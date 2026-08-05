@php
    $brandWords = preg_split('/\s+/', trim($siteName));
    $brandFirst = count($brandWords) > 1 ? implode(' ', array_slice($brandWords, 0, -1)) : '';
    $brandLast = end($brandWords);
@endphp
@if ($brandFirst)
    {{ $brandFirst }} <span class="text-brand-600 dark:text-brand-400">{{ $brandLast }}</span>
@else
    <span class="text-brand-600 dark:text-brand-400">{{ $brandLast }}</span>
@endif
