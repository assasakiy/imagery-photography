<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_access_tokens', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->foreignId('project_id')->nullable()->change()->nullOnDelete();
            $table->string('purpose')->default('project')->after('user_id');
            $table->string('created_by_type')->nullable()->after('purpose');
            $table->unsignedBigInteger('created_by_id')->nullable()->after('created_by_type');
        });
    }

    public function down(): void
    {
        Schema::table('client_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['purpose', 'created_by_type', 'created_by_id']);
            $table->dropForeign(['project_id']);
            $table->foreignId('project_id')->nullable(false)->change()->constrained()->cascadeOnDelete();
        });
    }
};