from validations.user import User, UserData, ImageData
from service.db import supabase
from collections.abc import Mapping
from typing import cast
from validations.jwt_handling import create_access_token

def create_user(user: User) -> str:
    user_data = user.model_dump()
    user_response = supabase.table("users").select("id").eq("email", user_data["email"]).execute()
    user_id = ""
    if not user_response.data:
        new_user_response = supabase.table("users").insert(user_data).select("id").execute()
        new_user_data = new_user_response.data
        if (
            not isinstance(new_user_data, list)
            or not new_user_data
            or not isinstance(new_user_data[0], Mapping)
            or "id" not in new_user_data[0]
        ):
            raise RuntimeError("User insert returned no valid id")
        user_id = str(new_user_data[0]["id"])
    else:
        existing_user_data = user_response.data
        if (
            not isinstance(existing_user_data, list)
            or not existing_user_data
            or not isinstance(existing_user_data[0], Mapping)
            or "id" not in existing_user_data[0]
        ):
            raise RuntimeError("User lookup returned no valid id")
        user_id = str(existing_user_data[0]["id"])
    return create_access_token(user_id)

def get_user_data(user_id: str) -> UserData:
    user_response = supabase.table("users").select("*").eq("id", user_id).execute()
    if not user_response.data:
        raise RuntimeError(f"User with id {user_id} not found")
    user_data = user_response.data[0]
    if not isinstance(user_data, Mapping):
        raise RuntimeError(f"User data for id {user_id} is not a valid mapping")
    images_response = (
        supabase.table("images")
        .select("content_image,style_image,generated_image")
        .eq("user_id", user_id)
        .execute()
    )
    image_rows = getattr(images_response, "data", None)
    if not isinstance(image_rows, list):
        raise RuntimeError(f"Image data for user id {user_id} is not a valid list")

    images: list[ImageData] = []
    for image_row in image_rows:
        if not isinstance(image_row, Mapping):
            raise RuntimeError(f"Image data for user id {user_id} contains an invalid record")
        content_image = image_row.get("content_image")
        style_image = image_row.get("style_image")
        generated_image = image_row.get("generated_image")
        if not all(
            isinstance(value, str)
            for value in (content_image, style_image, generated_image)
        ):
            raise RuntimeError(f"Image data for user id {user_id} contains invalid image values")
        images.append(ImageData(
            content_image=cast(str, content_image),
            style_image=cast(str, style_image),
            generated_image=cast(str, generated_image),
        ))
    return UserData(
        username=cast(str, user_data.get("name", "")),
        email=cast(str, user_data.get("email", "")),
        images=cast(list[ImageData], images),
    )