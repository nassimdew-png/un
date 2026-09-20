<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use App\Models\Patient;

$user = User::first();
$tenant = Tenant::first();
$token = $user->createToken('test-runner')->plainTextToken;
$patient = Patient::first();
$patientId = $patient ? $patient->id : 1;

function createWavSineTone($durationSeconds = 1.0, $frequency = 440, $sampleRate = 16000) {
    $numSamples = $sampleRate * $durationSeconds;
    $data = '';
    for ($i = 0; $i < $numSamples; $i++) {
        $t = $i / $sampleRate;
        $val = (int)(sin(2 * M_PI * $frequency * $t) * 32767 * 0.5);
        $data .= pack('v', $val);
    }
    $dataSize = strlen($data);
    $header = "RIFF";
    $header .= pack('V', 36 + $dataSize);
    $header .= "WAVE";
    $header .= "fmt ";
    $header .= pack('V', 16);
    $header .= pack('v', 1); // PCM
    $header .= pack('v', 1); // Mono
    $header .= pack('V', $sampleRate);
    $header .= pack('V', $sampleRate * 2);
    $header .= pack('v', 2);
    $header .= pack('v', 16);
    $header .= "data";
    $header .= pack('V', $dataSize);
    return $header . $data;
}

$sineWav = createWavSineTone(1.5, 440, 16000);
$wavPath = sys_get_temp_dir() . '/test_sine_tone.wav';
file_put_contents($wavPath, $sineWav);

function callApi($url, $method = 'POST', $data = [], $files = [], $token = '', $tenantId = '') {
    $ch = curl_init($url);
    $headers = [
        'Accept: application/json',
        'Authorization: Bearer ' . $token,
    ];
    if ($tenantId) {
        $headers[] = 'X-Tenant-ID: ' . $tenantId;
        $headers[] = 'X-Tenant: ' . $tenantId;
    }

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_TIMEOUT, 90);

    if (!empty($files)) {
        $postFields = $data;
        foreach ($files as $k => $path) {
            $postFields[$k] = new CURLFile($path, 'audio/wav', basename($path));
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    } else {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['status' => $status, 'body' => json_decode($response, true), 'raw' => $response];
}

$baseUrl = 'http://127.0.0.1:8000/api';
$tenantId = $tenant ? $tenant->id : '';

echo "========================================================\n";
echo "1. Testing Studio 3: generate-exercise\n";
$res1 = callApi("$baseUrl/ai-therapy/generate-exercise", 'POST', [
    'patient_id' => $patientId,
    'content_type' => 'تمارين منزلية للأرطوفونيا',
    'target_goal' => 'تصحيح نطق حرف الراء واللام في الكلمات الثنائية',
    'difficulty' => 'متوسط'
], [], $token, $tenantId);
echo "Status: " . $res1['status'] . "\n";
echo "Success: " . (isset($res1['body']['success']) && $res1['body']['success'] ? 'true' : 'false') . "\n";
echo "Content Bytes: " . strlen($res1['body']['content'] ?? '') . "\n";

echo "\n========================================================\n";
echo "2. Testing Studio 5: generate-social-story\n";
$res2 = callApi("$baseUrl/ai-therapy/generate-social-story", 'POST', [
    'patient_id' => $patientId,
    'theme' => 'تنظيف الأسنان قبل النوم',
    'behavior_target' => 'الالتزام بتنظيف الأسنان بانتظام دون قلق',
    'character_name' => 'يوسف'
], [], $token, $tenantId);
echo "Status: " . $res2['status'] . "\n";
echo "Success: " . (isset($res2['body']['success']) && $res2['body']['success'] ? 'true' : 'false') . "\n";
$panels = $res2['body']['story']['panels'] ?? [];
echo "Panels count: " . count($panels) . "\n";
if (count($panels) > 0) {
    echo "Panel 1: " . ($panels[0]['panel_title'] ?? '') . " | " . mb_substr($panels[0]['text_arabic'] ?? '', 0, 50) . "...\n";
}

echo "\n========================================================\n";
echo "3. Testing Studio 10: Speech Transcribe Guardrail (Sine Tone / No Speech)\n";
$res3 = callApi("$baseUrl/ai-therapy/speech/transcribe-file", 'POST', [
    'specialty' => 'orthophonie',
    'language' => 'ar'
], ['audio' => $wavPath], $token, $tenantId);
echo "Status: " . $res3['status'] . " (Expected: 422 Rejection)\n";
echo "has_speech: " . (isset($res3['body']['has_speech']) ? ($res3['body']['has_speech'] ? 'true' : 'false') : 'none') . "\n";
echo "Message: " . ($res3['body']['message'] ?? 'N/A') . "\n";

echo "\n========================================================\n";
echo "4. Testing Studio 11: Fluency Analyzer Guardrail (Sine Tone / No Speech)\n";
$res4 = callApi("$baseUrl/ai-therapy/orthophonie/analyze-fluency", 'POST', [
    'session_context' => 'orthophonie test'
], ['audio' => $wavPath], $token, $tenantId);
echo "Status: " . $res4['status'] . " (Expected: 422 Rejection)\n";
echo "has_speech: " . (isset($res4['body']['has_speech']) ? ($res4['body']['has_speech'] ? 'true' : 'false') : 'none') . "\n";
echo "Message: " . ($res4['body']['message'] ?? 'N/A') . "\n";

echo "\n========================================================\n";
echo "5. Testing Studio 14: generate-podcast\n";
$res5 = callApi("$baseUrl/ai-therapy/generate-podcast", 'POST', [
    'topic_text' => 'إرشادات عملية للأولياء للتعامل مع فرط النشاط وتشتت الانتباه وتنظيم الروتين اليومي',
    'tone' => 'parent_education',
    'language' => 'darja',
    'duration' => 'short'
], [], $token, $tenantId);
echo "Status: " . $res5['status'] . "\n";
echo "Success: " . (isset($res5['body']['success']) && $res5['body']['success'] ? 'true' : 'false') . "\n";
echo "Episode Title: " . ($res5['body']['episode_title'] ?? $res5['body']['title'] ?? $res5['body']['data']['episode_title'] ?? 'N/A') . "\n";
echo "Audio URL: " . ($res5['body']['audio_url'] ?? $res5['body']['data']['audio_url'] ?? 'N/A') . "\n";
echo "Dialogue Lines: " . count($res5['body']['dialogue'] ?? $res5['body']['data']['dialogue'] ?? []) . "\n";

echo "\n========================================================\n";
echo "ALL TESTS FINISHED\n";
