@extends('layouts.app')

@section('title', 'Layanan & Harga')
@section('meta_description', 'Daftar layanan dan paket harga photography & videography Sopian Lalu Imagery - dari paket satuan hingga bundling lengkap.')

@section('content')
    @php
        $servicesIntro = \App\Models\LandingContent::getValue('services_intro', '');
        $whatsappUrl = \App\Models\LandingContent::getValue('social_whatsapp', 'https://wa.me/6287764426909');

        $allServices = $services; // master satuan
        $minPhoto = $allServices->where('media', 'photo')->min('price');
        $minVideo = $allServices->where('media', 'video')->min('price');

        $allPackages = \App\Models\Package::with('services')->active()->orderBy('display_order')->get();
        $featuredPackage = $allPackages->firstWhere('is_featured', true) ?? $allPackages->firstWhere('is_popular', true) ?? $allPackages->first();

        $mediaMeta = [
            'photo' => ['label' => 'Photography', 'desc' => 'Abadikan momen dengan gambar berkualitas tinggi.', 'icon' => 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'min' => $minPhoto],
            'video' => ['label' => 'Videography', 'desc' => 'Cerita bergerak sinematik untuk momen Anda.', 'icon' => 'M22 8l-6 4 6 4V8z M2 6h14v12H2z', 'min' => $minVideo],
        ];
        $cards = array_values(array_filter($mediaMeta, fn ($m) => $m['min'] !== null));

        $priceCategories = \App\Models\ServiceCategory::where('published', true)->orderBy('order')->get();
    @endphp

    <section class="relative overflow-hidden border-b border-line bg-zinc-100/60 dark:bg-zinc-900/40">
        <div class="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl"></div>
        <div class="container-site py-20 text-center sm:py-24">
            <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Layanan</p>
            <h1 class="section-heading text-ink">Paket & Harga</h1>
            @if ($servicesIntro)
                <p class="mx-auto mt-4 max-w-2xl text-ink-muted">{{ $servicesIntro }}</p>
            @endif
        </div>
    </section>

    {{-- Widget kartu utama (dihitung otomatis) --}}
    <section class="container-site py-20">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            @foreach ($cards as $card)
                <div class="card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
                    <div class="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-600/10 transition-transform duration-300 group-hover:scale-150"></div>
                    <div class="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="{{ $card['icon'] }}"/></svg>
                    </div>
                    <h2 class="text-lg font-bold text-ink">{{ $card['label'] }}</h2>
                    <p class="mt-1 text-sm leading-relaxed text-ink-muted">{{ $card['desc'] }}</p>
                    <p class="mt-6 text-sm text-ink-muted">Mulai dari</p>
                    <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($card['min'], 0, ',', '.') }}</p>
                </div>
            @endforeach

            @if ($featuredPackage)
                <div class="card group relative flex flex-col overflow-hidden border-amber-500/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 lg:col-span-1">
                    <div class="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-amber-500/10 transition-transform duration-300 group-hover:scale-150"></div>
                    <div class="mb-5 flex items-center gap-3">
                        <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        </div>
                        @if ($featuredPackage->is_featured)
                            <span class="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">Unggulan</span>
                        @elseif ($featuredPackage->is_popular)
                            <span class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Populer</span>
                        @endif
                    </div>
                    <h2 class="text-lg font-bold text-ink">{{ $featuredPackage->name }}</h2>
                    <p class="mt-1 flex-1 text-sm leading-relaxed text-ink-muted">{{ $featuredPackage->services->pluck('name')->join(', ') }}</p>
                    <div class="mt-6">
                        @if ($featuredPackage->discountValue() > 0)
                            <p class="text-sm text-ink-muted line-through">Rp {{ number_format($featuredPackage->basePrice(), 0, ',', '.') }}</p>
                            <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Hemat Rp {{ number_format($featuredPackage->discountValue(), 0, ',', '.') }}</p>
                        @else
                            <p class="text-sm text-ink-muted">Harga</p>
                        @endif
                        <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($featuredPackage->computedPrice(), 0, ',', '.') }}</p>
                    </div>
                </div>
            @endif
        </div>
    </section>

    {{-- Daftar harga per kategori --}}
    @if ($priceCategories->isNotEmpty())
        <section class="bg-zinc-100/60 py-20 dark:bg-zinc-900/40">
            <div class="container-site space-y-16">
                @foreach ($priceCategories as $cat)
                    @php
                        $isSatuan = $cat->type === 'satuan';
                        $items = $isSatuan
                            ? $allServices->where('active', true)->sortBy('order')
                            : $allPackages->where('type', $cat->type);
                    @endphp
                    @if ($items->isNotEmpty())
                        <div>
                            <div class="mb-8">
                                @if ($cat->label)
                                    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">{{ $cat->label }}</p>
                                @endif
                                <h2 class="text-2xl font-bold text-ink sm:text-3xl">{{ $cat->title }}</h2>
                                @if ($cat->description)
                                    <p class="mt-2 text-sm text-ink-muted">{{ content_plain($cat->description) }}</p>
                                @endif
                            </div>

                            @if ($isSatuan && $cat->layout === 'grid')
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    @foreach ($items->groupBy('event') as $event => $rows)
                                        <div class="card p-5">
                                            <span class="font-semibold text-ink">{{ $event }}</span>
                                            <ul class="mt-3 space-y-2">
                                                @foreach ($rows as $svc)
                                                    <li class="flex items-center justify-between gap-3 text-sm">
                                                        <span class="capitalize text-ink-muted">{{ $svc->media }}
                                                            @if ($svc->duration)
                                                                <span class="block text-xs text-ink-muted/70">{{ $svc->duration }}</span>
                                                            @endif
                                                        </span>
                                                        <span class="font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($svc->price, 0, ',', '.') }}</span>
                                                    </li>
                                                @endforeach
                                            </ul>
                                        </div>
                                    @endforeach
                                </div>
                            @elseif ($cat->layout === 'grid')
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    @foreach ($items as $pkg)
                                        <div class="card flex flex-col justify-between p-5">
                                            <div>
                                                <span class="font-semibold text-ink">{{ $pkg->name }}</span>
                                                <p class="mt-1 text-xs text-ink-muted">{{ $pkg->services->pluck('name')->join(', ') }}</p>
                                            </div>
                                            <div class="mt-3">
                                                @if ($pkg->discountValue() > 0)
                                                    <p class="text-xs text-ink-muted line-through">Rp {{ number_format($pkg->basePrice(), 0, ',', '.') }}</p>
                                                    <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Hemat Rp {{ number_format($pkg->discountValue(), 0, ',', '.') }}</p>
                                                @endif
                                                <span class="text-lg font-bold text-brand-600 dark:text-brand-400">Rp {{ number_format($pkg->computedPrice(), 0, ',', '.') }}</span>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            @else
                                @php
                                    $mediaCols = [];
                                    foreach (($cat->columns ?: []) as $i => $col) {
                                        if ($i === 0) continue;
                                        $mediaCols[] = ['label' => $col, 'media' => str_contains(strtolower($col), 'foto') ? 'photo' : (str_contains(strtolower($col), 'video') ? 'video' : (str_contains(strtolower($col), 'drone') ? 'drone' : null))];
                                    }
                                    $groupedEvents = $isSatuan ? $items->groupBy('event')->sortKeys() : collect();
                                @endphp
                                <div class="card overflow-hidden">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                @foreach ($cat->columns ?: ($isSatuan ? ['Layanan', 'Harga'] : ['Paket', 'Harga']) as $col)
                                                    <th>{{ $col }}</th>
                                                @endforeach
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @if ($isSatuan)
                                                @foreach ($groupedEvents as $event => $rows)
                                                    <tr>
                                                        <td class="font-semibold text-ink">{{ $event }}</td>
                                                        @foreach ($mediaCols as $mc)
                                                            @php $svc = $rows->firstWhere('media', $mc['media']); @endphp
                                                            <td class="text-ink">
                                                                @if ($svc)
                                                                    Rp {{ number_format($svc->price, 0, ',', '.') }}
                                                                    @if ($svc->duration)
                                                                        <span class="block text-xs font-normal text-ink-muted">{{ $svc->duration }}</span>
                                                                    @endif
                                                                @else
                                                                    <span class="text-ink-muted">-</span>
                                                                @endif
                                                            </td>
                                                        @endforeach
                                                    </tr>
                                                @endforeach
                                            @else
                                                @foreach ($items as $row)
                                                    <tr>
                                                        <td class="font-semibold text-ink">{{ $row->name }}</td>
                                                        <td class="text-ink">Rp {{ number_format($row->computedPrice(), 0, ',', '.') }}</td>
                                                    </tr>
                                                @endforeach
                                            @endif
                                        </tbody>
                                    </table>
                                </div>
                            @endif
                        </div>
                    @endif
                @endforeach
            </div>

            <div class="container-site mt-16">
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
            </div>
        </section>
    @endif

    <section class="container-site py-20">
        <div class="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 p-8 text-center sm:p-12">
            <h2 class="text-2xl font-bold text-white sm:text-3xl">Siap Mengabadikan Momen Anda?</h2>
            <p class="mx-auto mt-3 max-w-xl text-sm text-brand-100 sm:text-base">Konsultasikan kebutuhan Anda secara gratis. Kami akan bantu pilih paket yang paling tepat.</p>
            <a href="{{ $whatsappUrl }}" target="_blank" rel="noreferrer" class="btn mt-6 bg-white text-brand-700 shadow-lg hover:bg-brand-50">
                Hubungi via WhatsApp
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </a>
        </div>
    </section>
@endsection