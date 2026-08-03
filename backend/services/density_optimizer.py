MAX_BULLET_WORDS = 35
MAX_BULLETS_PER_SLIDE = 7

def truncate_text(text, max_words):
    if not isinstance(text, str):
        return text
    words = text.split()
    if len(words) > max_words:
        return " ".join(words[:max_words]) + "..."
    return text

def optimize_presentation(slides):
    optimized_slides = []
    for slide in slides:
        if "bullets" in slide and isinstance(slide["bullets"], list):
            slide["bullets"] = [truncate_text(b, MAX_BULLET_WORDS) for b in slide["bullets"][:MAX_BULLETS_PER_SLIDE]]
        # Truncate nested bullet lists (comparison columns, etc.)
        for col in ["column_left", "column_right"]:
            if col in slide and isinstance(slide[col], dict) and "bullets" in slide[col] and isinstance(slide[col]["bullets"], list):
                slide[col]["bullets"] = [truncate_text(b, MAX_BULLET_WORDS) for b in slide[col]["bullets"][:MAX_BULLETS_PER_SLIDE]]
        optimized_slides.append(slide)
    return optimized_slides
