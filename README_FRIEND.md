# PPT Maker - Quick Start for Docker

Hi there! This folder contains everything you need to run the PPT Maker app.

## Instructions

1. Make sure you have Docker and Docker Compose installed on your system.
2. Load the exported Docker images into your local Docker registry by running:
   ```bash
   docker load -i ppt_maker_images.tar
   ```
3. Once the images are loaded, you can start the application using Docker Compose:
   ```bash
   docker compose up -d
   ```
4. The application is now running! 
   - Open your browser and go to `http://localhost:80` (or just `http://localhost`) to access the frontend.
   - The backend runs on port `3000`.

To stop the application, run:
```bash
docker compose down
```
