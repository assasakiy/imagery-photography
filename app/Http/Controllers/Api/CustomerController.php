<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ContactMessage;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\ProjectFile;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $projects = $user->projects()->get();

        return response()->json([
            'projects' => $projects->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'type' => $p->type,
                'status' => $p->status,
                'price' => $p->price,
                'updated_at' => $p->updated_at,
            ]),
            'bookings' => ContactMessage::where('type', 'booking')
                ->where(fn ($q) => $q->where('email', $user->email)->orWhere('phone', $user->phone))
                ->count(),
            'bookmarks' => $user->bookmarks()->count(),
            'downloadable' => ProjectFile::whereIn('project_id', $projects->pluck('id'))
                ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                ->count(),
        ]);
    }

    public function bookings(Request $request)
    {
        $user = $request->user();

        return response()->json(
            Booking::where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->get(['id', 'booking_no', 'name', 'phone', 'email', 'package_label', 'event_date', 'location', 'notes', 'price', 'status', 'project_id', 'created_at'])
        );
    }

    public function invoices(Request $request)
    {
        $projectIds = $request->user()->projects()->pluck('id');

        $invoices = Invoice::with(['project'])
            ->whereIn('project_id', $projectIds)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'number' => $inv->number,
                'project_id' => $inv->project_id,
                'project' => $inv->project?->name,
                'price' => $inv->base_amount,
                'paid' => $inv->paid_amount,
                'remaining' => $inv->remaining(),
                'status' => $inv->status,
                'issued_at' => $inv->issued_at,
            ]);

        return response()->json($invoices);
    }

    public function payments(Request $request)
    {
        $user = $request->user();
        $projectIds = $user->projects()->pluck('id');

        return response()->json(
            Payment::whereIn('project_id', $projectIds)->orderByDesc('created_at')->get()
        );
    }

    public function gallery(Request $request)
    {
        $projectId = $request->query('project_id');
        $projects = $request->user()->projects();

        if ($projectId) {
            $projects = $projects->where('id', $projectId);
        }

        $projects = $projects->with('files')->get();

        return response()->json($projects->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'status' => $p->status,
                'files' => $p->files->map(function ($f) {
                    return [
                        'id' => $f->id,
                        'name' => $f->original_name,
                        'size' => $f->size,
                        'expires_at' => $f->expires_at,
                        'available' => !$f->expires_at || $f->expires_at->isFuture(),
                    ];
                }),
            ];
        }));
    }

    public function messages(Request $request)
    {
        $user = $request->user();

        return response()->json(
            ContactMessage::where('type', 'message')
                ->where(fn ($q) => $q->where('email', $user->email)->orWhere('phone', $user->phone))
                ->orderByDesc('created_at')
                ->get(['id', 'message', 'created_at', 'status'])
        );
    }

    public function sendMessage(Request $request)
    {
        $data = $request->validate([
            'message' => 'required|string|max:2000',
            'project_id' => 'nullable|integer',
        ]);

        $user = $request->user();

        if (!empty($data['project_id'])) {
            $user->projects()->findOrFail($data['project_id']);
        }

        ContactMessage::create([
            'type' => 'message',
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'message' => $data['message'],
            'project_id' => $data['project_id'] ?? null,
        ]);

        return response()->json(['ok' => true]);
    }
}