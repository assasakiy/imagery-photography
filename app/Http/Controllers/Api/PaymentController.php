<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Project;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with('project.client');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request, Project $project)
    {
        $user = $request->user();
        if ($user->isClient() && $project->client?->user_id !== $user->id) {
            abort(403);
        }

        $data = $request->validate([
            'amount' => 'required|numeric|min:0',
            'method' => 'required|in:manual_transfer,gateway',
            'notes' => 'nullable|string',
            'proof_file' => 'nullable|file|max:10240',
        ]);

        if ($request->hasFile('proof_file')) {
            $data['proof_file'] = $request->file('proof_file')->store('payment-proofs/' . $project->id, 'public');
        }

        $payment = Payment::create([
            'project_id' => $project->id,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'status' => 'pending',
            'proof_file' => $data['proof_file'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        app(NotificationService::class)->webhook('payment.submitted', [
            'payment_id' => $payment->id,
            'project_id' => $project->id,
            'amount' => $data['amount'],
        ]);

        app(AuditLogger::class)->log('payment.submitted', 'Pembayaran dikirim: Rp ' . number_format((float) $data['amount'], 0, ',', '.') . ' untuk project "' . $project->name . '"', $payment);

        return response()->json($payment, 201);
    }

    public function confirm(Request $request, Payment $payment)
    {
        $payment->update(['status' => 'confirmed', 'paid_at' => now()]);

        app(AuditLogger::class)->log('payment.confirmed', 'Pembayaran dikonfirmasi: Rp ' . number_format((float) $payment->amount, 0, ',', '.') . ' (project ' . $payment->project->name . ')', $payment);

        $notifications = app(NotificationService::class);
        $notifications->webhook('payment.confirmed', ['payment_id' => $payment->id, 'project_id' => $payment->project_id]);

        if ($client = $payment->project?->client) {
            if ($client->phone) {
                $notifications->whatsapp(
                    $client->phone,
                    "Pembayaran Anda sebesar Rp " . number_format((float) $payment->amount, 0, ',', '.') . " telah dikonfirmasi. Terima kasih! 🙏",
                    null,
                    $client->user,
                    'payment.confirmed'
                );
            }
            if ($client->user) {
                $notifications->inApp(
                    $client->user,
                    'Pembayaran dikonfirmasi',
                    'Pembayaran Rp ' . number_format((float) $payment->amount, 0, ',', '.') . ' untuk project "' . $payment->project->name . '" telah dikonfirmasi.',
                    '/dashboard/projects/' . $payment->project->id,
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

        return response()->json($payment);
    }
}
