import subprocess
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

php_script = """<?php
require '/var/www/clinic-saas/backend/vendor/autoload.php';
$app = require_once '/var/www/clinic-saas/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$tenant = App\\Models\\Tenant::first();
$invoice = App\\Models\\Invoice::withoutGlobalScopes()->create([
    'tenant_id' => $tenant->id,
    'invoice_type' => 'b2b_subscription',
    'company_name' => 'SARL Medical Solutions DZ',
    'tax_id' => '001916012345678',
    'trade_register' => '16/00-1234567B19',
    'nis_number' => '0019160123456',
    'subscription_plan' => 'باقة المراكز السريرية المتقدمة (Multi-Pro)',
    'billing_period' => 'annuel',
    'period_start' => '2026-09-01',
    'period_end' => '2027-08-31',
    'subtotal_ht' => 50000,
    'tax_rate' => 19,
    'tax_amount' => 9500,
    'total_amount' => 59500,
    'paid_amount' => 59500,
    'payment_status' => 'paid',
    'payment_method' => 'baridimob',
    'invoice_number' => 'FAC-B2B-2026-0001',
    'issued_date' => '2026-09-14',
    'due_date' => '2026-09-21',
    'items' => [
        [
            'description' => 'اشتراك سنوي في منصة PsyPro Clinical SaaS - باقة المراكز السريرية',
            'quantity' => 1,
            'unit_price' => 50000,
            'total' => 50000
        ]
    ]
]);

echo "Created B2B Invoice: id=" . $invoice->id . ", num=" . $invoice->invoice_number . ", company=" . $invoice->company_name . ", total=" . $invoice->total_amount . " DZD\\n";

// Test rendering PDF view
$html = view('pdf.invoice_receipt', ['invoice' => $invoice, 'tenant' => $tenant])->render();
echo "PDF HTML rendered successfully! Length: " . strlen($html) . " bytes\\n";
if (strpos($html, '001916012345678') !== false && strpos($html, 'SARL Medical Solutions DZ') !== false) {
    echo "SUCCESS: B2B company name and Tax ID (NIF) found in rendered invoice template!\\n";
} else {
    echo "WARNING: Tax ID not found in HTML.\\n";
}
"""

p = subprocess.Popen([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST,
    "cat > /tmp/test_invoice.php && php /tmp/test_invoice.php && rm /tmp/test_invoice.php"
], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')

stdout, stderr = p.communicate(input=php_script)
print("STDOUT:\n", stdout)
if stderr:
    print("STDERR:\n", stderr)
