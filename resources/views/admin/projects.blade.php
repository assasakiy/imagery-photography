@extends('layouts.admin')

@section('title', 'Projects')

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-2xl font-bold mb-4">Buat Project Baru</h2>
    <form method="POST" action="/projects">
        @csrf
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select name="client_id" required class="border rounded-lg px-3 py-2">
                <option value="">Pilih Client</option>
                @foreach($clients as $client)
                <option value="{{ $client->id }}">{{ $client->name }}</option>
                @endforeach
            </select>
            <input type="text" name="name" placeholder="Nama Project" required class="border rounded-lg px-3 py-2">
            <select name="status" class="border rounded-lg px-3 py-2">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
            </select>
            <textarea name="description" placeholder="Deskripsi" rows="2" class="border rounded-lg px-3 py-2 md:col-span-2"></textarea>
            <input type="number" name="price" placeholder="Harga (Rp)" step="0.01" class="border rounded-lg px-3 py-2">
            <input type="date" name="start_date" class="border rounded-lg px-3 py-2">
            <input type="date" name="end_date" class="border rounded-lg px-3 py-2">
        </div>
        <button type="submit" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Buat Project</button>
    </form>
</div>

<div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-semibold mb-4">Daftar Project</h3>
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b text-left">
                    <th class="py-2 px-3">Project</th>
                    <th class="py-2 px-3">Client</th>
                    <th class="py-2 px-3">Harga</th>
                    <th class="py-2 px-3">Status</th>
                    <th class="py-2 px-3">Aksi</th>
                </tr>
            </thead>
            <tbody>
                @forelse($projects as $project)
                <tr class="border-b hover:bg-gray-50">
                    <td class="py-2 px-3 font-medium">{{ $project->name }}</td>
                    <td class="py-2 px-3">{{ $project->client?->name }}</td>
                    <td class="py-2 px-3">{{ $project->price ? 'Rp '.number_format($project->price,0,',','.') : '-' }}</td>
                    <td class="py-2 px-3">
                        <span class="px-2 py-1 text-xs rounded {{ $project->status === 'completed' ? 'bg-green-100 text-green-800' : ($project->status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ($project->status === 'delivered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')) }}">
                            {{ str_replace('_', ' ', $project->status) }}
                        </span>
                    </td>
                    <td class="py-2 px-3">
                        <a href="/projects/{{ $project->id }}" class="text-indigo-600 hover:text-indigo-800">Detail</a>
                    </td>
                </tr>
                @empty
                <tr><td colspan="5" class="py-8 text-center text-gray-500">Belum ada project.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-4">{{ $projects->links() }}</div>
</div>
@endsection
