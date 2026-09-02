<?php

namespace App\Jobs;

use App\Models\GeneratedClinicalVideo;
use App\Models\PatientAiRecord;
use App\Services\AiGatewayService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GenerateClinicalVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $videoId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $videoId)
    {
        $this->videoId = $videoId;
    }

    /**
     * Execute the job.
     */
    public function handle(AiGatewayService $aiGateway): void
    {
        $video = GeneratedClinicalVideo::find($this->videoId);
        if (!$video) {
            Log::warning("GenerateClinicalVideoJob: Video record [{$this->videoId}] not found.");
            return;
        }

        $video->update(['status' => 'processing']);

        $tmpDir = sys_get_temp_dir() . '/clinical_vid_' . uniqid();
        File::makeDirectory($tmpDir, 0775, true);

        try {
            // 1. Dimensions based on Aspect Ratio
            $aspectRatio = $video->aspect_ratio ?: '16:9';
            [$width, $height] = match($aspectRatio) {
                '9:16' => [720, 1280],
                '1:1' => [1024, 1024],
                default => [1280, 720],
            };

            // 2. Generate Narration Script & Scene Prompts via Gemini
            $systemPrompt = <<<PROMPT
أنت مخرج فيديو علاجي ورسوم متحركة موجهة للأطفال والتثقيف النفسي (Clinical Video Modeling & Animated Social Stories Director).
قم بصياغة نص تعليق صوتي قصير جداً وهادئ (Voiceover: 2-3 جمل دافئة) ووصفين بصريين دقيقين للمشهدين بالإنجليزية لتوليدهما بالذكاء الاصطناعي:
Scene 1: الموقف السلوكي المبدئي أو بداية التمرين بهدوء.
Scene 2: السلوك الإيجابي والنتيجة المطمئنة مع ابتجاز أو نجاح.

أرجع المخرج حصراً بتنسيق JSON:
{
  "voiceover_text": "نص التعليق الصوتي الهادئ للأطفال أو الأولياء...",
  "scene1_prompt": "Clean 3D cartoon illustration of...",
  "scene2_prompt": "Clean 3D cartoon illustration of..."
}
PROMPT;

            $userPrompt = "موضوع الفيديو والقصة السريرية: {$video->title}\nالتفاصيل: {$video->prompt}\nالفئة: {$video->category}";

            $result = $aiGateway->generate('video_script_director', $userPrompt, $systemPrompt, null, null, [
                'temperature' => 0.3,
                'max_tokens' => 1500,
                'format_json' => true,
            ]);

            $content = trim($result['content'] ?? '');
            if (str_starts_with($content, '```json')) $content = substr($content, 7);
            if (str_ends_with($content, '```')) $content = substr($content, 0, -3);
            $script = json_decode(trim($content), true);

            $voiceoverText = $script['voiceover_text'] ?? "مرحباً يا بطل، اليوم سنتعلم مهارة جديدة وجميلة معاً بخطوات بسيطة وهدوء.";
            $scene1Prompt = $script['scene1_prompt'] ?? "Pediatric clinical animation scene, friendly cute 3D cartoon child character, soft lighting: {$video->prompt}";
            $scene2Prompt = $script['scene2_prompt'] ?? "Pediatric clinical animation scene, happy smiling 3D cartoon child celebrating success: {$video->prompt}";

            // 3. Synthesize Voiceover Audio with edge-tts
            $audioPath = $tmpDir . '/voiceover.mp3';
            $sanitizedVoiceText = preg_replace('/[^\p{L}\p{N}\s.,?!:،؟\'-]/u', ' ', $voiceoverText);
            $ttsCmd = sprintf(
                'edge-tts --voice ar-DZ-AminaNeural --text %s --write-media %s 2>&1',
                escapeshellarg($sanitizedVoiceText),
                escapeshellarg($audioPath)
            );
            exec($ttsCmd);

            if (!File::exists($audioPath) || filesize($audioPath) < 500) {
                // Fallback tone
                $cmdTone = sprintf(
                    'ffmpeg -y -f lavfi -i "sine=frequency=523.25:duration=6,afade=t=in:st=0:d=1,afade=t=out:st=5:d=1,volume=0.08" -c:a libmp3lame -b:a 128k %s 2>&1',
                    escapeshellarg($audioPath)
                );
                exec($cmdTone);
            }

            // 4. Generate Visual Frames
            $frame1Path = $tmpDir . '/frame1.jpg';
            $frame2Path = $tmpDir . '/frame2.jpg';

            $seed1 = mt_rand(1000, 99999);
            $seed2 = mt_rand(1000, 99999);

            $url1 = "https://image.pollinations.ai/prompt/" . rawurlencode("High quality 3D pediatric animation render, Pixar style, cute expressive character, clean background: " . $scene1Prompt) . "?width={$width}&height={$height}&nologo=true&seed={$seed1}";
            $url2 = "https://image.pollinations.ai/prompt/" . rawurlencode("High quality 3D pediatric animation render, Pixar style, happy smiling character celebrating, bright warm colors: " . $scene2Prompt) . "?width={$width}&height={$height}&nologo=true&seed={$seed2}";

            $res1 = Http::timeout(45)->get($url1);
            if ($res1->successful()) File::put($frame1Path, $res1->body());

            $res2 = Http::timeout(45)->get($url2);
            if ($res2->successful()) File::put($frame2Path, $res2->body());

            // Ensure we have at least one frame
            if (!File::exists($frame1Path)) {
                $colorCmd = sprintf('ffmpeg -y -f lavfi -i "color=c=0x1e1b4b:s=%dx%d:d=1" -vframes 1 %s', $width, $height, escapeshellarg($frame1Path));
                exec($colorCmd);
            }
            if (!File::exists($frame2Path)) {
                File::copy($frame1Path, $frame2Path);
            }

            // 5. Render Animated MP4 via FFmpeg with Smooth Pan & Crossfade
            $videosDir = public_path('storage/generated_videos');
            if (!File::exists($videosDir)) {
                File::makeDirectory($videosDir, 0775, true);
            }

            $uniqueId = Str::random(16);
            $videoFileName = "video_{$uniqueId}.mp4";
            $thumbFileName = "thumb_{$uniqueId}.jpg";

            $finalVideoPath = $videosDir . '/' . $videoFileName;
            $finalThumbPath = $videosDir . '/' . $thumbFileName;

            // Render video with FFmpeg
            $ffmpegCmd = sprintf(
                'ffmpeg -y -loop 1 -t 4 -i %s -loop 1 -t 4 -i %s -i %s ' .
                '-filter_complex "[0:v]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,zoompan=z=\'min(zoom+0.0015,1.15)\':d=100:s=%dx%d[v0]; ' .
                '[1:v]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,zoompan=z=\'min(zoom+0.0015,1.15)\':d=100:s=%dx%d[v1]; ' .
                '[v0][v1]concat=n=2:v=1:a=0,format=yuv420p[v]" ' .
                '-map "[v]" -map 2:a -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k -shortest -movflags +faststart %s 2>&1',
                escapeshellarg($frame1Path),
                escapeshellarg($frame2Path),
                escapeshellarg($audioPath),
                $width, $height, $width, $height, $width, $height,
                $width, $height, $width, $height, $width, $height,
                escapeshellarg($finalVideoPath)
            );

            exec($ffmpegCmd, $ffOut, $ffRet);

            // Fallback render if complex filter failed
            if (!File::exists($finalVideoPath) || filesize($finalVideoPath) < 1000) {
                $fallbackCmd = sprintf(
                    'ffmpeg -y -loop 1 -i %s -i %s -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -movflags +faststart %s 2>&1',
                    escapeshellarg($frame1Path),
                    escapeshellarg($audioPath),
                    escapeshellarg($finalVideoPath)
                );
                exec($fallbackCmd);
            }

            chmod($finalVideoPath, 0664);

            // 6. Generate Thumbnail Image
            $thumbCmd = sprintf(
                'ffmpeg -y -i %s -ss 00:00:01 -vframes 1 %s 2>&1',
                escapeshellarg($finalVideoPath),
                escapeshellarg($finalThumbPath)
            );
            exec($thumbCmd);
            if (File::exists($finalThumbPath)) {
                chmod($finalThumbPath, 0664);
            }

            // 7. Update Video Record
            $publicVideoUrl = url('/storage/generated_videos/' . $videoFileName);
            $publicThumbUrl = File::exists($finalThumbPath) ? url('/storage/generated_videos/' . $thumbFileName) : null;

            $video->update([
                'status' => 'completed',
                'video_url' => $publicVideoUrl,
                'thumbnail_url' => $publicThumbUrl,
                'duration_seconds' => 8,
            ]);

            // 8. Attach to Patient AI Records if applicable
            if ($video->patient_id) {
                try {
                    PatientAiRecord::create([
                        'clinic_id' => $video->clinic_id ?: ($video->tenant_id ?: 1),
                        'tenant_id' => $video->tenant_id ?: 1,
                        'patient_id' => $video->patient_id,
                        'user_id' => $video->user_id,
                        'tool_type' => 'social_story',
                        'title' => 'فيديو نمذجة بصرية: ' . $video->title,
                        'summary' => 'مقطع فيديو متحرك للتأهيل السلوكي والقصص الاجتماعية.',
                        'payload' => [
                            'video_url' => $publicVideoUrl,
                            'thumbnail_url' => $publicThumbUrl,
                            'title' => $video->title,
                            'category' => $video->category,
                            'duration_seconds' => 8,
                        ],
                        'is_shared_with_portal' => true,
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Failed to attach video to patient AI record: ' . $e->getMessage());
                }
            }

            Log::info("Clinical Video generated successfully: [{$video->id}] -> {$publicVideoUrl}");

        } catch (\Throwable $e) {
            Log::error("GenerateClinicalVideoJob failed for video [{$this->videoId}]: " . $e->getMessage());
            $video->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        } finally {
            // Clean up temporary workspace
            try {
                File::deleteDirectory($tmpDir);
            } catch (\Throwable $e) {}
        }
    }
}
