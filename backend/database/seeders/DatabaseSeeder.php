<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with demo clinic and specialist.
     */
    public function run(): void
    {
        // إنشاء عيادة تجريبية
        $tenant = Tenant::create([
            'name' => 'عيادة الأمل التجريبية',
            'subdomain' => 'elamal',
            'specialty_type' => 'multidisciplinary',
            'subscription' => ['status' => 'active', 'plan' => 'trial']
        ]);

        // إنشاء أخصائي أرطوفوني تجريبي
        User::create([
            'tenant_id' => $tenant->_id,
            'name' => 'د. سارة',
            'email' => 'sara@elamal.dz',
            'password' => bcrypt('password123'),
            'role' => 'orthophonist',
            'specialty' => 'orthophonie',
            'is_active' => true
        ]);
    }
}
