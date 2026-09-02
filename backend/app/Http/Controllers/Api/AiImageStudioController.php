<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientAiRecord;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiImageStudioController extends Controller
{
    /**
     * Generate Therapy Visual Asset / PECS Card / Coloring Page.
     * POST /api/ai-therapy/generate-image
     */
    public function generateImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => 'required|string|min:3|max:2000',
            'style' => 'nullable|string|in:cartoon_pecs,coloring_book,realistic_clinical,social_post,social_story',
            'aspect_ratio' => 'nullable|string|in:1:1,4:3,16:9',
            'patient_id' => 'nullable|integer|exists:patients,id',
            'card_label_ar' => 'nullable|string|max:200',
        ]);

        $user = Auth::user();
        $tenantId = $user->tenant_id ?: 1;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $rawPrompt = trim($validated['prompt']);
        $style = $validated['style'] ?? 'cartoon_pecs';
        $aspectRatio = $validated['aspect_ratio'] ?? '1:1';
        $cardLabel = $validated['card_label_ar'] ?? $rawPrompt;

        // 1. Enhance Prompt based on Clinical Visual Style
        $enhancedPrompt = $this->buildEnhancedPrompt($rawPrompt, $style);

        // 2. Resolve Dimensions based on Aspect Ratio
        [$width, $height] = match($aspectRatio) {
            '4:3' => [1024, 768],
            '16:9' => [1280, 720],
            default => [1024, 1024],
        };

        // 3. Fetch Image from Neural Image Generation Engine
        $seed = mt_rand(10000, 999999);
        $imageUrlEndpoint = "https://image.pollinations.ai/prompt/" . rawurlencode($enhancedPrompt) . "?width={$width}&height={$height}&nologo=true&seed={$seed}";

        try {
            $response = Http::timeout(60)->get($imageUrlEndpoint);

            if (!$response->successful() || strlen($response->body()) < 1000) {
                throw new \Exception('فشل استلام محتوى الصورة من محرك التوليد البصري.');
            }

            $imageBytes = $response->body();
        } catch (\Throwable $e) {
            Log::error("AI Image Generation Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'تعذر توليد الصورة حالياً. يرجى إعادة المحاولة: ' . $e->getMessage(),
            ], 500);
        }

        // 4. Save to Storage Public Directory
        $assetsDir = public_path('storage/generated_assets');
        if (!File::exists($assetsDir)) {
            File::makeDirectory($assetsDir, 0775, true);
        }

        $fileName = 'asset_' . Str::random(16) . '.jpg';
        $fullPath = $assetsDir . '/' . $fileName;

        File::put($fullPath, $imageBytes);
        chmod($fullPath, 0664);

        $publicUrl = url('/storage/generated_assets/' . $fileName);

        // 5. Attach to Patient AI Records if patient selected
        $savedRecordId = null;
        if ($patient) {
            try {
                $record = PatientAiRecord::create([
                    'clinic_id' => $tenantId,
                    'tenant_id' => $tenantId,
                    'patient_id' => $patient->id,
                    'user_id' => $user->id,
                    'tool_type' => 'social_story',
                    'title' => 'وسيلة بصرية: ' . Str::limit($cardLabel, 60),
                    'summary' => "وسيلة بصرية وبطاقة علاجية بنمط {$style}.",
                    'payload' => [
                        'image_url' => $publicUrl,
                        'card_label_ar' => $cardLabel,
                        'prompt' => $rawPrompt,
                        'style' => $style,
                        'aspect_ratio' => $aspectRatio,
                    ],
                    'is_shared_with_portal' => true,
                ]);
                $savedRecordId = $record->id;
            } catch (\Throwable $e) {
                Log::warning('Failed to save visual asset to patient AI records: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تم توليد وتصميم الوسيلة البصرية بنجاح!',
            'data' => [
                'image_url' => $publicUrl,
                'prompt' => $rawPrompt,
                'style' => $style,
                'aspect_ratio' => $aspectRatio,
                'card_label_ar' => $cardLabel,
                'patient_id' => $patient ? $patient->id : null,
                'record_id' => $savedRecordId,
                'created_at' => now()->toIso8601String(),
            ]
        ]);
    }

    /**
     * Get Gallery of Generated Visual Assets.
     * GET /api/ai-therapy/generated-images
     */
    public function getGeneratedImages(Request $request): JsonResponse
    {
        $assetsDir = public_path('storage/generated_assets');
        $assets = [];

        if (File::exists($assetsDir)) {
            $files = File::files($assetsDir);
            // Sort by modified time descending
            usort($files, fn($a, $b) => $b->getMTime() <=> $a->getMTime());

            foreach (array_slice($files, 0, 30) as $file) {
                $assets[] = [
                    'file_name' => $file->getFilename(),
                    'image_url' => url('/storage/generated_assets/' . $file->getFilename()),
                    'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
                    'size_kb' => round($file->getSize() / 1024, 1),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'assets' => $assets,
        ]);
    }

    /**
     * Build Clinical Prompt Enhancement based on selected style.
     */
    private function buildEnhancedPrompt(string $prompt, string $style): string
    {
        return match($style) {
            'cartoon_pecs' => "PECS picture communication symbols flashcard style, clear bold dark outlines, isolated single central action or object on clean pure white background, flat 2D vector cartoon, pediatric speech therapy icon, high contrast, vibrant colors, expressive friendly character, minimalist, no background clutter, professional educational illustration: {$prompt}",
            'coloring_book' => "Children coloring book page line art, thick bold clean black outlines, pure white background, crisp vector line work, no colors, no shading, no grayscale, no gradients, easy and fun for kids to color with crayons: {$prompt}",
            'social_story' => "Pediatric social story children book illustration, soft warm pastel watercolor painting, gentle expressive characters, clear social emotional context, friendly and calming atmosphere, cute storybook art: {$prompt}",
            'social_post' => "Modern clean medical clinic social media poster graphic, high quality aesthetic, pediatric healthcare background, soft elegant lighting, minimalist layout, professional: {$prompt}",
            'realistic_clinical' => "Clean bright studio lighting photography style, pediatric medical therapy, sharp focus, high definition, calming and welcoming: {$prompt}",
            default => "Pediatric speech therapy illustration, clear colorful cartoon style, clean white background: {$prompt}",
        };
    }
}
