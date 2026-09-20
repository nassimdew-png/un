<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientAttachment;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PatientAudioController extends Controller
{
    public function index(string|int $patientId): JsonResponse
    {
        $samples = PatientAttachment::where('patient_id', $patientId)
            ->where(function ($q) {
                $q->where('category', 'audio_recording')
                  ->orWhere('mime_type', 'like', 'audio%')
                  ->orWhere('file_path', 'like', '%.mp3')
                  ->orWhere('file_path', 'like', '%.wav')
                  ->orWhere('file_path', 'like', '%.webm')
                  ->orWhere('file_path', 'like', '%.m4a');
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'samples' => $samples,
        ]);
    }

    public function store(Request $request, string|int $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        if (!$request->hasFile('audio')) {
            return response()->json([
                'success' => false,
                'message' => 'ملف الصوت غير مرفق.',
            ], 422);
        }

        $file = $request->file('audio');
        $path = $file->store("patients/{$patient->id}/audio", 'public');

        $attachment = PatientAttachment::create([
            'tenant_id' => $patient->tenant_id,
            'patient_id' => $patient->id,
            'file_name' => $file->getClientOriginalName() ?: 'تسجيل صوتي',
            'file_path' => $path,
            'mime_type' => $file->getMimeType() ?: 'audio/webm',
            'file_size_kb' => (int)ceil($file->getSize() / 1024),
            'category' => 'audio_recording',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ العينة الصوتية بنجاح.',
            'sample' => $attachment,
        ], 201);
    }

    public function stream(Request $request, string|int $patientId, string|int $audioId)
    {
        $attachment = PatientAttachment::where('patient_id', $patientId)->findOrFail($audioId);
        if (!Storage::disk('public')->exists($attachment->file_path)) {
            return response()->json(['message' => 'ملف الصوت غير موجود.'], 404);
        }

        return Storage::disk('public')->response($attachment->file_path);
    }

    public function destroy(string|int $patientId, string|int $audioId): JsonResponse
    {
        $attachment = PatientAttachment::where('patient_id', $patientId)->findOrFail($audioId);
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }
        $attachment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف العينة الصوتية.',
        ]);
    }
}
