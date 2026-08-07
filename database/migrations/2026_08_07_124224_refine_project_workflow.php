<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('event_start')->nullable()->after('event_date');
            $table->timestamp('event_end')->nullable()->after('event_start');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->timestamp('event_start')->nullable()->after('event_date');
            $table->timestamp('event_end')->nullable()->after('event_start');
            $table->timestamp('shooting_at')->nullable()->after('event_end');
            $table->timestamp('editing_at')->nullable()->after('shooting_at');
            $table->timestamp('awaiting_payment_at')->nullable()->after('editing_at');
            $table->timestamp('completed_at')->nullable()->after('awaiting_payment_at');
        });

        // Hapus kolom tanggal mulai/selesai lama, diganti waktu mulai/selesai acara.
        if (Schema::hasColumn('projects', 'start_date')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn(['start_date', 'end_date']);
            });
        }

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('dp_amount', 12, 2)->default(0)->after('base_amount');
        });

        // Rename status data lama menjadi tahap "Menunggu Pembayaran".
        DB::table('projects')->where('status', 'awaiting_confirmation')->update(['status' => 'awaiting_payment']);
    }

    public function down(): void
    {
        DB::table('projects')->where('status', 'awaiting_payment')->update(['status' => 'awaiting_confirmation']);

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('dp_amount');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->date('start_date')->nullable()->after('event_date');
            $table->date('end_date')->nullable()->after('start_date');
            $table->dropColumn(['event_start', 'event_end', 'shooting_at', 'editing_at', 'awaiting_payment_at', 'completed_at']);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['event_start', 'event_end']);
        });
    }
};