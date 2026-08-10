<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('login_histories', function (Blueprint $table) {
            $table->string('identifier', 255)->nullable()->after('method');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('identifier', 255)->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('login_histories', function (Blueprint $table) {
            $table->dropColumn('identifier');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn('identifier');
        });
    }
};
