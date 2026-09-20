<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\ChatbotKnowledge;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    use ApiResponse;

    /**
     * Handle incoming citizen queries using Groq AI + Ordinance Grounding.
     */
    public function ask(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $userQuery = trim($request->input('message'));
        $lowercaseQuery = strtolower($userQuery);

        // 1. Extract words from user query for smart scoring
        preg_match_all('/\b[a-z0-9_]{3,}\b/i', $lowercaseQuery, $matches);
        $words = array_unique(array_map('strtolower', $matches[0] ?? []));

        // 2. Fetch all active chatbot knowledge items and rank by match score
        $allItems = ChatbotKnowledge::where('is_active', true)->get();

        $scoredItems = $allItems->map(function ($item) use ($words, $lowercaseQuery) {
            $score = 0;
            $itemKeywords = strtolower(($item->keywords ?? '') . ' ' . ($item->title ?? '') . ' ' . ($item->category ?? ''));
            $itemContent = strtolower($item->content ?? '');

            // Sentence match bonus
            if (!empty($lowercaseQuery) && (str_contains($itemKeywords, $lowercaseQuery) || str_contains($itemContent, $lowercaseQuery))) {
                $score += 20;
            }

            foreach ($words as $word) {
                if (in_array($word, ['the', 'and', 'for', 'ang', 'mga', 'nga', 'pag', 'ung', 'kay'])) {
                    continue;
                }
                if (str_contains($itemKeywords, $word)) {
                    $score += 5;
                }
                if (str_contains($itemContent, $word)) {
                    $score += 2;
                }
            }

            $item->match_score = $score;
            return $item;
        })->sortByDesc('match_score')->values();

        $exactKnowledge = ($scoredItems->first() && $scoredItems->first()->match_score > 0) 
            ? $scoredItems->first() 
            : null;

        $contextItems = $scoredItems->filter(fn($item) => $item->match_score > 0)->take(5);
        if ($contextItems->isEmpty()) {
            $contextItems = $allItems->take(6);
        }

        $contextText = $contextItems->map(fn($item) => 
            "[{$item->ordinance_ref}] {$item->title}:\n{$item->content}"
        )->implode("\n\n");

        // 3. System Prompt with strict TMU Ordinance Grounding
        $systemPrompt = <<<EOT
You are the official TMU (Traffic Management Unit) AI Assistant for the e-Reklamo platform of Roxas City.
Your goal is to answer citizen questions regarding motorized tricycle fares, traffic rules, discounts, dress code, towing, and fines based STRICTLY on the official Ordinance context below.

RULES:
1. ONLY state rules, fare rates, and fines explicitly contained in the Ordinance Context below.
2. For overcharging fines, explicitly state the official penalties from Section 5:
   - 1st Offense: ₱1,500.00 fine
   - 2nd Offense: ₱3,000.00 fine
   - 3rd Offense: ₱5,000.00 fine
   - 4th & Succeeding Offenses: Suspension of Franchise for 3 months
3. For fare rates: ₱15.00 for the first 2km, plus ₱5.00 for every additional kilometer. For Senior Citizens, Students, and PWDs: ₱10.00 for the first 2km, plus ₱5.00 for every additional kilometer. Children 3ft & below on lap are FREE.
4. If the answer is NOT present in the Ordinance Context, state clearly: "I cannot find this specific rule in our current ordinance database. Please visit or call the TMU Help Desk at City Hall."
5. Be helpful, concise, polite, and respond in Tagalog or English.

OFFICIAL ORDINANCE CONTEXT:
{$contextText}
EOT;

        // 4. Call Groq API if API key is provided
        $groqApiKey = env('GROQ_API_KEY');
        $aiReply = null;

        if ($groqApiKey) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $groqApiKey,
                    'Content-Type' => 'application/json',
                ])->timeout(10)->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.1-8b-instant',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userQuery],
                    ],
                    'temperature' => 0.1,
                    'max_tokens' => 500,
                ]);

                if ($response->successful()) {
                    $aiReply = $response->json('choices.0.message.content');
                } else {
                    Log::error('Groq API Error: ' . $response->body());
                }
            } catch (\Exception $e) {
                Log::error('Groq API Exception: ' . $e->getMessage());
            }
        }

        // Fallback reply if Groq API key is unconfigured or call fails
        if (!$aiReply) {
            if ($exactKnowledge) {
                $aiReply = "According to {$exactKnowledge->ordinance_ref} ({$exactKnowledge->title}):\n{$exactKnowledge->content}";
            } else {
                $aiReply = "According to Roxas City Ordinance No. 024-2024 (Section 5): Overcharging is penalized with a ₱1,500.00 fine for 1st offense, ₱3,000.00 for 2nd offense, ₱5,000.00 for 3rd offense, and 3-month Franchise Suspension for 4th offense. Standard tricycle fare is ₱15.00 for the first 2km (₱10.00 for Senior/Student/PWD).";
            }
        }

        return $this->success('Query processed successfully', [
            'reply' => $aiReply,
            'card' => $exactKnowledge ? [
                'title' => $exactKnowledge->title,
                'ordinance_ref' => $exactKnowledge->ordinance_ref,
                'content' => $exactKnowledge->content,
                'fine_amount' => $exactKnowledge->fine_amount,
            ] : null,
            'references' => $contextItems->pluck('ordinance_ref')->unique()->values(),
        ]);
    }

    /**
     * Get list of ordinance knowledge entries for reference or quick options.
     */
    public function knowledgeBase()
    {
        $items = ChatbotKnowledge::where('is_active', true)
            ->select('id', 'title', 'category', 'keywords', 'ordinance_ref', 'fine_amount')
            ->get();

        return $this->success('Knowledge base items retrieved', $items);
    }
}
