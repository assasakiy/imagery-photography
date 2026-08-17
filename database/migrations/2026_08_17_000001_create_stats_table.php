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
        Schema::create('stats', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('value');
            $table->string('suffix', 10)->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
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
    }
};