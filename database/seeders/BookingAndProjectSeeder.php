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

        $client = User::where('email', 'client@imagery.my.id')->first() ?? User::role('client')->first();

        // Bersihkan data lama (idempotent): project & booking tanpa klien / milik klien demo.
        Project::whereNull('user_id')->forceDelete();
        Booking::whereNull('user_id')->delete();
        Project::where('user_id', $client?->id)->forceDelete();
        Booking::where('user_id', $client?->id)->delete();

        // 1 booking milik klien (converted) yang menjadi 1 pesanan (project).
        $booking = Booking::firstOrCreate(
            ['booking_no' => 'BK-00001'],
            [
                'user_id' => $client?->id,
                'name' => $client?->name ?? 'Ayu Maharani',
                'email' => $client?->email ?? 'client@imagery.my.id',
                'phone' => '08123456789',
                'package_id' => $package->id,
                'package_label' => $package->name,
                'event_date' => now()->addDays(10),
                'event_start' => now()->addDays(10)->setTime(8, 0),
                'event_end' => now()->addDays(10)->setTime(14, 0),
                'location' => 'Masjid Raya, Lombok Tengah',
                'notes' => 'Pemesanan via dashboard klien.',
                'price' => $package->computedPrice(),
                'status' => 'converted'
            ]
        );

        $project = Project::firstOrCreate(
            ['name' => 'Wedding Ayu & Rian'],
            [
                'user_id' => $booking->user_id,
                'package_id' => $package->id,
                'event_date' => $booking->event_date,
                'event_start' => $booking->event_start,
                'event_end' => $booking->event_end,
                'location' => $booking->location,
                'price' => $booking->price,
                'status' => 'scheduled'
            ]
        );

        $booking->update(['project_id' => $project->id]);

        $project->invoice()->firstOrCreate(
            ['number' => 'INV-' . str_pad((string) $project->id, 5, '0', STR_PAD_LEFT)],
            [
                'issued_at' => now()->toDateString(),
                'due_at' => now()->addDays(7)->toDateString(),
                'base_amount' => $project->price,
                'status' => 'unpaid'
            ]
        );

        $project->addSystemUpdate('Booking ' . $booking->booking_no . ' diterima — project dibuat untuk klien ' . ($client?->name ?? '-') . '.');
    }
}