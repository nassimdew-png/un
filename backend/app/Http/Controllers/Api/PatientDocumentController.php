<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PatientDocumentController extends Controller
{
    public function index(Request $request, $patientId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [],
        ]);
    }

    public function store(Request $request, $patientId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Document saved successfully',
            'data' => $request->all(),
        ]);
    }

    public function show($id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['id' => $id],
        ]);
    }

    public function destroy($id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully',
        ]);
    }

    public function exportPdf(Request $request, $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'PDF export initialized',
        ]);
    }
}
