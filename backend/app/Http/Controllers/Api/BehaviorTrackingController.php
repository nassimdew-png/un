<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BehaviorTrackingController extends Controller
{
    public function index(Request $request, $patientId): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function store(Request $request, $patientId): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $request->all()]);
    }

    public function getProgression(Request $request, $patientId): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }
}
