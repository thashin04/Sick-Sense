import os
from google.cloud import texttospeech

def synthesize_speech(text, voice_name="en-US-Neural2-F"):
    """
    Synthesizes speech from text using Google Cloud Text-to-Speech Client Library.
    """
    try:
        # Find the backend directory relative to this file
        # This file is at backend/services/tts.py, so parent of parent is backend/
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        creds_filename = "absolute-dahlia-483917-r0-1192f636e3a6.json"
        
        # Check in backend root, then check project root
        creds_path = os.path.join(backend_dir, creds_filename)
        
        if not os.path.exists(creds_path):
            # Try project root
            creds_path = os.path.join(backend_dir, "..", creds_filename)
        
        if not os.path.exists(creds_path):
            raise FileNotFoundError(f"Service account key not found at: {creds_path}")

        print(f"[TTS] Using credentials: {creds_path}")
        client = texttospeech.TextToSpeechClient.from_service_account_json(creds_path)

        input_text = texttospeech.SynthesisInput(text=text)

        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name=voice_name
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            pitch=0,
            speaking_rate=1.0
        )

        response = client.synthesize_speech(
            request={"input": input_text, "voice": voice, "audio_config": audio_config}
        )

        return response.audio_content
    except Exception as e:
        print(f"[TTS] Synthesis failed: {str(e)}")
        raise e
