import os
import requests
from google.cloud import texttospeech

def synthesize_speech(text, voice_name="en-US-Neural2-F"):
    """
    Synthesizes speech from text. 
    Tries ElevenLabs first if configured, falls back to Google Cloud TTS.
    """
    # Prefer ElevenLabs if the API key is set
    eleven_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVEN_VOICE_ID", "21m00Tcm4TlvDq8ikWAM") # Default to Rachel

    if eleven_key:
        print(f"[TTS] Attempting ElevenLabs synthesis with voice: {voice_id}")
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": eleven_key
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 200:
                print(f"[TTS] Successfully synthesized audio with ElevenLabs.")
                return response.content
            else:
                print(f"[TTS] ElevenLabs failed (HTTP {response.status_code}): {response.text}. Falling back to Google...")
        except Exception as e:
            print(f"[TTS] ElevenLabs error: {e}. Falling back to Google...")

    # Fallback/Default: Google Cloud Text-to-Speech
    try:
        # Find the backend directory relative to this file
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        creds_filename = "absolute-dahlia-483917-r0-1192f636e3a6.json"
        
        # Check in backend root, then check project root
        creds_path = os.path.join(backend_dir, creds_filename)
        
        if not os.path.exists(creds_path):
            creds_path = os.path.join(backend_dir, "..", creds_filename)
        
        if not os.path.exists(creds_path):
            raise FileNotFoundError(f"Service account key not found at: {creds_path}")

        print(f"[TTS] Using Google Cloud fallback credentials: {creds_path}")
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
        print(f"[TTS] Google synthesis failed: {str(e)}")
        raise e
