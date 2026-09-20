<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EmdrSignalingController extends Controller
{
    /**
     * Update EMDR session real-time state
     */
    public function syncState(Request $request, string $sessionCode)
    {
        $validated = $request->validate([
            'is_playing' => 'nullable|boolean',
            'speed' => 'nullable|numeric|min:1|max:10',
            'movement_pattern' => 'nullable|string|in:horizontal,infinity,diagonal',
            'dot_color' => 'nullable|string|max:32',
            'dot_size' => 'nullable|integer|min:10|max:100',
            'passes_per_set' => 'nullable|integer|min:1|max:100',
            'current_pass' => 'nullable|integer|min:0',
            'completed_sets' => 'nullable|integer|min:0',
            'sound_enabled' => 'nullable|boolean',
            'sound_tone' => 'nullable|string|max:32',
            'sound_volume' => 'nullable|numeric|min:0|max:1',
            'therapist_guidance' => 'nullable|string|max:500',
            'active_phase' => 'nullable|string|max:64',
            'suds_score' => 'nullable|numeric|min:0|max:10',
            'voc_score' => 'nullable|numeric|min:1|max:7',
        ]);

        $payload = array_merge($validated, [
            'updated_at' => now()->toISOString(),
            'server_timestamp' => microtime(true) * 1000,
        ]);

        // Cache state for 4 hours
        Cache::put("emdr_session_state_{$sessionCode}", $payload, 14400);

        return response()->json([
            'status' => 'success',
            'session_code' => $sessionCode,
            'state' => $payload,
        ]);
    }

    /**
     * Get EMDR session real-time state (Public for patient display)
     */
    public function getState(string $sessionCode)
    {
        $state = Cache::get("emdr_session_state_{$sessionCode}", [
            'is_playing' => false,
            'speed' => 5,
            'movement_pattern' => 'horizontal',
            'dot_color' => '#0d9488',
            'dot_size' => 36,
            'passes_per_set' => 24,
            'current_pass' => 0,
            'completed_sets' => 0,
            'sound_enabled' => true,
            'sound_tone' => 'sine_440',
            'sound_volume' => 0.5,
            'therapist_guidance' => 'جلسة EMDR مباشرة - ركز على النقطة وتنفس بهدوء',
            'active_phase' => 'lightbar',
            'updated_at' => now()->toISOString(),
        ]);

        return response()->json([
            'status' => 'success',
            'session_code' => $sessionCode,
            'state' => $state,
        ]);
    }
}
