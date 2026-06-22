import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
from bson import ObjectId
from app.core.database import get_collection
from app.routes.auth import get_current_user
from app.services.gemini import gemini_service
from app.models.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/api", tags=["AI Services"])
logger = logging.getLogger("codementor.routes.services")

# Request schemas for AI Tasks
class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    language: Optional[str] = "python"

class CodeTaskRequest(BaseModel):
    code: str = Field(..., min_length=1)
    language: Optional[str] = "python"

@router.post("/generate-code")
async def generate_code(request: GenerateRequest, current_user: dict = Depends(get_current_user)):
    """Generate source code based on a natural language prompt."""
    system_instruction = """You are CodeMentor AI, an expert programmer. Generate clean, efficient, and well-structured code.
Always output:
1. The source code inside a markdown code block with language indicator.
2. A brief, professional explanation of the solution.
3. Time Complexity and Space Complexity analysis (Big O notation).
4. Best practices, optimization suggestions, or potential caveats.
"""
    prompt = f"Generate {request.language} code for the following requirement: {request.prompt}"
    
    async def sse_generator():
        async for chunk in gemini_service.run_single_prompt(system_instruction, prompt):
            yield chunk

    return EventSourceResponse(sse_generator())

@router.post("/explain-code")
async def explain_code(request: CodeTaskRequest, current_user: dict = Depends(get_current_user)):
    """Explain pasted source code line-by-line, highlighting logical workflow."""
    system_instruction = """You are CodeMentor AI, a computer science tutor. Explain the provided code in beginner-friendly, detailed terms.
Always output:
1. A summary of what the code does.
2. Detailed explanation of the logic and components.
3. Complexity analysis (Time and Space).
4. Line-by-line breakdown for key sections.
"""
    prompt = f"Explain this {request.language} code:\n```\n{request.code}\n```"
    
    async def sse_generator():
        async for chunk in gemini_service.run_single_prompt(system_instruction, prompt):
            yield chunk

    return EventSourceResponse(sse_generator())

@router.post("/debug-code")
async def debug_code(request: CodeTaskRequest, current_user: dict = Depends(get_current_user)):
    """Analyze code for syntax/logical errors, explain root causes, and provide fixes."""
    system_instruction = """You are CodeMentor AI, a debugging expert. Identify syntax, runtime, and logical errors.
Always output:
1. original code vs corrected code (in code blocks).
2. Analysis of the errors (root cause, explanation).
3. Line numbers or sections where issues were identified.
4. Best practices to prevent these bugs in the future.
"""
    prompt = f"Debug this {request.language} code:\n```\n{request.code}\n```"
    
    async def sse_generator():
        async for chunk in gemini_service.run_single_prompt(system_instruction, prompt):
            yield chunk

    return EventSourceResponse(sse_generator())

@router.post("/optimize-code")
async def optimize_code(request: CodeTaskRequest, current_user: dict = Depends(get_current_user)):
    """Analyze code and propose optimized, cleaner, and faster alternatives."""
    system_instruction = """You are CodeMentor AI, a performance tuning expert. Optimize code for execution speed and space efficiency.
Always output:
1. The optimized code (in code blocks).
2. Comparison of complexity: Original complexity vs Optimized complexity.
3. Detailed list of changes made and the performance justification for each.
"""
    prompt = f"Optimize this {request.language} code:\n```\n{request.code}\n```"
    
    async def sse_generator():
        async for chunk in gemini_service.run_single_prompt(system_instruction, prompt):
            yield chunk

    return EventSourceResponse(sse_generator())

@router.post("/generate-docs")
async def generate_docs(request: CodeTaskRequest, current_user: dict = Depends(get_current_user)):
    """Automatically generate docstrings, inline comments, README sections, or usage instructions."""
    system_instruction = """You are CodeMentor AI, a technical writer. Write docstrings, inline comments, and developer documentation.
Always output:
1. The documented code (containing docstrings and comments).
2. Brief README section on usage and inputs/outputs.
3. A couple of quick usage examples.
"""
    prompt = f"Generate documentation and docstrings for this {request.language} code:\n```\n{request.code}\n```"
    
    async def sse_generator():
        async for chunk in gemini_service.run_single_prompt(system_instruction, prompt):
            yield chunk

    return EventSourceResponse(sse_generator())

@router.post("/review-code", response_model=ReviewResponse)
async def review_code(request: ReviewCreate, current_user: dict = Depends(get_current_user)):
    """
    Perform a code quality audit, generate a structured report, and save the audit details to MongoDB.
    Non-streaming endpoint returning structured JSON report.
    """
    reviews_col = get_collection("reviews")
    
    # Request structured report from Gemini
    report = await gemini_service.get_structured_review(request.code, request.language)
    
    review_doc = {
        "userId": str(current_user["_id"]),
        "code": request.code,
        "language": request.language,
        "report": report,
        "createdAt": datetime.utcnow()
    }
    
    # Save review result to MongoDB
    result = await reviews_col.insert_one(review_doc)
    review_doc["_id"] = result.inserted_id
    
    return review_doc

@router.get("/reviews", response_model=List[ReviewResponse])
async def get_reviews_history(current_user: dict = Depends(get_current_user)):
    """Fetch user's previous code reviews."""
    reviews_col = get_collection("reviews")
    cursor = reviews_col.find({"userId": str(current_user["_id"])}).sort("createdAt", -1)
    
    history = []
    async for doc in cursor:
        history.append(doc)
    return history
