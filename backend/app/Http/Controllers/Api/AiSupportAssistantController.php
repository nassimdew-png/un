<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KnowledgeBaseArticle;
use App\Models\SupportConversation;
use App\Models\Tenant;
use App\Services\AiGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiSupportAssistantController extends Controller
{
    protected AiGatewayService $aiGateway;

    public function __construct(AiGatewayService $aiGateway)
    {
        $this->aiGateway = $aiGateway;
    }

    // ==========================================
    // 1. TENANT KNOWLEDGE BASE & AI RECEPTIONIST
    // ==========================================

    /**
     * Tenant crawls a website / FAQ URL for their clinic.
     * POST /api/tenant/knowledge-base/crawl
     */
    public function tenantCrawl(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;
        if (!$tenantId) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $validated = $request->validate([
            'url' => 'required|url|max:500',
        ]);

        return $this->performCrawlAndStore($validated['url'], $tenantId);
    }

    /**
     * Tenant adds raw text FAQ / Clinic Policies directly.
     * POST /api/tenant/knowledge-base/text
     */
    public function tenantSaveDirectText(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id;
        if (!$tenantId) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|min:20',
        ]);

        $tokensCount = (int) ceil(mb_strlen($validated['content']) / 3.5);

        $article = KnowledgeBaseArticle::create([
            'clinic_id' => $tenantId,
            'source_url' => 'manual://policy_' . Str::random(8),
            'title' => $validated['title'],
            'content' => $validated['content'],
            'tokens_count' => $tokensCount,
            'last_crawled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة الوثيقة إلى قاعدة معرفة العيادة بنجاح.',
            'article' => $article,
        ], 201);
    }

    /**
     * Get Tenant Knowledge Base articles and AI Receptionist config.
     * GET /api/tenant/knowledge-base
     */
    public function tenantGetKnowledgeBase(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenant = Tenant::findOrFail($user->tenant_id);

        $articles = KnowledgeBaseArticle::where('clinic_id', $tenant->id)
            ->orderBy('last_crawled_at', 'desc')
            ->get();

        $embedCode = sprintf(
            '<script src="https://psypro.tech/embed/support-widget.js" data-clinic="%s" async></script>',
            $tenant->subdomain ?: $tenant->id
        );

        return response()->json([
            'success' => true,
            'clinic' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'ai_receptionist_enabled' => (bool) ($tenant->ai_receptionist_enabled ?? true),
                'ai_receptionist_greeting' => $tenant->ai_receptionist_greeting ?: "مرحباً بك في {$tenant->name}! 👋 أنا موظف الاستقبال الذكي، كيف يمكنني مساعدتك اليوم؟",
                'ai_receptionist_instructions' => $tenant->ai_receptionist_instructions ?: '',
                'embed_code' => $embedCode,
                'public_booking_url' => "https://psypro.tech/kiosk?clinic=" . ($tenant->subdomain ?: $tenant->id),
            ],
            'articles' => $articles,
            'total_articles' => $articles->count(),
            'total_tokens' => $articles->sum('tokens_count'),
        ]);
    }

    /**
     * Update Tenant AI Receptionist Settings.
     * POST /api/tenant/knowledge-base/settings
     */
    public function tenantUpdateSettings(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenant = Tenant::findOrFail($user->tenant_id);

        $validated = $request->validate([
            'ai_receptionist_enabled' => 'nullable|boolean',
            'ai_receptionist_greeting' => 'nullable|string|max:500',
            'ai_receptionist_instructions' => 'nullable|string|max:2000',
        ]);

        $tenant->update([
            'ai_receptionist_enabled' => (bool) ($validated['ai_receptionist_enabled'] ?? true),
            'ai_receptionist_greeting' => $validated['ai_receptionist_greeting'] ?? null,
            'ai_receptionist_instructions' => $validated['ai_receptionist_instructions'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث إعدادات موظف الاستقبال الذكي للعيادة بنجاح.',
            'tenant' => $tenant,
        ]);
    }

    /**
     * Delete a knowledge base article for current tenant.
     * DELETE /api/tenant/knowledge-base/{id}
     */
    public function tenantDeleteArticle(string $id): JsonResponse
    {
        $user = Auth::user();
        $article = KnowledgeBaseArticle::where('id', $id)
            ->where('clinic_id', $user->tenant_id)
            ->firstOrFail();

        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الصفحة من قاعدة معرفة العيادة بنجاح.',
        ]);
    }

    // ==========================================
    // 2. PUBLIC MULTI-TENANT AI RECEPTIONIST CHAT
    // ==========================================

    /**
     * Public AI Support & Receptionist Chat Endpoint.
     * POST /api/public/support/chat
     */
    public function publicChat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'required|string|min:2|max:1000',
            'session_id' => 'nullable|string|max:100',
            'clinic_slug_or_id' => 'nullable|string|max:100',
        ]);

        $question = trim($validated['question']);
        $sessionId = $validated['session_id'] ?: ('sess_pub_' . Str::random(16));
        $clinicIdentifier = $validated['clinic_slug_or_id'] ?? null;

        // Resolve Tenant
        $tenant = null;
        if ($clinicIdentifier) {
            $tenant = Tenant::where('id', $clinicIdentifier)
                ->orWhere('subdomain', $clinicIdentifier)
                ->orWhere('custom_domain', $clinicIdentifier)
                ->first();
        }

        // Record User Message in DB
        try {
            SupportConversation::create([
                'clinic_id' => $tenant?->id,
                'session_id' => $sessionId,
                'role' => 'user',
                'message' => $question,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Public chat log error: ' . $e->getMessage());
        }

        // Search scoped knowledge base
        $articlesQuery = KnowledgeBaseArticle::query();
        if ($tenant) {
            $articlesQuery->where('clinic_id', $tenant->id);
        } else {
            $articlesQuery->whereNull('clinic_id');
        }

        $keywords = array_filter(explode(' ', $question), fn($w) => mb_strlen($w) >= 3);
        if (!empty($keywords)) {
            $articlesQuery->where(function ($q) use ($keywords) {
                foreach (array_slice($keywords, 0, 5) as $kw) {
                    $q->orWhere('title', 'like', "%{$kw}%")
                      ->orWhere('content', 'like', "%{$kw}%");
                }
            });
        }

        $matched = $articlesQuery->limit(4)->get();
        if ($matched->isEmpty() && $tenant) {
            $matched = KnowledgeBaseArticle::where('clinic_id', $tenant->id)->latest()->limit(3)->get();
        }
        if ($matched->isEmpty() && !$tenant) {
            $matched = KnowledgeBaseArticle::whereNull('clinic_id')->latest()->limit(3)->get();
        }

        $sources = [];
        $contextChunks = [];
        foreach ($matched as $art) {
            $sources[] = [
                'title' => $art->title ?: 'وثيقة العيادة',
                'url' => $art->source_url,
            ];
            $contextChunks[] = "### " . $art->title . "\n" . Str::limit($art->content, 2000);
        }

        if ($tenant) {
            // Clinic AI Receptionist Persona
            $clinicName = $tenant->name;
            $greeting = $tenant->ai_receptionist_greeting ?: "مرحباً بكم في {$clinicName}!";
            $customInstructions = $tenant->ai_receptionist_instructions ?: 'الرد بلباقة حول الخدمات وأوقات العمل وتوجيه الزوار لحجز موعد.';
            $bookingUrl = "https://psypro.tech/kiosk?clinic=" . ($tenant->subdomain ?: $tenant->id);

            $systemPrompt = <<<PROMPT
أنت موظف الاستقبال والرد الذكي الرسمي لعيادة "{$clinicName}".
مهمتك: الترحيب بالزوار والأولياء، وتقديم إجابات واضحة وودودة حول تخصصات العيادة، مواعيد العمل، الخدمات، وكيفية حجز المواعيد.

توجيهات الإدارة:
- رسالة الترحيب: {$greeting}
- تعليمات خاصة: {$customInstructions}
- رابط حجز المواعيد: {$bookingUrl}

قواعد صارمة:
1. أجب بلباقة ولغة عربية جميلة ومريحة.
2. اعتمد على وثائق العيادة المرفقة أدناه. إذا كان السؤال عن الأسعار أو الحالات غير المذكورة، اطلب من العميل ترك رسالة أو التواصل مع إدارة العيادة.
3. شجع العميل على حجز موعد عبر الرابط أو الهاتف عند طلب الاستشارة.

وثائق ومعلومات عيادة {$clinicName}:
PROMPT;
        } else {
            // Global Platform Persona
            $systemPrompt = <<<PROMPT
أنت المساعد الذكي للدعم الفني لمنصة "PsyPro" لإدارة العيادات والذكاء الاصطناعي السريري.
أجب بدقة وموضوعية على أسئلة الأخصائيين بناءً على وثائق المنصة المرفقة أدناه.
PROMPT;
        }

        $fullContext = implode("\n\n---\n\n", $contextChunks);
        if (empty($fullContext)) {
            $fullContext = "العيادة تقدم خدمات التقييم والتشخيص والتأهيل الأرطوفوني والنفسي. يمكنكم حجز موعد مباشرة عبر المنصة.";
        }

        $systemPrompt .= "\n\n" . $fullContext;
        $userPrompt = "سؤال الزائر:\n{$question}";

        $result = $this->aiGateway->generate('receptionist_chat', $userPrompt, $systemPrompt, $tenant, null, [
            'temperature' => 0.3,
            'max_tokens' => 1200,
        ]);

        $answer = $result['content'] ?? 'مرحباً بك، نسعد بخدمتك دائماً. يرجى إعادة طرح سؤالك أو التواصل المباشر مع العيادة.';

        // Record Assistant Response
        try {
            SupportConversation::create([
                'clinic_id' => $tenant?->id,
                'session_id' => $sessionId,
                'role' => 'assistant',
                'message' => $answer,
                'sources' => $sources,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Public chat log assistant error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'answer' => $answer,
            'sources' => $sources,
            'session_id' => $sessionId,
            'clinic' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
            ] : null,
        ]);
    }

    // ==========================================
    // 3. GLOBAL PLATFORM CRAWLER & RAG
    // ==========================================

    /**
     * Crawl global URL for platform admin.
     * POST /api/support/crawl-url
     */
    public function crawlUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => 'required|url|max:500',
        ]);

        return $this->performCrawlAndStore($validated['url'], null);
    }

    public function getArticles(Request $request): JsonResponse
    {
        $articles = KnowledgeBaseArticle::whereNull('clinic_id')
            ->orderBy('last_crawled_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'articles' => $articles,
            'total_articles' => $articles->count(),
            'total_tokens' => $articles->sum('tokens_count'),
        ]);
    }

    public function deleteArticle(string $id): JsonResponse
    {
        $article = KnowledgeBaseArticle::whereNull('clinic_id')->where('id', $id)->firstOrFail();
        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الصفحة من قاعدة المعرفة العامة بنجاح.',
        ]);
    }

    public function ask(Request $request): JsonResponse
    {
        return $this->publicChat($request);
    }

    // ==========================================
    // 4. EMBEDDABLE JAVASCRIPT WIDGET (VANILLA JS)
    // ==========================================

    /**
     * Serve Standalone Embeddable Script for External Clinic Websites.
     * GET /embed/support-widget.js
     */
    public function serveEmbedScript(): Response
    {
        $js = <<<'JAVASCRIPT'
(function() {
  var scriptTag = document.currentScript || document.querySelector('script[src*="support-widget.js"]');
  var clinicSlug = scriptTag ? scriptTag.getAttribute('data-clinic') : '';
  var apiUrl = 'https://psypro.tech/api/public/support/chat';

  var container = document.createElement('div');
  container.id = 'psypro-ai-receptionist-root';
  container.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:999999;font-family:system-ui,-apple-system,sans-serif;direction:rtl;';

  var button = document.createElement('button');
  button.innerHTML = '🤖 <span style="margin-right:6px;font-weight:bold;font-size:13px;">مساعد الاستقبال الذكي</span>';
  button.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;border-radius:50px;padding:12px 20px;font-size:14px;cursor:pointer;box-shadow:0 10px 25px rgba(124,58,237,0.4);display:flex;align-items:center;transition:all 0.3s;';
  
  var chatBox = document.createElement('div');
  chatBox.style.cssText = 'display:none;width:360px;height:520px;background:#0f172a;border:1px solid #334155;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,0.6);flex-direction:column;overflow:hidden;margin-bottom:12px;';

  chatBox.innerHTML = `
    <div style="background:linear-gradient(90deg,#581c87,#1e1b4b);padding:14px 16px;color:#fff;display:flex;justify-content:between;align-items:center;border-bottom:1px solid #334155;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:20px;">🤖</span>
        <div>
          <div style="font-weight:bold;font-size:13px;">موظف الاستقبال الذكي</div>
          <div style="font-size:10px;color:#cbd5e1;">الرد الآلي المباشر للعيادة</div>
        </div>
      </div>
      <button id="psypro-close-btn" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;">✕</button>
    </div>
    <div id="psypro-messages" style="flex:1;padding:14px;overflow-y:auto;font-size:12px;color:#e2e8f0;display:flex;flex-direction:column;gap:10px;">
      <div style="background:#1e293b;padding:10px 14px;border-radius:16px;border-top-right-radius:2px;max-width:85%;line-height:1.5;">
        مرحباً بك! 👋 كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن مواعيد العيادة، الخدمات المتاحة، أو حجز موعدك.
      </div>
    </div>
    <div style="padding:10px;background:#090d16;border-top:1px solid #1e293b;display:flex;gap:8px;">
      <input id="psypro-input" type="text" placeholder="اكتب استفسارك هنا..." style="flex:1;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:8px 12px;color:#fff;font-size:12px;outline:none;" />
      <button id="psypro-send-btn" style="background:#7c3aed;color:#fff;border:none;border-radius:12px;padding:8px 14px;font-size:12px;font-weight:bold;cursor:pointer;">إرسال</button>
    </div>
  `;

  container.appendChild(chatBox);
  container.appendChild(button);
  document.body.appendChild(container);

  var isOpen = false;
  button.onclick = function() {
    isOpen = !isOpen;
    chatBox.style.display = isOpen ? 'flex' : 'none';
  };

  document.getElementById('psypro-close-btn').onclick = function() {
    isOpen = false;
    chatBox.style.display = 'none';
  };

  var messagesContainer = document.getElementById('psypro-messages');
  var input = document.getElementById('psypro-input');
  var sendBtn = document.getElementById('psypro-send-btn');
  var sessionId = 'sess_embed_' + Math.random().toString(36).substring(2, 10);

  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;

    var userMsg = document.createElement('div');
    userMsg.style.cssText = 'background:#7c3aed;color:#fff;padding:10px 14px;border-radius:16px;border-top-left-radius:2px;max-width:85%;align-self:flex-start;line-height:1.5;';
    userMsg.innerText = text;
    messagesContainer.appendChild(userMsg);
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    var loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'background:#1e293b;padding:8px 12px;border-radius:12px;max-width:80%;color:#94a3b8;font-size:11px;';
    loadingMsg.innerText = 'جاري المعالجة...';
    messagesContainer.appendChild(loadingMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text, clinic_slug_or_id: clinicSlug, session_id: sessionId })
    })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      messagesContainer.removeChild(loadingMsg);
      var botMsg = document.createElement('div');
      botMsg.style.cssText = 'background:#1e293b;padding:10px 14px;border-radius:16px;border-top-right-radius:2px;max-width:85%;line-height:1.5;white-space:pre-wrap;';
      botMsg.innerText = res.answer || 'شكراً لتواصلك معنا.';
      messagesContainer.appendChild(botMsg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    })
    .catch(function() {
      messagesContainer.removeChild(loadingMsg);
      var errMsg = document.createElement('div');
      errMsg.style.cssText = 'background:#450a0a;color:#fca5a5;padding:8px 12px;border-radius:12px;';
      errMsg.innerText = 'تعذر الاتصال بالخادم.';
      messagesContainer.appendChild(errMsg);
    });
  }

  sendBtn.onclick = sendMessage;
  input.onkeydown = function(e) {
    if (e.key === 'Enter') sendMessage();
  };
})();
JAVASCRIPT;

        return response($js, 200, [
            'Content-Type' => 'application/javascript; charset=utf-8',
            'Cache-Control' => 'public, max-age=3600',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }

    /**
     * Shared Crawl Logic.
     */
    private function performCrawlAndStore(string $url, ?int $clinicId): JsonResponse
    {
        try {
            $response = Http::timeout(25)
                ->withHeaders([
                    'User-Agent' => 'PsyProKnowledgeCrawler/1.0 (+https://psypro.tech)',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ])
                ->get($url);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => "تعذر جلب محتوى الرابط (رمز الاستجابة: {$response->status()}).",
                ], 422);
            }

            $html = $response->body();

            $title = 'صفحة قاعدة المعرفة';
            if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $matches)) {
                $title = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            }

            $cleaned = preg_replace('/<(script|style|svg|nav|footer|header|noscript|iframe)[^>]*>.*?<\/\1>/is', ' ', $html);
            $cleaned = preg_replace('/<[^>]+>/', ' ', $cleaned);
            $cleaned = html_entity_decode($cleaned, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $cleaned = preg_replace('/\s+/', ' ', $cleaned);
            $cleaned = trim($cleaned);

            if (mb_strlen($cleaned) < 50) {
                return response()->json([
                    'success' => false,
                    'message' => 'لم يتم العثور على محتوى نصي كافٍ لفهرسته في هذا الرابط.',
                ], 422);
            }

            $tokensCount = (int) ceil(mb_strlen($cleaned) / 3.5);

            $article = KnowledgeBaseArticle::updateOrCreate(
                [
                    'source_url' => $url,
                    'clinic_id' => $clinicId,
                ],
                [
                    'title' => Str::limit($title, 250),
                    'content' => $cleaned,
                    'tokens_count' => $tokensCount,
                    'last_crawled_at' => now(),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'تم مسح وفهرسة محتوى الرابط بنجاح في قاعدة المعرفة!',
                'article' => $article,
            ]);

        } catch (\Throwable $e) {
            Log::error('Crawler error for URL [' . $url . ']: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء الاتصال بالرابط وفهرسته: ' . $e->getMessage(),
            ], 500);
        }
    }
}
