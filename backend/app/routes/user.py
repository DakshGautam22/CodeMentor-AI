import logging
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.core.database import get_collection
from app.core.security import hash_password
from app.routes.auth import get_current_user
from app.models.user import UserUpdate, UserResponse

router = APIRouter(prefix="/api/profile", tags=["User Profile"])
logger = logging.getLogger("codementor.routes.user")

@router.get("", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Fetch user profile details for the logged-in user."""
    return current_user

@router.put("", response_model=UserResponse)
async def update_profile(
    profile_data: UserUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update profile parameters, verifying unique email if changed, and hashing passwords if provided."""
    users_col = get_collection("users")
    user_id = current_user["_id"]
    
    update_dict = {}
    
    # Email unique constraint verification
    if profile_data.email and profile_data.email != current_user["email"]:
        existing = await users_col.find_one({"email": profile_data.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
        update_dict["email"] = profile_data.email
        
    if profile_data.name:
        update_dict["name"] = profile_data.name
        
    if profile_data.password:
        update_dict["password"] = hash_password(profile_data.password)
        
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update."
        )
        
    result = await users_col.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_dict},
        return_document=True
    )
    
    return result
