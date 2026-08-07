<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Payment;
use App\Models\Portfolio;
use App\Models\Project;
use App\Models\User;

class DashboardController extends Controller
{
    public function stats()
    {
        if ($this->isAdmin()) {
            return response()->json([
                'role' => 'admin',
                'total_projects' => Project::count(),
                'active_projects' => Project::whereIn('status', ['scheduled', 'shooting', 'editing', 'awaiting_payment'])->count(),
                'completed_projects' => Project::whereIn('status', ['completed', 'archived'])->count(),
                'total_clients' => User::role('client')->count(),
                'total_revenue' => Payment::where('status', 'confirmed')->sum('amount'),
                'pending_payments' => Payment::where('status', 'pending')->count(),
                'portfolios' => Portfolio::count(),
                'unread_messages' => ContactMessage::whereNull('read_at')->count(),
                'recent_projects' => Project::with('user.profile')->latest()->take(5)->get(),
                'recent_messages' => ContactMessage::latest()->take(5)->get(),
                'recent_payments' => Payment::with('project')->latest()->take(5)->get(),
            ]);
        }

        $user = request()->user();

        if ($user->isSubscriber() && !$user->isClient()) {
            return response()->json([
                'role' => 'subscriber',
                'projects' => 0,
                'in_progress' => 0,
                'completed' => 0,
                'total_spent' => 0,
                'recent_projects' => [],
            ]);
        }

        return response()->json([
            'role' => 'client',
            'projects' => $user->projects()->count(),
            'in_progress' => $user->projects()->whereIn('status', ['scheduled', 'shooting', 'editing', 'awaiting_payment'])->count(),
            'completed' => $user->projects()->whereIn('status', ['completed', 'archived'])->count(),
            'total_spent' => Payment::whereHas('project', fn ($q) => $q->where('user_id', $user->id))->where('status', 'confirmed')->sum('amount'),
            'recent_projects' => $user->projects()->with('user.profile')->latest()->take(5)->get(),
        ]);
    }

    private function isAdmin(): bool
    {
        return request()->user()->isStaff();
    }
}
