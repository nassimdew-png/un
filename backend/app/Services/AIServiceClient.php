<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class AIServiceClient
{
    protected Client $client;
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = env('AI_SERVICE_URL', 'http://ai-service:8000');
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout'  => 30.0,
            'headers'  => [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ],
        ]);
    }

    /**
     * Request clinical Orthophonie Bilan generation
     */
    public function generateBilan(array $clinicalInput, ?array $anamnese = null, ?string $patientName = null): array
    {
        try {
            $response = $this->client->post('/api/v1/bilan/generate', [
                'json' => [
                    'patient_name'   => $patientName,
                    'anamnese'       => $anamnese,
                    'clinical_input' => $clinicalInput,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('AI Service Error (Bilan Generation): ' . $e->getMessage());
            return [
                'success'             => false,
                'ai_generated_report' => 'تعذر الاتصال بمحرك الذكاء الاصطناعي حالياً. يرجى مراجعة إعدادات الخدمة.',
                'error'               => $e->getMessage(),
            ];
        }
    }

    /**
     * Score a psychometric test (BDI-II, HAM-A, etc.)
     */
    public function scoreTest(string $testType, array $answers, ?int $patientAge = null): array
    {
        try {
            $response = $this->client->post('/api/v1/tests/score', [
                'json' => [
                    'test_type'   => $testType,
                    'answers'     => $answers,
                    'patient_age' => $patientAge,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('AI Service Error (Test Scoring): ' . $e->getMessage());
            return [
                'test_type'   => $testType,
                'total_score' => array_sum($answers),
                'severity'    => 'Unknown (Service Error)',
                'error'       => $e->getMessage(),
            ];
        }
    }

    /**
     * Summarize a therapy session into SOAP format
     */
    public function summarizeSession(string $rawNotes, ?string $patientName = null, int $sessionNumber = 1): array
    {
        try {
            $response = $this->client->post('/api/v1/session/soap-summary', [
                'json' => [
                    'raw_notes'      => $rawNotes,
                    'patient_name'   => $patientName,
                    'session_number' => $sessionNumber,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('AI Service Error (SOAP Summary): ' . $e->getMessage());
            return [
                'success'            => false,
                'formatted_markdown' => $rawNotes,
                'error'              => $e->getMessage(),
            ];
        }
    }
}
