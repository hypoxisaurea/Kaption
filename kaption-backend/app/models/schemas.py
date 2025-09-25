"""Kaption API Schemas - User Profile and Cultural Context Analysis Models"""

from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """User profile information"""
    familiarity: int = Field(..., ge=1, le=5, description="Korean culture familiarity level (1-5)")
    language_level: Literal["Beginner", "Intermediate", "Advanced"] = Field(
        ..., description="Korean language proficiency level"
    )
    interests: List[str] = Field(
        default_factory=list,
        description="User interests list (e.g., K-Food, K-Pop, Korean History, K-Drama, Traditional Culture)"
    )


class AnalyzeRequest(BaseModel):
    """Video analysis request model"""
    youtube_url: str = Field(..., description="YouTube video URL to analyze")
    user_profile: UserProfile = Field(..., description="User profile information")


class Explanation(BaseModel):
    """Cultural context explanation"""
    summary: str = Field(..., description="One-line summary in English")
    main: str = Field(..., description="Detailed explanation tailored to user level (English with Korean terms)")
    tip: str = Field(..., description="Additional tips based on language level/familiarity")


DeepDiveType = Literal[
    "cultural_etiquette",
    "social_situation",
    "language_practice",
    "food_culture",
    "pop_culture",
    "traditional_culture",
]


class DeepDive(BaseModel):
    """Additional interactive learning/tutoring metadata for a checkpoint"""
    type: DeepDiveType = Field(..., description="Predefined deep dive category")
    reason: str = Field(..., description="Why this deep dive category was selected")


class CulturalCheckpoint(BaseModel):
    """Cultural/linguistic context checkpoint"""
    timestamp_seconds: int = Field(..., description="Scene timestamp in seconds")
    timestamp_formatted: str = Field(..., description="Formatted timestamp (e.g., 00:02:05)")
    trigger_keyword: str = Field(..., description="Key Korean word/expression that triggered explanation")
    segment_stt: str = Field(..., description="Speech-to-text transcription at this timestamp")
    scene_description: str = Field(..., description="Description of the scene in English")
    context_title: str = Field(..., description="Cultural context title in English")
    explanation: Explanation = Field(..., description="User-tailored explanation")
    related_interests: List[str] = Field(
        default_factory=list,
        description="Related user interests for this context"
    )


class CheckpointRef(BaseModel):
    """Minimal reference to the originating checkpoint"""
    timestamp_seconds: int
    timestamp_formatted: str
    trigger_keyword: str
    context_title: str
    checkpoint_uid: Optional[str] = None


class DeepDiveSection(BaseModel):
    heading: str
    detail: str


class ExerciseItem(BaseModel):
    # Quiz-style
    question: Optional[str] = None
    options: Optional[List[str]] = None
    answer: Optional[str] = None
    explanation: Optional[str] = None
    # Roleplay/social scenarios
    scenario: Optional[str] = None
    dialogue: Optional[List[str]] = None
    tips: Optional[List[str]] = None
    # Practice/language
    pattern: Optional[str] = None
    examples: Optional[List[str]] = None
    task: Optional[str] = None


class DeepDiveExercise(BaseModel):
    kind: Literal["quiz", "roleplay", "practice"]
    prompt: str
    items: List[ExerciseItem] = Field(default_factory=list)


class DeepDiveGenerateRequest(BaseModel):
    checkpoint: CulturalCheckpoint
    user_profile: UserProfile


class DeepDiveGenerateResponse(BaseModel):
    type: DeepDiveType
    checkpoint: CheckpointRef
    title: str
    summary: str
    learning_objectives: List[str] = Field(default_factory=list)
    sections: List[DeepDiveSection] = Field(default_factory=list)
    exercises: List[DeepDiveExercise] = Field(default_factory=list)
    resources: List[str] = Field(default_factory=list)


class VideoInfo(BaseModel):
    """Video basic information"""
    title: str = Field(..., description="Video title in English")
    total_duration: float = Field(..., description="Total duration in seconds")


class AnalyzeResponse(BaseModel):
    """Video analysis response model"""
    video_info: VideoInfo = Field(..., description="Video basic information")
    checkpoints: List[CulturalCheckpoint] = Field(
        default_factory=list,
        description="List of cultural/linguistic context checkpoints"
    )
    analysis_id: Optional[str] = Field(None, description="Analysis ID")
    status: str = Field("success", description="Analysis status")
    error: Optional[str] = Field(None, description="Error message if any")


# ==========================
# DeepDive Batch (Recap/TPS/Quiz)
# ==========================

class RecapCompact(BaseModel):
    title: str
    bullets: List[str] = Field(..., min_items=2, max_items=4, description="2–4 compact recap bullets")
    voiceover: Optional[str] = Field(None, description="One-line TTS friendly voiceover (<=120 chars)")


class RecapTerm(BaseModel):
    term_ko: str
    term_rom: str
    gloss_en: str
    sample_en: Optional[str] = None


class RecapExample(BaseModel):
    scene: str
    translation_en: str
    line_ko: Optional[str] = None
    line_rom: Optional[str] = None


class RecapDetailed(BaseModel):
    summary_short: str
    summary_main: str
    key_points: List[str] = Field(default_factory=list)
    terms: Optional[List[RecapTerm]] = None
    examples: Optional[List[RecapExample]] = None
    share_seed: Optional[Dict[str, str]] = None  # {"claim","evidence","example","korean_term"}


class Recap(BaseModel):
    compact: RecapCompact
    detailed: RecapDetailed


class TPSThink(BaseModel):
    prompt: str
    guiding_questions: List[str] = Field(default_factory=list)
    example_keywords: List[str] = Field(default_factory=list)
    note_template: List[str] = Field(default_factory=lambda: [
        "claim", "example", "korean_term", "reflection"
    ])
    timebox_seconds: int = Field(default=30, ge=10, le=120)
    tts_line: Optional[str] = None


class TPSShare(BaseModel):
    prompt: str
    report_template: List[str] = Field(default_factory=lambda: [
        "claim", "evidence", "example", "korean_term"
    ])
    self_check: List[str] = Field(default_factory=lambda: [
        "한국어 용어 정확?", "근거 구체적?"
    ])
    tts_line: Optional[str] = None


class TPSActivity(BaseModel):
    think: TPSThink
    share: TPSShare


class QuizOption(BaseModel):
    text: str


class QuizItem(BaseModel):
    kind: Literal["multiple_choice", "open_ended"]
    question: str
    options: Optional[List[QuizOption]] = None  # MCQ: 3–4 options
    correct_option_index: Optional[int] = None  # MCQ required
    correct_answer_text: Optional[str] = None   # Open-ended required
    explanation: str
    hints: List[str] = Field(default_factory=list)  # up to 2
    tags: List[str] = Field(default_factory=list)


class DeepDiveItem(BaseModel):
    checkpoint: CheckpointRef
    recap: Recap
    tps: TPSActivity
    quizzes: List[QuizItem] = Field(..., min_items=1, max_items=2)
    follow_ups: List[str] = Field(default_factory=list)


class DeepDiveBatchRequest(BaseModel):
    user_profile: UserProfile
    checkpoints: List[CulturalCheckpoint] = Field(..., min_items=1, max_items=10)


class DeepDiveBatchResponse(BaseModel):
    items: List[DeepDiveItem]