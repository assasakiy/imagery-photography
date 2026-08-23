<?php

namespace App\Support;

use App\Models\Blog;
use App\Models\MediaLibrary;
use App\Models\Payment;
use App\Models\Portfolio;
use App\Models\Project;
use App\Models\User;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\DefaultPathGenerator;

class MediaPathGenerator extends DefaultPathGenerator
{
    public function getPath(Media $media): string
    {
        return $this->basePathFor($media).'/';
    }

    public function getPathForConversions(Media $media): string
    {
        return $this->basePathFor($media).'/conversions/';
    }

    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->basePathFor($media).'/responsive-images/';
    }

    protected function basePathFor(Media $media): string
    {
        $modelClass = $media->model_type;

        return match (true) {
            // main shared library (uploaded by users) -> systemassets/{collection}/{media_id}
            $modelClass === MediaLibrary::class
                => "systemassets/{$media->collection_name}/{$media->getKey()}",
            // blog (post) content -> posts/{post_id}/{media_id}
            $modelClass === Blog::class
                => "posts/{$media->model_id}/{$media->getKey()}",
            // portfolio -> portfolios/{portfolio_id}/{media_id}
            is_a($modelClass, Portfolio::class, true)
                => "portfolios/{$media->model_id}/{$media->getKey()}",
            // user avatar & cover -> profiles/{user_id}/{media_id}
            is_a($modelClass, User::class, true)
                => "profiles/{$media->model_id}/{$media->collection_name}/{$media->getKey()}",
            // payment proofs -> payment-proofs/{payment_id}/{media_id}
            is_a($modelClass, Payment::class, true)
                => "payment-proofs/{$media->model_id}/{$media->getKey()}",
            // project: kategori aset terpisah (thumbnail & bukti) di folder sendiri;
            // collection files (asset original/preview) tetap di jalur lama "media/..." agar tidak merusak data lama.
            is_a($modelClass, Project::class, true)
                => match ($media->collection_name) {
                    'thumbnail' => "project-thumbs/{$media->model_id}/{$media->getKey()}",
                    'proofs' => "project-proofs/{$media->model_id}/{$media->getKey()}",
                    default => "media/{$media->getKey()}",
                },
            default
                => "media/{$media->getKey()}",
        };
    }
}