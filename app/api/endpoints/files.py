from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import shutil
from typing import List
from datetime import datetime
from PyPDF2 import PdfReader
from app.Config import Config

router = APIRouter()

@router.get("/")
async def list_files():
    try:
        files_data = []
        for filename in os.listdir(Config.UPLOAD_PATH):
            file_path = os.path.join(Config.UPLOAD_PATH, filename)
            if os.path.isfile(file_path):
                stats = os.stat(file_path)
                # Attempt to get page count
                page_count = 0
                try:
                    reader = PdfReader(file_path)
                    page_count = len(reader.pages)
                except:
                    pass

                files_data.append({
                    "name": filename,
                    "size": stats.st_size,
                    "uploaded_at": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                    "page_count": page_count
                })
        return {"files": files_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{filename}/details")
async def file_details(filename: str):
    file_path = os.path.join(Config.UPLOAD_PATH, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        stats = os.stat(file_path)
        reader = PdfReader(file_path)
        return {
            "name": filename,
            "size": stats.st_size,
            "page_count": len(reader.pages),
            "uploaded_at": datetime.fromtimestamp(stats.st_mtime).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    uploaded_files = []
    for file in files:
        file_path = os.path.join(Config.UPLOAD_PATH, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        uploaded_files.append(file.filename)
    return {"message": f"Successfully uploaded {len(uploaded_files)} files", "files": uploaded_files}

@router.delete("/{filename}")
async def delete_file(filename: str):
    file_path = os.path.join(Config.UPLOAD_PATH, filename)
    try:
        if os.path.isfile(file_path):
            os.remove(file_path)
            return {"message": f"File {filename} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
