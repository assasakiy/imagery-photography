<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Service;
use App\Support\ContentSanitizer;
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
        app(\App\Services\AuditLogger::class)->log('service.created', 'Layanan dibuat', $service);

        return response()->json($service, 201);
    }

    public function update(Request $request, Service $service)
    {
        $data = $this->validateData($request);

        $service->update($data);
        app(\App\Services\AuditLogger::class)->log('service.updated', 'Layanan diperbarui', $service);

        return response()->json($service);
    }

    public function destroy(Service $service)
    {
        $service->delete();
        app(\App\Services\AuditLogger::class)->log('service.deleted', 'Layanan dihapus', $service);

        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request): array
    {
        $data = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'starting_price' => 'nullable|numeric|min:0',
            'order' => 'integer|min:0',
        ])->validate();

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');

        return $data;
    }
}
