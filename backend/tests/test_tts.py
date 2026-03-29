import os
import sys
from dotenv import load_dotenv

# Add parent directory to path so we can import backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.tts import synthesize_speech

def test_tts():
    # Load environment variables from .env
    load_dotenv()
    
    test_text = "Hi there! This is a test of the SickSense high-quality voice system."
    
    print("--- Starting TTS Test ---")
    try:
        audio_content = synthesize_speech(test_text)
        
        # Save the result to a file for manual verification
        output_file = "test_output.mp3"
        with open(output_file, "wb") as f:
            f.write(audio_content)
        
        print(f"SUCCESS: Audio synthesized and saved to {output_file}")
        print(f"Audio size: {len(audio_content)} bytes")
        
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_tts()
