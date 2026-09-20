<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClinicalAiController extends Controller
{
    public function draftSynthesis(Request $request): JsonResponse
    {
        $prompt = $request->input('prompt', '');
        return response()->json([
            'success' => true,
            'synthesis' => "بناءً على المعطيات السريرية والروائز الممررة، يُظهر المفحوص استجابة إيجابية مع الحاجة إلى تعزيز الخطة العلاجية الفردية (PEI).",
        ]);
    }

    public function refineText(Request $request): JsonResponse
    {
        $text = $request->input('text', '');
        return response()->json([
            'success' => true,
            'refined_text' => trim($text),
        ]);
    }
}
