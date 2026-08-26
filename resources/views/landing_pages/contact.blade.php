@extends('layouts.app')

@section('title', 'Kontak')
@section('meta_description', 'Hubungi Sopian Lalu Imagery untuk booking foto & video - wedding, prewedding, event, dan portrait di Lombok.')

@section('content')
    @include('partials.page-hero', [
        'page' => $page,
        'badge' => 'Kontak',
        'title' => 'Hubungi Kami',
        'subtitle' => 'Ada pertanyaan atau ingin booking? Kirim pesan melalui formulir di bawah, atau hubungi kami langsung.',
    ])

    <section class="container-site py-16 md:py-20">
        <div class="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-5">
            <div class="space-y-5 lg:col-span-2">
                <div class="reveal reveal-left card flex h-full flex-col p-6 sm:p-7">
                    <h2 class="text-lg font-bold text-ink">Informasi Kontak</h2>
                    <p class="mt-1 text-sm text-ink-muted">Hubungi kami melalui saluran di bawah ini.</p>

                    <div class="mt-5 divide-y divide-line">
                        @if (!empty($contents['contact_phone']))
                            <a href="tel:{{ $contents['contact_phone'] }}" class="group flex items-center gap-4 py-4">
                                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                </div>
                                <div>
                                    <p class="text-sm text-ink-muted">WhatsApp / Telepon</p>
                                    <p class="mt-0.5 font-semibold text-ink transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">{{ $contents['contact_phone'] }}</p>
                                </div>
                            </a>
                        @endif

                        @if (!empty($contents['contact_email']))
                            <a href="mailto:{{ $contents['contact_email'] }}" class="group flex items-center gap-4 py-4">
                                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                                </div>
                                <div>
                                    <p class="text-sm text-ink-muted">Email</p>
                                    <p class="mt-0.5 break-all font-semibold text-ink transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">{{ $contents['contact_email'] }}</p>
                                </div>
                            </a>
                        @endif

                        @if (!empty($contents['contact_address']))
                            <a href="https://www.google.com/maps/search/?api=1&query={{ urlencode($contents['contact_address']) }}" target="_blank" rel="noreferrer" class="group flex items-center gap-4 py-4">
                                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                </div>
                                <div>
                                    <p class="text-sm text-ink-muted">Studio / Base</p>
                                    <p class="mt-0.5 font-semibold text-ink transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">{{ $contents['contact_address'] }}</p>
                                </div>
                            </a>
                        @endif
                    </div>

                    @if (!empty($contents['social_extra']))
                        <div class="mt-auto border-t border-line pt-6">
                            <p class="mb-4 text-sm font-semibold text-ink">Temukan Kami di Sosial Media</p>
                            <div class="flex flex-wrap gap-3">
                                @foreach ($contents['social_extra'] as $extra)
                                    @if (!empty($extra['type']) && !empty($extra['url']))
                                        @include('partials.social-icon', [
                                            'type' => $extra['type'],
                                            'url' => $extra['url'],
                                            'size' => 20,
                                            'class' => 'flex h-11 w-11 items-center justify-center rounded-full border border-line bg-zinc-50 text-ink-muted transition-all hover:-translate-y-0.5 hover:border-brand-500/50 hover:text-brand-600 dark:bg-zinc-900 dark:hover:text-brand-400',
                                        ])
                                    @elseif (!empty($extra['label']) && !empty($extra['url']))
                                        <a href="{{ $extra['url'] }}" target="_blank" rel="noreferrer" class="flex items-center rounded-full border border-line bg-zinc-50 px-3 py-2 text-xs font-semibold text-ink-muted transition-all hover:-translate-y-0.5 hover:border-brand-500/50 hover:text-brand-600 dark:bg-zinc-900 dark:hover:text-brand-400">{{ $extra['label'] }}</a>
                                    @endif
                                @endforeach
                            </div>
                        </div>
                    @endif
                </div>
            </div>

            <div class="lg:col-span-3">
                <div class="reveal reveal-right card flex h-full flex-col p-6 sm:p-8">
                    <h2 class="text-xl font-bold text-ink">Kirim Pesan</h2>
                    <p class="mt-1 text-sm text-ink-muted">Kami akan membalas secepatnya.</p>

                    @if (session('success'))
                        <div class="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            {{ session('success') }}
                        </div>
                    @endif

                    @if ($errors->any())
                        <div class="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                            <ul class="list-inside list-disc space-y-1">
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <form method="POST" action="{{ route('contact.store') }}" class="mt-6 space-y-4">
                        @csrf
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label for="name" class="label">Nama <span class="text-red-500">*</span></label>
                                <input id="name" name="name" type="text" value="{{ old('name') }}" required class="input" placeholder="Nama Anda">
                            </div>
                            <div>
                                <label for="email" class="label">Email <span class="text-red-500">*</span></label>
                                <input id="email" name="email" type="email" value="{{ old('email') }}" required class="input" placeholder="email@contoh.com">
                            </div>
                        </div>
                        <div>
                            <label for="phone" class="label">Telepon / WhatsApp <span class="text-xs font-normal text-ink-muted">(opsional)</span></label>
                            <input id="phone" name="phone" type="text" value="{{ old('phone') }}" class="input" placeholder="08xxxxxxxxxx">
                        </div>
                        <div>
                            <label for="message" class="label">Pesan <span class="text-red-500">*</span></label>
                            <textarea id="message" name="message" rows="5" required class="input min-h-[120px]" placeholder="Ceritakan kebutuhan Anda...">{{ old('message') }}</textarea>
                        </div>
                        <button type="submit" class="btn-primary w-full sm:w-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                            Kirim Pesan
                        </button>
                    </form>
                </div>
            </div>
        </div>

        @if (!empty($contents['map_url']))
            <div class="mt-20">
                <div class="mb-10 text-center">
                    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Lokasi Kami</p>
                    <h2 class="text-2xl font-bold text-ink sm:text-3xl">Kunjungi Studio Kami</h2>
                </div>

                <div class="card overflow-hidden p-2">
                    <iframe
                        src="{{ maps_embed_url($contents['map_url']) }}"
                        class="h-[420px] w-full rounded-xl border-0 sm:h-[500px] lg:h-[520px]"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        title="Lokasi Sopian Lalu Imagery"
                    ></iframe>
                </div>
            </div>
        @elseif (!empty($contents['contact_address']))
            <div class="mt-20">
                <div class="mb-10 text-center">
                    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Lokasi Kami</p>
                    <h2 class="text-2xl font-bold text-ink sm:text-3xl">Kunjungi Studio Kami</h2>
                </div>

                <div class="card overflow-hidden p-2">
                    <iframe
                        src="https://www.google.com/maps?q={{ urlencode($contents['contact_address']) }}&output=embed"
                        class="h-[420px] w-full rounded-xl border-0 sm:h-[500px] lg:h-[520px]"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        title="Lokasi Sopian Lalu Imagery"
                    ></iframe>
                </div>
            </div>
        @endif
    </section>
@endsection
