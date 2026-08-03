MAX_BULLET_WORDS = 15
MAX_BULLETS_PER_SLIDE = 4
MAX_TITLE_WORDS = 10

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
        # 1. Truncate title
        if "title" in slide:
            slide["title"] = truncate_text(slide["title"], MAX_TITLE_WORDS)
            
        # 2. Pagination for informational slides
        category = slide.get("slide_category", "")
        
        # Fallback if category is missing but slide_type matches typical informational slides
        if not category and slide.get("slide_type") in ["standard_text", "two_column_image", "comparison", "summary_takeaways"]:
            category = "informational"
            
        if category == "informational" and "bullets" in slide and isinstance(slide["bullets"], list):
            # Truncate bullets
            processed_bullets = [truncate_text(b, MAX_BULLET_WORDS) for b in slide["bullets"]]
            
            if len(processed_bullets) <= MAX_BULLETS_PER_SLIDE:
                slide["bullets"] = processed_bullets
                optimized_slides.append(slide)
            else:
                # Chunking
                for i in range(0, len(processed_bullets), MAX_BULLETS_PER_SLIDE):
                    chunk = processed_bullets[i:i + MAX_BULLETS_PER_SLIDE]
                    new_slide = slide.copy()
                    new_slide["bullets"] = chunk
                    if i > 0:
                        new_title = new_slide.get("title", "")
                        if not new_title.endswith("(Cont.)"):
                            new_slide["title"] = f"{new_title} (Cont.)"
                    optimized_slides.append(new_slide)
        else:
            # Still truncate bullets if present, just in case
            if "bullets" in slide and isinstance(slide["bullets"], list):
                slide["bullets"] = [truncate_text(b, MAX_BULLET_WORDS) for b in slide["bullets"]]
            optimized_slides.append(slide)
            
    return optimized_slides
