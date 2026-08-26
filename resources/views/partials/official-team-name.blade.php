@php
    $displayName = $name ?? $user?->name ?? 'Pengguna';
    $officialTeam = $officialTeam ?? ($user?->hasRole(['owner', 'admin']) ?? false);
@endphp
<span class="inline-flex min-w-0 items-center gap-1 {{ $class ?? '' }}">
    <span class="truncate">{{ $displayName }}</span>
    @if ($officialTeam)
        <span class="inline-flex h-[17px] w-[17px] shrink-0 self-center align-middle text-brand-600 dark:text-brand-400" role="img" title="Tim Resmi" aria-label="Tim Resmi">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
                <path d="m9 12 2 2 4-4"/>
            </svg>
        </span>
    @endif
</span>
