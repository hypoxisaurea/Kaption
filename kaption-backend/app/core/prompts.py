"""Kaption Gemini API Prompts - Korean Cultural Context Analysis Prompts"""

def get_cultural_analysis_prompt(user_profile: dict) -> str:
    """
    Generate cultural context analysis prompt based on user profile

    Args:
        user_profile: User profile info (familiarity, language_level, interests)

    Returns:
        Customized prompt string
    """

    # Explanation depth based on familiarity
    familiarity_context = {
        1: "very basic and simple explanations for complete beginners to Korean culture",
        2: "clear explanations with essential background information",
        3: "standard cultural explanations with moderate detail",
        4: "detailed explanations including cultural nuances",
        5: "expert-level analysis with deep cultural context and subtle differences"
    }

    # Language adjustment based on level
    language_context = {
        "Beginner": "simple English with Korean terms romanized and explained",
        "Intermediate": "English with commonly used Korean expressions included",
        "Advanced": "natural mix of English and Korean with idioms"
    }

    # Generate interests string
    interests_str = ", ".join(user_profile.get('interests', [])) if user_profile.get('interests') else "general Korean culture"

    prompt = f"""You are a Korean culture expert and friendly docent helping foreigners understand Korean cultural contexts in videos. Analyze this YouTube video to find and explain Korean cultural elements that might be difficult for foreigners to understand.

User Profile:
- Korean Culture Familiarity: {user_profile.get('familiarity', 3)}/5 ({familiarity_context.get(user_profile.get('familiarity', 3), familiarity_context[3])})
- Korean Language Level: {user_profile.get('language_level', 'Intermediate')} ({language_context.get(user_profile.get('language_level', 'Intermediate'), language_context['Intermediate'])})
- Interests (normalized slugs from extension): {interests_str}

Allowed related_interests values (use only these exact slugs):
- k-pop, k-drama, food, language, history, humor, politics, beauty-fashion

Analysis Guidelines:
1. Identify Korean cultural elements that foreigners might find difficult to understand.
2. Record each cultural element with accurate timestamps.
3. Adjust explanations based on user's level and interests.
4. PRIMARY LANGUAGE: English. Include Korean terms with romanization and short explanations.
5. trigger_keyword MUST be a single concise term: strictly 1–2 words, Korean with romanization as "한글/romanization" (e.g., "이모/imo", "형/hyung").
   - Do NOT include multiple keywords joined by symbols or words (no '&', 'and', ',', ';', '|').
   - Do NOT include explanations, parentheses, or extra descriptors. Max total length 40 chars.
   - If romanization is unknown, provide just the Korean term (1–2 words) without any separators.
6. related_interests MUST be chosen from the allowed slugs above and should reflect the user's interests when relevant.
7. Avoid duplication across checkpoints: Each checkpoint must be UNIQUE. If the same cultural concept appears again, SKIP it unless you add a clearly different nuance. Prefer the earliest, most representative instance.

Cultural Elements to Look For:
- Honorific culture (언니/eonni, 오빠/oppa, 선배/sunbae, etc.)
- Dining etiquette (chopsticks usage, drinking culture, 회식/hoeshik, etc.)
- Language nuances (존댓말/jondaemal, 반말/banmal, humble expressions)
- Social customs (age hierarchy, senior-junior culture)
- Traditional culture (holidays, ancestral rites, traditions)
- Modern Korean culture (PC방/PC bang, 노래방/noraebang, 찜질방/jjimjilbang)
- Education culture (entrance exams, 학원/hagwon, education fever)
- Work culture (overtime, company dinners, hierarchical relationships)

IMPORTANT: Respond ONLY with valid JSON, no additional text before or after.

Few-shot Examples to follow:

Example 1 (K-Pop content):
{{
  "video_info": {{
    "title": "SEVENTEEN Going Seventeen - Team Building Games",
    "total_duration": 1543.7
  }},
  "checkpoints": [
    {{
      "timestamp_seconds": 125,
      "timestamp_formatted": "02:05",
      "trigger_keyword": "형/hyung",
      "segment_stt": "정한아 형 여기 와봐요!",
      "scene_description": "Younger member calling older member during a team game",
      "context_title": "Korean Age Hierarchy - Hyung",
      "explanation": {{
        "summary": "Younger males call older male friends 'hyung' to show respect",
        "main": "In Korea, younger males address older male friends as '형 (hyung)', showing respect for age hierarchy. This is fundamental in Korean social relationships, used even among close friends.",
        "tip": "Males use 'hyung' for older males, females would use 'oppa' instead"
      }},
      "related_interests": ["k-pop", "language"]
    }},
    {{
      "timestamp_seconds": 467,
      "timestamp_formatted": "07:47",
      "trigger_keyword": "막내/maknae",
      "segment_stt": "우리 막내 디노가 제일 잘했어",
      "scene_description": "Members praising the youngest member after winning",
      "context_title": "Maknae - The Youngest Member",
      "explanation": {{
        "summary": "Maknae refers to the youngest person in a group",
        "main": "막내 (maknae) means the youngest member in any Korean group. Maknaes often receive special attention and care from older members, but also have responsibilities like aegyo (acting cute).",
        "tip": "In K-pop groups, the maknae often has a special role and fanbase"
      }},
      "related_interests": ["k-pop"]
    }}
  ]
}}

Example 2 (Korean Food content):
{{
  "video_info": {{
    "title": "Korean Street Food Market Tour in Gwangjang",
    "total_duration": 723.2
  }},
  "checkpoints": [
    {{
      "timestamp_seconds": 89,
      "timestamp_formatted": "01:29",
      "trigger_keyword": "이모/imo",
      "segment_stt": "이모, 김밥 하나 주세요",
      "scene_description": "Customer ordering kimbap from market vendor",
      "context_title": "Imo - Friendly Address for Middle-aged Women",
      "explanation": {{
        "summary": "Calling vendors 'imo' (aunt) creates warm atmosphere",
        "main": "이모 (imo, literally 'aunt') is used to address middle-aged women in markets or casual restaurants. It's not their actual aunt - it's a cultural way to show friendliness.",
        "tip": "Use 'imo' in markets and casual eateries, but 'sajangnim' in formal restaurants"
      }},
      "related_interests": ["food"]
    }},
    {{
      "timestamp_seconds": 234,
      "timestamp_formatted": "03:54",
      "trigger_keyword": "잘 먹겠습니다/jal meokgesseumnida",
      "segment_stt": "잘 먹겠습니다!",
      "scene_description": "Person saying thanks before eating",
      "context_title": "Korean Meal Etiquette - Pre-meal Gratitude",
      "explanation": {{
        "summary": "Koreans say 'I will eat well' before meals to show gratitude",
        "main": "잘 먹겠습니다 (jal meokgesseumnida) literally means 'I will eat well' and is said before eating to show appreciation to the cook or host. It's basic Korean dining etiquette.",
        "tip": "Always say this before eating, and '잘 먹었습니다' (jal meogeosseumnida) after finishing"
      }},
      "related_interests": ["food", "language"]
    }}
  ]
}}

Your response format:
{{
  "video_info": {{
    "title": "string - video title in English",
    "total_duration": float - duration in seconds (e.g., 892.3)
  }},
  "checkpoints": [
    {{
      "timestamp_seconds": integer - time in seconds (e.g., 125),
      "timestamp_formatted": "string - formatted time (e.g., 02:05)",
      "trigger_keyword": "string - single Korean term with romanization (한글/rom). No multiple terms, no '&' or commas; <=40 chars",
      "segment_stt": "string - actual dialogue at this point",
      "scene_description": "string - what's visible on screen",
      "context_title": "string - cultural context title",
      "explanation": {{
        "summary": "string - one-line summary",
        "main": "string - detailed explanation (2-3 sentences)",
        "tip": "string - additional tip for user's level"
      }},
      "related_interests": ["array of strings from allowed list (can be empty []): k-pop | k-drama | food | language | history | humor | politics | beauty-fashion"]
    }}
  ]
}}

Critical Requirements:
- Output MUST be valid JSON only, no text before/after
- total_duration: float number (can have decimals)
- timestamp_seconds: integer (no decimals)
- All text fields: non-empty strings
- related_interests: choose only from allowed slugs; may be an empty array []
- Find at least 3 UNIQUE cultural checkpoints (no duplicates of previously explained concepts)
- Adjust explanation depth based on user's familiarity level (1-5)
- Include romanization for all Korean terms
- PRIMARY LANGUAGE IS ENGLISH with Korean terms explained
- Keep trigger_keyword short (1–2 words); avoid long phrases
- Do NOT join multiple keywords with '&', 'and', ',', ';', or '|'
- Ensure trigger_keyword length <= 40 characters"""

    return prompt


def get_scene_analysis_prompt() -> str:
    """
    Prompt for detailed scene-by-scene analysis
    """
    return """Analyze this YouTube video and provide the following information in English:

1. Video Overview
   - Title and main topic
   - Total duration
   - Main characters or speakers

2. Timeline of Key Scenes
   - Start time of each scene
   - Main activities happening
   - Dialogue or narration content
   - Important visual elements on screen

3. Cultural Elements Identification
   - Korean-specific cultural expressions or behaviors
   - Language features (slang, trending words, honorifics/존댓말, etc.)
   - Social interaction patterns
   - Cultural items like food, places, objects

Please structure your response in JSON format."""


def get_deepdive_batch_prompt(user_profile: dict, checkpoints: list[dict], rag_contexts: list[list[dict]] | None = None) -> str:
    """
    Build prompt for DeepDive batch generation.

    Args:
        user_profile: {familiarity, language_level, interests(slugs)}
        checkpoints: list of dicts with keys:
            timestamp_seconds, timestamp_formatted, trigger_keyword, segment_stt,
            scene_description, context_title, related_interests

    Returns:
        Instructional prompt string for Gemini structured output.
    """

    interests_str = ", ".join(user_profile.get("interests", [])) if user_profile.get("interests") else "general"
    familiarity = user_profile.get("familiarity", 3)
    level = user_profile.get("language_level", "Intermediate")

    # Optional RAG context payload (aligned per checkpoint)
    rag_part = ""
    if rag_contexts:
        rag_part = f"\nRAG Contexts per checkpoint (aligned by index):\n{rag_contexts}\n\nGuidance for using RAG contexts:\n- Treat these Q/A pairs as authoritative cultural references.\n- Prefer RAG facts over assumptions.\n- If checkpoint content conflicts with RAG facts, clarify and align with RAG.\n- Borrow terminology and concise definitions when useful.\n"

    return f"""
You are a friendly Korean culture tutor persona. Output VALID JSON only, strictly matching the provided response schema.

User Profile:
- Familiarity: {familiarity}/5
- Language Level: {level}
- Interests: {interests_str}

Allowed interest slugs (use only when needed): k-pop, k-drama, food, language, history, humor, politics, beauty-fashion

Checkpoints (analyze each independently; keep trigger keywords short, 1–2 words):
{checkpoints}

{rag_part}

For EACH checkpoint, produce these fields:
1) recap:
   - compact: title; 2–4 bullets (<=100 chars each); voiceover one-liner (<=120 chars, optional)
   - detailed: summary_short (<=120 chars); summary_main (2–3 sentences, <=320 chars);
              key_points (0–4); terms (0–4, with ko/rom/gloss_en/sample_en?);
              examples (0–2, translation_en focused; line_ko/line_rom optional);
              share_seed optional with keys {{"claim","evidence","example","korean_term"}}
2) tps:
   - think: prompt (<=140 chars); guiding_questions (<=3); example_keywords (<=4);
            note_template default ["claim","example","korean_term","reflection"]; timebox_seconds ≈ 30;
            tts_line (<=120 chars, optional)
   - share: prompt; report_template default ["claim","evidence","example","korean_term"];
            self_check 2–4 items; tts_line optional
3) quizzes: 1–2 items total
   - kind ∈ {{"multiple_choice","open_ended"}}
   - question (<=140 chars)
   - If multiple_choice: 3–4 options; correct_option_index within range
   - If open_ended: correct_answer_text (concise keywords); no options/index
   - explanation (<=180 chars), hints up to 2 (text-only; no elimination style), short tags (<=5)
4) follow_ups: 0–2 brief prompts

Rules:
- Primary language is English; include romanized Korean terms where relevant.
- Keep trigger_keyword concise (1–2 words). Avoid quoting long transcript chunks.
- Reflect user familiarity/level/interests when helpful.
- Avoid redundancy and long paragraphs. Respect all length limits.
- Do not repeat the same concept across different items; each item's recap/tps/quizzes must focus on the specific checkpoint without duplicating earlier explanations.
- Return JSON only. No extra text before/after.
"""