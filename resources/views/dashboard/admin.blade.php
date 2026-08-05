@extends('layouts.admin')

@section('title', 'Dashboard Admin')

@section('content')
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-500 text-sm">Total Projects</p>
        <p class="text-3xl font-bold">{{ $stats['total_projects'] }}</p>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-500 text-sm">Active Projects</p>
        <p class="text-3xl font-bold text-yellow-600">{{ $stats['active_projects'] }}</p>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-500 text-sm">Total Clients</p>
        <p class="text-3xl font-bold text-blue-600">{{ $stats['total_clients'] }}</p>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-500 text-sm">Revenue</p>
        <p class="text-3xl font-bold text-green-600">Rp {{ number_format($stats['total_revenue'], 0, ',', '.') }}</p>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="font-semibold text-lg mb-4">Recent Projects</h3>
        @if($stats['recent_projects']->isNotEmpty())
        <div class="space-y-3">
            @foreach($stats['recent_projects'] as $project)
            <div class="flex justify-between items-center border-b pb-2">
                <div>
                    <a href="/projects/{{ $project->id }}" class="font-medium hover:text-indigo-600">{{ $project->name }}</a>
                    <p class="text-sm text-gray-500">{{ $project->client?->name }}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded {{ $project->status === 'completed' ? 'bg-green-100 text-green-800' : ($project->status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800') }}">
                    {{ str_replace('_', ' ', $project->status) }}
                </span>
            </div>
            @endforeach
        </div>
        @else
        <p class="text-gray-500">Belum ada project.</p>
        @endif
        <a href="/projects" class="mt-4 inline-block text-indigo-600 hover:text-indigo-800 text-sm">Lihat semua →</a>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="font-semibold text-lg mb-4">Recent Payments</h3>
        @if($stats['recent_payments']->isNotEmpty())
        <div class="space-y-3">
            @foreach($stats['recent_payments'] as $payment)
            <div class="flex justify-between items-center border-b pb-2">
                <div>
                    <p class="font-medium">Rp {{ number_format($payment->amount, 0, ',', '.') }}</p>
                    <p class="text-sm text-gray-500">{{ $payment->project?->name }} - {{ $payment->project?->client?->name }}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded {{ $payment->status === 'confirmed' ? 'bg-green-100 text-green-800' : ($payment->status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800') }}">
                    {{ $payment->status }}
                </span>
            </div>
            @endforeach
        </div>
        @else
        <p class="text-gray-500">Belum ada pembayaran.</p>
        @endif
    </div>
</div>
@endsection
