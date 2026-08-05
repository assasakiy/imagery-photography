<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json(Service::orderBy('order')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $service = Service::create($data);
        app(AuditLogger::class)->log('service.created', 'Layanan satuan dibuat: ' . $service->name, $service);

        return response()->json($service, 201);
    }

    public function update(Request $request, Service $service)
    {
        $data = $this->validateData($request);

        $service->update($data);
        app(AuditLogger::class)->log('service.updated', 'Layanan satuan diperbarui: ' . $service->name, $service);

        return response()->json($service);
    }

    public function destroy(Service $service)
    {
        app(AuditLogger::class)->log('service.deleted', 'Layanan satuan dihapus: ' . $service->name, $service);
        $service->delete();

        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request): array
    {
        return Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'event' => 'nullable|string|max:255',
            'media' => 'required|in:photo,video,drone,photobooth,livestream',
            'duration' => 'nullable|string|max:255',
            'terms' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'active' => 'boolean',
            'order' => 'integer|min:0',
        ])->validate();
    }
}