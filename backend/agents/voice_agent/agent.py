from google.adk.agents import Agent
from google.adk.agents.run_config import RunConfig, StreamingMode

root_agent = Agent(
    name="voice_agent",
    model="gemini-2.5-flash-native-audio-latest",
    description="A voice agent that briefs users on nearby illness outbreaks and prevention strategies.",
    instruction=(
        "You are the SickSense Voice Assistant. Your primary role is to brief the user "
        "on the spread of nearby illnesses based on the text data provided to you. "
        "When you receive a text message containing health data or outbreak reports, "
        "always summarize the current situation clearly, and then provide actionable, "
        "practical advice on how the user can protect themselves from those specific illnesses. "
        "Keep your tone informative, calming, and helpful."
    ),
)
# Configure for audio output
run_config = RunConfig(
    response_modalities=["AUDIO"],  # Required for audio responses
    streaming_mode=StreamingMode.BIDI
)

# Process audio output from the model
async def process_audio_stream(runner, live_request_queue):
    async for event in runner.run_live(
        user_id="user_123",
        session_id="session_456",
        live_request_queue=live_request_queue,
        run_config=run_config
    ):
        # Events may contain multiple parts (text, audio, etc.)
        if event.content and event.content.parts:
            for part in event.content.parts:
                # Audio data arrives as inline_data with audio/pcm MIME type
                if part.inline_data and part.inline_data.mime_type.startswith("audio/pcm"):
                    # The data is already decoded to raw bytes (24kHz, 16-bit PCM, mono)
                    audio_bytes = part.inline_data.data

                    # Your logic to stream audio to client
                    await stream_audio_to_client(audio_bytes)

                    # Or save to file
                    # with open("output.pcm", "ab") as f:
                    #     f.write(audio_bytes)