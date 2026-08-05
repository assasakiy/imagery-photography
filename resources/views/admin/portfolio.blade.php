@extends('layouts.admin')

@section('title', 'Portfolio')

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-2xl font-bold mb-4">Tambah Portfolio</h2>
    <form method="POST" action="/portfolio">
        @csrf
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="title" placeholder="Judul" required class="border rounded-lg px-3 py-2">
            <input type="text" name="category" placeholder="Kategori" class="border rounded-lg px-3 py-2">
            <select name="media_id" class="border rounded-lg px-3 py-2">
                <option value="">Pilih Media</option>
                @foreach($mediaList as $m)
                <option value="{{ $m->id }}">{{ $m->filename }}</option>
                @endforeach
            </select>
            <textarea name="description" placeholder="Deskripsi" rows="2" class="border rounded-lg px-3 py-2 md:col-span-3"></textarea>
            <div class="flex gap-4 items-center">
                <label><input type="checkbox" name="is_featured" value="1"> Featured</label>
                <input type="number" name="order" placeholder="Urutan" value="0" class="border rounded-lg px-3 py-2 w-24">
            </div>
        </div>
        <button type="submit" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Simpan</button>
    </form>
</div>

<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">Daftar Portfolio</h3>
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b text-left">
                    <th class="py-2 px-3">Judul</th>
                    <th class="py-2 px-3">Kategori</th>
                    <th class="py-2 px-3">Featured</th>
                    <th class="py-2 px-3">Urutan</th>
                    <th class="py-2 px-3">Aksi</th>
                </tr>
            </thead>
            <tbody>
                @forelse($portfolios as $item)
                <tr class="border-b">
                    <td class="py-2 px-3">{{ $item->title }}</td>
                    <td class="py-2 px-3">{{ $item->category }}</td>
                    <td class="py-2 px-3">{{ $item->is_featured ? '✅' : '-' }}</td>
                    <td class="py-2 px-3">{{ $item->order }}</td>
                    <td class="py-2 px-3">
                        <form method="POST" action="/portfolio/{{ $item->id }}" class="inline" onsubmit="return confirm('Hapus?')">
                            @csrf @method('DELETE')
                            <button type="submit" class="text-red-500 hover:text-red-700">Hapus</button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr><td colspan="5" class="py-8 text-center text-gray-500">Belum ada portfolio.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-4">{{ $portfolios->links() }}</div>
</div>
@endsection
