import os
import sys

# Add the root directory to the path so we can import backend properly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

try:
    from backend.services.tts import synthesize_speech
    
    print("--- TTS DIAGNOSTIC TEST (SERVICE ACCOUNT) ---")
    creds_filename = "absolute-dahlia-483917-r0-1192f636e3a6.json"
    print(f"Using credentials file: {creds_filename}")
    
    # Try a simple synthesis
    audio = synthesize_speech("Hello! This is the premium Neural voice model powered by the absolute-dahlia service account.")
    
    output_path = os.path.join(os.path.dirname(__file__), "premium_test.mp3")
    with open(output_path, "wb") as f:
        f.write(audio)
        
    print(f"SUCCESS! Premium audio saved to: {output_path}")
    print(f"Size: {len(audio)} bytes")
    
except Exception as e:
    print("\n" + "="*50)
    print("SYNTHESIS FAILED")
    print("Reason:", str(e))
    print("="*50 + "\n")
