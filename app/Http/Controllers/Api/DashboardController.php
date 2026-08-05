<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ContactMessage;
use App\Models\Payment;
use App\Models\Portfolio;
use App\Models\Project;

class DashboardController extends Controller
{
    public function stats()
    {
        if ($this->isAdmin()) {
            return response()->json([
                'role' => 'admin',
                'total_projects' => Project::count(),
                'active_projects' => Project::whereIn('status', ['in_progress', 'pending'])->count(),
                'completed_projects' => Project::whereIn('status', ['completed', 'delivered'])->count(),
                'total_clients' => Client::count(),
                'total_revenue' => Payment::where('status', 'confirmed')->sum('amount'),
                'pending_payments' => Payment::where('status', 'pending')->count(),
                'portfolios' => Portfolio::count(),
                'unread_messages' => ContactMessage::whereNull('read_at')->count(),
                'recent_projects' => Project::with('client')->latest()->take(5)->get(),
                'recent_messages' => ContactMessage::latest()->take(5)->get(),
                'recent_payments' => Payment::with('project')->latest()->take(5)->get(),
            ]);
        }

        $client = $this->userClient();

        return response()->json([
            'role' => 'client',
            'projects' => $client ? Project::with('client')->where('client_id', $client->id)->count() : 0,
            'in_progress' => $client ? Project::where('client_id', $client->id)->where('status', 'in_progress')->count() : 0,
            'completed' => $client ? Project::where('client_id', $client->id)->whereIn('status', ['completed', 'delivered'])->count() : 0,
            'total_spent' => $client ? Payment::whereHas('project', fn ($q) => $q->where('client_id', $client->id))->where('status', 'confirmed')->sum('amount') : 0,
            'recent_projects' => $client ? Project::with('client')->where('client_id', $client->id)->latest()->take(5)->get() : [],
        ]);
    }

    private function isAdmin(): bool
    {
        return request()->user()->isAdmin();
    }

    private function userClient(): ?Client
    {
        return request()->user()->client;
    }
}
