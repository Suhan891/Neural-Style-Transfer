from service.agent import AgentModel
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status
from typing import Tuple
from PIL import Image
from io import BytesIO
from config import setting
from validations.create_image import ValidatedImage
from service.db import supabase
from service.user import get_user_data

class ImageService(AgentModel):
    def __init__(self) -> None:
        super().__init__()
        self.supabase = supabase
        self.cloudinary = cloudinary.config(
            cloud_name = setting.CLOUDINARY_NAME, 
            api_key = setting.CLOUDINARY_API_KEY, 
            api_secret = setting.CLOUDINARY_API_SECRET
        )
    
    def create_image(
        self,
        content_image: ValidatedImage,
        style_image: ValidatedImage,
        user_id: str,
        alpha: float = 1.0,
    ) -> str:
        get_user_data(user_id=user_id)
        content_bytes = content_image.file.read()
        style_bytes = style_image.file.read()
        
        # 2. Convert bytes to an in-memory binary stream and open with Pillow
        content_img = Image.open(BytesIO(content_bytes))
        style_img = Image.open(BytesIO(style_bytes))
        
        generated_image = self.generate_image(
            content_image=content_img.convert("RGB"),
            style_image=style_img.convert("RGB"),
            alpha=alpha,
        )
        
        c_secure_url, c_public_url = self._upload_image(content_img)
        s_secure_url, s_public_url = self._upload_image(style_img)
        g_secure_url, g_public_url = self._upload_image(generated_image)

        data = {
            "content_image": c_secure_url,
            "content_key": c_public_url,
            "style_image": s_secure_url,
            "style_key": s_public_url,
            "generated_image": g_secure_url,
            "generated_key": g_public_url,
            "user_id": user_id
        }
        response = self.supabase.table("images").insert(data).select("generated_image").execute()
        rows = getattr(response, "data", None)
        if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
            raise RuntimeError("Image record was not returned after insertion")
        generated_image_url = rows[0].get("generated_image")
        if not isinstance(generated_image_url, str):
            raise RuntimeError("Generated image URL was not returned after insertion")
        return generated_image_url
        
    def _upload_image(self, image: Image.Image) -> Tuple[str, str]:
        buffer = BytesIO()
        image.save(buffer, format=image.format or "PNG")
        buffer.seek(0)

        result = cloudinary.uploader.upload(
            buffer,
            folder="nst_images",
        )
        return result["secure_url"], result["public_id"]
    
    def remove_image(self, image_id: str, user_id: str) -> dict[str, str | bool]:
        response = (
            self.supabase.table("images")
            .select("id,user_id,content_key,style_key,generated_key")
            .eq("id", image_id)
            .eq("user_id", user_id)
            .execute()
        )
        rows = getattr(response, "data", None)
        if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found",
            )

        image_record = rows[0]
        public_ids = [
            image_record.get("content_key"),
            image_record.get("style_key"),
            image_record.get("generated_key"),
        ]
        if not all(isinstance(public_id, str) and public_id for public_id in public_ids):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Image record is missing Cloudinary public IDs",
            )

        try:
            for public_id in public_ids:
                result = cloudinary.uploader.destroy(public_id, invalidate=True)
                if result.get("result") not in {"ok", "not found"}:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Cloudinary did not confirm image deletion",
                    )
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Cloudinary image deletion failed",
            ) from error

        delete_response = (
            self.supabase.table("images")
            .delete()
            .eq("id", image_id)
            .eq("user_id", user_id)
            .select("id")
            .execute()
        )
        deleted_rows = getattr(delete_response, "data", None)
        if not isinstance(deleted_rows, list) or not deleted_rows:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudinary assets were removed, but the image record could not be deleted",
            )

        return {"deleted": True, "image_id": image_id}
        