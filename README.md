# varroa-mite-counter
Creating a varroa mite counter app for Fife Beekeepers as part of the University of St Andrew's Sustainability Side Projects!

## Model

The PoC model is an open weight PyTorch detector built on YOLO11 Nano. It was fine tuned by Divasón et. al[^1] in 2023 and can be publicly accessed via GitHub at [jodivaso/varrodetector](https://github.com/jodivaso/varrodetector).

The dataset used in testing, not included in this repo (357MB), is also from Divasón 2023. It can be accessed at [zenodo.org/records/10231845](https://zenodo.org/records/10231845), and on GitHub at [jodivaso/varroa_detector](https://github.com/jodivaso/varroa_detector).

[^1]: Divasón, Jose & Ascacibar, Francisco Javier & Romero, Ana & Santolaria, Pilar & Yániz, Jesús. (2023). Varroa Mite Detection Using Deep Learning Techniques. 10.1007/978-3-031-40725-3_28. 

## Server

The current server is designed for the field demo with Andy. It exposes a single `POST /count` endpoint which accepts an image upload, saves it to disk, runs inference and returns an integer count. This will enable in-person testing and foolproof data collection when paired with a web UI.

See `server/README.md` for installation, usage instructions and documentation.

## Frontend

The frontend is implemented as vanilla HTML/CSS/JS. It presents an upload form, and when an image is loaded, an "Analyse" button which calls `POST /count` on the image. There is also a "Clear" button to return to the upload form. The frontend displays the number of detections as text and draws red boxes on the preview for clear comparison.

## Deployment

The PoC site is deployed using nginx and systemd on a virtual private server provided by Hetzner. It tunnels a connection to a local device in St Andrews using WireGuard to take advantage of its GPU, falling back to CPU inference when this is unavailable.

See `deploy/` for the configuration files used on the VPS. Note that the WireGuard config has been gitignored for safety, if access is required please contact [@MutantCacti](https://github.com/MutantCacti).
