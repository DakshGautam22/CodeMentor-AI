import logging
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.core.database import get_collection
from app.routes.auth import get_current_user
from app.models.snippet import SnippetCreate, SnippetResponse, SnippetUpdate

router = APIRouter(prefix="/api/snippets", tags=["Saved Snippets"])
logger = logging.getLogger("codementor.routes.snippets")

@router.post("", response_model=SnippetResponse)
async def create_snippet(snippet_data: SnippetCreate, current_user: dict = Depends(get_current_user)):
    """Save a new code snippet to MongoDB."""
    snippets_col = get_collection("snippets")
    
    doc = {
        "userId": str(current_user["_id"]),
        "title": snippet_data.title,
        "language": snippet_data.language,
        "code": snippet_data.code,
        "createdAt": datetime.utcnow()
    }
    
    result = await snippets_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return doc

@router.get("", response_model=List[SnippetResponse])
async def list_snippets(current_user: dict = Depends(get_current_user)):
    """Retrieve all saved snippets for the logged-in user."""
    snippets_col = get_collection("snippets")
    
    cursor = snippets_col.find({"userId": str(current_user["_id"])}).sort("createdAt", -1)
    snippets = []
    async for doc in cursor:
        snippets.append(doc)
        
    return snippets

@router.put("/{snippet_id}", response_model=SnippetResponse)
async def update_snippet(
    snippet_id: str,
    snippet_update: SnippetUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Modify a saved snippet's details."""
    snippets_col = get_collection("snippets")
    try:
        update_data = {k: v for k, v in snippet_update.dict(exclude_unset=True).items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No parameters provided for update.")
            
        result = await snippets_col.find_one_and_update(
            {"_id": ObjectId(snippet_id), "userId": str(current_user["_id"])},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Snippet not found.")
        return result
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request or snippet ID format.")

@router.delete("/{snippet_id}")
async def delete_snippet(snippet_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a snippet from the database."""
    snippets_col = get_collection("snippets")
    try:
        result = await snippets_col.delete_one({"_id": ObjectId(snippet_id), "userId": str(current_user["_id"])})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Snippet not found.")
        return {"detail": "Snippet deleted successfully."}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid snippet ID format.")
