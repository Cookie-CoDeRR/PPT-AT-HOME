# PPT-AT-HOME API Documentation

The application provides a programmatic Headless REST API allowing third-party tools, scripts, or cloud services to generate `.pptx` presentations directly without using the React frontend.

It also supports passing dual LLM configurations to run the Layout Model (Mini LLM) and Content Model (Main LLM) on entirely different cloud providers!

---

## 1. Core Endpoints

### Generate Presentation JSON (Headless)
Executes the full generation pipeline (Blueprint Router -> Web RAG -> Iterative Slide Generation -> Auto-Healer) and returns the final slide objects.

* **URL**: `/api/v1/generate`
* **Method**: `POST`
* **Content-Type**: `application/json`

#### Request Schema
```json
{
  "prompt": "The History of Apple",
  "slideCount": 10,
  "theme": "Modern Dark Tech",
  
  "layoutConfig": {
    "baseUrl": "https://api.groq.com/openai/v1",
    "apiKey": "gsk_your_groq_key_here",
    "model": "llama3-8b-8192"
  },
  
  "contentConfig": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-your_openai_key_here",
    "model": "gpt-4o"
  }
}
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | The topic or instruction for the presentation. |
| `slideCount` | number | No | The number of slides to generate. Defaults to `10`. |
| `theme` | string | No | The visual theme to apply. E.g., `Modern Dark Tech`, `Neo Brutalism`. |
| `layoutConfig` | object | No | Configuration for the structural blueprint router (Mini LLM). |
| `contentConfig` | object | No | Configuration for the slide content generation (Main LLM). |

#### LLM Configuration Object (`layoutConfig` / `contentConfig`)
The backend uses standard **OpenAI-compatible** REST schemas. You can hook it up to any compatible provider (e.g., OpenAI, Groq, OpenRouter, TogetherAI, LM Studio, Ollama).
* **`baseUrl`**: The API endpoint for chat completions. (e.g. `http://127.0.0.1:1234/v1` for local, `https://api.groq.com/openai/v1` for Groq).
* **`apiKey`**: The authorization bearer token. Not required if using a local host without auth.
* **`model`**: The model string identifier.

#### Success Response
```json
{
  "status": "success",
  "title": "The History of Apple",
  "slides": [
    {
      "slide_number": 1,
      "slide_type": "title_hero",
      "title": "The History of Apple",
      "subtitle": "From a Garage to a Global Tech Titan",
      "role": "hook",
      "priority": 1,
      "key_message": "Apple's journey revolutionized personal computing."
    }
  ]
}
```

---

## 2. Advanced Endpoints

The backend also exposes granular internal endpoints that the frontend uses. These can be utilized for building custom UI workflows.

### Generate Blueprint Outline
* **URL**: `/api/generate-blueprint`
* **Method**: `POST`
* **Payload**: `{ "prompt": "Topic", "slideCount": 10, "layoutConfig": {...} }`
* **Description**: Returns just the structural sequence of slide types (e.g. `[{"slide_type": "title_hero"}, {"slide_type": "bento_grid"}]`).

### Stream Content Generation
* **URL**: `/api/generate-json-stream`
* **Method**: `POST`
* **Payload**: `{ "prompt": "Topic", "blueprint": [...], "contentConfig": {...} }`
* **Description**: Returns Server-Sent Events (SSE) streaming the generation of slides one-by-one.

### Compile to PPTX
* **URL**: `/api/generate-pptx`
* **Method**: `POST` (multipart/form-data)
* **Payload**: Form data with `slides` (JSON stringified array), `title`, `theme`.
* **Description**: Compiles the given JSON slide array into a downloadable `.pptx` binary file.
