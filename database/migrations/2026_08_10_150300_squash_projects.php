<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ===== Proyek & pesanan =====
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('name');
            $table->string('order_no')->nullable()->unique();
            $table->unsignedBigInteger('package_id')->nullable();
            $table->string('event_date')->nullable();
            $table->timestamp('event_start')->nullable();
            $table->timestamp('event_end')->nullable();
            $table->timestamp('shooting_at')->nullable();
            $table->timestamp('editing_at')->nullable();
            $table->timestamp('awaiting_payment_at')->nullable();
            $table->timestamp('preview_ends_at')->nullable();
            $table->timestamp('preview_expired_at')->nullable();
            $table->timestamp('reminded_at')->nullable();
            $table->string('delivery_zip')->nullable();
            $table->unsignedBigInteger('delivery_zip_size')->nullable();
            $table->unsignedInteger('delivery_zip_count')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->unsignedInteger('photo_total')->default(0);
            $table->unsignedInteger('photo_done')->default(0);
            $table->unsignedInteger('video_total')->default(0);
            $table->unsignedInteger('video_done')->default(0);
            $table->json('pricing_snapshot')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedInteger('retention_days')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->softDeletes();
            $table->unsignedBigInteger('deleted_by_id')->nullable();
            $table->string('deleted_by_name')->nullable();
            $table->string('delete_reason')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('package_id')->references('id')->on('packages')->onDelete('set null');
        });

        Schema::create('project_files', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('media_id')->nullable();
            $table->string('asset_key', 36)->nullable()->index();
            $table->string('filename');
            $table->string('original_name');
            $table->string('path')->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->string('type')->nullable();
            $table->boolean('is_preview')->default(false);
            $table->string('gallery_status')->default('preparing');
            $table->string('category')->nullable();
            $table->string('variant', 20)->nullable()->index();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('preview_expires_at')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('media_id')->references('id')->on('media')->onDelete('cascade');
        });

        Schema::create('project_updates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->text('message');
            $table->string('type')->default('update');
            $table->string('kind')->default('manual');
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->decimal('amount', 15, 2);
            $table->string('method')->default('manual_transfer');
            $table->string('status')->default('pending');
            $table->string('proof_file')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number')->nullable()->unique();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->date('issued_at')->nullable();
            $table->date('due_at')->nullable();
            $table->decimal('base_amount', 15, 2)->default(0);
            $table->decimal('dp_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->string('status')->default('unpaid');
            $table->timestamps();

            $table->index('status');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_no')->nullable()->unique();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('package_id')->nullable();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('package_label')->nullable();
            $table->date('event_date')->nullable();
            $table->timestamp('event_start')->nullable();
            $table->timestamp('event_end')->nullable();
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('project_id')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('package_id')->references('id')->on('packages')->onDelete('set null');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
        });

        Schema::create('redeliveries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->text('note')->nullable();
            $table->string('status')->default('pending');
            $table->decimal('fee', 15, 2)->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('message');
            $table->string('type')->default('contact');
            $table->string('event_date')->nullable();
            $table->string('package')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->string('status')->default('new');
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
        });

        Schema::create('client_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('purpose')->default('project');
            $table->string('status')->default('pending');
            $table->string('created_by_type')->nullable();
            $table->unsignedBigInteger('created_by_id')->nullable();
            $table->string('token', 100)->unique();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('expires_hours')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index('project_id', 'client_access_tokens_project_id_foreign');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_access_tokens');
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('redeliveries');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('project_updates');
        Schema::dropIfExists('project_files');
        Schema::dropIfExists('projects');
    }
};
