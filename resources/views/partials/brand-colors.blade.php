@php
    $brandColor = app(\App\Services\RuntimeSettings::class)->brandColor();
@endphp
<style>
{!! \App\Support\BrandColors::css($brandColor) !!}
</style>
