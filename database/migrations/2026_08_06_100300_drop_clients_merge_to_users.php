<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // users: hapus kolom legacy profil & role (role via Spatie). Idempotent.
        $drop = [];
        foreach (['name_legacy', 'bio', 'avatar_url', 'cover_url', 'social_facebook', 'social_instagram', 'social_tiktok', 'social_whatsapp', 'role'] as $col) {
            if (Schema::hasColumn('users', $col)) {
                $drop[] = $col;
            }
        }
        if ($drop) {
            Schema::table('users', function (Blueprint $table) use ($drop) {
                $table->dropColumn($drop);
            });
        }

        // projects: gunakan user_id existing (sudah ada). Hapus client_id bila ada + isi user_id dari clients lama.
        if (Schema::hasColumn('projects', 'client_id')) {
            foreach (DB::table('projects')->whereNull('user_id')->get() as $p) {
                $uid = DB::table('clients')->where('id', $p->client_id)->value('user_id');
                if ($uid) {
                    DB::table('projects')->where('id', $p->id)->update(['user_id' => $uid]);
                }
            }

            if ($this->hasForeignKey('projects', 'projects_client_id_foreign')) {
                Schema::table('projects', function (Blueprint $table) {
                    $table->dropForeign(['client_id']);
                });
            }
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn('client_id');
            });
        }

        if (Schema::hasColumn('projects', 'user_id') && !$this->hasForeignKey('projects', 'projects_user_id_foreign')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        // client_access_tokens: hapus client_id bila ada.
        if (Schema::hasColumn('client_access_tokens', 'client_id')) {
            if ($this->hasForeignKey('client_access_tokens', 'client_access_tokens_client_id_foreign')) {
                Schema::table('client_access_tokens', function (Blueprint $table) {
                    $table->dropForeign(['client_id']);
                });
            }
            Schema::table('client_access_tokens', function (Blueprint $table) {
                $table->dropColumn('client_id');
            });
        }

        // drop clients.
        Schema::dropIfExists('clients');
    }

    private function hasForeignKey(string $table, string $constraint): bool
    {
        return DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::connection()->getDatabaseName())
            ->where('TABLE_NAME', $table)
            ->where('CONSTRAINT_NAME', $constraint)
            ->exists();
    }

    public function down(): void
    {
        // Best-effort reverse (data clients sudah dihapus, hanya strukturnya dikembalikan sebagian).
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('client_access_tokens', function (Blueprint $table) {
            $table->unsignedBigInteger('client_id')->nullable();
            $table->foreign('client_id')->references('id')->on('clients')->nullOnDelete();
        });
    }
};