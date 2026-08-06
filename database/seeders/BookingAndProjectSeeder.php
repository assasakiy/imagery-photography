<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Booking;
use App\Models\Project;
use App\Models\User;
use App\Models\Package;

class BookingAndProjectSeeder extends Seeder
{
    public function run(): void
    {
        $package = Package::first();
        if (!$package) return;

        $admin = User::where('email', 'owner@imagery.my.id')->first();
        
        // Buat 1 booking pending
        Booking::create([
            'booking_no' => 'BK-00001',
            'name' => 'Calon Klien 1',
            'email' => 'calon1@example.com',
            'package_id' => $package->id,
            'package_label' => $package->name,
            'event_date' => now()->addDays(30),
            'location' => 'Gedung Serbaguna',
            'notes' => 'Tolong fotografer yang ramah',
            'price' => $package->computedPrice(),
            'status' => 'pending'
        ]);

        // Buat 1 booking converted -> jadi proyek scheduled
        $b2 = Booking::create([
            'booking_no' => 'BK-00002',
            'user_id' => User::role('client')->first()->id ?? null,
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'package_id' => $package->id,
            'package_label' => $package->name,
            'event_date' => now()->addDays(10),
            'location' => 'Masjid Raya',
            'price' => $package->computedPrice(),
            'status' => 'converted'
        ]);

        $project = Project::create([
            'user_id' => $b2->user_id,
            'name' => 'Wedding Budi & Sari Baru',
            'package_id' => $package->id,
            'event_date' => $b2->event_date,
            'price' => $b2->price,
            'status' => 'scheduled'
        ]);
        
        $b2->update(['project_id' => $project->id]);

        $project->invoice()->create([
            'number' => 'INV-' . str_pad((string) $project->id, 5, '0', STR_PAD_LEFT),
            'issued_at' => now()->toDateString(),
            'due_at' => now()->addDays(7)->toDateString(),
            'base_amount' => $project->price,
            'status' => 'unpaid'
        ]);
        
        $project->addSystemUpdate('Booking BK-00002 diterima — project dibuat.');
    }
}