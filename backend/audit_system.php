<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$endpoints = [
    'Auth Login'              => ['POST', '/api/auth/login'],
    'Public Login Alias'      => ['POST', '/api/login'],
    'Patients Resource'       => ['GET',  '/api/patients'],
    'Clinical Tests List'     => ['GET',  '/api/clinical-tests'],
    'Exercises Bank List'     => ['GET',  '/api/exercises'],
    'SuperAdmin Gateways'     => ['GET',  '/api/superadmin/communication-settings'],
    'SuperAdmin Test WA'      => ['POST', '/api/superadmin/communication-settings/test-whatsapp'],
    'SuperAdmin Test SMS'     => ['POST', '/api/superadmin/communication-settings/test-sms'],
    'SuperAdmin AI Providers' => ['GET',  '/api/superadmin/ai-providers'],
    'SuperAdmin AI Test'      => ['POST', '/api/superadmin/ai-providers/test'],
    'SuperAdmin Switches'     => ['GET',  '/api/superadmin/feature-switches'],
    'SuperAdmin Quotas'       => ['GET',  '/api/superadmin/clinics/quotas'],
    'SuperAdmin Plans'        => ['GET',  '/api/superadmin/plans'],
];

echo "\n================= [ 1. API ROUTES AUDIT ] =================\n";
$routes = Illuminate\Support\Facades\Route::getRoutes();
foreach ($endpoints as $label => [$method, $uri]) {
    $cleanedUri = ltrim(str_replace('/api', '', $uri), '/');
    $match = false;
    foreach ($routes as $route) {
        if (in_array($method, $route->methods()) && ($route->uri() === $cleanedUri || $route->uri() === 'api/' . $cleanedUri || $route->uri() === $uri)) {
            $match = true;
            break;
        }
    }
    printf("%-26s [%s] %-40s : %s\n", $label, $method, $uri, $match ? "✅ PASS" : "❌ MISSING ROUTE");
}

echo "\n================= [ 2. DATABASE AND SEED AUDIT ] =============\n";
try {
    \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "Database Connection: ✅ CONNECTED\n";
} catch (\Exception $e) {
    echo "Database Connection: ❌ ERROR (" . $e->getMessage() . ")\n";
}

echo "\n============================================================\n";
