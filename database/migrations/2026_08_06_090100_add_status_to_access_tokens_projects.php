<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_access_tokens', function (Blueprint $table) {
            $table->string('status')->default('pending')->after('purpose');
            $table->unsignedInteger('expires_hours')->nullable()->after('expires_at');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedBigInteger('deleted_by_id')->nullable()->after('deleted_at');
            $table->string('deleted_by_name')->nullable()->after('deleted_by_id');
            $table->string('delete_reason')->nullable()->after('deleted_by_name');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['deleted_by_id', 'deleted_by_name', 'delete_reason']);
        });

        Schema::table('client_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['status', 'expires_hours']);
        });
    }
};