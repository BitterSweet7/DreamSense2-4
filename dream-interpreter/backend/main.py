from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import os
import logging
from typing import Optional, List, Dict
import pandas as pd
from rag_utils import DreamDictionaryRAG

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Dream Interpreter API")

# Configure CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the RAG system
dream_dictionary_path = os.path.join(os.path.dirname(__file__), "data", "dream_dictionary_ready2.csv")
try:
    rag_system = DreamDictionaryRAG(dream_dictionary_path)
    logger.info("RAG system initialized successfully")
except Exception as e:
    logger.error(f"Error initializing RAG system: {e}")
    rag_system = None

# Initialize the model
try:
    # Using a smaller model for quick responses
    # You can replace this with a larger model if needed
    model = pipeline(
        "text-generation",
        model="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        max_length=800
    )
    logger.info("LLM initialized successfully")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    model = None

class DreamRequest(BaseModel):
    dream_text: str

class DreamSymbol(BaseModel):
    term: str
    details: str
    score: float

class DreamResponse(BaseModel):
    interpretation: str
    symbols: List[DreamSymbol] = []
    error: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Welcome to the Dream Interpreter API"}

@app.post("/interpret")
async def interpret_dream(dream_request: DreamRequest):
    """Endpoint to interpret dreams using the LLM with RAG."""
    try:
        if not model:
            raise HTTPException(status_code=500, detail="Model not initialized")
        
        dream_text = dream_request.dream_text
        logger.info(f"Received dream: {dream_text[:50]}...")
        
        # Get relevant context from the dream dictionary
        if rag_system:
            context, relevant_entries = rag_system.generate_context(dream_text)
            logger.info(f"Found {len(relevant_entries)} relevant entries")
            for entry in relevant_entries[:3]:
                logger.info(f"Top entry: {entry['term']} (score: {entry['score']:.2f})")
        else:
            context = "No dream dictionary available."
            relevant_entries = []
        
        # Create a prompt with the context
        prompt = f"""<|system|>
You are DreamSense, a warm and empathetic dream interpreter with expertise in dream symbolism and psychology.
Your task is to interpret dreams based STRICTLY on the provided dream dictionary references.
DO NOT make up interpretations - rely ONLY on the provided references.

IMPORTANT: Your interpretation MUST be based on the dream dictionary references. If no relevant references are found, acknowledge this and provide only general supportive comments.

{context}

Dream: {dream_text}

"""
        
        try:
            # Generate the interpretation using the model
            logger.info(f"Generating interpretation with model...")
            result = model(prompt, max_length=800, num_return_sequences=1)[0]['generated_text']
            
            # Extract the interpretation part (everything after the prompt)
            prompt_end = f"Dream: {dream_text}"
            if prompt_end in result:
                interpretation = result.split(prompt_end)[1].strip()
            else:
                # If we can't find the exact prompt, just take everything after the system prompt
                system_end = "<|system|>"
                if system_end in result:
                    interpretation = result.split(system_end)[1].strip()
                else:
                    interpretation = result
            
            logger.info(f"Generated interpretation: {interpretation[:100]}...")
            
            # Convert relevant entries to DreamSymbol objects
            symbols = []
            for entry in relevant_entries:
                symbols.append(DreamSymbol(
                    term=entry["term"],
                    details=entry["details"][:100] + "..." if len(entry["details"]) > 100 else entry["details"],
                    score=float(entry["score"])
                ))
            
            return DreamResponse(interpretation=interpretation, symbols=symbols)
        except Exception as e:
            logger.error(f"Error generating interpretation: {e}")
            return DreamResponse(interpretation="I apologize, but I'm having trouble interpreting your dream right now. Please try again in a moment.", symbols=[])
    except Exception as e:
        logger.error(f"Error interpreting dream: {str(e)}")
        return DreamResponse(interpretation="I'm having trouble interpreting your dream right now. Please try again later.", error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
