FROM node:20-bullseye-slim

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libreoffice-impress \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Set up Python virtual environment and install dependencies
RUN python3 -m venv venv
# Pillow and python-pptx
RUN ./venv/bin/pip install Pillow python-pptx

# Copy backend source
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
