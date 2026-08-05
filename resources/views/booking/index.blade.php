@extends('layouts.app')

@section('title', 'Booking')
@section('meta_description', 'Pesan layanan foto & video Sopian Lalu Imagery - wedding, prewedding, event, dan portrait di Lombok.')

@section('content')
    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Booking</p>
            <h1 class="section-heading text-ink">Pesan Sekarang</h1>
            <p class="mt-4 max-w-2xl text-ink-muted">
                Isi formulir di bawah dan kami akan menghubungi Anda via WhatsApp untuk konfirmasi ketersediaan jadwal.
            </p>
        </div>
    </section>

    <section class="container-site py-16">
        <div class="grid grid-cols-1 gap-10 lg:grid-cols-5">
            <div class="space-y-4 lg:col-span-2">
                @if (!empty($contents['contact_phone']))
                    <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', str_replace(['+'], '', $contents['contact_phone'])) }}" target="_blank" rel="noreferrer" class="card flex items-start gap-4 p-5 transition-colors hover:border-brand-500/50">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-ink">WhatsApp Langsung</p>
                            <p class="mt-1 text-sm text-ink-muted">{{ $contents['contact_phone'] }}</p>
                        </div>
                    </a>
                @endif

                @if (!empty($contents['contact_email']))
                    <a href="mailto:{{ $contents['contact_email'] }}" class="card flex items-start gap-4 p-5 transition-colors hover:border-brand-500/50">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-ink">Email</p>
                            <p class="mt-1 break-all text-sm text-ink-muted">{{ $contents['contact_email'] }}</p>
                        </div>
                    </a>
                @endif

                <div class="card p-5">
                    <p class="text-sm font-semibold text-ink">Paket Populer</p>
                    <ul class="mt-3 space-y-2 text-sm text-ink-muted">
                        @foreach ($packages->take(4) as $pkg)
                            <li class="flex items-center gap-2">
                                <span class="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                                {{ $pkg['name'] }}
                            </li>
                        @endforeach
                    </ul>
                </div>
            </div>

            <div class="lg:col-span-3">
                @if (session('success'))
                    <div class="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        {{ session('success') }}
                    </div>
                @endif

                <form method="POST" action="{{ route('booking.store') }}" class="card space-y-5 p-6 md:p-8">
                    @csrf

                    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label for="name" class="label">Nama Lengkap <span class="text-red-500">*</span></label>
                            <input type="text" id="name" name="name" value="{{ old('name') }}" required class="input" placeholder="Nama Anda">
                            @error('name') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="phone" class="label">No. WhatsApp <span class="text-red-500">*</span></label>
                            <input type="text" id="phone" name="phone" value="{{ old('phone') }}" required class="input" placeholder="08xxxxxxxxxx">
                            @error('phone') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="email" class="label">Email</label>
                            <input type="email" id="email" name="email" value="{{ old('email') }}" class="input" placeholder="email@contoh.com">
                            @error('email') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div>
                            <label for="event_date" class="label">Tanggal Acara</label>
                            <input type="date" id="event_date" name="event_date" value="{{ old('event_date') }}" class="input">
                            @error('event_date') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>

                        <div class="sm:col-span-2">
                            <label for="package" class="label">Paket / Jenis Acara</label>
                            <select id="package" name="package" class="input">
                                <option value="">Pilih paket...</option>
                                @foreach ($packages as $pkg)
                                    <option value="{{ $pkg['name'] }}" {{ old('package') === $pkg['name'] ? 'selected' : '' }}>{{ $pkg['name'] }}</option>
                                @endforeach
                            </select>
                            @error('package') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                        </div>
                    </div>

                    <div>
                        <label for="message" class="label">Pesan Tambahan</label>
                        <textarea id="message" name="message" rows="4" class="input" placeholder="Ceritakan kebutuhan Anda...">{{ old('message') }}</textarea>
                        @error('message') <p class="mt-1 text-xs text-red-500">{{ $message }}</p> @enderror
                    </div>

                    <div class="flex flex-col items-center gap-3 sm:flex-row">
                        <button type="submit" class="btn-primary w-full sm:w-auto">
                            Kirim Permintaan Booking
                        </button>
                        <p class="text-xs text-ink-muted">Respon cepat via WhatsApp dalam 1x24 jam.</p>
                    </div>
                </form>
            </div>
        </div>
    </section>
@endsection
