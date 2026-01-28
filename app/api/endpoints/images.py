from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os
import shutil
import uuid
from app.Config import Config
from app.services.ai_service import send_image_to_ai
from app.services.image_service import save_image, is_valid_image
from app.utils.prompts import PROMPTS

router = APIRouter()

@router.post("/process")
async def process_single_image(
    image: UploadFile = File(...),
    prompt_type: str = Form("standard"),
    language: str = Form("german")
):
    # Validation
    if not is_valid_image(image.file):
        raise HTTPException(status_code=400, detail="Invalid image uploaded")

    prompt_key = f"{prompt_type}_{language}"
    if prompt_key not in PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unsupported prompt mapping: {prompt_key}")

    temp_id = str(uuid.uuid4())
    unique_temp_path = os.path.join(Config.TEMP_IMAGE_PATH, temp_id)
    os.makedirs(unique_temp_path, exist_ok=True)

    try:
        # Save uploaded file
        image_path = os.path.join(unique_temp_path, image.filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        alt_text = send_image_to_ai(image_path, prompt_key)
        return {"alt_text": alt_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(unique_temp_path):
            shutil.rmtree(unique_temp_path)
