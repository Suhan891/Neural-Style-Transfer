from fastapi import APIRouter, Depends, File, Form
from validations.create_image import ValidatedImage
from typing import Annotated
from service.image_handling import ImageService
from validations.jwt_handling import get_current_user_id

router = APIRouter()

image_service = ImageService()

@router.post("/generate")
def upload_image(
    content_image: Annotated[ValidatedImage, File(description="Content image file (JPEG, JPG, PNG, or WebP, max 3MB)")],
    style_image: Annotated[ValidatedImage, File(description="Style image file (JPEG, JPG, PNG, or WebP, max 3MB)")],
    alpha: Annotated[float, Form(ge=0.0, le=1.0, description="Alpha value for style transfer (0.0 to 1.0)")],
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    return image_service.create_image(
        content_image=content_image,
        style_image=style_image,
        alpha=alpha,
        user_id=user_id,
    )