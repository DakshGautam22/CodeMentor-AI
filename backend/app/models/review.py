from datetime import datetime
from typing import Annotated, Dict, Any
from pydantic import BaseModel, Field, BeforeValidator, PlainSerializer

# MongoDB ObjectId serializer helper for Pydantic v2
PyObjectId = Annotated[
    str,
    BeforeValidator(str),
    PlainSerializer(lambda x: str(x), return_type=str),
]

class ReviewCreate(BaseModel):
    code: str = Field(..., min_length=1)
    language: str = Field(..., min_length=1)

class ReviewResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    userId: str
    code: str
    language: str
    report: Dict[str, Any] = Field(..., description="Structured code review report containing rating, findings, and suggestions")
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "603d2b2f2f11181818181820",
                "userId": "603d2b2f2f11181818181817",
                "code": "def process(x):\n    a = 10\n    return x*a",
                "language": "python",
                "report": {
                    "score": 75,
                    "summary": "The code is functional but simple. Variable names could be descriptive.",
                    "issues": [
                        {"type": "naming", "severity": "low", "line": 2, "description": "Variable 'a' is not descriptive."}
                    ],
                    "suggestions": "Rename 'a' to 'multiplier'."
                },
                "createdAt": "2026-06-21T21:10:55Z"
            }
        }
    }
