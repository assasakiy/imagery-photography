@extends('layouts.app')

@section('title', 'Kontak')
@section('meta_description', 'Hubungi Sopian Lalu Imagery untuk booking foto & video - wedding, prewedding, event, dan portrait di Lombok.')

@section('content')
    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Kontak</p>
            <h1 class="section-heading text-ink">Hubungi Kami</h1>
            <p class="mt-4 max-w-2xl text-ink-muted">
                Ada pertanyaan atau ingin booking? Kirim pesan melalui formulir di bawah, atau hubungi kami langsung.
            </p>
        </div>
    </section>

    <section class="container-site py-16">
        <div class="grid grid-cols-1 gap-10 lg:grid-cols-5">
            <div class="space-y-4 lg:col-span-2">
                @if (!empty($contents['contact_phone']))
                    <a href="tel:{{ $contents['contact_phone'] }}" class="card group flex items-start gap-4 p-5 transition-colors hover:border-brand-500/50">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-ink">Telepon / WhatsApp</p>
                            <p class="mt-1 text-sm text-ink-muted">{{ $contents['contact_phone'] }}</p>
                        </div>
                    </a>
                @endif

                @if (!empty($contents['contact_email']))
                    <a href="mailto:{{ $contents['contact_email'] }}" class="card group flex items-start gap-4 p-5 transition-colors hover:border-brand-500/50">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-ink">Email</p>
                            <p class="mt-1 break-all text-sm text-ink-muted">{{ $contents['contact_email'] }}</p>
                        </div>
                    </a>
                @endif

                @if (!empty($contents['contact_address']))
                    <div class="card flex items-start gap-4 p-5">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-ink">Alamat</p>
                            <p class="mt-1 text-sm text-ink-muted">{{ $contents['contact_address'] }}</p>
                        </div>
                    </div>
                @endif

                <div class="card p-5">
                    <p class="mb-4 text-sm font-semibold text-ink">Media Sosial</p>
                    <div class="flex flex-wrap gap-2">
                        @foreach ([
                            'social_instagram' => 'Instagram',
                            'social_facebook' => 'Facebook',
                            'social_tiktok' => 'TikTok',
                            'social_whatsapp' => 'WhatsApp',
                        ] as $key => $label)
                            @if (!empty($contents[$key]))
                                <a href="{{ $contents[$key] }}" target="_blank" rel="noreferrer" class="btn-outline !px-4 !py-2 !text-xs">{{ $label }}</a>
                            @endif
                        @endforeach
                    </div>
                </div>
            </div>

            <div class="lg:col-span-3">
                <div class="card p-6 sm:p-8">
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
    </section>
@endsection
