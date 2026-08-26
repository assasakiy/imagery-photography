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

        // 1. Satu booking baru masuk
        Booking::firstOrCreate(
            ['booking_no' => 'BK-00001'],
            [
                'user_id' => $client?->id,
                'name' => $client?->name ?? 'Ayu Maharani',
                'email' => $client?->email ?? 'client@imagery.my.id',
                'phone' => '08123456789',
                'package_id' => $package->id,
                'package_label' => $package->name,
                'event_date' => now()->addDays(20),
                'event_start' => now()->addDays(20)->setTime(8, 0),
                'event_end' => now()->addDays(20)->setTime(14, 0),
                'location' => 'Masjid Raya, Lombok Tengah',
                'notes' => 'Tolong fotografernya yang komunikatif ya mas.',
                'price' => $package->computedPrice(),
                'status' => 'new'
            ]
        );

        // 2. Satu booking disetujui (tinggal buat project)
        Booking::firstOrCreate(
            ['booking_no' => 'BK-00002'],
            [
                'user_id' => $client?->id,
                'name' => $client?->name ?? 'Ayu Maharani',
                'email' => $client?->email ?? 'client@imagery.my.id',
                'phone' => '08123456789',
                'package_id' => $package->id,
                'package_label' => $package->name,
                'event_date' => now()->addDays(15),
                'event_start' => now()->addDays(15)->setTime(9, 0),
                'event_end' => now()->addDays(15)->setTime(12, 0),
                'location' => 'Pantai Kuta, Lombok',
                'notes' => 'Prewedding tema kasual.',
                'price' => $package->computedPrice(),
                'status' => 'approved'
            ]
        );

        // 3. Satu booking converted ke Project yang sudah selesai & lunas
        $bookingConverted = Booking::firstOrCreate(
            ['booking_no' => 'BK-00003'],
            [
                'user_id' => $client?->id,
                'name' => $client?->name ?? 'Ayu Maharani',
                'email' => $client?->email ?? 'client@imagery.my.id',
                'phone' => '08123456789',
                'package_id' => $package->id,
                'package_label' => $package->name,
                'event_date' => now()->subDays(10),
                'event_start' => now()->subDays(10)->setTime(8, 0),
                'event_end' => now()->subDays(10)->setTime(14, 0),
                'location' => 'Hotel Lombok Raya',
                'notes' => 'Booking lama.',
                'price' => $package->computedPrice(),
                'status' => 'converted'
            ]
        );

        $project = Project::firstOrCreate(
            ['name' => 'Wedding Ayu & Rian (Selesai)'],
            [
                'user_id' => $bookingConverted->user_id,
                'package_id' => $package->id,
                'event_date' => $bookingConverted->event_date,
                'event_start' => $bookingConverted->event_start,
                'event_end' => $bookingConverted->event_end,
                'location' => $bookingConverted->location,
                'price' => $bookingConverted->price,
                'status' => 'completed',
                'completed_at' => now()->subDays(5)
            ]
        );

        $bookingConverted->update(['project_id' => $project->id]);

        $invoice = $project->invoice()->firstOrCreate(
            ['number' => 'INV-' . str_pad((string) $project->id, 5, '0', STR_PAD_LEFT)],
            [
                'issued_at' => now()->subDays(15)->toDateString(),
                'due_at' => now()->subDays(8)->toDateString(),
                'base_amount' => $project->price,
                'status' => 'paid',
                'paid_amount' => $project->price
            ]
        );

        // Lunas
        $project->payments()->firstOrCreate(
            ['amount' => $project->price],
            [
                'method' => 'manual_transfer',
                'gateway' => 'Bank Transfer',
                'status' => 'confirmed',
                'paid_at' => now()->subDays(5)
            ]
        );

        $project->addSystemUpdate('Pesanan Wedding Ayu & Rian telah selesai. Pembayaran lunas.');
    }
}