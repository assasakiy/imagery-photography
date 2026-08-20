<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('client_id')->nullable();
            $table->string('name');
            $table->string('service')->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->unsignedTinyInteger('recommend_score')->nullable();
            $table->text('content');
            $table->string('title')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->foreign('client_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
        });

        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->morphs('likeable');
            $table->timestamps();

            $table->unique(['user_id', 'likeable_type', 'likeable_id']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->morphs('commentable');
            $table->text('content');
            $table->string('status', 20)->default('published');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['commentable_type', 'commentable_id', 'status']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->morphs('likeable');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->unique(['likeable_type', 'likeable_id', 'user_id']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->morphs('commentable');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->text('body');
            $table->string('status', 20)->default('approved');
            $table->timestamps();

            $table->index(['commentable_type', 'commentable_id', 'status']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('comments')->onDelete('cascade');
        });

        Schema::create('login_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('method', 30)->default('password');
            $table->string('identifier')->nullable();
            $table->string('status', 20)->default('success');
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('logged_in_at')->nullable();
            $table->timestamp('logged_out_at')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'ip']);
            $table->index(['user_id', 'user_agent']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_role', 50)->nullable();
            $table->string('action', 80);
            $table->text('description')->nullable();
            $table->string('identifier')->nullable();
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('action');
            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('stats', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('value')->nullable();
            $table->string('suffix', 10)->nullable();
            $table->string('source')->default('manual');
            $table->string('metric')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });

        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->nullable()->index();
            $table->string('path', 500);
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('device_type', 20)->nullable();
            $table->string('os', 50)->nullable();
            $table->string('browser', 50)->nullable();
            $table->string('referrer', 500)->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamp('created_at')->nullable()->index();

            $table->index(['path', 'created_at']);
        });

        Schema::create('page_view_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->string('path', 500);
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('unique_visitors')->default(0);

            $table->unique(['date', 'path']);
        });

        Schema::create('cookie_consents', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->nullable()->index();
            $table->string('consent', 20)->default('necessary');
            $table->timestamp('created_at')->nullable();
        });

        $permission = Permission::firstOrCreate(['name' => 'manage-stats', 'guard_name' => 'web']);

        foreach (['owner', 'admin'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            if ($role) {
                $role->givePermissionTo($permission);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $permission = Permission::where('name', 'manage-stats')->where('guard_name', 'web')->first();
        if ($permission) {
            Role::where('guard_name', 'web')->get()->each(fn (Role $role) => $role->revokePermissionTo($permission));
            $permission->delete();
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        }

        Schema::dropIfExists('stats');
        Schema::dropIfExists('cookie_consents');
        Schema::dropIfExists('page_view_daily');
        Schema::dropIfExists('page_views');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('login_histories');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('likes');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('likes');
    }
};