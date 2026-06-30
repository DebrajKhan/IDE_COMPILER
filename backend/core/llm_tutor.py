import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

def get_tutor_response(code: str, language: str, error_message: str = None) -> dict:
    """
    Analyzes the provided code and error using the Gemini API.
    Returns a pedagogical hint using the Socratic method, or congratulates on success.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        print("Warning: GEMINI_API_KEY not found in environment. Using fallback mock response.")
        if error_message:
            return {
                "message": f"I see an error: {error_message.splitlines()[-1] if error_message.splitlines() else 'Unknown error'}. Please configure the Gemini API key for smarter hints!",
                "emotion": "encouraging"
            }
        else:
            return {
                "message": "Great job! Your code ran perfectly! Configure the Gemini API key for dynamic AI responses.",
                "emotion": "celebrating"
            }

    try:
        client = genai.Client(api_key=api_key)
        
        system_prompt = (
            "You are an empathetic, encouraging coding tutor. "
            "If the user has an error, guide them to the solution using the Socratic method (asking guiding questions). "
            "If they have no error, congratulate them enthusiastically for writing perfect code! "
            "DO NOT write the corrected code for them. Keep your response brief, max 2-3 sentences. "
            "Always respond with a JSON object containing exactly two keys: "
            "'message' (your hint/question/congratulations) and 'emotion' (one of: 'encouraging', 'thinking', 'celebrating', 'neutral')."
        )
        
        if error_message:
            user_prompt = f"Language: {language}\n\nCode:\n{code}\n\nError:\n{error_message}"
        else:
            user_prompt = f"Language: {language}\n\nCode:\n{code}\n\nResult: Success! Code ran perfectly without errors."
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
            ),
        )
        
        # Parse the JSON response
        result = json.loads(response.text)
        return {
            "message": result.get("message", "Hmm, let's think about this error."),
            "emotion": result.get("emotion", "thinking")
        }
        
    except Exception as e:
        print(f"LLM API Error: {e}")
        return {
            "message": "I'm having trouble analyzing your code right now. Could you double-check the syntax?",
            "emotion": "thinking"
        }
