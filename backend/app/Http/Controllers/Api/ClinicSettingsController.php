<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicBrandingSetting;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ClinicSettingsController extends Controller
{
    /**
     * Helper to retrieve active tenant.
     */
    protected function getActiveTenant(): ?Tenant
    {
        $user = Auth::user();
        if (!$user) {
            return null;
        }

        if ($user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id) ?: Tenant::where('id', (int)$user->tenant_id)->first();
            if ($tenant) {
                return $tenant;
            }
        }

        return Tenant::first();
    }

    /**
     * Get current clinic visual identity and letterhead settings.
     */
    public function getBranding(Request $request): JsonResponse
    {
        $tenant = $this->getActiveTenant();
        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'العيادة غير موجودة أو غير مسجلة.'], 404);
        }

        $branding = ClinicBrandingSetting::where('tenant_id', $tenant->id)->first();

        if (!$branding) {
            $branding = ClinicBrandingSetting::create([
                'tenant_id' => $tenant->id,
                'logo_url' => $tenant->logo_path ?? null,
                'stamp_url' => $tenant->digital_stamp_path ?? null,
                'signature_url' => $tenant->signature_path ?? null,
                'primary_color' => $tenant->report_accent_color ?? '#2563eb',
                'secondary_color' => '#06b6d4',
                'header_layout' => $tenant->header_layout ?? 'modern_split',
                'show_watermark' => true,
                'show_stamp_on_bilans' => true,
                'license_number' => $tenant->license_number ?? 'DZ-MSPRH-2026/884',
                'official_title_ar' => $tenant->header_title_ar ?? 'عيادة ومخبر الفحوصات والتشخيص السريري والتأهيلي',
                'official_title_fr' => $tenant->header_title_fr ?? 'Cabinet Médical Spécialisé en Orthophonie et Psychologie',
                'phone' => $tenant->phone ?? '0550123456',
                'address' => $tenant->address ?? 'شارع فلسطين - بئر مراد رايس',
                'wilaya' => $tenant->wilaya ?? '16 - الجزائر العاصمة',
                'footer_text' => $tenant->footer_legal_text ?? 'وثيقة رسمية وسرية صادرة عن منظومة السجلات الطبية الرقمية PsyPro Tech • صالحة للإجراءات الإدارية والمدرسية',
            ]);
        }

        return response()->json([
            'success' => true,
            'settings' => $branding,
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
            ],
        ]);
    }

    /**
     * Update clinic visual identity, upload high-res assets and save letterhead settings.
     */
    public function updateBranding(Request $request): JsonResponse
    {
        $tenant = $this->getActiveTenant();
        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'العيادة غير موجودة.'], 404);
        }

        $request->validate([
            'logo' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
            'stamp' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
            'signature' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
            'primary_color' => 'nullable|string|max:20',
            'secondary_color' => 'nullable|string|max:20',
            'header_layout' => 'nullable|string|max:50',
            'show_watermark' => 'nullable',
            'show_stamp_on_bilans' => 'nullable',
            'license_number' => 'nullable|string|max:100',
            'official_title_ar' => 'nullable|string|max:255',
            'official_title_fr' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'wilaya' => 'nullable|string|max:100',
            'footer_text' => 'nullable|string',
        ]);

        $branding = ClinicBrandingSetting::firstOrNew(['tenant_id' => $tenant->id]);

        $uploadDir = "clinic_branding/{$tenant->id}";

        // Upload Logo
        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $fileName = 'logo_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs($uploadDir, $fileName, 'public');
            $branding->logo_url = '/storage/' . $path;
            $tenant->logo_path = $branding->logo_url;
        } elseif ($request->input('logo_url') === 'DELETE') {
            $branding->logo_url = null;
            $tenant->logo_path = null;
        }

        // Upload Medical Stamp
        if ($request->hasFile('stamp')) {
            $file = $request->file('stamp');
            $fileName = 'stamp_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs($uploadDir, $fileName, 'public');
            $branding->stamp_url = '/storage/' . $path;
            $tenant->digital_stamp_path = $branding->stamp_url;
        } elseif ($request->input('stamp_url') === 'DELETE') {
            $branding->stamp_url = null;
            $tenant->digital_stamp_path = null;
        }

        // Upload Signature
        if ($request->hasFile('signature')) {
            $file = $request->file('signature');
            $fileName = 'signature_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs($uploadDir, $fileName, 'public');
            $branding->signature_url = '/storage/' . $path;
            $tenant->signature_path = $branding->signature_url;
        } elseif ($request->input('signature_url') === 'DELETE') {
            $branding->signature_url = null;
            $tenant->signature_path = null;
        }

        // Fill Metadata
        if ($request->has('primary_color')) {
            $branding->primary_color = $request->input('primary_color');
            $tenant->report_accent_color = $request->input('primary_color');
        }
        if ($request->has('secondary_color')) {
            $branding->secondary_color = $request->input('secondary_color');
        }
        if ($request->has('header_layout')) {
            $branding->header_layout = $request->input('header_layout');
            $tenant->header_layout = $request->input('header_layout');
        }
        if ($request->has('show_watermark')) {
            $branding->show_watermark = filter_var($request->input('show_watermark'), FILTER_VALIDATE_BOOLEAN);
            $tenant->show_watermark = $branding->show_watermark;
        }
        if ($request->has('show_stamp_on_bilans')) {
            $branding->show_stamp_on_bilans = filter_var($request->input('show_stamp_on_bilans'), FILTER_VALIDATE_BOOLEAN);
            $tenant->show_stamp_on_bilans = $branding->show_stamp_on_bilans;
        }
        if ($request->has('license_number')) {
            $branding->license_number = $request->input('license_number');
            $tenant->license_number = $request->input('license_number');
        }
        if ($request->has('official_title_ar')) {
            $branding->official_title_ar = $request->input('official_title_ar');
            $tenant->header_title_ar = $request->input('official_title_ar');
        }
        if ($request->has('official_title_fr')) {
            $branding->official_title_fr = $request->input('official_title_fr');
            $tenant->header_title_fr = $request->input('official_title_fr');
        }
        if ($request->has('phone')) {
            $branding->phone = $request->input('phone');
            $tenant->phone = $request->input('phone');
        }
        if ($request->has('address')) {
            $branding->address = $request->input('address');
            $tenant->address = $request->input('address');
        }
        if ($request->has('wilaya')) {
            $branding->wilaya = $request->input('wilaya');
            $tenant->wilaya = $request->input('wilaya');
        }
        if ($request->has('footer_text')) {
            $branding->footer_text = $request->input('footer_text');
            $tenant->footer_legal_text = $request->input('footer_text');
        }

        $branding->save();
        $tenant->save();

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ وتحديث الهوية البصرية وترويسة التقارير بنجاح! ✨',
            'settings' => $branding,
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'logo_path' => $tenant->logo_path,
                'report_accent_color' => $tenant->report_accent_color,
            ],
        ]);
    }
}
