<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeletherapyRoom;
use App\Models\TherapySession;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TeletherapySignalingController extends Controller
{
    /**
     * List recent teletherapy sessions / rooms
     */
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id ?? null;

        $rooms = TeletherapyRoom::with(['patient:id,full_name,phone,file_number'])
            ->when($tenantId, function ($query, $tenantId) {
                return $query->where('tenant_id', $tenantId);
            })
            ->latest()
            ->paginate(20);

        return response()->json($rooms);
    }

    /**
     * Create or retrieve an active teletherapy room
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_code' => 'nullable|string|max:64',
            'patient_id' => 'nullable|exists:patients,id',
            'appointment_id' => 'nullable|integer',
            'specialty' => 'nullable|string|max:64',
            'access_pin' => 'nullable|string|max:16',
        ]);

        $tenantId = $request->user()->tenant_id ?? null;
        $roomCode = $validated['room_code'] ?? ('ROOM-' . strtoupper(Str::random(6)));
        $accessToken = Str::random(40);
        $pin = $validated['access_pin'] ?? str_pad((string)random_int(1000, 9999), 4, '0', STR_PAD_LEFT);

        $room = TeletherapyRoom::updateOrCreate(
            ['room_code' => $roomCode],
            [
                'tenant_id' => $tenantId,
                'patient_id' => $validated['patient_id'] ?? null,
                'specialist_id' => $request->user()->id ?? null,
                'appointment_id' => $validated['appointment_id'] ?? null,
                'access_token' => $accessToken,
                'access_pin' => $pin,
                'specialty' => $validated['specialty'] ?? 'orthophony',
                'status' => 'active',
                'started_at' => now(),
            ]
        );

        return response()->json([
            'status' => 'success',
            'room' => $room->load('patient:id,full_name,phone,file_number'),
        ], 201);
    }

    /**
     * Get room details
     */
    public function show(Request $request, string $roomCode)
    {
        $room = TeletherapyRoom::with(['patient:id,full_name,phone,file_number', 'specialist:id,name'])
            ->where('room_code', $roomCode)
            ->first();

        if (!$room) {
            return response()->json(['message' => 'الغرفة غير موجودة'], 404);
        }

        return response()->json([
            'status' => 'success',
            'room' => $room,
        ]);
    }

    /**
     * Save SOAP notes and conclude teletherapy session
     */
    public function saveSession(Request $request)
    {
        $validated = $request->validate([
            'room_code' => 'required|string|max:64',
            'patient_id' => 'nullable|integer',
            'duration_seconds' => 'nullable|integer',
            'soap_data' => 'nullable|array',
            'canvas_snapshot' => 'nullable|string',
        ]);

        $tenantId = $request->user()->tenant_id ?? null;
        $room = TeletherapyRoom::where('room_code', $validated['room_code'])->first();

        if (!$room) {
            $room = new TeletherapyRoom();
            $room->room_code = $validated['room_code'];
            $room->tenant_id = $tenantId;
        }

        $patientId = $validated['patient_id'] ?? $room->patient_id;
        if ($patientId) {
            $patient = Patient::find($patientId);
            if ($patient) {
                $room->patient_id = $patient->id;
            }
        }

        $room->duration_seconds = $validated['duration_seconds'] ?? $room->duration_seconds;
        $room->soap_snapshot = $validated['soap_data'] ?? $room->soap_snapshot;
        if (!empty($validated['canvas_snapshot'])) {
            $room->canvas_snapshot = $validated['canvas_snapshot'];
        }
        $room->status = 'completed';
        $room->ended_at = now();
        $room->save();

        // Record in therapy_sessions table if patient is present
        if ($room->patient_id && class_exists(TherapySession::class)) {
            $soap = $validated['soap_data'] ?? [];
            $notesText = sprintf(
                "[استشارة تطبيب عن بعد - WebRTC & Canvas]\n• مدة الحصة: %d ثانية\n• S (ذاتي): %s\n• O (موضوعي والسبورة): %s\n• A (تقييم): %s\n• P (خطة وتوصيات): %s",
                $room->duration_seconds ?? 0,
                $soap['subjective'] ?? 'لا يوجد',
                $soap['objective'] ?? 'تم التفاعل بالسبورة السريرية',
                $soap['assessment'] ?? 'استجابة جيدة للتعزيزات البصرية',
                $soap['plan'] ?? 'متابعة البرنامج الرقمي'
            );

            try {
                TherapySession::create([
                    'tenant_id' => $tenantId ?? $room->tenant_id,
                    'patient_id' => $room->patient_id,
                    'specialist_id' => $room->specialist_id ?? ($request->user() ? $request->user()->id : null),
                    'session_date' => now()->toDateString(),
                    'duration_minutes' => max(1, round(($room->duration_seconds ?? 0) / 60)),
                    'notes' => $notesText,
                    'specialty' => $room->specialty ?? 'orthophony',
                ]);
            } catch (\Exception $e) {
                // Non-fatal if table schema varies
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم توثيق وحفظ جلسة التطبيب عن بعد بنجاح',
            'room' => $room,
        ]);
    }

    /**
     * Send WebRTC Signaling or Canvas Event
     */
    public function signal(Request $request, string $roomCode)
    {
        $payload = $request->all();
        $room = TeletherapyRoom::where('room_code', $roomCode)->first();

        if (!$room) {
            return response()->json(['message' => 'الغرفة غير موجودة'], 404);
        }

        $currentState = $room->signaling_state ?? [];
        $events = $currentState['events'] ?? [];

        // Append new event with timestamp
        $events[] = array_merge($payload, [
            'id' => (string)Str::uuid(),
            'ts' => microtime(true),
        ]);

        // Keep last 40 events to prevent bloat
        if (count($events) > 40) {
            $events = array_slice($events, -40);
        }

        $currentState['events'] = $events;
        $room->signaling_state = $currentState;
        $room->save();

        return response()->json(['status' => 'sent', 'count' => count($events)]);
    }

    /**
     * Poll WebRTC Signaling or Canvas Events
     */
    public function getSignals(Request $request, string $roomCode)
    {
        $since = (float)($request->query('since', 0));
        $room = TeletherapyRoom::where('room_code', $roomCode)->first();

        if (!$room) {
            return response()->json(['events' => []]);
        }

        $allEvents = $room->signaling_state['events'] ?? [];
        $newEvents = array_filter($allEvents, function ($e) use ($since) {
            return isset($e['ts']) && $e['ts'] > $since;
        });

        return response()->json([
            'events' => array_values($newEvents),
            'latest_ts' => microtime(true),
        ]);
    }

    /**
     * Public Guest Access: Pre-call verification for patients/guardians
     */
    public function publicRoom(Request $request, string $roomCode)
    {
        $pin = $request->query('pin') ?? $request->input('pin');

        $room = TeletherapyRoom::with(['patient:id,full_name,specialty'])
            ->where('room_code', $roomCode)
            ->first();

        if (!$room) {
            return response()->json(['message' => 'رابط الجلسة غير صحيح أو انتهت صلاحيته'], 404);
        }

        if ($room->access_pin && $pin && $room->access_pin !== $pin) {
            return response()->json(['message' => 'رمز الدخول السريع (PIN) غير صحيح'], 403);
        }

        return response()->json([
            'status' => 'ready',
            'room_code' => $room->room_code,
            'specialty' => $room->specialty,
            'patient_name' => $room->patient->full_name ?? 'المريض',
            'is_pin_required' => !empty($room->access_pin),
            'pin_verified' => empty($room->access_pin) || ($pin === $room->access_pin),
        ]);
    }
}
