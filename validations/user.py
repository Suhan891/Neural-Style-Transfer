from pydantic import BaseModel, Field, EmailStr, constr
from typing import List, TypedDict, List

class User(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    email: EmailStr = Field(...)

class ImageData(TypedDict):
    content_image: str
    style_image: str
    generated_image: str

class UserData(TypedDict):
    username: str
    email: str
    images: List[ImageData]