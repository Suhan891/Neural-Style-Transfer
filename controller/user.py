from fastapi import APIRouter
from validations.user import User
from service.user import create_user, get_user_data
from fastapi import Depends
from typing import Annotated
from validations.jwt_handling import get_current_user_id

router = APIRouter()

@router.post("/login")
def login(data: User):
    return create_user(data)

@router.get("/access")
def all_data(
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    return get_user_data(user_id=user_id)