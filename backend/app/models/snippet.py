from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator, PlainSerializer

# MongoDB ObjectId serializer helper for Pydantic v2
PyObjectId = Annotated[
    str,
    BeforeValidator(str),
    PlainSerializer(lambda x: str(x), return_type=str),
]

class SnippetBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    language: str = Field(..., min_length=1, max_length=50)
    code: str = Field(..., min_length=1)

class SnippetCreate(SnippetBase):
    pass

class SnippetUpdate(BaseModel):
    title: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None

class SnippetResponse(SnippetBase):
    id: PyObjectId = Field(..., alias="_id")
    userId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "603d2b2f2f11181818181819",
                "userId": "603d2b2f2f11181818181817",
                "title": "Quicksort Algorithm",
                "language": "python",
                "code": "def quicksort(arr):\n    ...",
                "createdAt": "2026-06-21T21:10:55Z"
            }
        }
    }
