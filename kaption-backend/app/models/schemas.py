"""Kaption API Schemas - User Profile and Cultural Context Analysis Models"""

from typing import List, Optional, Literal
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