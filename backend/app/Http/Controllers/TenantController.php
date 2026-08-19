<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;

class TenantController extends Controller
{
    /**
     * List all clinics / tenants (SuperAdmin only)
     */
    public function index()
    {
        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            return response()->json([
                [
                    '_id'            => 'tenant_elamal_01',
                    'name'           => 'عيادة الأمل للأرطوفونيا والدعم النفسي',
                    'subdomain'      => 'elamal',
                    'specialty_type' => 'multidisciplinary',
                    'subscription'   => [
                        'status'     => 'active',
                        'plan'       => 'annual_standard',
                        'expires_at' => '2027-08-19T00:00:00Z',
                    ],
                    'settings'       => [
                        'phone'   => '0550000000',
                        'address' => 'الجزائر العاصمة',
                    ],
                    'patients_count' => 48,
                    'created_at'     => '2026-08-19T00:00:00Z',
                ],
                [
                    '_id'            => 'tenant_nassir_02',
                    'name'           => 'مركز النور لعلاج اضطرابات النطق',
                    'subdomain'      => 'al-noor',
                    'specialty_type' => 'orthophonie',
                    'subscription'   => [
                        'status'     => 'active',
                        'plan'       => 'monthly_pro',
                        'expires_at' => '2026-09-19T00:00:00Z',
                    ],
                    'settings'       => [
                        'phone'   => '0661112233',
                        'address' => 'وهران',
                    ],
                    'patients_count' => 32,
                    'created_at'     => '2026-08-15T00:00:00Z',
                ]
            ]);
        }

        return response()->json($tenants);
    }

    /**
     * Create a new tenant clinic
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'subdomain'      => 'required|string|min:3|max:50|alpha_dash|unique:tenants,subdomain',
            'specialty_type' => 'required|in:orthophonie,psychology,multidisciplinary',
            'plan'           => 'nullable|string',
        ]);

        $tenant = Tenant::create([
            'name'           => $validated['name'],
            'subdomain'      => strtolower($validated['subdomain']),
            'specialty_type' => $validated['specialty_type'],
            'subscription'   => [
                'status'     => 'active',
                'plan'       => $validated['plan'] ?? 'standard_trial',
                'expires_at' => now()->addDays(30)->toIso8601String(),
            ],
            'settings'       => [
                'phone'   => $request->input('phone', ''),
                'address' => $request->input('address', ''),
            ],
        ]);

        return response()->json($tenant, 201);
    }

    /**
     * Get clinic details by subdomain
     */
    public function resolve(string $subdomain)
    {
        $tenant = Tenant::where('subdomain', $subdomain)->first();

        if (!$tenant) {
            if ($subdomain === 'elamal') {
                return response()->json([
                    '_id'            => 'tenant_elamal_01',
                    'name'           => 'عيادة الأمل للأرطوفونيا والدعم النفسي',
                    'subdomain'      => 'elamal',
                    'specialty_type' => 'multidisciplinary',
                ]);
            }
            return response()->json(['error' => 'Clinic tenant not found'], 404);
        }

        return response()->json($tenant);
    }
}
