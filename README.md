# varroa-mite-counter
Creating a varroa mite counter app for Fife Beekeepers as part of the University of St Andrew's Sustainability Side Projects!

## Server

The current server is designed for the field demo with Andy. It exposes a single `POST /count` endpoint which accepts an image upload, saves it to disk, runs inference and returns an integer count. This will enable in-person testing and foolproof data collection when paired with a web UI.

See `server/README.md` for installation & usage instructions and relevant documentation.
