@extends('layouts.admin')

@section('title', 'Pengaturan')

@section('content')
<div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-2xl font-bold mb-6">Pengaturan Website</h2>

    <form method="POST" action="/settings">
        @csrf @method('PUT')

        <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4 border-b pb-2">Informasi</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Hero Title</label>
                    <input type="text" name="hero_title" value="{{ $contents['hero_title'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Hero Subtitle</label>
                    <input type="text" name="hero_subtitle" value="{{ $contents['hero_subtitle'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">About Title</label>
                    <input type="text" name="about_title" value="{{ $contents['about_title'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">About Content</label>
                    <textarea name="about_content" rows="3" class="w-full border rounded-lg px-3 py-2">{{ $contents['about_content'] ?? '' }}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Alamat</label>
                    <input type="text" name="contact_address" value="{{ $contents['contact_address'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">No. Telepon</label>
                    <input type="text" name="contact_phone" value="{{ $contents['contact_phone'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Email</label>
                    <input type="email" name="contact_email" value="{{ $contents['contact_email'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
            </div>
        </div>

        <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4 border-b pb-2">Media Sosial</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Facebook URL</label>
                    <input type="text" name="social_facebook" value="{{ $contents['social_facebook'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Instagram URL</label>
                    <input type="text" name="social_instagram" value="{{ $contents['social_instagram'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">TikTok URL</label>
                    <input type="text" name="social_tiktok" value="{{ $contents['social_tiktok'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">WhatsApp URL</label>
                    <input type="text" name="social_whatsapp" value="{{ $contents['social_whatsapp'] ?? '' }}" class="w-full border rounded-lg px-3 py-2">
                </div>
            </div>
        </div>

        <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4 border-b pb-2">Ganti Password</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Password Saat Ini</label>
                    <input type="password" name="current_password" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Password Baru</label>
                    <input type="password" name="password" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Konfirmasi Password</label>
                    <input type="password" name="password_confirmation" class="w-full border rounded-lg px-3 py-2">
                </div>
            </div>
        </div>

        <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg">Simpan Pengaturan</button>
    </form>
</div>
@endsection
