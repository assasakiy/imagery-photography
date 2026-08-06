<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('remember_token');
            $table->timestamp('activated_at')->nullable()->after('status');
            $table->softDeletes()->after('activated_at');
            $table->unsignedBigInteger('deleted_by_id')->nullable()->after('deleted_at');
            $table->string('deleted_by_name')->nullable()->after('deleted_by_id');
            $table->string('delete_reason')->nullable()->after('deleted_by_name');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->softDeletes()->after('notes');
            $table->unsignedBigInteger('deleted_by_id')->nullable()->after('deleted_at');
            $table->string('deleted_by_name')->nullable()->after('deleted_by_id');
            $table->string('delete_reason')->nullable()->after('deleted_by_name');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['deleted_at', 'deleted_by_id', 'deleted_by_name', 'delete_reason']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'activated_at', 'deleted_at', 'deleted_by_id', 'deleted_by_name', 'delete_reason']);
        });
    }
};