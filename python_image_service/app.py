import io
import torch
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from diffusers import AutoPipelineForText2Image

app = Flask(__name__)
CORS(app)

# Determine the device (MPS for Apple Silicon, CUDA for NVIDIA, otherwise CPU)
if torch.backends.mps.is_available():
    device = "mps"
elif torch.cuda.is_available():
    device = "cuda"
else:
    device = "cpu"

print(f"Loading Diffusers model on {device}...")
# Use SD-Turbo for rapid generation (1-4 steps)
try:
    pipeline = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sd-turbo", 
        torch_dtype=torch.float16 if device != "cpu" else torch.float32, 
        variant="fp16" if device != "cpu" else None
    )
    pipeline.to(device)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Failed to load model: {e}")
    pipeline = None

@app.route('/generate-image', methods=['POST'])
def generate_image():
    if not pipeline:
        return jsonify({"error": "Model not loaded"}), 500
        
    data = request.json
    prompt = data.get('prompt', '')
    
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
        
    print(f"Generating image for prompt: '{prompt}'")
    
    try:
        # SD-Turbo is optimized for 1-4 inference steps
        num_inference_steps = data.get('steps', 1) 
        
        image = pipeline(
            prompt=prompt, 
            num_inference_steps=num_inference_steps, 
            guidance_scale=0.0
        ).images[0]
        
        # Convert PIL image to byte stream
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=85)
        img_byte_arr.seek(0)
        
        return send_file(
            img_byte_arr, 
            mimetype='image/jpeg',
            as_attachment=False,
            download_name='generated.jpg'
        )
    except Exception as e:
        print(f"Error generating image: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run on port 5000
    app.run(host='127.0.0.1', port=5000, debug=False)
