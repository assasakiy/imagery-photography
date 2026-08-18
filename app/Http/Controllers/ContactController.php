<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index()
    {
        $page = \App\Models\Page::where('slug', 'contact')->first();
        $info = contact_info();

        $contents = [
            'contact_phone' => $info['phone'],
            'contact_email' => $info['email'],
            'contact_address' => $info['address'],
            'map_url' => $info['map_url'],
            'social_extra' => $info['socials'],
        ];

        return view('landing_pages.contact', compact('contents', 'page'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'message' => 'required|string',
        ]);

        $message = ContactMessage::create($data);

        $notifications = app(NotificationService::class);
        $notifications->toAdmins(
            'Pesan kontak baru',
            "{$message->name} ({$message->email}) mengirim pesan.",
            '/dashboard/messages/' . $message->id,
            'message.new'
        );
        $notifications->webhook('message.new', [
            'id' => $message->id,
            'name' => $message->name,
            'email' => $message->email,
            'phone' => $message->phone,
            'message' => $message->message,
        ]);

        return back()->with('success', 'Pesan berhasil dikirim! Kami akan menghubungi Anda segera.');
    }

    public function services()
    {
        $page = \App\Models\Page::where('slug', 'services')->first();
        $sections = is_array($page?->sections) ? $page->sections : [];
        $sections = collect($sections)->keyBy('type');

        $allPackages = \App\Models\Package::with('services')->active()->orderBy('display_order')->get();
        $allServices = \App\Models\Service::where('active', true)->orderBy('order')->get();
        $faqs = \Illuminate\Support\Collection::empty();

        // Section Populer / Unggulan
        $populer = $sections->get('layanan_populer') ?: [];
        $highlightSubtitle = trim((string) ($populer['subtitle'] ?? '')) !== '' ? $populer['subtitle'] : 'Populer & Unggulan';
        $highlightTitle = trim((string) ($populer['title'] ?? '')) !== '' ? $populer['title'] : 'Paket Pilihan Kami';
        $usePopular = ($populer['use_popular'] ?? true) !== false;
        $useFeatured = ($populer['use_featured'] ?? true) !== false;
        $popularLimit = min(6, max(1, (int) ($populer['popular_limit'] ?? 3)));
        $featuredLimit = min(6, max(1, (int) ($populer['featured_limit'] ?? 3)));

        $highlightPackages = collect();
        if ($usePopular) {
            $highlightPackages = $highlightPackages->merge($allPackages->where('is_popular', true)->values()->take($popularLimit));
        }
        if ($useFeatured) {
            $highlightPackages = $highlightPackages->merge($allPackages->where('is_featured', true)->values()->take($featuredLimit));
        }
        $highlightPackages = $highlightPackages->unique('id')->values();

        // Section Satuan
        $satuan = $sections->get('layanan_satuan') ?: [];
        $satuanTitle = trim((string) ($satuan['title'] ?? '')) !== '' ? $satuan['title'] : 'Paket Satuan';
        $satuanSubtitle = trim((string) ($satuan['subtitle'] ?? '')) !== '' ? $satuan['subtitle'] : 'Satuan';
        $satuanIds = array_values(array_filter((array) ($satuan['items'] ?? []), 'is_numeric'));
        $satuanServices = count($satuanIds) > 0 ? $allServices->whereIn('id', $satuanIds)->values() : $allServices;

        // Section Premium (bundling)
        $premium = $sections->get('layanan_premium') ?: [];
        $premiumTitle = trim((string) ($premium['title'] ?? '')) !== '' ? $premium['title'] : 'Paket Premium';
        $premiumSubtitle = trim((string) ($premium['subtitle'] ?? '')) !== '' ? $premium['subtitle'] : 'Premium';
        $premiumIds = array_values(array_filter((array) ($premium['items'] ?? []), 'is_numeric'));
        $premiumPackages = count($premiumIds) > 0
            ? $allPackages->where('type', 'bundling')->whereIn('id', $premiumIds)->values()
            : $allPackages->where('type', 'bundling')->values();

        // Section Ultimate (combo)
        $ultimate = $sections->get('layanan_ultimate') ?: [];
        $ultimateTitle = trim((string) ($ultimate['title'] ?? '')) !== '' ? $ultimate['title'] : 'Paket Ultimate';
        $ultimateSubtitle = trim((string) ($ultimate['subtitle'] ?? '')) !== '' ? $ultimate['subtitle'] : 'Ultimate';
        $ultimateIds = array_values(array_filter((array) ($ultimate['items'] ?? []), 'is_numeric'));
        $ultimatePackages = count($ultimateIds) > 0
            ? $allPackages->where('type', 'combo')->whereIn('id', $ultimateIds)->values()
            : $allPackages->where('type', 'combo')->values();

        // Section Catatan
        $catatan = $sections->get('layanan_catatan') ?: [];
        $catatanTitle = trim((string) ($catatan['title'] ?? '')) !== '' ? $catatan['title'] : 'Catatan Penting';
        $catatanContent = trim((string) ($catatan['content'] ?? '')) !== '' ? $catatan['content'] : '';

        // Section FAQ
        $faqSec = $sections->get('layanan_faq') ?: [];
        $faqSubtitle = trim((string) ($faqSec['subtitle'] ?? '')) !== '' ? $faqSec['subtitle'] : 'FAQ';
        $faqTitle = trim((string) ($faqSec['title'] ?? '')) !== '' ? $faqSec['title'] : 'Tanya Jawab';
        if ($faqSec) {
            $faqs = \App\Services\LandingContentResolver::faqs($faqSec);
        }

        // Section CTA
        $cta = $sections->get('layanan_cta') ?: [];
        $ctaTitle = trim((string) ($cta['title'] ?? '')) !== '' ? $cta['title'] : 'Siap Mengabadikan Momen Anda?';
        $ctaDescription = trim((string) ($cta['description'] ?? '')) !== '' ? $cta['description'] : 'Konsultasikan kebutuhan Anda secara gratis. Kami akan bantu pilih paket yang paling tepat.';
        $ctaButtonText = trim((string) ($cta['button_text'] ?? '')) !== '' ? $cta['button_text'] : 'Hubungi via WhatsApp';
        $ctaButtonLink = trim((string) ($cta['button_link'] ?? '')) !== '' ? $cta['button_link'] : (\App\Models\Setting::getValue('social_whatsapp', 'https://wa.me/6287764426909'));

        return view('landing_pages.services', compact(
            'page',
            'allServices',
            'allPackages',
            'highlightSubtitle',
            'highlightTitle',
            'highlightPackages',
            'satuanSubtitle',
            'satuanTitle',
            'satuanServices',
            'premiumSubtitle',
            'premiumTitle',
            'premiumPackages',
            'ultimateSubtitle',
            'ultimateTitle',
            'ultimatePackages',
            'catatanTitle',
            'catatanContent',
            'faqSubtitle',
            'faqTitle',
            'faqs',
            'ctaTitle',
            'ctaDescription',
            'ctaButtonText',
            'ctaButtonLink'
        ));
    }
}