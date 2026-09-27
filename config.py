from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

load_dotenv() 

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # database related
    
    # Parsers related
    VGG_PATH: str = os.getenv("VGG_PATH", "./model/vgg_normalised.pth")
    TRAINED_MODEL: str = os.getenv("TRAINED_MODEL", "../model/project/trained_model.pth")
    
    CLOUDINARY_NAME: str = os.getenv("CLOUDINARY_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # JWT Token Related
    secret_key: str = os.getenv("SECRET_KEY","")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    timeout: int = int(os.getenv("TIMEOUT", "30"))
    ACCESS_TOKEN_EXPIRE_MINUTES : int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES","30"))
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

setting = Settings()
    