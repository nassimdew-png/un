import requests

# Test saas invoice view compilation via php artisan tinker
import subprocess

cmd = """
php artisan tinker --execute="
\\$invoice = (object)[
    'invoice_number' => 'INV-TEST-2026-001',
    'amount_dzd' => 25000,
    'billing_cycle' => 'annual',
    'period_start' => now(),
    'period_end' => now()->addYear(),
    'payment_method' => 'baridimob',
    'created_at' => now(),
];
\\$clinic = \\App\\Models\\Tenant::first();
\\$owner = \\App\\Models\\User::first();
\\$plan = \\App\\Models\\SubscriptionPlan::first();

\\$pdf = \\Barryvdh\\DomPDF\\Facade\\Pdf::loadView('pdf.saas_invoice', [
    'invoice' => \\$invoice,
    'clinic' => \\$clinic,
    'owner' => \\$owner,
    'plan' => \\$plan,
]);
echo 'PDF Length: ' . strlen(\\$pdf->output());
"
"""

res = subprocess.run(cmd, shell=True, cwd="/var/www/clinic-saas/backend", capture_output=True, text=True)
print("OUT:", res.stdout)
if res.stderr:
    print("ERR:", res.stderr)
