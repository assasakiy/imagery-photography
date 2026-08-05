@extends('layouts.admin')

@section('title', 'Layanan')

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-2xl font-bold mb-4">Tambah Layanan</h2>
    <form method="POST" action="/services-admin">
        @csrf
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="title" placeholder="Nama Layanan" required class="border rounded-lg px-3 py-2">
            <input type="text" name="icon" placeholder="Icon (emoji)" class="border rounded-lg px-3 py-2">
            <input type="number" name="starting_price" placeholder="Harga Mulai" step="0.01" class="border rounded-lg px-3 py-2">
            <textarea name="description" placeholder="Deskripsi" rows="2" class="border rounded-lg px-3 py-2 md:col-span-3"></textarea>
            <div>
                <input type="number" name="order" placeholder="Urutan" value="0" class="border rounded-lg px-3 py-2 w-24">
            </div>
        </div>
        <button type="submit" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Simpan</button>
    </form>
</div>

<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">Daftar Layanan</h3>
    <table class="w-full text-sm">
        <thead>
            <tr class="border-b text-left">
                <th class="py-2 px-3">Icon</th>
                <th class="py-2 px-3">Nama</th>
                <th class="py-2 px-3">Harga</th>
                <th class="py-2 px-3">Urutan</th>
                <th class="py-2 px-3">Aksi</th>
            </tr>
        </thead>
        <tbody>
            @forelse($services as $service)
            <tr class="border-b">
                <td class="py-2 px-3 text-2xl">{{ $service->icon ?? '📷' }}</td>
                <td class="py-2 px-3">{{ $service->title }}</td>
                <td class="py-2 px-3">{{ $service->starting_price ? 'Rp '.number_format($service->starting_price,0,',','.') : '-' }}</td>
                <td class="py-2 px-3">{{ $service->order }}</td>
                <td class="py-2 px-3">
                    <form method="POST" action="/services-admin/{{ $service->id }}" class="inline" onsubmit="return confirm('Hapus?')">
                        @csrf @method('DELETE')
                        <button type="submit" class="text-red-500 hover:text-red-700">Hapus</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr><td colspan="5" class="py-8 text-center text-gray-500">Belum ada layanan.</td></tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
