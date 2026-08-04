import json
import random
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = BASE_DIR / "backend"
DATASET_PATH = BASE_DIR / "dataset_layout_bank.json"
OUTPUT_PATH = BACKEND_DIR / "data" / "qwen_router_dataset.jsonl"

# Sample topics for generating synthetic prompts
TOPICS = [
    "ESP32 Microcontroller Architecture",
    "Q4 2024 Go-to-Market Strategy",
    "Quarterly Financial Review",
    "Employee Onboarding Guide",
    "Kubernetes Deployment Strategies",
    "AI-Driven Marketing Campaigns",
    "Renewable Energy Investments",
    "Series A Pitch Deck",
    "Machine Learning Lifecycle",
    "E-commerce Conversion Optimization",
    "Cloud Migration Best Practices",
    "Data Privacy and GDPR Compliance",
    "Product Launch Playbook",
    "Customer Journey Mapping",
    "Agile Software Development",
    "Cybersecurity Threat Landscape",
    "Blockchain for Supply Chain",
    "SaaS Pricing Models",
    "Generative AI in Healthcare",
    "Automotive Industry Trends 2025"
]

def main():
    if not DATASET_PATH.exists():
        print(f"Error: {DATASET_PATH} not found.")
        return

    print(f"Loading dataset from {DATASET_PATH}...")
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    decks = data.get("decks", [])
    print(f"Found {len(decks)} decks to process.")

    os.makedirs(OUTPUT_PATH.parent, exist_ok=True)
    
    written = 0
    with open(OUTPUT_PATH, "w", encoding="utf-8") as out_f:
        for deck in decks:
            sequence = deck.get("sequence", [])
            
            # Filter or fallback missing
            processed_seq = [s if s else "standard_text" for s in sequence]
            
            if not processed_seq:
                continue

            slide_count = len(processed_seq)
            topic = random.choice(TOPICS)
            
            instruction = f"Design the structural blueprint for a {slide_count}-slide presentation about {topic}."
            
            alpaca_item = {
                "instruction": instruction,
                "input": "",
                "output": json.dumps(processed_seq)
            }
            
            out_f.write(json.dumps(alpaca_item) + "\n")
            written += 1

    print(f"Successfully wrote {written} JSONL records to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
