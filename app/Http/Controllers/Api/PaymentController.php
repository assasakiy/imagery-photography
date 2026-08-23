<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Project;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use App\Services\RuntimeSettings;
use App\Services\TriPayClient;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function methods()
    {
        $settings = app(RuntimeSettings::class);

        $allAccounts = $settings->paymentManualAccounts();
        $activeManualKeys = $settings->paymentActiveManuals();
        $activeQrisKey = $settings->paymentActiveQris();

        // Filter groups/accounts
        $filteredGroups = [];
        foreach ($allAccounts as $group) {
            $filteredAccounts = [];
            foreach ($group['accounts'] ?? [] as $acc) {
                if (($group['type'] === 'qris' && $acc['key'] === $activeQrisKey) ||
                    ($group['type'] !== 'qris' && in_array($acc['key'], $activeManualKeys, true))) {
                    $filteredAccounts[] = $acc;
                }
            }
            if (!empty($filteredAccounts)) {
                $filteredGroups[] = [
                    'type' => $group['type'],
                    'accounts' => $filteredAccounts
                ];
            }
        }

        $manual = [
            'enabled' => $settings->paymentManualEnabled() && !empty($filteredGroups),
            'groups' => $filteredGroups,
        ];

        $gateway = [
            'enabled' => false,
            'channels' => [],
        ];

        if ($settings->paymentGatewayEnabled() && $settings->paymentGatewayConfigured()) {
            $allChannels = app(TriPayClient::class)->paymentChannels();
            $activeChannels = $settings->paymentActiveChannels();
            $filteredChannels = array_filter($allChannels, fn($ch) => in_array($ch['code'], $activeChannels, true));

            if (!empty($filteredChannels)) {
                $gateway['enabled'] = true;
                $gateway['channels'] = array_values($filteredChannels);
            }
        }

        return response()->json(['manual' => $manual, 'gateway' => $gateway]);
    }

    public function createGateway(Request $request, Project $project)
    {
        $user = $request->user();
        if ($user->isClient() && $project->user_id !== $user->id) {
            abort(403);
        }

        $data = $request->validate([
            'amount' => 'required|numeric|min:1',
            'method' => 'required|string|max:50',
            'return_url' => 'nullable|url',
        ]);

        $settings = app(RuntimeSettings::class);
        if (!$settings->paymentGatewayEnabled() || !$settings->paymentGatewayConfigured()) {
            return response()->json(['message' => 'Payment gateway belum diaktifkan.'], 422);
        }

        $client = app(TriPayClient::class);
        $merchantRef = 'IMG-' . strtoupper(\Illuminate\Support\Str::random(12));
        $amount = (int) round((float) $data['amount']);

        $result = $client->createTransaction(
            $merchantRef,
            $amount,
            $data['method'],
            [
                'name' => $user->name ?? 'Klien',
                'email' => $user->email,
                'phone' => $user->phone,
            ],
            [[
                'sku' => $project->order_no ?? (string) $project->id,
                'name' => $project->name,
                'price' => $amount,
                'quantity' => 1,
            ]],
            $data['return_url'] ?? null
        );

        if (!$result || !isset($result['reference'])) {
            return response()->json(['message' => 'Gagal membuat transaksi di gateway. Periksa konfigurasi TriPay.'], 422);
        }

        $payment = Payment::create([
            'project_id' => $project->id,
            'amount' => $amount,
            'method' => 'gateway',
            'gateway' => 'tripay',
            'gateway_ref' => $result['reference'],
            'gateway_method' => $data['method'],
            'checkout_url' => $result['checkout_url'] ?? ($result['pay_code'] ?? null),
            'status' => 'pending',
        ]);

        return response()->json([
            'payment' => $payment,
            'checkout_url' => $payment->checkout_url,
            'pay_code' => $result['pay_code'] ?? null,
            'reference' => $result['reference'],
        ], 201);
    }

    public function gatewayStatus(Request $request, Payment $payment)
    {
        $user = $request->user();
        if ($user->isClient() && $payment->project?->user_id !== $user->id) {
            abort(403);
        }

        if ($payment->method !== 'gateway' || !$payment->gateway_ref) {
            return response()->json(['status' => $payment->status]);
        }

        $detail = app(TriPayClient::class)->checkStatus($payment->gateway_ref);
        if ($detail && isset($detail['status'])) {
            $map = ['PAID' => 'confirmed', 'EXPIRED' => 'expired', 'FAILED' => 'failed'];
            if (isset($map[$detail['status']])) {
                $newStatus = $map[$detail['status']];
                if ($newStatus === 'confirmed' && $payment->status !== 'confirmed') {
                    $this->markConfirmed($payment);
                } elseif ($newStatus === 'failed' && $payment->status === 'pending') {
                    $payment->update(['status' => 'failed']);
                } elseif ($newStatus === 'expired' && $payment->status === 'pending') {
                    $payment->update(['status' => 'expired']);
                }
            }
        }

        return response()->json(['status' => $payment->fresh()->status]);
    }

    public function webhook(Request $request)
    {
        $raw = $request->getContent();
        $signature = $request->header('X-Callback-Signature', '');

        $client = app(TriPayClient::class);
        if (!$client->verifyCallback($raw, $signature)) {
            \Illuminate\Support\Facades\Log::warning('TriPay callback invalid signature', ['body' => substr($raw, 0, 500)]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $payload = json_decode($raw, true);
        if (!$payload) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $reference = $payload['reference'] ?? null;
        $payment = $reference ? Payment::where('gateway_ref', $reference)->first() : null;
        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        $status = $payload['status'] ?? null;
        if ($status === 'PAID' && $payment->status !== 'confirmed') {
            $this->markConfirmed($payment);
        } elseif ($status === 'EXPIRED' && $payment->status === 'pending') {
            $payment->update(['status' => 'expired']);
        } elseif ($status === 'FAILED' && $payment->status === 'pending') {
            $payment->update(['status' => 'failed']);
        }

        return response()->json(['success' => true]);
    }

    private function markConfirmed(Payment $payment)
    {
        $payment->update(['status' => 'confirmed', 'paid_at' => now()]);
        
        app(NotificationService::class)->notifyPaymentConfirmed($payment);

        app(AuditLogger::class)->log('payment.confirmed', 'Pembayaran gateway dikonfirmasi otomatis: Rp ' . number_format((float) $payment->amount, 0, ',', '.') . ' (project ' . $payment->project->name . ')', $payment);

        $project = $payment->project;
        if ($project) {
            $invoice = $project->invoice;
            if ($invoice) {
                $paid = $project->payments()->where('status', 'confirmed')->sum('amount');
                $invoice->paid_amount = $paid;
                $invoice->refreshStatus();
            }
            $project->addSystemUpdate('Pembayaran gateway Rp ' . number_format((float) $payment->amount, 0, ',', '.') . ' dikonfirmasi otomatis.');
            if ($project->status === 'awaiting_payment' && $project->isPaid()) {
                $project->advanceStep('completed');
                $project->addSystemUpdate('Tagihan lunas. Pesanan selesai.');
            }
        }
    }

    public function index(Request $request)
    {
        // Pembayaran proyek yang di-trash (klien dihapus) tidak ditampilkan.
        $query = Payment::with('project.user.profile')->whereHas('project');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request, Project $project)
    {
        $user = $request->user();
        if ($user->isClient() && $project->user_id !== $user->id) {
            abort(403);
        }

        $data = $request->validate([
            'amount' => 'required|numeric|min:0',
            'method' => 'required|in:manual_transfer,gateway',
            'notes' => 'nullable|string',
            'proof_file' => 'nullable|file|max:10240',
            'channel_type' => 'nullable|string|max:20',
            'channel_label' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'account_name' => 'nullable|string|max:100',
        ]);

        $payment = Payment::create([
            'project_id' => $project->id,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
            'channel_type' => $data['channel_type'] ?? null,
            'channel_label' => $data['channel_label'] ?? null,
            'account_number' => $data['account_number'] ?? null,
            'account_name' => $data['account_name'] ?? null,
        ]);

        if ($request->hasFile('proof_file')) {
            $payment->addMediaFromRequest('proof_file')->toMediaCollection('payment_proof');
        }

        app(NotificationService::class)->webhook('payment.submitted', [
            'payment_id' => $payment->id,
            'project_id' => $project->id,
            'amount' => $data['amount'],
        ]);
        
        app(NotificationService::class)->notifyPaymentSubmitted($payment);

        app(AuditLogger::class)->log('payment.submitted', 'Pembayaran dikirim: Rp ' . number_format((float) $data['amount'], 0, ',', '.') . ' untuk project "' . $project->name . '"', $payment);

        if (!$project->invoice) {
            $invoice = $project->invoice()->create([
                'number' => \App\Models\Invoice::nextNumber(),
                'issued_at' => now()->toDateString(),
                'due_at' => now()->addDays(7)->toDateString(),
                'base_amount' => $project->price ?? 0,
                'paid_amount' => 0,
                'status' => 'unpaid',
            ]);
            $project->addSystemUpdate('Invoice ' . $invoice->number . ' dibuat sebesar Rp ' . number_format((float) ($project->price ?? 0), 0, ',', '.') . '.');
        }

        return response()->json($payment, 201);
    }

    public function confirm(Request $request, Payment $payment)
    {
        $payment->update(['status' => 'confirmed', 'paid_at' => now()]);

        app(AuditLogger::class)->log('payment.confirmed', 'Pembayaran dikonfirmasi: Rp ' . number_format((float) $payment->amount, 0, ',', '.') . ' (project ' . $payment->project->name . ')', $payment);

        // Sinkronkan invoice + timeline system.
        $project = $payment->project;
        if ($project) {
            $invoice = $project->invoice;
            if ($invoice) {
                $paid = $project->payments()->where('status', 'confirmed')->sum('amount');
                $invoice->paid_amount = $paid;
                $invoice->refreshStatus();
            }
            $totalPaid = $project->totalPaid();
            $project->addSystemUpdate('Pembayaran Rp ' . number_format((float) $payment->amount, 0, ',', '.') . ' dikonfirmasi. Total dibayar: Rp ' . number_format((float) $totalPaid, 0, ',', '.') . '.');

            // Lunas -> tutup alur jadi "Selesai".
            if ($project->status === 'awaiting_payment' && $project->isPaid()) {
                $project->advanceStep('completed');
                $project->addSystemUpdate('Tagihan lunas. Pesanan selesai.');
            }
        }

        $notifications = app(NotificationService::class);
        $notifications->webhook('payment.confirmed', ['payment_id' => $payment->id, 'project_id' => $payment->project_id]);

        if ($client = $payment->project?->user) {
            if ($client->phone) {
                $notifications->whatsapp(
                    $client->phone,
                    "Pembayaran Anda sebesar Rp " . number_format((float) $payment->amount, 0, ',', '.') . " telah dikonfirmasi. Terima kasih! 🙏",
                    null,
                    $client,
                    'payment.confirmed'
                );
            }
            if ($client) {
                $notifications->inApp(
                    $client,
                    'Pembayaran dikonfirmasi',
                    'Pembayaran Rp ' . number_format((float) $payment->amount, 0, ',', '.') . ' untuk pesanan "' . $payment->project->name . '" telah dikonfirmasi.',
                    $notifications->orderUrl($payment->project),
                    'payment.confirmed'
                );
            }
        }

        return response()->json($payment);
    }

    public function reject(Request $request, Payment $payment)
    {
        $request->validate(['notes' => 'nullable|string']);

        $payment->update(['status' => 'failed', 'notes' => $request->notes]);

        app(AuditLogger::class)->log('payment.rejected', 'Pembayaran ditolak: Rp ' . number_format((float) $payment->amount, 0, ',', '.') . ' (project ' . $payment->project->name . ')', $payment);

        app(NotificationService::class)->webhook('payment.rejected', ['payment_id' => $payment->id]);
        app(NotificationService::class)->notifyPaymentRejected($payment);

        return response()->json($payment);
    }
}
