@extends('layouts.app')

@section('title', 'Layanan & Harga')
@section('meta_description', 'Daftar layanan dan paket harga photography & videography Sopian Lalu Imagery - dari paket satuan hingga bundling lengkap.')

@section('content')
    @php
        $servicesIntro = \App\Models\LandingContent::getValue('services_intro', '');
        $whatsappUrl = \App\Models\LandingContent::getValue('social_whatsapp', 'https://wa.me/6287764426909');
        $icons = [
            'camera' => 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
            'video' => 'M22 8l-6 4 6 4V8z M2 6h14v12H2z',
            'heart' => 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
        ];
    @endphp

    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-20">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Layanan</p>
            <h1 class="section-heading text-ink">Paket & Harga</h1>
            @if ($servicesIntro)
                <p class="mt-4 max-w-2xl text-ink-muted">{{ $servicesIntro }}</p>
            @endif
        </div>
    </section>

    {{-- Service cards --}}
    @if ($services->isNotEmpty())
        <section class="container-site py-20">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                @foreach ($services as $service)
                    <div class="card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
                        <div class="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-600/10 transition-transform duration-300 group-hover:scale-150"></div>
                        <div class="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="{{ $icons[$service->icon] ?? $icons['camera'] }}"/></svg>
                        </div>
                        <h2 class="text-lg font-bold text-ink">{{ $service->title }}</h2>
                        <p class="mt-2 text-sm leading-relaxed text-ink-muted">{{ content_plain($service->description) }}</p>
                        @if ($service->starting_price)
                            <p class="mt-5 text-sm text-ink-muted">Mulai dari</p>
                            <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($service->starting_price, 0, ',', '.') }}</p>
                        @endif
                    </div>
                @endforeach
            </div>
        </section>
    @endif

    {{-- Price tables (dari konten WordPress) --}}
    <section class="bg-zinc-100/60 py-20 dark:bg-zinc-900/40">
        <div class="container-site space-y-16">
            <div>
                <div class="mb-8">
                    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">I. Satuan</p>
                    <h2 class="text-2xl font-bold text-ink sm:text-3xl">Paket Stand-Alone</h2>
                    <p class="mt-2 text-sm text-ink-muted">Layanan satuan, bisa dipilih Foto atau Video saja.</p>
                </div>
                <div class="card overflow-hidden">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Layanan</th>
                                <th>Foto <span class="font-normal">(Edit + Soft File)</span></th>
                                <th>Video <span class="font-normal">(3-4 Menit)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ([
                                ['Akad', '400k', '500k'],
                                ['Wedding', '450k', '550k'],
                                ['Nyongkolan', '500k', '600k'],
                                ['Ulang Tahun', '350k', '450k'],
                                ['Hunting', '300k / 3 jam', '300k / 1-2 menit'],
                                ['Wisuda', '450k / 1 jam', '450k / 1-2 menit'],
                            ] as [$name, $foto, $video])
                                <tr>
                                    <td class="font-semibold text-ink">{{ $name }}</td>
                                    <td class="text-ink">{{ $foto }}</td>
                                    <td class="text-ink">{{ $video }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <div class="mb-8">
                    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">II. Premium</p>
                    <h2 class="text-2xl font-bold text-ink sm:text-3xl">Paket Single Medium</h2>
                    <p class="mt-2 text-sm text-ink-muted">Bundling satu medium untuk rangkaian acara.</p>
                </div>
                <div class="card overflow-hidden">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Paket</th>
                                <th>Foto <span class="font-normal">(Bundling)</span></th>
                                <th>Video <span class="font-normal">(Bundling)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ([
                                ['Akad + Wedding', '800k', '900k'],
                                ['Akad + Nyongkolan', '850k', '950k'],
                                ['Akad + Wedding + Nyongkolan', '1.200k', '1.500k'],
                            ] as [$name, $foto, $video])
                                <tr>
                                    <td class="font-semibold text-ink">{{ $name }}</td>
                                    <td class="text-ink">{{ $foto }}</td>
                                    <td class="text-ink">{{ $video }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <div class="mb-8">
                    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">III. Ultimate</p>
                    <h2 class="text-2xl font-bold text-ink sm:text-3xl">Paket Combo Foto + Video</h2>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ([
                        ['Akad', '900k'],
                        ['Wedding', '950k'],
                        ['Nyongkolan', '950k'],
                        ['Akad + Wedding', '1.600k'],
                        ['Akad + Nyongkolan', '1.700k'],
                        ['Akad + Wedding + Nyongkolan', '2.700k'],
                    ] as [$name, $price])
                        <div class="card flex items-center justify-between p-5">
                            <span class="font-semibold text-ink">{{ $name }}</span>
                            <span class="text-lg font-bold text-brand-600 dark:text-brand-400">{{ $price }}</span>
                        </div>
                    @endforeach
                    <div class="card flex flex-col justify-between p-5">
                        <span class="font-semibold text-ink">Lainnya</span>
                        <span class="text-sm text-ink-muted">Ulang Tahun (800k) · Hunting (500k) · Wisuda (750k)</span>
                    </div>
                </div>
            </div>

            <div class="card border-amber-500/40 bg-amber-500/5 p-6">
                <h3 class="flex items-center gap-2 font-bold text-ink">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500"><path d="M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>
                    Catatan Penting
                </h3>
                <ul class="mt-4 space-y-2 text-sm leading-relaxed text-ink-muted">
                    <li><span class="font-semibold text-ink">Layanan Video:</span> Harga sudah <span class="font-semibold text-ink">termasuk penggunaan Drone</span> untuk pengambilan gambar udara.</li>
                    <li><span class="font-semibold text-ink">Ketentuan File Foto:</span> Paket foto bersifat <em>File Only</em>. Semua file dikirimkan melalui <span class="font-semibold text-ink">Google Drive</span> segera setelah acara selesai/diproses.</li>
                    <li><span class="font-semibold text-ink">Biaya Transportasi (charge luar wilayah):</span> Luar Pringgarata <span class="font-semibold text-ink">+50k</span>, Luar Lombok Tengah <span class="font-semibold text-ink">+100k</span>.</li>
                    <li>Untuk paket sekolah atau kebutuhan khusus lainnya, silakan hubungi kami.</li>
                </ul>
            </div>

            <div class="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 p-8 text-center sm:p-12">
                <h2 class="text-2xl font-bold text-white sm:text-3xl">Siap Mengabadikan Momen Anda?</h2>
                <p class="mx-auto mt-3 max-w-xl text-sm text-brand-100 sm:text-base">Konsultasikan kebutuhan Anda secara gratis. Kami akan bantu pilih paket yang paling tepat.</p>
                <a href="{{ $whatsappUrl }}" target="_blank" rel="noreferrer" class="btn mt-6 bg-white text-brand-700 shadow-lg hover:bg-brand-50">
                    Hubungi via WhatsApp
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </a>
            </div>
        </div>
    </section>
@endsection
