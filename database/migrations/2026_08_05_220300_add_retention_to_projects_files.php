<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedInteger('retention_days')->nullable()->after('end_date');
            $table->timestamp('archived_at')->nullable()->after('retention_days');
            $table->timestamp('deleted_at')->nullable()->after('archived_at');
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('project_files', function (Blueprint $table) {
            $table->dropColumn('expires_at');
        });
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['retention_days', 'archived_at', 'deleted_at']);
        });
    }
};