from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import time
from controller.agent import router as agent_router
from controller.user import router as user_router

class CustomException(HTTPException):
    def __init__(self, msg: str, code=400):
        super().__init__(status_code=code, detail=msg)
        self.msg = msg
        self.status_code = code

    def __str__(self):
        return f"{self.status_code}: {self.msg}"

app = FastAPI()

app.include_router(agent_router, prefix="/agent", tags=["agent"])
app.include_router(user_router, prefix="/user", tags=["user"])

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request of {request.method} on {request.url} received.")
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    logger.info(f"Completed {request.method} {request.url.path} with {response.status_code} in {process_time:.4f}s")
    return response

@app.exception_handler(CustomException)
async def custom_exception_handler(request: Request, exc: CustomException):
    logger.error(f"CustomException: {exc}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "status_code": exc.status_code, "message": exc.msg},
    )

@app.get("/")
def home():
    return {"message": "Alright! I am Fine 😊"}