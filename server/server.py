'''
Varroa-mite-counter POC backend.

Data collection + inference server for the field demo with Andy.
'''
import json
from pathlib import Path

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Route
from starlette.middleware.cors import CORSMiddleware


SERVER_DIR = Path(__file__).resolve().parent
DATA_DIR = SERVER_DIR / 'data'


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
    return JSONResponse({'error':'Not yet implemented'})


# MARK: Application

app = Starlette(routes=[
    Route('/', health, methods=['GET']),
    Route('/count', count, methods=['POST']),
])

app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='127.0.0.1', port=5555, reload=False)
