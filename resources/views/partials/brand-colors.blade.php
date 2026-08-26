@php
    $settings = app(\App\Services\RuntimeSettings::class);
@endphp
<style>
{!! \App\Support\BrandColors::css($settings->brandPrimaryColor(), $settings->brandSecondaryColor(), $settings->brandAccentColor()) !!}
</style>
