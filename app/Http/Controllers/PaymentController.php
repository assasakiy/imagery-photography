<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $user = Auth::user();
        if ($user->isClient() && $project->client->user_id !== $user->id) {
            abort(403);
        }

        $data = $request->validate([
            'amount' => 'required|numeric|min:0',
            'method' => 'required|in:manual_transfer,gateway',
            'notes' => 'nullable|string',
            'proof_file' => 'nullable|file|max:10240',
        ]);

        if ($request->hasFile('proof_file')) {
            $data['proof_file'] = $request->file('proof_file')
                ->store('payment-proofs/' . $project->id, 'public');
        }

        $payment = Payment::create([
            'project_id' => $project->id,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'status' => 'pending',
            'proof_file' => $data['proof_file'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Pembayaran tercatat. Menunggu konfirmasi admin.');
    }

    public function confirm(Payment $payment)
    {
        $payment->update([
            'status' => 'confirmed',
            'paid_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Pembayaran dikonfirmasi.');
    }

    public function reject(Request $request, Payment $payment)
    {
        $request->validate(['notes' => 'nullable|string']);
        $payment->update([
            'status' => 'failed',
            'notes' => $request->notes,
        ]);

        return redirect()->back()->with('success', 'Pembayaran ditolak.');
    }
}
