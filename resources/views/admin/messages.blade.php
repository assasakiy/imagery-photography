@extends('layouts.admin')

@section('title', 'Pesan Masuk')

@section('content')
<div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-2xl font-bold mb-4">Pesan Masuk</h2>
    <div class="space-y-4">
        @forelse($messages as $message)
        <div class="border rounded-lg p-4 {{ $message->read_at ? 'bg-gray-50' : 'bg-blue-50 border-blue-200' }}">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold">{{ $message->name }}</h4>
                    <p class="text-sm text-gray-500">{{ $message->email }} @if($message->phone)- {{ $message->phone }}@endif</p>
                </div>
                <span class="text-xs text-gray-400">{{ $message->created_at->diffForHumans() }}</span>
            </div>
            <p class="mt-2 text-gray-700">{{ Str::limit($message->message, 200) }}</p>
            @if(!$message->read_at)
            <form method="GET" action="/messages/{{ $message->id }}" class="mt-2">
                <button type="submit" class="text-indigo-600 text-sm hover:text-indigo-800">Baca</button>
            </form>
            @endif
        </div>
        @empty
        <p class="text-center text-gray-500 py-8">Belum ada pesan.</p>
        @endforelse
    </div>
    <div class="mt-4">{{ $messages->links() }}</div>
</div>
@endsection
