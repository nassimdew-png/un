<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateClinicalVideoJob;
use App\Models\GeneratedClinicalVideo;
use App\Models\Patient;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AiVideoStudioController extends Controller
{
    /**
     * Request Asynchronous Clinical Video Modeling Generation.
     * POST /api/ai-therapy/videos/generate
     */
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|min:3|max:200',
            'prompt' => 'required|string|min:5|max:3000',
            'category' => 'nullable|string|in:social_story,therapy_exercise,clinic_reel,breathing_visual',
            'aspect_ratio' => 'nullable|string|in:16:9,9:16,1:1',
            'patient_id' => 'nullable|integer|exists:patients,id',
        ]);

        $user = Auth::user();
        $tenantId = $user->tenant_id ?: 1;

        $video = GeneratedClinicalVideo::create([
            'clinic_id' => $tenantId,
            'tenant_id' => $tenantId,
            'patient_id' => $validated['patient_id'] ?? null,
            'user_id' => $user->id,
            'title' => trim($validated['title']),
            'prompt' => trim($validated['prompt']),
            'category' => $validated['category'] ?? 'social_story',
            'model_used' => 'veo_animation',
            'aspect_ratio' => $validated['aspect_ratio'] ?? '16:9',
            'status' => 'queued',
        ]);

        // Dispatch async job (falls back to synchronous execution if queue sync is used)
        GenerateClinicalVideoJob::dispatch($video->id);

        return response()->json([
            'success' => true,
            'message' => 'تم إدراج طلب توليد الفيديو المتحرك في قائمة المعالجة بنجاح!',
            'video_id' => $video->id,
            'video' => $video,
        ], 202);
    }

    /**
     * Poll Video Generation Status.
     * GET /api/ai-therapy/videos/status/{id}
     */
    public function getStatus(int $id): JsonResponse
    {
        $video = GeneratedClinicalVideo::findOrFail($id);

        return response()->json([
            'success' => true,
            'video' => $video,
        ]);
    }

    /**
     * Get Generated Videos Gallery for Current Clinic.
     * GET /api/ai-therapy/videos
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?: 1;

        $videos = GeneratedClinicalVideo::where('tenant_id', $tenantId)
            ->orWhereNull('tenant_id')
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'videos' => $videos,
        ]);
    }
}
