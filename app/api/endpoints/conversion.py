from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import Response, StreamingResponse
from typing import Optional, Generator
import os
import shutil
import uuid
import json
from PyPDF2 import PdfReader
from app.Config import Config
from app.services.pdf_service import convert_pdf_to_images
from app.services.ai_service import process_images_with_ai, send_image_to_ai
from app.utils.helpers import generate_html_content
import logging
import time

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/convert/{filename}")
async def convert_existing_pdf(
    filename: str,
    language: str = "german",
    start_page: int = 1,
    num_pages: Optional[int] = None
):
    pdf_path = os.path.join(Config.UPLOAD_PATH, filename)
    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="File not found")

    temp_id = str(uuid.uuid4())
    output_dir = os.path.join(Config.TEMP_IMAGE_PATH, temp_id)
    os.makedirs(output_dir, exist_ok=True)

    try:
        total_pages = len(PdfReader(pdf_path).pages)

        # Validation and page range logic
        if start_page < 1: start_page = 1
        if not num_pages or num_pages <= 0 or start_page + num_pages - 1 > total_pages:
            end_page = total_pages
        else:
            end_page = start_page + num_pages - 1

        images = convert_pdf_to_images(pdf_path, output_dir, start_page=start_page, end_page=end_page)
        texts = process_images_with_ai(images, language)

        html_content, download_filename = generate_html_content(texts, filename, language)

        # Cleanup temp images
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)

        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename={download_filename}"}
        )
    except Exception as e:
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def convert_pdf(
    file: UploadFile = File(...),
    language: str = Form("english"),
    start_page: int = Form(1),
    num_pages: int = Form(None)
):
    temp_id = str(uuid.uuid4())
    output_dir = os.path.join(Config.TEMP_IMAGE_PATH, temp_id)
    os.makedirs(output_dir, exist_ok=True)

    # Save uploaded PDF temporarily to process it
    temp_pdf_path = os.path.join(Config.UPLOAD_PATH, f"temp_{temp_id}_{file.filename}")

    try:
        with open(temp_pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        total_pages = len(PdfReader(temp_pdf_path).pages)

        # Validation
        if start_page < 1: start_page = 1

        if not num_pages or num_pages <= 0 or start_page + num_pages - 1 > total_pages:
            end_page = total_pages
        else:
            end_page = start_page + num_pages - 1

        images = convert_pdf_to_images(temp_pdf_path, output_dir, start_page=start_page, end_page=end_page)
        texts = process_images_with_ai(images, language)

        html_content, download_filename = generate_html_content(texts, file.filename, language)

        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename={download_filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)

@router.post("/upload")
async def upload_only(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    file_path = os.path.join(Config.UPLOAD_PATH, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"filename": file.filename, "message": "File uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def generate_conversion_events(
    pdf_path: str,
    output_dir: str,
    language: str,
    start_page: int,
    end_page: int,
    filename: str,
    api_delay: float = 0
) -> Generator[str, None, None]:
    """Generator that yields SSE events during PDF conversion"""
    try:
        total_pages_to_convert = end_page - start_page + 1

        # Step 1: Convert PDF to images
        yield f"data: {json.dumps({'type': 'status', 'message': 'PDF wird in Bilder konvertiert...', 'current': 0, 'total': total_pages_to_convert})}\n\n"

        images = convert_pdf_to_images(pdf_path, output_dir, start_page=start_page, end_page=end_page)

        # Step 2: Process each image with AI and send progress
        texts = []
        for i, image in enumerate(images):
            current_page = i + 1
            yield f"data: {json.dumps({'type': 'progress', 'message': f'Seite {current_page} von {total_pages_to_convert} wird konvertiert...', 'current': current_page, 'total': total_pages_to_convert})}\n\n"

            logger.info(f"Processing image {image} on page {current_page}")

            # Optional delay between requests; prefer explicit api_delay param, fallback to Config.API_DELAY
            delay = api_delay if api_delay is not None and api_delay > 0 else getattr(Config, 'API_DELAY', 0)
            if i > 0 and delay:
                try:
                    time.sleep(float(delay))
                except Exception:
                    pass

            text = send_image_to_ai(image, language)
            logger.info(f"Received text: {text}")
            texts.append(text)

        # Step 3: Generate HTML
        yield f"data: {json.dumps({'type': 'status', 'message': 'HTML wird generiert...', 'current': total_pages_to_convert, 'total': total_pages_to_convert})}\n\n"

        html_content, download_filename = generate_html_content(texts, filename, language)

        # Step 4: Send completion with HTML content (base64 encoded to avoid JSON issues)
        import base64
        html_base64 = base64.b64encode(html_content.encode('utf-8')).decode('utf-8')

        yield f"data: {json.dumps({'type': 'complete', 'message': 'Konvertierung abgeschlossen!', 'html': html_base64, 'filename': download_filename})}\n\n"

    except Exception as e:
        logger.error(f"Conversion error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    finally:
        # Cleanup
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)


@router.get("/stream/{filename}")
async def convert_with_progress(
    filename: str,
    language: str = "german",
    start_page: int = 1,
    num_pages: Optional[int] = None,
    api_delay: Optional[float] = None
):
    """SSE endpoint for PDF conversion with progress updates"""
    pdf_path = os.path.join(Config.UPLOAD_PATH, filename)
    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="File not found")

    temp_id = str(uuid.uuid4())
    output_dir = os.path.join(Config.TEMP_IMAGE_PATH, temp_id)
    os.makedirs(output_dir, exist_ok=True)

    total_pages = len(PdfReader(pdf_path).pages)

    # Validation and page range logic
    if start_page < 1:
        start_page = 1
    if not num_pages or num_pages <= 0 or start_page + num_pages - 1 > total_pages:
        end_page = total_pages
    else:
        end_page = start_page + num_pages - 1

    return StreamingResponse(
        generate_conversion_events(pdf_path, output_dir, language, start_page, end_page, filename, api_delay=(api_delay or 0)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
