<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->morphs('model');
            $table->uuid('uuid')->nullable()->unique();
            $table->string('collection_name');
            $table->string('name');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->string('disk');
            $table->string('conversions_disk')->nullable();
            $table->unsignedBigInteger('size');
            $table->json('manipulations');
            $table->json('custom_properties');
            $table->json('generated_conversions');
            $table->json('responsive_images');
            $table->unsignedInteger('order_column')->nullable()->index();
            $table->timestamps();
            $table->unsignedBigInteger('uploaded_by')->nullable()->index();
            $table->boolean('is_public')->default(true)->index();
        });

        Schema::create('media_libraries', function (Blueprint $table) {
            $table->id();
        });

        Schema::create('watermarked_assets', function (Blueprint $table) {
            $table->id();
            $table->string('hash', 64)->unique();
            $table->text('source');
            $table->string('mime_type', 64)->nullable();
            $table->boolean('generated')->default(false);
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        \Illuminate\Support\Facades\DB::table('categories')->insertOrIgnore([
            ['name' => 'Artikel Unggulan', 'slug' => 'featured', 'description' => 'Pilihan redaksi kami.', 'is_system' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Artikel Populer', 'slug' => 'populer', 'description' => 'Paling banyak dibaca.', 'is_system' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Artikel Terbaru', 'slug' => 'latest', 'description' => 'Update terbaru dari kami.', 'is_system' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::create('categorizables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('category_id');
            $table->morphs('categorizable');
            $table->timestamps();
            $table->unique(['category_id', 'categorizable_type', 'categorizable_id'], 'categorizables_unique');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
        });

        Schema::create('blog_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('blogs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('author_id')->nullable();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('excerpt')->nullable();
            $table->longText('content');
            $table->string('image_url')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('views_count')->default(0)->index();
            $table->boolean('is_featured')->default(false)->index();

            $table->foreign('author_id')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('blog_post_tag', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('blog_id');
            $table->unsignedBigInteger('tag_id');
            $table->unique(['blog_id', 'tag_id']);
            $table->foreign('blog_id')->references('id')->on('blogs')->onDelete('cascade');
            $table->foreign('tag_id')->references('id')->on('blog_tags')->onDelete('cascade');
        });

        Schema::create('portfolios', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer');
            $table->integer('order')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('portfolios');
        Schema::dropIfExists('blog_post_tag');
        Schema::dropIfExists('blogs');
        Schema::dropIfExists('blog_tags');
        Schema::dropIfExists('categorizables');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('watermarked_assets');
        Schema::dropIfExists('media_libraries');
        Schema::dropIfExists('media');
    }
};