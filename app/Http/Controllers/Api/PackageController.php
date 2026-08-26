<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PackageController extends Controller
{
    public function index(Request $request)
    {
        $query = Package::with('services')->withBookingCount()
            ->when($request->boolean('active_only'), fn ($q) => $q->where('is_active', true))
            ->when($request->filled('q'), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($request->filled('status'), function ($q, $status) {
                if ($status === 'active') return $q->where('is_active', true);
                if ($status === 'inactive') return $q->where('is_active', false);
            })
            ->when($request->filled('type'), fn ($q, $type) => $q->where('type', $type))
            ->orderBy('display_order');

        return response()->json($query->get()->map(fn ($p) => $this->serialize($p)));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $items = $data['items'] ?? [];
        unset($data['items']);

        $package = Package::create($data);
        $this->syncItems($package, $items);

        app(AuditLogger::class)->log('package.created', 'Paket dibuat: ' . $package->name, $package);

        return response()->json($this->serialize($package->load('services')), 201);
    }

    public function update(Request $request, Package $package)
    {
        $data = $this->validateData($request);
        $items = $data['items'] ?? [];
        unset($data['items']);

        $package->update($data);
        $this->syncItems($package, $items);

        app(AuditLogger::class)->log('package.updated', 'Paket diperbarui: ' . $package->name, $package);

        return response()->json($this->serialize($package->load('services')));
    }

    public function destroy(Package $package)
    {
        app(AuditLogger::class)->log('package.deleted', 'Paket dihapus: ' . $package->name, $package);
        $package->delete();

        return response()->json(['ok' => true]);
    }

    private function syncItems(Package $package, array $items): void
    {
        $package->services()->detach();

        foreach ($items as $it) {
            if (empty($it['service_id'])) {
                continue;
            }
            $package->services()->attach($it['service_id'], ['qty' => (int) max(1, $it['qty'] ?? 1)]);
        }
    }

    private function serialize(Package $package): array
    {
        return [
            'id' => $package->id,
            'name' => $package->name,
            'slug' => $package->slug,
            'type' => $package->type,
            'price_mode' => $package->price_mode,
            'promo_type' => $package->promo_type,
            'promo_value' => $package->promo_value,
            'manual_price' => $package->manual_price,
            'description' => $package->description,
            'is_featured' => (bool) $package->is_featured,
            'is_active' => (bool) $package->is_active,
            'booking_count' => (int) ($package->booking_count ?? $package->bookings()->whereIn('status', ['confirmed', 'converted'])->count()),
            'display_order' => $package->display_order,
            'base_price' => $package->basePrice(),
            'discount' => $package->discountValue(),
            'price' => $package->computedPrice(),
            'items' => $package->services->map(fn ($svc) => [
                'service_id' => $svc->id,
                'name' => $svc->event,
                'media' => $svc->media,
                'event' => $svc->event,
                'duration' => $svc->duration,
                'price' => $svc->price,
                'qty' => $svc->pivot->qty,
                'line_total' => (float) $svc->price * (int) $svc->pivot->qty,
            ])->values(),
        ];
    }

    private function validateData(Request $request): array
    {
        $data = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type' => 'required|in:bundling,combo,populer,unggulan',
            'price_mode' => 'required|in:auto,manual',
            'promo_type' => 'nullable|in:none,nominal,percent',
            'promo_value' => 'nullable|numeric|min:0',
            'manual_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer|min:0',
            'items' => 'nullable|array',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.qty' => 'nullable|integer|min:1',
        ])->validate();

        $data['promo_type'] = $data['promo_type'] ?? 'none';
        if ($data['price_mode'] === 'auto') {
            $data['manual_price'] = null;
        }

        return $data;
    }
}