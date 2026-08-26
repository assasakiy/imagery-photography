@php
    $emailEnabled = $shellSettings->channelEnabled('email');
    $waEnabled = $shellSettings->channelEnabled('whatsapp');
    $reqEmail = $emailEnabled && !$waEnabled;
    $reqPhone = $waEnabled && !$emailEnabled;
    $reqBoth = $emailEnabled && $waEnabled;
@endphp

@extends('layouts.app')

@section('title', 'Booking')
@section('meta_description', 'Pesan layanan foto & video Sopian Lalu Imagery - wedding, prewedding, event, dan portrait di Lombok.')

@section('content')
    @include('partials.page-hero', [
        'page' => $page,
        'badge' => 'Booking',
        'title' => 'Pesan Sekarang',
        'subtitle' => 'Isi formulir di bawah dan kami akan menghubungi Anda via WhatsApp untuk konfirmasi ketersediaan jadwal.',
    ])

    <section class="container-site pt-16 pb-24">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div class="space-y-6 lg:col-span-2">
                @if (session('success'))
                    <div class="mb-2 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0"><path d="M20 6 9 17l-5-5" /></svg>
                        {{ session('success') }}
                    </div>
                @endif

                <form method="POST" action="{{ route('booking.store') }}" class="reveal reveal-scale card space-y-6 p-6 md:p-8">
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

@php
    $emailEnabled = $shellSettings->channelEnabled('email');
    $waEnabled = $shellSettings->channelEnabled('whatsapp');
    $reqEmail = $emailEnabled && !$waEnabled;
    $reqPhone = $waEnabled && !$emailEnabled;
    $reqBoth = $emailEnabled && $waEnabled;
@endphp

                        <div>
                            <label for="email" class="label">Email 
                                @if($reqEmail) <span class="text-red-500">*</span> 
                                @elseif($reqBoth) <span class="text-red-500">*</span><span class="text-[10px] font-normal text-ink-muted ml-1">(atau isi WA)</span> 
                                @else <span class="text-amber-600">(opsional)</span> 
                                @endif
                            </label>
                            <input type="email" id="email" name="email" value="{{ old('email') }}" {{ $reqEmail ? 'required' : '' }} class="input" placeholder="email@contoh.com">
                            @error('email') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="phone" class="label">No. WhatsApp 
                                @if($reqPhone) <span class="text-red-500">*</span> 
                                @elseif($reqBoth) <span class="text-red-500">*</span><span class="text-[10px] font-normal text-ink-muted ml-1">(atau isi Email)</span> 
                                @else <span class="text-amber-600">(opsional)</span> 
                                @endif
                            </label>
                            <input type="text" id="phone" name="phone" value="{{ old('phone') }}" {{ $reqPhone ? 'required' : '' }} class="input" placeholder="08xxxxxxxxxx">
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
                            <label for="location" class="label">Lokasi Acara</label>
                            <input type="text" id="location" name="location" value="{{ old('location') }}" class="input" placeholder="Alamat / tempat acara">
                            @error('location') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="event_date" class="label">Tanggal Acara</label>
                            <input type="date" id="event_date" name="event_date" value="{{ old('event_date') }}" class="input">
                            @error('event_date') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="event_start" class="label">Waktu Mulai Acara</label>
                            <input type="time" id="event_start" name="event_start_time" value="{{ old('event_start_time') }}" class="input">
                            @error('event_start_time') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="event_end" class="label">Waktu Selesai Acara</label>
                            <input type="time" id="event_end" name="event_end_time" value="{{ old('event_end_time') }}" class="input">
                            @error('event_end_time') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div class="sm:col-span-2">
                            <label for="package_id" class="label">Paket <span class="text-red-500">*</span></label>
                            <select id="package_id" name="package_id" class="input" required onchange="document.getElementById('custom_services').style.display = this.value === 'custom' ? 'block' : 'none'">
                                <option value="">Pilih paket...</option>
                                @foreach ($packages as $pkg)
                                    <option value="{{ $pkg['id'] }}" {{ old('package_id') == $pkg['id'] ? 'selected' : '' }}>{{ $pkg['name'] }}{{ $pkg['price'] ? ' — Rp ' . number_format($pkg['price'], 0, ',', '.') : '' }}</option>
                                @endforeach
                                <option value="custom" {{ old('package_id') == 'custom' ? 'selected' : '' }}>Layanan Satuan</option>
                            </select>
                            @error('package_id') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div id="custom_services" class="sm:col-span-2" style="display: {{ old('package_id') == 'custom' ? 'block' : 'none' }}">
                            <label class="label">Pilih Layanan Satuan</label>
                            <div class="max-h-48 overflow-y-auto rounded-xl border border-line bg-zinc-50/50 p-2 dark:bg-zinc-800/50">
                                @foreach ($services as $svc)
                                    <label class="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white dark:hover:bg-zinc-800">
                                        <input type="checkbox" name="service_ids[]" value="{{ $svc->id }}" data-price="{{ $svc->price }}" data-name="{{ $svc->event }} ({{ $svc->media }})" class="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500" {{ in_array($svc->id, old('service_ids', [])) ? 'checked' : '' }}>
                                        <div class="flex flex-1 justify-between text-sm">
                                            <span class="font-medium text-ink">{{ $svc->event }} <span class="text-xs text-ink-muted capitalize">({!! $svc->media !!})</span></span>
                                            <span class="font-semibold tabular-nums text-brand-600 dark:text-brand-400">Rp {{ number_format($svc->price, 0, ',', '.') }}</span>
                                        </div>
                                    </label>
                                @endforeach
                            </div>
                            @error('service_ids') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
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

            <div class="flex h-full flex-col space-y-6">
                @if ($showKontak)
                <div class="card shrink-0 p-5">
                    <p class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">{{ $kontakTitle }}</p>
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
                @endif

                @if ($showPopuler && $packages->isNotEmpty())
                    @php
                        $popularCards = $packages
                            ->sortByDesc(fn ($p) => $p['is_featured'] || ($p['booking_count'] ?? 0) > 0)
                            ->filter(fn ($p) => $p['is_featured'] || ($p['booking_count'] ?? 0) > 0)
                            ->values()
                            ->take(3);
                    @endphp
                    <div class="reveal reveal-right card flex-1 p-5" id="bcard">
                        <p class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted" id="bcard_label">{{ $populerTitle }}</p>
                        <div class="space-y-3" id="bcard_list">
                            @foreach ($popularCards as $i => $pkg)
                                @php
                                    $borderRank = ['border-brand-500/60', 'border-brand-500/30', 'border-brand-500/15'][$i] ?? 'border-line';
                                    $bgRank = ['bg-brand-500/5', '', ''][$i] ?? '';
                                @endphp
                                <div class="rounded-xl border-2 {{ $borderRank }} {{ $bgRank }} p-3 transition-colors" id="bcard_row_{{ $pkg['id'] }}" data-pkg-id="{{ $pkg['id'] }}">
                                    <div class="flex items-start gap-3">
                                        <span class="mt-0.5 flex h-8 w-8 min-w-8 items-center justify-center rounded-full bg-brand-600/15 text-sm font-bold leading-none text-brand-600 dark:text-brand-400">{{ $i + 1 }}</span>
                                        <div class="min-w-0 flex-1">
                                            <p class="truncate font-semibold text-ink" data-name>{{ $pkg['name'] }}</p>
                                            <p class="mt-0.5 text-sm font-bold tabular-nums text-brand-600 dark:text-brand-400" data-price>Rp {{ number_format($pkg['price'], 0, ',', '.') }}</p>
                                            @if ($pkg['discount'] > 0)
                                                <p class="text-xs text-ink-muted line-through">Rp {{ number_format($pkg['base_price'], 0, ',', '.') }}</p>
                                            @endif
                                        </div>
                                    </div>
                                    <ul class="mt-2 space-y-1 border-t border-line pt-2 text-sm text-ink-muted">
                                        @foreach ($pkg['items'] as $item)
                                            <li class="flex items-center gap-2">
                                                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"></span>
                                                <span class="truncate" data-item>{{ $item }}</span>
                                            </li>
                                        @endforeach
                                    </ul>
                                </div>
                            @endforeach
                        </div>
                        <div class="mt-3 hidden rounded-xl border border-dashed border-line bg-surface-muted/50 p-3 text-sm text-ink-muted" id="bcard_detail"></div>
                    </div>
                @endif

                </div>
        </div>
    </section>

        @if ($showCara)
        <section class="border-t border-line py-16">
            <div class="container-site">
                <div class="mb-12 text-center">
                    <h2 class="text-2xl font-bold tracking-tight text-ink">{{ $caraTitle }}</h2>
                </div>
                <ol class="relative ml-6 mr-auto max-w-3xl border-l-2 border-zinc-400/40 pl-10 md:mx-auto md:border-l-0 md:pl-0">
                    <span aria-hidden="true" class="absolute left-1/2 top-0 z-0 hidden h-full w-0.5 -translate-x-1/2 bg-zinc-400/40 md:block"></span>
                    @foreach ($caraSteps as $i => $step)
                        <li class="relative mb-3 md:mb-1 md:flex last:mb-0 {{ $i % 2 === 0 ? 'md:justify-start' : 'md:justify-end' }}">
                            @if ($i % 2 === 0)
                                <div class="w-full md:w-1/2 md:pr-12 md:mr-auto">
                                    <div class="card p-5">
                                        <p class="text-sm leading-relaxed text-ink-muted">{{ $step }}</p>
                                    </div>
                                </div>
                                <span class="absolute -left-[62px] top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-400 bg-surface text-sm font-bold text-ink md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 dark:bg-zinc-900 dark:text-brand-400">{{ $i + 1 }}</span>
                            @else
                                <span class="absolute -left-[62px] top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-400 bg-surface text-sm font-bold text-ink md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 dark:bg-zinc-900 dark:text-brand-400">{{ $i + 1 }}</span>
                                <div class="w-full md:w-1/2 md:pl-12 md:ml-auto">
                                    <div class="card p-5">
                                        <p class="text-sm leading-relaxed text-ink-muted">{{ $step }}</p>
                                    </div>
                                </div>
                            @endif
                        </li>
                    @endforeach
                </ol>
            </div>
        </section>
        @endif

        @if ($showFaq)
        <section class="border-t border-line py-16">
            <div class="container-site">
                <div class="mb-10 text-center">
                    <h2 class="text-2xl font-bold tracking-tight text-ink">{{ $faqTitle }}</h2>
                </div>
                <div class="mx-auto max-w-3xl space-y-3">
                    @foreach ($faqs as $faq)
                        <details class="group card p-0">
                            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-ink [&::-webkit-details-marker]:hidden">
                                {{ $faq->question }}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-ink-muted transition-transform duration-300 group-open:rotate-180"><path d="m6 9 6 6 6-6"/></svg>
                            </summary>
                            <div class="rich-content px-6 pb-6">
                                {!! content_html($faq->answer) !!}
                            </div>
                        </details>
                    @endforeach
                </div>
            </div>
        </section>
        @endif

    <script>
(function () {
            const PACKAGES = @json($packages);
            const pkgSel = document.getElementById('package_id');
            const svcBoxes = document.querySelectorAll('input[name="service_ids[]"]');
            const rows = document.querySelectorAll('#bcard_list [data-pkg-id]');
            const detail = document.getElementById('bcard_detail');
            const fmt = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

            function clearActive() {
                rows.forEach((row) => {
                    row.classList.remove('ring-2', 'ring-brand-500/30', 'bg-brand-500/5');
                });
            }

            function updateCard() {
                const val = pkgSel.value;
                clearActive();
                rows.forEach((row) => (row.style.display = ''));
                detail.classList.add('hidden');
                detail.classList.remove('flex');
                if (val === 'custom') {
                    const checked = [...svcBoxes].filter((b) => b.checked);
                    if (checked.length) {
                        detail.classList.remove('hidden');
                        detail.classList.add('flex');
                        detail.innerHTML = checked.map((b) => '<li class="flex items-center gap-2"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"></span><span class="truncate">' + b.dataset.name + '</span></li>').join('');
                    }
                } else if (val) {
                    const row = document.getElementById('bcard_row_' + val);
                    if (row) row.classList.add('ring-2', 'ring-brand-500/30', 'bg-brand-500/5');
                }
            }

            function freezeCard() {
                const card = document.getElementById('bcard');
                if (card) card.style.flex = '0 0 auto';
            }

            pkgSel.addEventListener('change', () => { freezeCard(); updateCard(); });
            svcBoxes.forEach((b) => b.addEventListener('change', () => { freezeCard(); if (pkgSel.value === 'custom') updateCard(); }));
            updateCard();
        })();
    </script>
@endsection
