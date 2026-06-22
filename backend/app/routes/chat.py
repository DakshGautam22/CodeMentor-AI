import json
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sse_starlette.sse import EventSourceResponse
from bson import ObjectId
from app.core.database import get_collection
from app.routes.auth import get_current_user
from app.models.chat import Message, ChatListItem, ChatResponse, ChatUpdate
from app.services.gemini import gemini_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])
logger = logging.getLogger("codementor.routes.chat")

@router.get("/history", response_model=List[ChatListItem])
async def get_chat_history(
    current_user: dict = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search text in titles")
):
    """Retrieve the conversation list (history) for the authenticated user, sorted by recency and pinned status."""
    chats_col = get_collection("chats")
    
    query = {"userId": str(current_user["_id"])}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
        
    cursor = chats_col.find(query).sort([("isPinned", -1), ("createdAt", -1)])
    
    chat_list = []
    async for doc in cursor:
        chat_list.append({
            "_id": doc["_id"],
            "title": doc.get("title", "New Conversation"),
            "isPinned": doc.get("isPinned", False),
            "messageCount": len(doc.get("messages", [])),
            "createdAt": doc.get("createdAt", datetime.utcnow())
        })
    return chat_list

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat_detail(chat_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch details of a single chat conversation."""
    chats_col = get_collection("chats")
    try:
        chat = await chats_col.find_one({"_id": ObjectId(chat_id), "userId": str(current_user["_id"])})
        if not chat:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        return chat
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid chat ID format.")

@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(chat_id: str, chat_update: ChatUpdate, current_user: dict = Depends(get_current_user)):
    """Rename a conversation or toggle its pinned status."""
    chats_col = get_collection("chats")
    try:
        update_data = {k: v for k, v in chat_update.dict(exclude_unset=True).items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update parameters provided.")
            
        result = await chats_col.find_one_and_update(
            {"_id": ObjectId(chat_id), "userId": str(current_user["_id"])},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        return result
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request parameters.")

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a conversation from history."""
    chats_col = get_collection("chats")
    try:
        result = await chats_col.delete_one({"_id": ObjectId(chat_id), "userId": str(current_user["_id"])})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        return {"detail": "Conversation deleted successfully."}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid chat ID format.")

@router.post("/stream")
async def stream_chat_response(
    prompt: str = Query(...),
    chatId: Optional[str] = Query(None),
    systemPrompt: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Initiate a multi-turn chat stream. Returns Server-Sent Events (SSE).
    Autosaves user and assistant messages to MongoDB upon connection completion.
    """
    chats_col = get_collection("chats")
    user_id = str(current_user["_id"])
    
    # Resolve or create conversation
    active_chat_id = chatId
    chat_title = "New Conversation"
    db_messages = []
    
    if active_chat_id:
        try:
            chat_doc = await chats_col.find_one({"_id": ObjectId(active_chat_id), "userId": user_id})
            if chat_doc:
                db_messages = chat_doc.get("messages", [])
                chat_title = chat_doc.get("title", chat_title)
            else:
                active_chat_id = None  # Fallback to create a new chat
        except Exception:
            active_chat_id = None
            
    # Auto-generate title from the first prompt if it's a new chat
    if not active_chat_id:
        chat_title = prompt[:40] + ("..." if len(prompt) > 40 else "")
        new_chat_doc = {
            "userId": user_id,
            "title": chat_title,
            "messages": [],
            "isPinned": False,
            "createdAt": datetime.utcnow()
        }
        insert_res = await chats_col.insert_one(new_chat_doc)
        active_chat_id = str(insert_res.inserted_id)

    # Append new user message to local history copy for Gemini instruction
    new_user_message = {
        "role": "user",
        "content": prompt,
        "timestamp": datetime.utcnow(),
        "intent": "general",
        "language": None
    }
    
    # We pass the full history (including the new prompt) to Gemini
    gemini_history = db_messages.copy()
    gemini_history.append(new_user_message)
    
    async def event_generator():
        # First send the chat ID event so client can sync routing
        yield {
            "event": "chatId",
            "data": json.dumps({"chatId": active_chat_id, "title": chat_title})
        }
        
        full_response = ""
        try:
            async for chunk in gemini_service.stream_chat(gemini_history, systemPrompt):
                if chunk.get("event") == "message":
                    data = json.loads(chunk["data"])
                    full_response += data.get("token", "")
                yield chunk
                
        except Exception as stream_err:
            logger.error(f"Stream error: {stream_err}")
            yield {"event": "error", "data": json.dumps({"detail": str(stream_err)})}
        finally:
            # Save the final exchange (User prompt + Assistant response) to MongoDB
            if full_response:
                new_assistant_message = {
                    "role": "assistant",
                    "content": full_response,
                    "timestamp": datetime.utcnow(),
                    "intent": "general",
                    "language": None
                }
                
                await chats_col.update_one(
                    {"_id": ObjectId(active_chat_id)},
                    {"$push": {"messages": {"$each": [new_user_message, new_assistant_message]}}}
                )
                logger.info(f"Successfully saved chat exchanges to database for chatId: {active_chat_id}")

    return EventSourceResponse(event_generator())
