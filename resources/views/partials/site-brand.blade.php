@php
    $brandWords = preg_split('/\s+/', trim($siteName));
    $brandFirst = count($brandWords) > 1 ? implode(' ', array_slice($brandWords, 0, -1)) : '';
    $brandLast = end($brandWords);
@endphp
<span style="font-family: var(--font-display); font-weight: 600; letter-spacing: -0.02em;">
@if ($brandFirst)
    {{ $brandFirst }} <span class="italic text-brand-600 dark:text-brand-400" style="font-weight: 500;">{{ $brandLast }}</span>
@else
    <span class="italic text-brand-600 dark:text-brand-400" style="font-weight: 500;">{{ $brandLast }}</span>
@endif
</span>
