import os
from dotenv import load_dotenv
from supabase import create_client, Client, acreate_client, AsyncClient
from config import setting


supabase: Client = create_client(setting.SUPABASE_URL, setting.SUPABASE_KEY)

async def get_async_client():
    async_supabase: AsyncClient = await acreate_client(setting.SUPABASE_URL, setting.SUPABASE_KEY)
    return async_supabase
