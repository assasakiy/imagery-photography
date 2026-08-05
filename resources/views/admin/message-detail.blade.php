@extends('layouts.admin')

@section('title', 'Pesan dari ' . $message->name)

@section('content')
<div class="bg-white rounded-lg shadow p-6">
    <div class="mb-6">
        <h2 class="text-2xl font-bold">Pesan dari {{ $message->name }}</h2>
        <p class="text-gray-500">{{ $message->email }} @if($message->phone)- {{ $message->phone }}@endif</p>
        <p class="text-xs text-gray-400 mt-1">{{ $message->created_at->format('d M Y H:i') }}</p>
    </div>
    <div class="bg-gray-50 p-6 rounded-lg">
        <p class="text-gray-800 whitespace-pre-wrap">{{ $message->message }}</p>
    </div>
    <div class="mt-6">
        <a href="/messages" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Kembali</a>
    </div>
</div>
@endsection
