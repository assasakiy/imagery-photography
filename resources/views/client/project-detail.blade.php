@extends('layouts.client')

@section('title', $project->name)

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex justify-between items-start mb-4">
        <div>
            <h2 class="text-2xl font-bold">{{ $project->name }}</h2>
            @if($project->description)<p class="text-gray-500 mt-1">{{ $project->description }}</p>@endif
        </div>
        <span class="px-3 py-1 text-sm rounded {{ $project->status === 'completed' ? 'bg-green-100 text-green-800' : ($project->status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ($project->status === 'delivered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')) }}">
            {{ str_replace('_', ' ', ucfirst($project->status)) }}
        </span>
    </div>

    @php
        $progress = match($project->status) {
            'delivered' => 100,
            'completed' => 80,
            'in_progress' => 40,
            default => 10
        };
    @endphp
    <div class="w-full bg-gray-200 rounded-full h-3 mb-6">
        <div class="bg-indigo-600 h-3 rounded-full transition-all" style="width: {{ $progress }}%"></div>
    </div>

    @if($project->price)
    <div class="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg mb-4">
        <div>
            <span class="text-gray-500">Total:</span>
            <span class="font-semibold block">Rp {{ number_format($project->price, 0, ',', '.') }}</span>
        </div>
        <div>
            <span class="text-gray-500">Terbayar:</span>
            <span class="font-semibold block text-green-600">Rp {{ number_format($project->totalPaid(), 0, ',', '.') }}</span>
        </div>
        <div>
            <span class="text-gray-500">Sisa:</span>
            <span class="font-semibold block text-red-600">Rp {{ number_format($project->remainingBalance(), 0, ',', '.') }}</span>
        </div>
    </div>
    @endif
</div>

{{-- Files --}}
@if($project->files->isNotEmpty())
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-semibold mb-4">File untuk Didownload</h3>
    <div class="space-y-2">
        @foreach($project->files as $file)
        <div class="flex justify-between items-center bg-gray-50 px-4 py-3 rounded">
            <div class="flex items-center gap-3">
                <span>📁</span>
                <span>{{ $file->original_name }} ({{ round($file->size / 1024) }} KB)</span>
            </div>
            <a href="/download/{{ $file->id }}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded text-sm">Download</a>
        </div>
        @endforeach
    </div>
</div>
@endif

{{-- Payment --}}
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-semibold mb-4">Pembayaran</h3>

    @if($project->payments->isNotEmpty())
    <div class="space-y-2 mb-4">
        @foreach($project->payments as $payment)
        <div class="flex justify-between items-center px-4 py-2 rounded {{ $payment->status === 'confirmed' ? 'bg-green-50' : ($payment->status === 'pending' ? 'bg-yellow-50' : 'bg-red-50') }}">
            <div>
                <span class="font-medium">Rp {{ number_format($payment->amount, 0, ',', '.') }}</span>
                <span class="text-gray-500 text-sm ml-2">({{ $payment->method }})</span>
                @if($payment->notes)<p class="text-xs text-gray-500">{{ $payment->notes }}</p>@endif
            </div>
            <span class="text-sm {{ $payment->status === 'confirmed' ? 'text-green-600' : ($payment->status === 'pending' ? 'text-yellow-600' : 'text-red-600') }}">
                {{ ucfirst($payment->status) }}
            </span>
        </div>
        @endforeach
    </div>
    @endif

    <details class="border rounded-lg p-4">
        <summary class="cursor-pointer font-medium text-indigo-600">Lakukan Pembayaran</summary>
        <form method="POST" action="/projects/{{ $project->id }}/payments" enctype="multipart/form-data" class="mt-4 space-y-3">
            @csrf
            <div>
                <label class="block text-sm font-medium mb-1">Jumlah (Rp)</label>
                <input type="number" name="amount" step="0.01" required class="w-full border rounded-lg px-3 py-2">
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Metode</label>
                <select name="method" class="w-full border rounded-lg px-3 py-2">
                    <option value="manual_transfer">Transfer Manual</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Bukti Transfer</label>
                <input type="file" name="proof_file" class="w-full border rounded-lg px-3 py-2">
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">Catatan (opsional)</label>
                <textarea name="notes" rows="2" class="w-full border rounded-lg px-3 py-2"></textarea>
            </div>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Kirim Pembayaran</button>
        </form>
    </details>

    @if($project->price && $project->remainingBalance() > 0)
    <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p class="font-medium text-blue-800">Info Rekening untuk Transfer Manual:</p>
        <p class="text-blue-600 mt-1">Silakan hubungi admin untuk detail rekening.</p>
    </div>
    @endif
</div>

{{-- Updates --}}
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-semibold mb-4">Progress Timeline</h3>
    @if($project->updates->isNotEmpty())
    <div class="space-y-4">
        @foreach($project->updates as $update)
        <div class="border-l-4 {{ $update->type === 'milestone' ? 'border-green-500' : ($update->type === 'note' ? 'border-yellow-500' : 'border-blue-500') }} pl-4">
            <p class="text-sm">{{ $update->message }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ $update->created_at->format('d M Y H:i') }}</p>
        </div>
        @endforeach
    </div>
    @else
    <p class="text-gray-500">Belum ada update.</p>
    @endif
</div>

<div class="flex gap-4">
    <a href="/dashboard" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Kembali ke Dashboard</a>
</div>
@endsection
