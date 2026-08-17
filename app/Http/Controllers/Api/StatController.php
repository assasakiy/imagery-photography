<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stat;
use App\Services\StatResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StatController extends Controller
{
    public function index()
    {
        return response()->json(Stat::orderBy('order')->orderBy('id')->get());
    }

    public function preview(Request $request)
    {
        $metric = $request->query('metric');
        $base = $request->query('base');

        return response()->json([
            'value' => app(StatResolver::class)->resolve($metric, $base),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $stat = Stat::create($data);
        app(\App\Services\AuditLogger::class)->log('stats.created', 'Statistik dibuat', $stat);

        return response()->json($stat, 201);
    }

    public function update(Request $request, Stat $stat)
    {
        $data = $this->validateData($request);

        $stat->update($data);
        app(\App\Services\AuditLogger::class)->log('stats.updated', 'Statistik diperbarui', $stat);

        return response()->json($stat);
    }

    public function destroy(Stat $stat)
    {
        $stat->delete();
        app(\App\Services\AuditLogger::class)->log('stats.deleted', 'Statistik dihapus');

        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request): array
    {
        $data = Validator::make($request->all(), [
            'source' => 'nullable|string|in:manual,auto,auto_offset',
            'metric' => ['nullable', 'string', 'max:50', 'required_if:source,auto', 'required_if:source,auto_offset'],
            'label' => 'required|string|max:255',
            'value' => 'nullable|string|max:50|required_unless:source,auto',
            'suffix' => 'nullable|string|max:10',
            'order' => 'integer|min:0',
        ])->validate();

        $data['source'] = $data['source'] ?? 'manual';
        $data['value'] = $data['value'] ?? null;

        if ($data['source'] === 'manual') {
            $data['metric'] = null;
        }

        return $data;
    }
}