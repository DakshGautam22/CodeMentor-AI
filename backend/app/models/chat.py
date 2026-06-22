from datetime import datetime
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator, PlainSerializer

# MongoDB ObjectId serializer helper for Pydantic v2
PyObjectId = Annotated[
    str,
    BeforeValidator(str),
    PlainSerializer(lambda x: str(x), return_type=str),
]

class Message(BaseModel):
    role: str = Field(..., description="Either 'user' or 'assistant'")
    content: str = Field(...)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    intent: Optional[str] = Field(None, description="Detected intent: explain, debug, generate, etc.")
    language: Optional[str] = Field(None, description="Automatically detected language if code-related")

class ChatBase(BaseModel):
    title: str = Field(default="New Conversation")
    isPinned: bool = Field(default=False)

class ChatCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)

class ChatUpdate(BaseModel):
    title: Optional[str] = None
    isPinned: Optional[bool] = None

class ChatResponse(ChatBase):
    id: PyObjectId = Field(..., alias="_id")
    userId: str
    messages: List[Message] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "603d2b2f2f11181818181818",
                "userId": "603d2b2f2f11181818181817",
                "title": "Sorting Algorithms in Python",
                "isPinned": False,
                "messages": [
                    {
                        "role": "user",
                        "content": "How do I implement quicksort?",
                        "timestamp": "2026-06-21T21:10:55Z",
                        "intent": "code_generation",
                        "language": "python"
                    }
                ],
                "createdAt": "2026-06-21T21:10:55Z"
            }
        }
    }

class ChatListItem(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    title: str
    isPinned: bool
    messageCount: int
    createdAt: datetime

    model_config = {
        "populate_by_name": True
    }
