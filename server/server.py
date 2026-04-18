'''
Varroa-mite-counter POC backend.

Data collection + inference server for the field demo with Andy.
'''
import time
import json
import magic
import hashlib
from pathlib import Path
from ultralytics import YOLO
from datetime import datetime, timezone

from starlette.routing import Route
from starlette.requests import Request
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException
from starlette.middleware.cors import CORSMiddleware


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / 'server' / 'data'
DATA_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_SIZE = 50 * (1024 ** 2) # 50 MiB

mime = magic.Magic(mime=True) # For image upload MIME type checking
print('Loading model weights...')
t0 = time.perf_counter()
model = YOLO(str(ROOT / 'model' / 'best.pt'), verbose=False) # Safe to call repeatedly
print(f'Loaded model in {time.perf_counter() - t0:.2f}s')


# MARK: Helpers

def count_varroa_mites(image_path) -> dict:
    '''
    Temporary helper function for inference in POST /count.
    Loads image, runs inference, returns a dict with format:
    {
        'count': int, 
        'boxes': [
            {'xywhn': [float, float, float, float], 'conf': float} 
        ... 
        ]
    }
    '''
    t0 = time.perf_counter()
    print(f'Starting inference on {image_path.name}')
    '''
    NB: imgsz, max_det, conf and iou are temporary magic numbers
    copied directly from https://github.com/jodivaso/varrodetector/blob/main/varroa_mite_gui.py
    (line 2787 onwards)
    '''
    results = model(
        str(image_path),
        imgsz=6016,
        max_det=2000,
        conf=0.1,
        iou=0.5,
        verbose=False,
        batch=1,
    )

    elapsed = time.perf_counter() - t0
    print(f"[count_varroa_mites] Inference: {elapsed:.2f}s")
    
    result = results[0]
    xywhn = result.boxes.xywhn.tolist() # [[center_x, center_y, width, height], ...]
    confs = result.boxes.conf.tolist()  # [confidence, ...]
    boxes = [{'xywhn': _xywhn, 'conf': _conf} for _xywhn, _conf in zip(xywhn, confs)]

    return {
        'count': len(xywhn),
        'boxes': boxes,
    }


# MARK: Endpoints

async def health(request: Request):
    '''
    Health check endpoint.
    '''
    return JSONResponse({'status':'healthy'})


async def count(request: Request):
    '''
    Receive input image, store, run inference,
    populate metadata, return predicted varroa mite count.
    '''
    # Get the image from the request
    form = await request.form()
    image = form.get('image')

    if image is None:
        raise HTTPException(status_code=400, detail='No image uploaded')
    
    image_bytes = await image.read()

    # Validate maximum image size
    if len(image_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f'Uploaded image is too large (max. {MAX_UPLOAD_SIZE} bytes)')

    # Check the image MIME type
    mime_type = mime.from_buffer(image_bytes)

    accepted_types = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
    } # TODO: Add HEIC, raw

    if mime_type not in accepted_types.keys():
        raise HTTPException(status_code=400, detail='Unsupported image format')

    # Get and check hash against saved images
    image_hash = hashlib.sha256(image_bytes).hexdigest()
    short_hash = image_hash[:8]

    # Construct filenames
    image_filename = short_hash + '.' + accepted_types[mime_type] # Derive extension from mime type
    metadata_filename = short_hash + '.json'

    if (DATA_DIR / metadata_filename).exists():
        # We already have this image stored, check metadata and return existing count if not null
        with open(DATA_DIR / (short_hash + '.json'), 'r') as file:
            metadata = json.load(file)
        if metadata['count'] is not None:
            return JSONResponse(metadata)

    else:
        # This is a new file
        # Save image file
        with open(DATA_DIR / image_filename, 'wb') as file:
            file.write(image_bytes)

        # Save image metadata
        metadata = {
            'time': datetime.now(timezone.utc).isoformat(),
            'hash': image_hash,
            'name': image.filename, # Original name from request Content-Disposition (can be null)
            'type': mime_type,
            'size': len(image_bytes),
            'count': None, # Varroa mite count (for later)
            'boxes': None, # Detected bboxes (for later)
        }
        with open(DATA_DIR / metadata_filename, 'w') as file:
            json.dump(metadata, file, indent=4)

    # Run inference
    try:
        result = count_varroa_mites(DATA_DIR / image_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Inference failed: {e}')

    # Update metadata
    metadata['count'] = result['count']
    metadata['boxes'] = result['boxes']

    with open(DATA_DIR / metadata_filename, 'w') as file:
        json.dump(metadata, file, indent=4)

    # Return metadata
    return JSONResponse(metadata)


# MARK: Application

app = Starlette(routes=[
    Route('/', health, methods=['GET']),
    Route('/count', count, methods=['POST']),
])

app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5555) # No hot-reload
