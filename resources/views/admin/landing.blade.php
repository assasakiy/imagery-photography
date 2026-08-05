@extends('layouts.admin')

@section('title', 'Edit Landing Page')

@section('content')
<div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-2xl font-bold mb-6">Edit Konten Landing Page</h2>

    <form method="POST" action="/landing">
        @csrf
        @method('PUT')

        @php
            $groups = $contents->groupBy(function($item) {
                return $item->group;
            });
        @endphp

        @foreach($groups as $group => $items)
        <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4 capitalize border-b pb-2">{{ $group }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @foreach($items as $item)
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ str_replace('_', ' ', ucfirst($item->key)) }}</label>
                    @if(in_array($item->key, ['about_content', 'hero_subtitle']))
                    <textarea name="{{ $item->key }}" rows="3" class="w-full border rounded-lg px-3 py-2">{{ $item->value }}</textarea>
                    @else
                    <input type="text" name="{{ $item->key }}" value="{{ $item->value }}" class="w-full border rounded-lg px-3 py-2">
                    @endif
                </div>
                @endforeach
            </div>
        </div>
        @endforeach

        <div class="flex gap-4">
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Simpan</button>
            <a href="/dashboard" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Kembali</a>
        </div>
    </form>
</div>
@endsection
