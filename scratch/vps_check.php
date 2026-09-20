<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "=== TENANTS COLUMNS ===\n";
$columns = Schema::getColumnListing('tenants');
print_r($columns);

echo "=== ALL TENANTS ===\n";
$tenants = DB::table('tenants')->get();
foreach ($tenants as $t) {
    echo "ID: {$t->id} | Name: {$t->name} | Subdomain: {$t->subdomain} | Status: {$t->status}\n";
}

echo "\n=== ALL USERS ===\n";
$users = DB::table('users')->get(['id', 'name', 'email', 'role', 'tenant_id']);
foreach ($users as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role} | Tenant: {$u->tenant_id}\n";
}
