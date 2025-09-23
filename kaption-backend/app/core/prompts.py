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
- Interests: {interests_str}

Analysis Guidelines:
1. Watch the video and identify Korean cultural elements that foreigners might find difficult to understand
2. Record each cultural element with accurate timestamps
3. Adjust explanations based on user's level and interests
4. IMPORTANT: Respond in ENGLISH as the primary language, but include Korean terms with explanations

Cultural Elements to Look For:
- Honorific culture (언니/unnie, 오빠/oppa, 선배/sunbae, 이모님/imo-nim, etc.)
- Dining etiquette (chopsticks usage, drinking culture, 회식/hoeshik, etc.)
- Language nuances (존댓말/jondaemal, 반말/banmal, humble expressions)
- Social customs (age hierarchy, senior-junior culture)
- Traditional culture (holidays, ancestral rites, traditions)
- Modern Korean culture (PC방/PC bang, 노래방/noraebang, 찜질방/jjimjilbang)
- Education culture (entrance exams, 학원/hagwon, education fever)
- Work culture (overtime, company dinners, hierarchical relationships)

IMPORTANT: Respond ONLY with valid JSON, no additional text before or after. Use this exact JSON format:
{{
  "video_info": {{
    "title": "video title in English",
    "total_duration": total_duration_in_seconds
  }},
  "checkpoints": [
    {{
      "timestamp_seconds": time_in_seconds,
      "timestamp_formatted": "00:00:00",
      "trigger_keyword": "key Korean word or expression (include both Korean and romanization)",
      "segment_stt": "transcription of dialogue at this timestamp",
      "scene_description": "description of what's visible on screen in English",
      "context_title": "Cultural Context Title in English",
      "explanation": {{
        "summary": "one-line summary in English",
        "main": "detailed explanation in English tailored to user level (2-3 sentences). Include Korean terms with romanization when needed.",
        "tip": "additional tip or related info based on user's language level, in English"
      }},
      "related_interests": ["related user interests"]
    }}
  ]
}}

Important Notes:
- Find at least 3 cultural checkpoints
- For Beginner level: Focus on simple English, always provide romanization for Korean terms
- For Intermediate level: Mix English with common Korean expressions
- For Advanced level: Include more Korean terms and cultural depth
- Prioritize content related to user's interests
- Ensure timestamps are accurate
- Make explanations friendly and easy to understand
- PRIMARY LANGUAGE IS ENGLISH, but include Korean terms where culturally relevant"""

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