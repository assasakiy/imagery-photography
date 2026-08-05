@extends('layouts.admin')

@section('title', 'Clients')

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-2xl font-bold mb-4">Tambah Client</h2>
    <form method="POST" action="/clients">
        @csrf
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="name" placeholder="Nama Client" required class="border rounded-lg px-3 py-2">
            <input type="email" name="email" placeholder="Email" class="border rounded-lg px-3 py-2">
            <input type="text" name="phone" placeholder="No. WhatsApp" class="border rounded-lg px-3 py-2">
            <input type="text" name="company" placeholder="Perusahaan" class="border rounded-lg px-3 py-2">
            <textarea name="notes" placeholder="Catatan" rows="2" class="border rounded-lg px-3 py-2 md:col-span-2"></textarea>
        </div>
        <button type="submit" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Simpan</button>
    </form>
</div>

<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">Daftar Client</h3>
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b text-left">
                    <th class="py-2 px-3">Nama</th>
                    <th class="py-2 px-3">Kontak</th>
                    <th class="py-2 px-3">Jumlah Project</th>
                    <th class="py-2 px-3">Dibuat</th>
                </tr>
            </thead>
            <tbody>
                @forelse($clients as $client)
                <tr class="border-b hover:bg-gray-50">
                    <td class="py-2 px-3 font-medium">{{ $client->name }}</td>
                    <td class="py-2 px-3">
                        @if($client->email)<div>{{ $client->email }}</div>@endif
                        @if($client->phone)<div class="text-gray-500">{{ $client->phone }}</div>@endif
                    </td>
                    <td class="py-2 px-3">{{ $client->projects_count }}</td>
                    <td class="py-2 px-3 text-gray-500">{{ $client->created_at->format('d M Y') }}</td>
                </tr>
                @empty
                <tr><td colspan="4" class="py-8 text-center text-gray-500">Belum ada client.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-4">{{ $clients->links() }}</div>
</div>
@endsection
