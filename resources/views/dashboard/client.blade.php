@extends('layouts.client')

@section('title', 'Dashboard Client')

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-2xl font-bold mb-2">Selamat Datang!</h2>
    <p class="text-gray-600">Berikut adalah project Anda.</p>
</div>

@if($projects && $projects->isNotEmpty())
    @foreach($projects as $project)
    <div class="bg-white rounded-lg shadow p-6 mb-4">
        <div class="flex justify-between items-start mb-4">
            <div>
                <h3 class="text-xl font-semibold">{{ $project->name }}</h3>
                <p class="text-gray-500 text-sm">{{ $project->description }}</p>
            </div>
            <span class="px-3 py-1 text-sm rounded {{ $project->status === 'completed' ? 'bg-green-100 text-green-800' : ($project->status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ($project->status === 'delivered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')) }}">
                {{ str_replace('_', ' ', ucfirst($project->status)) }}
            </span>
        </div>

        {{-- Progress bar --}}
        @php
            $progress = match($project->status) {
                'delivered' => 100,
                'completed' => 80,
                'in_progress' => 40,
                default => 10
            };
        @endphp
        <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div class="bg-indigo-600 h-2 rounded-full transition-all" style="width: {{ $progress }}%"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            @if($project->price)
            <div>
                <span class="text-gray-500">Total:</span>
                <span class="font-semibold">Rp {{ number_format($project->price, 0, ',', '.') }}</span>
            </div>
            <div>
                <span class="text-gray-500">Terbayar:</span>
                <span class="font-semibold text-green-600">Rp {{ number_format($project->totalPaid(), 0, ',', '.') }}</span>
            </div>
            <div>
                <span class="text-gray-500">Sisa:</span>
                <span class="font-semibold text-red-600">Rp {{ number_format($project->remainingBalance(), 0, ',', '.') }}</span>
            </div>
            @endif
        </div>

        <div class="mt-4 flex gap-2">
            <a href="/projects/{{ $project->id }}" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Detail →</a>
        </div>
    </div>
    @endforeach
@else
<div class="bg-white rounded-lg shadow p-6 text-center">
    <p class="text-gray-500">Belum ada project untuk Anda.</p>
</div>
@endif
@endsection
