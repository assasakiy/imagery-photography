@extends('layouts.client')

@section('title', 'Project Saya')

@section('content')
<div class="bg-white rounded-lg shadow p-6 mb-6">
    <h2 class="text-2xl font-bold">Project Saya</h2>
</div>

@forelse($projects as $project)
<div class="bg-white rounded-lg shadow p-6 mb-4">
    <div class="flex justify-between items-start mb-4">
        <div>
            <h3 class="text-xl font-semibold">{{ $project->name }}</h3>
            @if($project->description)<p class="text-gray-500">{{ $project->description }}</p>@endif
        </div>
        <span class="px-3 py-1 text-sm rounded {{ $project->status === 'completed' ? 'bg-green-100 text-green-800' : ($project->status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ($project->status === 'delivered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')) }}">
            {{ str_replace('_', ' ', ucfirst($project->status)) }}
        </span>
    </div>
    <a href="/projects/{{ $project->id }}" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Detail →</a>
</div>
@empty
<div class="bg-white rounded-lg shadow p-6 text-center">
    <p class="text-gray-500">Belum ada project.</p>
</div>
@endforelse
@endsection
