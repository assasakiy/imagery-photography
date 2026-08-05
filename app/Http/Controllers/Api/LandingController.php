<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LandingContent;
use App\Models\MediaLibrary;
use App\Services\AssetResolver;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LandingController extends Controller
{
    public function show()
    {
        $contents = LandingContent::all()->groupBy('group');

        $groups = $contents->map(function ($items) {
            return $items->mapWithKeys(fn ($item) => [$item->key => $item->value]);
        });

        $groups['images'] = [
            'hero_image' => AssetResolver::landingImage('hero_image', AssetResolver::DEFAULT_HERO_IMAGE),
            'about_image' => AssetResolver::landingImage('about_image', AssetResolver::DEFAULT_ABOUT_IMAGE),
        ];

        return response()->json($groups);
    }

    public function update(Request $request)
    {
        $data = Validator::make($request->all(), [
            'content' => 'nullable|array',
            'content.*' => 'nullable|string',
            'images' => 'nullable|array',
            'images.hero_image' => 'nullable|file|image|max:20480',
            'images.about_image' => 'nullable|file|image|max:20480',
            'reset_images' => 'nullable|array',
            'reset_images.*' => 'string',
        ])->validate();

        foreach ($data['content'] ?? [] as $key => $value) {
            $value = (string) $value;

            if (in_array($key, ['hero_subtitle', 'about_content', 'about_history', 'gallery_intro', 'services_intro'], true)) {
                $value = ContentSanitizer::clean($value);
            }

            LandingContent::setValue($key, $value);
        }

        foreach (['hero_image', 'about_image'] as $imageKey) {
            if (!empty($data['reset_images'][$imageKey])) {
                LandingContent::setValue($imageKey, '', 'landing_images');
                continue;
            }

            if (isset($data['images'][$imageKey]) && $data['images'][$imageKey] instanceof \Illuminate\Http\UploadedFile) {
                $library = MediaLibrary::singleton();
                $media = $library->addMedia($data['images'][$imageKey])
                    ->toMediaCollection('library');
                LandingContent::setValue($imageKey, 'media:' . $media->id, 'landing_images');
            }
        }

        app(\App\Services\RuntimeSettings::class)->forget();

        app(\App\Services\AuditLogger::class)->log('landing.updated', 'Konten landing page diperbarui. ' . (count($data['content'] ?? []) . ' field, ' . count($data['images'] ?? []) . ' gambar'));

        return response()->json(['ok' => true]);
    }
}
