# Architecture

TRAIL is composed of:

- Backend: FastAPI app in `app/` handling file uploads, PDF->images (PyMuPDF) and AI calls.
  - Key modules:
    - `app/api/endpoints/` — routes for files, conversion, images
    - `app/services/pdf_service.py` — PDF to PNG conversion
    - `app/services/ai_service.py` — OpenAI integration and batching
    - `app/utils/helpers.py` — HTML generation
- Frontend: Next.js app in `frontend/` for file upload, conversion UI and single-image analysis.
- Temp storage: `temp_images/` and `uploads/` directories for processing.

## Data flow
1. Upload PDF → stored in `uploads/`
2. Convert PDF to images (`pdf_service`) → `temp_images/<uuid>/page_x.png`
3. For each image, backend sends image to OpenAI via `ai_service` → receives text
4. Texts assembled into HTML (`helpers.generate_html_content`)
5. Frontend receives progress events (SSE) and final HTML (base64)

## Notes
- `API_DELAY` controls optional sleeps between requests. Prefer retry/backoff for production.
- See `app/Config.py` for configurable paths and model selection.
