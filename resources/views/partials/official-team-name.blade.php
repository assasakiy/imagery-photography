@php
    $displayName = $name ?? $user?->name ?? 'Pengguna';
    $officialTeam = $officialTeam ?? ($user?->hasRole(['owner', 'admin']) ?? false);
@endphp
<span class="inline-flex min-w-0 items-center gap-1 {{ $class ?? '' }}">
    <span class="truncate">{{ $displayName }}</span>
    @if ($officialTeam)
        <span class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white" title="Tim Resmi" aria-label="Tim Resmi">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6.5 12.5 3.5 3.5 7.5-8"/></svg>
        </span>
    @endif
</span>
