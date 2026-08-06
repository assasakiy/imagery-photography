<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with(['project.user'])->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($q = trim((string) $request->input('q'))) {
            $query->where(fn ($w) => $w
                ->where('number', 'like', '%' . $q . '%')
                ->orWhereHas('project', fn ($p) => $p->where('name', 'like', '%' . $q . '%')
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', '%' . $q . '%'))));
        }

        $invoices = $query->paginate(15);

        $invoices->getCollection()->transform(fn ($inv) => [
            'id' => $inv->id,
            'number' => $inv->number,
            'project_id' => $inv->project_id,
            'project' => $inv->project?->name,
            'client' => $inv->project?->user?->name,
            'price' => $inv->base_amount,
            'paid' => $inv->paid_amount,
            'remaining' => $inv->remaining(),
            'status' => $inv->status,
            'issued_at' => $inv->issued_at,
            'due_at' => $inv->due_at,
        ]);

        return response()->json($invoices);
    }
}