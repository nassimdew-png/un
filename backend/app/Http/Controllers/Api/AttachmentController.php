<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AttachmentController extends Controller
{
    /**
     * List patient attachments (tenant-scoped).
     */
    public function index(Request $request, string $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $query = PatientAttachment::where('patient_id', $patient->id);

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        $attachments = $query->latest()->get();

        return response()->json([
            'attachments' => $attachments,
            'total_count' => $attachments->count(),
        ]);
    }

    /**
     * Upload an audio recording or document for patient.
     */
    public function upload(Request $request, string $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $validated = $request->validate([
            'file' => 'required|file|max:15360', // max 15MB
            'category' => 'nullable|in:audio_recording,medical_report,imaging,other',
            'related_type' => 'nullable|in:assessment,session,general',
            'related_id' => 'nullable|integer',
            'notes' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getMimeType();
        $sizeKb = round($file->getSize() / 1024);

        // Determine category automatically if not supplied
        $category = $validated['category'] ?? null;
        if (!$category) {
            if (str_starts_with($mimeType, 'audio/') || str_contains($originalName, '.wav') || str_contains($originalName, '.mp3') || str_contains($originalName, '.webm') || str_contains($originalName, '.ogg')) {
                $category = 'audio_recording';
            } elseif (str_starts_with($mimeType, 'image/')) {
                $category = 'imaging';
            } elseif ($mimeType === 'application/pdf') {
                $category = 'medical_report';
            } else {
                $category = 'other';
            }
        }

        $tenantId = Auth::user()->tenant_id;
        $folder = "tenants/{$tenantId}/patient_{$patient->id}";
        $path = $file->store($folder, 'public');

        $attachment = PatientAttachment::create([
            'patient_id' => $patient->id,
            'related_type' => $validated['related_type'] ?? 'general',
            'related_id' => $validated['related_id'] ?? null,
            'file_name' => $originalName,
            'file_path' => $path,
            'mime_type' => $mimeType,
            'file_size_kb' => $sizeKb,
            'category' => $category,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Fichier joint enregistré avec succès.',
            'attachment' => $attachment,
        ], 201);
    }

    /**
     * Download attachment file.
     */
    public function download(string $id): BinaryFileResponse|JsonResponse
    {
        $attachment = PatientAttachment::findOrFail($id);

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            return response()->json(['message' => 'Fichier introuvable sur le disque.'], 404);
        }

        $filePath = Storage::disk('public')->path($attachment->file_path);

        return response()->download($filePath, $attachment->file_name);
    }

    /**
     * Delete an attachment.
     */
    public function destroy(string $id): JsonResponse
    {
        $attachment = PatientAttachment::findOrFail($id);

        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return response()->json([
            'message' => 'Fichier supprimé avec succès.',
        ]);
    }
}
