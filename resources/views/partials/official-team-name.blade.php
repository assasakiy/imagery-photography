@php
    $displayName = $name ?? $user?->name ?? 'Pengguna';
    $officialTeam = $officialTeam ?? ($user?->hasRole(['owner', 'admin']) ?? false);
@endphp
<span class="inline-flex min-w-0 items-center gap-1 {{ $class ?? '' }}">
    <span class="truncate">{{ $displayName }}</span>
    @if ($officialTeam)
        <span class="inline-flex h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" title="Tim Resmi" aria-label="Tim Resmi">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="m12 2.5 2.1 1.6 2.65-.15.8 2.53 2.25 1.4-.8 2.53.8 2.53-2.25 1.4-.8 2.53-2.65-.15L12 18.32l-2.1-1.6-2.65.15-.8-2.53-2.25-1.4.8-2.53-.8-2.53 2.25-1.4.8-2.53 2.65.15L12 2.5Z"/>
                <path d="m8.5 10.8 2.15 2.15 4.85-5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </span>
    @endif
</span>
