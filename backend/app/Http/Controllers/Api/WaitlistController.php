<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicBookingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WaitlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entries = PublicBookingRequest::where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $entries,
            'entries' => $entries,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $ctrl = new ClinicController();
        return $ctrl->addToWaitingList($request);
    }

    public function findMatches(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'matches' => [],
        ]);
    }

    public function assignSlot(Request $request, string|int $id): JsonResponse
    {
        $ctrl = new ClinicController();
        return $ctrl->convertWaitingToAppointment($request, (string)$id);
    }

    public function destroy(string|int $id): JsonResponse
    {
        $entry = PublicBookingRequest::findOrFail($id);
        $entry->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف السجل من قائمة الانتظار.',
        ]);
    }
}
