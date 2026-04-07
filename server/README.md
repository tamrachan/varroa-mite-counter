# Server

The POC server will perform inference by API and data collection.

|Method|Name|Codes|Note|
|---|---|---|---|
|GET|/|200, 500|health check|
|POST|/count|200, 400, 500|multipart/form-data (Image to int)

## Getting Started

The server uses [Starlette](https://starlette.dev) + [Uvicorn](https://uvicorn.dev).

```sh
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

## Goals

- The `/count` endpoint acts as both an inference request and image upload method.
- Images are saved to `server/data` as `<sha256[:8]>.ext`/`<sha256[:8]>.json` image/metadata pairs.
- Supported image formats: JPEG, PNG, HEIC, RAW.
- Deduplication is enforced by cache check. If the hash exists, the previous count is returned.
