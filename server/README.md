# Server

The POC server will perform inference by API and data collection.

|Method|Name|Codes|Note|
|---|---|---|---|
|GET|/|200, 500|health check|
|POST|/count|200, 400, 413, 500|multipart/form-data (key: 'image')

## Getting Started

The server uses [Starlette](https://starlette.dev) + [Uvicorn](https://uvicorn.dev).

```sh
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

To test the current setup, I've been using cURL:

```sh
curl --get http://localhost:5555 # should return {"status":"healthy"}
curl -F 'image=@/path/to/your/image.jpg' http://localhost:5555/count # should return {"count":N} after a long time
```

Cache checking is implemented, so re-running on the same image should return the same count instantly.

## Goals

- The `/count` endpoint acts as both an inference request and image upload method.
- Images are saved to `server/data` as `<sha256>.ext`/`<sha256>.json` image/metadata pairs.
- Supported image formats: JPEG, PNG, HEIC, RAW.
- Deduplication is enforced by cache check. If the hash exists, the previous count is returned.

## Example Metadata

```json
{
    "time": "2026-04-08T14:48:07.246230+00:00",
    "hash": "0a7899583c6d0f6c0f6bc95f5242a01c461c61cade95067d7ba48dd3856e1123",
    "name": "IMG_5702.jpg",
    "type": "image/jpeg",
    "size": 6126100,
    "count": 14,
    "boxes": [
        {
            "xywhn": [
                0.41205963492393494,
                0.11487293243408203,
                0.011139804497361183,
                0.008542893454432487
            ],
            "conf": 0.5900094509124756
        },
        ...
    ]
}
```

