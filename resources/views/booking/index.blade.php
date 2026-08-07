@extends('layouts.app')

@section('title', 'Booking')
@section('meta_description', 'Pesan layanan foto & video Sopian Lalu Imagery - wedding, prewedding, event, dan portrait di Lombok.')

@section('content')
    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div class="container-site relative py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Booking</p>
            <h1 class="section-heading text-ink">Pesan Sekarang</h1>
            <p class="mt-4 max-w-2xl text-ink-muted">
                Isi formulir di bawah dan kami akan menghubungi Anda via WhatsApp untuk konfirmasi ketersediaan jadwal.
            </p>
        </div>
    </section>

    <section class="container-site py-16">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div class="space-y-6 lg:col-span-2">
                @if (session('success'))
                    <div class="mb-2 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0"><path d="M20 6 9 17l-5-5" /></svg>
                        {{ session('success') }}
                    </div>
                @endif

                <form method="POST" action="{{ route('booking.store') }}" class="card space-y-6 p-6 md:p-8">
                    @csrf

                    <div class="flex items-center gap-3 border-b border-line pb-5">
                        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600 dark:text-brand-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </span>
                        <div>
                            <h2 class="text-lg font-bold text-ink">Data Diri</h2>
                            <p class="text-xs text-ink-muted">Email atau WhatsApp (minimal satu) diperlukan agar kami bisa menghubungi Anda.</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div class="sm:col-span-2">
                            <label for="name" class="label">Nama Lengkap <span class="text-red-500">*</span></label>
                            <input type="text" id="name" name="name" value="{{ old('name') }}" required class="input" placeholder="Nama Anda">
                            @error('name') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="email" class="label">Email <span class="text-red-500">*</span></label>
                            <input type="email" id="email" name="email" value="{{ old('email') }}" required class="input" placeholder="email@contoh.com">
                            @error('email') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="phone" class="label">No. WhatsApp <span class="text-amber-600">(opsional)</span></label>
                            <input type="text" id="phone" name="phone" value="{{ old('phone') }}" class="input" placeholder="08xxxxxxxxxx">
                            @error('phone') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>
                    </div>

                    <div class="flex items-center gap-3 border-b border-line pb-5">
                        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600 dark:text-brand-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        </span>
                        <div>
                            <h2 class="text-lg font-bold text-ink">Detail Acara</h2>
                            <p class="text-xs text-ink-muted">Pilih tanggal dan paket yang Anda inginkan.</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label for="event_date" class="label">Tanggal Acara</label>
                            <input type="date" id="event_date" name="event_date" value="{{ old('event_date') }}" class="input">
                            @error('event_date') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div class="sm:col-span-2">
                            <label for="package_id" class="label">Paket <span class="text-red-500">*</span></label>
                            <select id="package_id" name="package_id" class="input" required onchange="document.getElementById('custom_services').style.display = this.value === 'custom' ? 'block' : 'none'">
                                <option value="">Pilih paket...</option>
                                @foreach ($packages as $pkg)
                                    <option value="{{ $pkg['id'] }}" {{ old('package_id') == $pkg['id'] ? 'selected' : '' }}>{{ $pkg['name'] }}{{ $pkg['price'] ? ' — Rp ' . number_format($pkg['price'], 0, ',', '.') : '' }}</option>
                                @endforeach
                                <option value="custom" {{ old('package_id') == 'custom' ? 'selected' : '' }}>Kustom / Pilih Sendiri</option>
                            </select>
                            @error('package_id') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div id="custom_services" class="sm:col-span-2" style="display: {{ old('package_id') == 'custom' ? 'block' : 'none' }}">
                            <label class="label">Pilih Layanan Satuan</label>
                            <div class="max-h-48 overflow-y-auto rounded-xl border border-line bg-zinc-50/50 p-2 dark:bg-zinc-800/50">
                                @foreach ($services as $svc)
                                    <label class="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white dark:hover:bg-zinc-800">
                                        <input type="checkbox" name="service_ids[]" value="{{ $svc->id }}" class="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" {{ in_array($svc->id, old('service_ids', [])) ? 'checked' : '' }}>
                                        <div class="flex flex-1 justify-between text-sm">
                                            <span class="font-medium text-ink">{{ $svc->event }} <span class="text-xs text-ink-muted capitalize">({!! $svc->media !!})</span></span>
                                            <span class="font-semibold text-brand-600 dark:text-brand-400">Rp {{ number_format($svc->price, 0, ',', '.') }}</span>
                                        </div>
                                    </label>
                                @endforeach
                            </div>
                            @error('service_ids') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="location" class="label">Lokasi Acara</label>
                            <input type="text" id="location" name="location" value="{{ old('location') }}" class="input" placeholder="Alamat / tempat acara">
                            @error('location') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>
                    </div>

                    <div>
                        <label for="message" class="label">Catatan</label>
                        <textarea id="message" name="message" rows="4" class="input" placeholder="Ceritakan kebutuhan Anda...">{{ old('message') }}</textarea>
                        @error('message') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                    </div>

                    <div class="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
                        <button type="submit" class="btn-primary w-full sm:w-auto">
                            Kirim Permintaan Booking
                        </button>
                        <p class="flex items-center gap-1.5 text-xs text-ink-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            Respon cepat via WhatsApp dalam 1x24 jam.
                        </p>
                    </div>
                </form>
            </div>

            <div class="space-y-6">
                <div class="card p-5">
                    <p class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Kontak Kami</p>
                    @if (!empty($contents['contact_phone']))
                        <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', str_replace(['+'], '', $contents['contact_phone'])) }}" target="_blank" rel="noreferrer" class="group flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-surface-muted">
                            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-ink">WhatsApp Langsung</p>
                                <p class="mt-0.5 text-sm text-ink-muted">{{ $contents['contact_phone'] }}</p>
                            </div>
                        </a>
                    @endif

                    @if (!empty($contents['contact_email']))
                        <a href="mailto:{{ $contents['contact_email'] }}" class="group flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-surface-muted">
                            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-ink">Email</p>
                                <p class="mt-0.5 break-all text-sm text-ink-muted">{{ $contents['contact_email'] }}</p>
                            </div>
                        </a>
                    @endif

                    @if (!empty($contents['contact_address']))
                        <div class="flex items-start gap-4 rounded-xl p-3">
                            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-ink">Lokasi</p>
                                <p class="mt-0.5 text-sm text-ink-muted">{{ $contents['contact_address'] }}</p>
                            </div>
                        </div>
                    @endif
                </div>

                @if ($packages->isNotEmpty())
                    @php $featured = $packages->firstWhere('is_featured') ?? $packages->first(); @endphp
                    <div class="card overflow-hidden">
                        <div class="bg-gradient-to-br from-brand-600/10 to-brand-500/5 px-5 py-4">
                            <div class="flex items-center justify-between gap-2">
                                <p class="text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Paket Populer</p>
                                @if ($featured['is_featured'])
                                    <span class="badge bg-brand-600 text-white">Paling Laris</span>
                                @endif
                            </div>
                            <p class="mt-1 font-bold text-ink">{{ $featured['name'] }}</p>
                            @if ($featured['price'])
                                <p class="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($featured['price'], 0, ',', '.') }}</p>
                                @if ($featured['discount'])
                                    <p class="text-xs text-ink-muted">Harga asli Rp {{ number_format($featured['base_price'], 0, ',', '.') }} · Hemat Rp {{ number_format($featured['discount'], 0, ',', '.') }}</p>
                                @endif
                            @endif
                        </div>
                        @if (!empty($featured['items']))
                            <ul class="space-y-2 px-5 py-4 text-sm text-ink-muted">
                                @foreach ($featured['items'] as $item)
                                    <li class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-emerald-500"><path d="M20 6 9 17l-5-5" /></svg>
                                        {{ $item }}
                                    </li>
                                @endforeach
                            </ul>
                        @endif
                    </div>
                @endif

                <div class="card p-5">
                    <p class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Cara Booking</p>
                    <ol class="space-y-4">
                        @foreach ([
                            'Isi formulir dengan data diri & detail acara Anda.',
                            'Kami konfirmasi ketersediaan via WhatsApp/Email.',
                            'Cicilan atau pelunasan bisa dilakukan dari portal klien.',
                        ] as $i => $step)
                            <li class="flex items-start gap-3">
                                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/15 text-xs font-bold text-brand-600 dark:text-brand-400">{{ $i + 1 }}</span>
                                <p class="text-sm text-ink-muted">{{ $step }}</p>
                            </li>
                        @endforeach
                    </ol>
                </div>
            </div>
        </div>
    </section>
@endsection
