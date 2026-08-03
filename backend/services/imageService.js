const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getDimensions(slideSize, quality) {
    let width = 1024, height = 1024;
    switch(slideSize) {
        case "16:9": width = 1280; height = 720; break;
        case "9:16": width = 720; height = 1280; break;
        case "4:3": width = 1024; height = 768; break;
        case "1:1": default: width = 1024; height = 1024; break;
    }
    if (quality === 'HD') {
        width = Math.floor(width * 1.5);
        height = Math.floor(height * 1.5);
    }
    return { width, height };
}

function enhanceImagePrompt(basePrompt) {
    const styleSuffix = (
        ", highly detailed 3D isometric render, modern corporate tech presentation asset, " +
        "dark mode, glassmorphism UI elements, glowing neon accents, 8k resolution, " +
        "unreal engine 5, sleek, vibrant, abstract digital art"
    );
    return `${basePrompt}${styleSuffix}`;
}

async function saveImageLocally(base64Data) {
    const assetsDir = path.join(__dirname, '..', 'public', 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }
    const filename = `img_${crypto.randomBytes(4).toString('hex')}.png`;
    const filePath = path.join(assetsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return `/assets/${filename}`;
}

async function generateImageA1111(prompt, width, height) {
    const apiUrl = process.env.IMAGE_API_URL || 'http://127.0.0.1:7860/sdapi/v1/txt2img';
    const payload = {
        prompt,
        negative_prompt: "low quality, blurry, ugly, bad anatomy",
        steps: 20,
        width,
        height,
        cfg_scale: 7
    };
    
    try {
        const response = await axios.post(apiUrl, payload, { timeout: 30000 });
        return response.data.images[0]; // base64 string
    } catch (e) {
        console.error("A1111 Error:", e.message);
        throw new Error("Failed to generate image via A1111 API.");
    }
}

async function generateImageComfyUI(prompt, width, height) {
    const apiUrl = process.env.IMAGE_API_URL || 'http://127.0.0.1:8188';
    const baseUrl = apiUrl.replace('/prompt', ''); // Ensure clean base URL
    
    const workflow = {
      "3": {
        "class_type": "KSampler",
        "inputs": {
          "cfg": 7,
          "denoise": 1,
          "latent_image": ["5", 0],
          "model": ["4", 0],
          "negative": ["7", 0],
          "positive": ["6", 0],
          "sampler_name": "euler",
          "scheduler": "normal",
          "seed": Math.floor(Math.random() * 10000000),
          "steps": 20
        }
      },
      "4": {
        "class_type": "CheckpointLoaderSimple",
        "inputs": { "ckpt_name": "default.safetensors" }
      },
      "5": {
        "class_type": "EmptyLatentImage",
        "inputs": { "batch_size": 1, "height": height, "width": width }
      },
      "6": {
        "class_type": "CLIPTextEncode",
        "inputs": { "clip": ["4", 1], "text": prompt }
      },
      "7": {
        "class_type": "CLIPTextEncode",
        "inputs": { "clip": ["4", 1], "text": "blurry, low quality, bad anatomy, ugly" }
      },
      "8": {
        "class_type": "VAEDecode",
        "inputs": { "samples": ["3", 0], "vae": ["4", 2] }
      },
      "9": {
        "class_type": "SaveImage",
        "inputs": { "filename_prefix": "ppt_maker", "images": ["8", 0] }
      }
    };
    
    try {
        const response = await axios.post(`${baseUrl}/prompt`, { prompt: workflow }, { timeout: 10000 });
        const promptId = response.data.prompt_id;
        
        let history = {};
        let attempts = 0;
        
        while (!history[promptId] && attempts < 30) { 
            await new Promise(r => setTimeout(r, 2000));
            const histRes = await axios.get(`${baseUrl}/history/${promptId}`);
            history = histRes.data;
            attempts++;
        }
        
        if (!history[promptId]) throw new Error("ComfyUI generation timeout");
        
        const outputs = history[promptId].outputs;
        const outputNode = outputs[Object.keys(outputs)[0]];
        const filename = outputNode.images[0].filename;
        
        const imageRes = await axios.get(`${baseUrl}/view?filename=${filename}`, { responseType: 'arraybuffer', timeout: 10000 });
        return Buffer.from(imageRes.data, 'binary').toString('base64');
    } catch (e) {
        console.error("ComfyUI Error:", e.message);
        throw new Error("Failed to generate image via ComfyUI API.");
    }
}

async function generateImage(basePrompt, graphicStyle, graphicQuality, slideSize) {
    const engineType = (process.env.IMAGE_ENGINE_TYPE || 'a1111').toLowerCase();
    const finalPrompt = enhanceImagePrompt(basePrompt);
    const { width, height } = getDimensions(slideSize, graphicQuality);
    
    try {
        let base64Data;
        if (engineType === 'comfyui') {
            base64Data = await generateImageComfyUI(finalPrompt, width, height);
        } else {
            base64Data = await generateImageA1111(finalPrompt, width, height);
        }
        return await saveImageLocally(base64Data);
    } catch (e) {
        console.log(`Image generation failed, returning placeholder. Error: ${e.message}`);
        return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400&auto=format&fit=crop";
    }
}

module.exports = {
    generateImage,
    enhanceImagePrompt
};
