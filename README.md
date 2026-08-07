# PPT-AT-HOME (Local AI PowerPoint Generator)

A clone of online available service named "Gamma" for local ppt generation.
This full-stack application allows you to generate professional PowerPoint (.pptx) presentations using a local LLM via Ollama or LM Studio.

## Architecture

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons + Recharts
- **Backend**: Node.js (Express) + `pptxgenjs` + OpenAI Node SDK (for local compatibility) + Cheerio (WebRAG)

## Key Features

- **Advanced AI Layout Router:** Intelligently predicts structurally varied slide sequences (e.g., `title_hero`, `bento_grid`, `two_column_image`, `title_split`) instead of just boring bullet points. Supports local fine-tuned Qwen layout models.
- **WebRAG Context Engine:** Automatically scrapes the web (via DuckDuckGo) for real-time context and facts about your topic, injecting compressed factual context directly into the local LLM.
- **Dynamic React Previews:** View exactly how your presentation will look in a beautiful 16:9 React canvas before exporting. Includes interactive data tables and animated pie/bar charts.
- **Native PPTX Compiler:** Exports flawless `.pptx` files with intelligent native font mapping and dynamic auto-scaling text engines to ensure long AI-generated text never overflows slide boundaries.

## Prerequisites

1. **Node.js** (v18+)
2. **Local LLM Server** (Ollama or LM Studio)
   - Ensure you have a model downloaded (e.g., `llama3.2` for Ollama).
   - If using Ollama, it usually runs on `http://localhost:11434`.
   - If using LM Studio, start the local server on `http://localhost:1234`.

## Recommended Local Model Configurations

For optimal performance, structural adherence, and presentation quality, we highly recommend the following model stack:
- **Text/Reasoning:** `DeepSeek-R1-Distill-Llama-8B` or `Qwen2.5-14B` (Offers significantly better structural adherence and creativity than smaller 3B models).
- **Image Generation:** `Flux.1-schnell` (Operates flawlessly for high-end digital assets in low-step counts when hooked up to a local ComfyUI or MLX endpoint).

## Installation & Running

### 1. Backend

Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
node server.js
```
*(Optionally add a start script in package.json)*

By default, the backend runs on `http://localhost:3000`. 

### 2. Frontend

Open another terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
The frontend will typically run on `http://localhost:5173`. Open this URL in your browser.

## Usage

1. **Configure Connection**: On the left panel, input your local LLM API base URL and the model name you have loaded. Click "Test Connection" to ensure the app can reach the LLM.
2. **Setup Presentation**: Provide a detailed topic or instructions, choose your slide count, tone, and visual theme.
3. **Generate**: Click "Generate Presentation Outline". The app will prompt your local LLM to create a structured JSON outline.
4. **Review & Export**: Review the generated slides in the UI. If everything looks good, click "Export to PPTX" to download the compiled `.pptx` file.

## Developer APIs & Integrations

Want to build on top of PPT-AT-HOME or connect it to other apps? We offer a full headless programmatic API that lets you generate presentations directly via REST! 

Check out the **[API Documentation](API_DOCUMENTATION.md)** for details on:
- Configuring Cloud Providers (OpenAI, Groq, Anthropic, etc.)
- Programmatically generating Presentations via `/api/v1/generate`
- Streaming Content API and Blueprint generation 
