from typing import Annotated
from fastapi import UploadFile
from pydantic import BeforeValidator

MAX_FILE_SIZE = 3 * 1024 * 1024  # 3 Megabytes
ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

def validate_image(file: UploadFile) -> UploadFile:
    # Check MIME/Content Type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(
            f"Invalid file type: {file.content_type}. Only JPEG, PNG, and WebP are allowed."
        )
    
    # Check File Size (FastAPI populates file.size automatically)
    if file.size and file.size > MAX_FILE_SIZE:
        raise ValueError("File is too large. Maximum allowed size is 3MB.")
        
    return file

ValidatedImage = Annotated[UploadFile, BeforeValidator(validate_image)]

