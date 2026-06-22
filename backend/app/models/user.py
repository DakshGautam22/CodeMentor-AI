from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, EmailStr, Field, BeforeValidator, PlainSerializer

# MongoDB ObjectId serializer helper for Pydantic v2
PyObjectId = Annotated[
    str,
    BeforeValidator(str),
    PlainSerializer(lambda x: str(x), return_type=str),
]

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)

class UserResponse(UserBase):
    id: PyObjectId = Field(..., alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "id": "603d2b2f2f11181818181818",
                "name": "Jane Doe",
                "email": "jane@example.com",
                "createdAt": "2026-06-21T21:10:55Z"
            }
        }
    }
