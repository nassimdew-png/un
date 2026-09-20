<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantSettingsController extends ClinicSettingsController
{
    public function getSettings(Request $request): JsonResponse
    {
        return $this->getBranding($request);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        return $this->updateBranding($request);
    }

    public function getSubscriptionInvoices(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'invoices' => [],
        ]);
    }

    public function downloadSubscriptionInvoice(Request $request, string|int $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'الفاتورة غير متوفرة للتحميل حالياً.',
        ], 404);
    }
}
