from pathlib import Path

# File upload configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}

MAX_AUDIO_SIZE_MB = 25
MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024