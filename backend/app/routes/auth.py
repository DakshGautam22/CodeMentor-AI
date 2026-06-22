from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.core.database import get_collection
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.models.user import UserRegister, UserLogin, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to retrieve the authenticated user from the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED ,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    try:
        users_col = get_collection("users")
        user = await users_col.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise credentials_exception
        return user
    except Exception:
        raise credentials_exception

@router.post("/register")
async def register(user_data: UserRegister):
    """Register a new user, hashing their password and saving it to MongoDB."""
    users_col = get_collection("users")
    
    # Check if user already exists
    existing_user = await users_col.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )
        
    # Hash password and insert
    hashed_pwd = hash_password(user_data.password)
    user_dict = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_pwd,
        "createdAt": datetime.utcnow()
    }
    
    result = await users_col.insert_one(user_dict)
    created_user = await users_col.find_one({"_id": result.inserted_id})
    
    # Generate token
    access_token = create_access_token(data={"sub": str(created_user["_id"])})
    
    # Format response
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(created_user["_id"]),
            "name": created_user["name"],
            "email": created_user["email"],
            "createdAt": created_user["createdAt"]
        }
    }

@router.post("/login")
async def login(credentials: UserLogin):
    """Authenticate a user, returning a signed JWT access token."""
    users_col = get_collection("users")
    
    user = await users_col.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
        
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "createdAt": user["createdAt"]
        }
    }
