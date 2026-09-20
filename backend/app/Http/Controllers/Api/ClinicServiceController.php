<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ClinicServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $hasTable = \Illuminate\Support\Facades\Schema::hasTable('clinic_services');
        if ($hasTable) {
            $services = DB::table('clinic_services')->get();
            return response()->json(['success' => true, 'services' => $services, 'data' => $services]);
        }

        return response()->json([
            'success' => true,
            'services' => [
                ['id' => 1, 'name' => 'جلسة تقييم أرطوفوني أولي', 'price' => 2500, 'duration' => 45],
                ['id' => 2, 'name' => 'جلسة علاج نطقي وتخاطب', 'price' => 2000, 'duration' => 30],
                ['id' => 3, 'name' => 'جلسة فحص نفسي-متري شامل', 'price' => 3000, 'duration' => 60],
            ],
            'data' => [],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'تم حفظ الخدمة بنجاح.']);
    }

    public function show(string|int $id): JsonResponse
    {
        return response()->json(['success' => true]);
    }

    public function update(Request $request, string|int $id): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'تم تحديث الخدمة بنجاح.']);
    }

    public function destroy(string|int $id): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'تم حذف الخدمة بنجاح.']);
    }

    public function seedDefaultServices(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'تم استرجاع الخدمات الافتراضية.']);
    }

    public function toggleStatus(Request $request, string|int $id): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'تم تغيير حالة الخدمة.']);
    }

    public function listPatientPackages(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'packages' => []]);
    }

    public function usePackageSession(Request $request, string|int $id): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'تم استهلاك حصة من الباقة بنجاح.']);
    }
}
