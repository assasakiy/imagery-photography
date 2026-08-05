@extends('layouts.admin')

@section('title', 'Media Library')

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-2xl font-bold mb-4">Upload Media</h2>
    <form method="POST" action="/media" enctype="multipart/form-data">
        @csrf
        <div class="flex gap-4 items-end">
            <div class="flex-1">
                <input type="file" name="file" required class="w-full border rounded-lg px-3 py-2">
            </div>
            <div class="flex-1">
                <input type="text" name="alt_text" placeholder="Alt text (opsional)" class="w-full border rounded-lg px-3 py-2">
            </div>
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Upload</button>
        </div>
    </form>
</div>

<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">Media</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        @forelse($media as $item)
        <div class="border rounded-lg overflow-hidden group">
            @if(str_starts_with($item->type, 'image'))
            <img src="{{ $item->url }}" alt="{{ $item->alt_text }}" class="w-full h-32 object-cover">
            @else
            <div class="w-full h-32 bg-gray-200 flex items-center justify-center text-sm">📁 {{ $item->type }}</div>
            @endif
            <div class="p-2 text-xs">
                <p class="truncate">{{ $item->filename }}</p>
                <form method="POST" action="/media/{{ $item->id }}" onsubmit="return confirm('Hapus media ini?')">
                    @csrf @method('DELETE')
                    <button type="submit" class="text-red-500 hover:text-red-700 mt-1">Hapus</button>
                </form>
            </div>
        </div>
        @empty
        <div class="col-span-full text-center py-8 text-gray-500">Belum ada media.</div>
        @endforelse
    </div>
    <div class="mt-4">{{ $media->links() }}</div>
</div>
@endsection
