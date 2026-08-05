@extends('layouts.admin')

@section('title', $project->name)

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="flex justify-between items-start mb-4">
        <div>
            <h2 class="text-2xl font-bold">{{ $project->name }}</h2>
            <p class="text-gray-500">Client: {{ $project->client?->name }}</p>
        </div>
        <div class="flex gap-2 items-center">
            <span class="px-3 py-1 rounded text-sm {{ $project->status === 'completed' ? 'bg-green-100 text-green-800' : ($project->status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ($project->status === 'delivered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')) }}">
                {{ str_replace('_', ' ', ucfirst($project->status)) }}
            </span>
        </div>
    </div>

    @if($project->description)
    <p class="text-gray-600 mb-4">{{ $project->description }}</p>
    @endif

    <div class="grid grid-cols-3 gap-4 text-sm mb-4">
        @if($project->price)
        <div><span class="text-gray-500">Harga:</span> Rp {{ number_format($project->price, 0, ',', '.') }}</div>
        <div><span class="text-gray-500">Terbayar:</span> Rp {{ number_format($project->totalPaid(), 0, ',', '.') }}</div>
        <div><span class="text-gray-500">Sisa:</span> Rp {{ number_format($project->remainingBalance(), 0, ',', '.') }}</div>
        @endif
    </div>

    {{-- Smart Link --}}
    @if($project->accessTokens->isNotEmpty())
    <div class="bg-gray-100 p-4 rounded mb-4">
        <p class="text-sm font-medium mb-1">Smart Link Akses Client:</p>
        @foreach($project->accessTokens as $token)
        <div class="text-sm">
            <code class="bg-gray-200 px-2 py-1 rounded">{{ url('/access/'.$token->token) }}</code>
            @if($token->used_at)
            <span class="text-green-600 text-xs">(Sudah digunakan: {{ $token->used_at->format('d M Y H:i') }})</span>
            @endif
        </div>
        @endforeach
    </div>
    @endif

    {{-- Update Status --}}
    <form method="POST" action="/projects/{{ $project->id }}/status" class="flex gap-2 items-center mb-6">
        @csrf @method('PATCH')
        <select name="status" class="border rounded-lg px-3 py-2 text-sm">
            <option value="pending" {{ $project->status=='pending' ? 'selected' : '' }}>Pending</option>
            <option value="in_progress" {{ $project->status=='in_progress' ? 'selected' : '' }}>In Progress</option>
            <option value="completed" {{ $project->status=='completed' ? 'selected' : '' }}>Completed</option>
            <option value="delivered" {{ $project->status=='delivered' ? 'selected' : '' }}>Delivered</option>
        </select>
        <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Update Status</button>
    </form>
</div>

{{-- Files --}}
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-semibold mb-4">Upload File untuk Client</h3>
    <form method="POST" action="/projects/{{ $project->id }}/files" enctype="multipart/form-data">
        @csrf
        <div class="flex gap-4">
            <input type="file" name="file" required class="flex-1 border rounded-lg px-3 py-2">
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Upload</button>
        </div>
    </form>

    @if($project->files->isNotEmpty())
    <div class="mt-4 space-y-2">
        @foreach($project->files as $file)
        <div class="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
            <span>{{ $file->original_name }} ({{ round($file->size / 1024) }} KB)</span>
            <form method="POST" action="/projects/{{ $project->id }}/files/{{ $file->id }}" onsubmit="return confirm('Hapus file?')">
                @csrf @method('DELETE')
                <button type="submit" class="text-red-500 hover:text-red-700 text-sm">Hapus</button>
            </form>
        </div>
        @endforeach
    </div>
    @endif
</div>

{{-- Payments --}}
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-semibold mb-4">Pembayaran</h3>
    @if($project->payments->isNotEmpty())
    <div class="space-y-2">
        @foreach($project->payments as $payment)
        <div class="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
            <div>
                <span class="font-medium">Rp {{ number_format($payment->amount, 0, ',', '.') }}</span>
                <span class="text-gray-500 text-sm ml-2">{{ $payment->method }}</span>
                @if($payment->notes)<p class="text-xs text-gray-500">{{ $payment->notes }}</p>@endif
            </div>
            <div class="flex gap-2 items-center">
                <span class="px-2 py-1 text-xs rounded {{ $payment->status === 'confirmed' ? 'bg-green-100 text-green-800' : ($payment->status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800') }}">
                    {{ $payment->status }}
                </span>
                @if($payment->status === 'pending')
                <form method="POST" action="/payments/{{ $payment->id }}/confirm" class="inline">
                    @csrf @method('PATCH')
                    <button type="submit" class="text-green-600 hover:text-green-800 text-sm">Konfirmasi</button>
                </form>
                <form method="POST" action="/payments/{{ $payment->id }}/reject" class="inline">
                    @csrf @method('PATCH')
                    <input type="text" name="notes" placeholder="Alasan" class="border text-xs px-2 py-1 rounded w-32">
                    <button type="submit" class="text-red-600 hover:text-red-800 text-sm">Tolak</button>
                </form>
                @endif
            </div>
        </div>
        @endforeach
    </div>
    @else
    <p class="text-gray-500">Belum ada pembayaran.</p>
    @endif
</div>

{{-- Updates --}}
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h3 class="text-lg font-semibold mb-4">Update Progress</h3>
    <form method="POST" action="/projects/{{ $project->id }}/updates">
        @csrf
        <div class="flex gap-4">
            <textarea name="message" placeholder="Tulis update..." rows="2" required class="flex-1 border rounded-lg px-3 py-2"></textarea>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg self-end">Kirim</button>
        </div>
    </form>

    @if($project->updates->isNotEmpty())
    <div class="mt-6 space-y-4">
        @foreach($project->updates as $update)
        <div class="border-l-4 {{ $update->type === 'milestone' ? 'border-green-500' : ($update->type === 'note' ? 'border-yellow-500' : 'border-blue-500') }} pl-4">
            <div class="flex justify-between">
                <p class="text-sm">{{ $update->message }}</p>
                <span class="text-xs text-gray-500">{{ $update->created_at->diffForHumans() }}</span>
            </div>
            <p class="text-xs text-gray-400">— {{ $update->user?->name ?? 'System' }}</p>
        </div>
        @endforeach
    </div>
    @endif
</div>

<div class="flex gap-4">
    <a href="/projects" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Kembali</a>
</div>
@endsection
