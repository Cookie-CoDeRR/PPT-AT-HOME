import json
import argparse
import os

import re
from PIL import Image, ImageDraw
import base64
import tempfile
import os

import tempfile
from pptx import Presentation
from density_optimizer import optimize_presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE
from pptx.enum.chart import XL_LEGEND_POSITION

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if not hex_str: return RGBColor(0, 0, 0)
    try:
        return RGBColor(int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16))
    except:
        return RGBColor(0, 0, 0)

def set_shape_color(shape, hex_str):
    fill = shape.fill
    fill.solid()
    fill.fore_color.rgb = hex_to_rgb(hex_str)
    try:
        shape.line.color.rgb = hex_to_rgb(hex_str)
    except:
        pass

def add_text_box(slide, text, left, top, width, height, font_size, color_hex, align=PP_ALIGN.LEFT, bold=False, font_name=None):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    tf.vertical_anchor = MSO_ANCHOR.TOP
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = align
    p.font.size = Pt(font_size)
    p.font.color.rgb = hex_to_rgb(color_hex)
    p.font.bold = bold
    if font_name:
        p.font.name = font_name
    return txBox

def add_bullets(slide, bullets, left, top, width, height, font_size, color_hex, font_name=None):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    tf.vertical_anchor = MSO_ANCHOR.TOP
    for i, bullet in enumerate(bullets):
        p = tf.add_paragraph() if i > 0 else tf.paragraphs[0]
        p.text = bullet
        p.font.size = Pt(font_size)
        p.font.color.rgb = hex_to_rgb(color_hex)
        p.level = 0
        if font_name:
            p.font.name = font_name
    return txBox

def save_base64_image(b64_str):
    if b64_str.startswith("data:image"):
        b64_str = b64_str.split(",")[1]
    img_data = base64.b64decode(b64_str)
    fd, path = tempfile.mkstemp(suffix=".png")
    with os.fdopen(fd, 'wb') as f:
        f.write(img_data)
    return path

def add_column_content(slide, col_data, left, top, width, height, theme):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    tf.vertical_anchor = MSO_ANCHOR.TOP
    if not col_data: return
    
    # First paragraph (Title)
    p0 = tf.paragraphs[0]
    p0.text = col_data[0]
    p0.font.bold = True
    p0.font.size = Pt(22)
    p0.font.color.rgb = hex_to_rgb(theme['titleColor'])
    if theme.get('fontFace'):
        p0.font.name = theme.get('fontFace')
        
    # Subsequent paragraphs (Bullets)
    for bullet in col_data[1:]:
        p = tf.add_paragraph()
        p.text = "• " + bullet
        p.font.size = Pt(16)
        p.font.color.rgb = hex_to_rgb(theme['textColor'])
        if theme.get('bodyFontFace'):
            p.font.name = theme.get('bodyFontFace')

def build_comparison_slide(slide, data, theme, img_path):
    add_text_box(slide, data.get("title", ""), 0.5, 0.5, 12.3, 1.0, 34, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    
    col_a = data.get("col_a", [])
    if not col_a and "column_left" in data:
        col_a = [data["column_left"].get("title", "")] + data["column_left"].get("bullets", [])
        
    col_b = data.get("col_b", [])
    if not col_b and "column_right" in data:
        col_b = [data["column_right"].get("title", "")] + data["column_right"].get("bullets", [])
    
    # Column A (Left)
    left_rect = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.5), Inches(2.0), Inches(5.8), Inches(4.5))
    set_shape_color(left_rect, theme['shapeFill'])
    add_column_content(slide, col_a, 0.7, 2.2, 5.4, 4.1, theme)

    # VS badge
    vs_circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(6.33), Inches(3.7), Inches(0.7), Inches(0.7))
    set_shape_color(vs_circle, theme['titleColor'])
    add_text_box(slide, "VS", 6.33, 3.8, 0.7, 0.5, 14, theme['bkgd'], PP_ALIGN.CENTER, True, theme.get('fontFace'))

    # Column B (Right)
    right_rect = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.0), Inches(2.0), Inches(5.8), Inches(4.5))
    set_shape_color(right_rect, theme['shapeFill'])
    add_column_content(slide, col_b, 7.2, 2.2, 5.4, 4.1, theme)

def build_timeline_slide(slide, data, theme, img_path):
    add_text_box(slide, data.get("title", ""), 0.5, 0.4, 12.33, 1, 34, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    
    steps = data.get("steps", [])
    if not steps: return

    # Main line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(3.2), Inches(12.33), Inches(0.05))
    set_shape_color(line, theme['shapeFill'])

    step_width = 11.0 / len(steps)
    for i, step in enumerate(steps):
        box_left = 1.0 + (i * step_width)
        box_top = 3.0
        
        # Node
        node = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(box_left + (step_width/2) - 0.2), Inches(3.05), Inches(0.4), Inches(0.4))
        set_shape_color(node, theme['accent'])

        add_text_box(slide, step.get("step", ""), box_left, 3.5, step_width - 0.2, 0.5, 14, theme['accent'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
        add_text_box(slide, step.get("text", ""), box_left, 4.0, step_width - 0.2, 2.0, 12, theme['textColor'], PP_ALIGN.CENTER, False, theme.get('bodyFontFace'))

def build_stat_slide(slide, data, theme, img_path):
    add_text_box(slide, data.get("stat", ""), 0.5, 1.5, 6.0, 2.0, 80, theme['accent'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    add_text_box(slide, data.get("label", ""), 0.5, 3.5, 6.0, 1.0, 24, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.6), Inches(1.5), Inches(0.05), Inches(4.0))
    set_shape_color(line, theme['accent'])
    
    add_text_box(slide, data.get("title", ""), 7.0, 1.5, 5.8, 1.0, 28, theme['titleColor'], PP_ALIGN.LEFT, True, theme.get('fontFace'))
    add_bullets(slide, data.get("bullets", []), 7.0, 2.5, 5.8, 3.0, 18, theme['textColor'], theme.get('bodyFontFace'))

def build_grid_slide(slide, data, theme, img_path):
    add_text_box(slide, data.get("title", ""), 0.5, 0.4, 12.33, 1, 34, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    
    items = data.get("items", [])
    if not items: return
    
    cols = 2 if len(items) in [2, 4] else (4 if len(items) > 6 else 3)
    box_w = (12.33 - ((cols - 1) * 0.4)) / cols
    box_h = 2.0
    
    for i, item in enumerate(items):
        r = i // cols
        c = i % cols
        x = 0.5 + (c * (box_w + 0.4))
        y = 1.5 + (r * (box_h + 0.4))
        
        rect = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(box_w), Inches(box_h))
        set_shape_color(rect, theme['shapeFill'])
        
        add_text_box(slide, item.get("item_title", ""), x+0.1, y+0.1, box_w-0.2, 0.4, 16, theme['titleColor'], PP_ALIGN.LEFT, True, theme.get('fontFace'))
        add_text_box(slide, item.get("item_text", ""), x+0.1, y+0.6, box_w-0.2, 1.3, 12, theme['textColor'], PP_ALIGN.LEFT, False, theme.get('bodyFontFace'))


def build_chart_slide(slide, data, theme, img_path, chart_type):
    add_text_box(slide, data.get("title", ""), 0.5, 0.5, 5.0, 1.0, 32, theme['titleColor'], PP_ALIGN.LEFT, True, theme.get('fontFace'))
    add_text_box(slide, data.get("description", ""), 0.5, 1.5, 5.0, 2.0, 18, theme['textColor'], PP_ALIGN.LEFT, False, theme.get('bodyFontFace'))
    
    chart_data_obj = data.get("chart_data", {})
    labels = chart_data_obj.get("labels", [])
    values = chart_data_obj.get("values", [])
    
    if not labels or not values:
        # Fallback to default
        build_default_slide(slide, data, theme, img_path)
        return
        
    chart_data = CategoryChartData()
    chart_data.categories = labels
    chart_data.add_series('Series 1', values)
    
    x, y, cx, cy = Inches(6.0), Inches(1.5), Inches(6.5), Inches(5.0)
    
    ctype = XL_CHART_TYPE.PIE if chart_type == 'pie' else XL_CHART_TYPE.COLUMN_CLUSTERED
    chart = slide.shapes.add_chart(ctype, x, y, cx, cy, chart_data).chart
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM

def build_data_table_slide(slide, data, theme, img_path):
    add_text_box(slide, data.get("title", ""), 0.5, 0.4, 12.33, 1, 32, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    
    table_data = data.get("table_data", {})
    headers = table_data.get("headers", [])
    rows = table_data.get("rows", [])
    
    if not headers or not rows:
        build_default_slide(slide, data, theme, img_path)
        return
        
    num_rows = len(rows) + 1
    num_cols = len(headers)
    
    left, top, width, height = Inches(1.0), Inches(1.5), Inches(11.33), Inches(5.0)
    table_shape = slide.shapes.add_table(num_rows, num_cols, left, top, width, height)
    table = table_shape.table
    
    for i, header in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = str(header)
        cell.fill.solid()
        cell.fill.fore_color.rgb = hex_to_rgb(theme['accent'])
        for p in cell.text_frame.paragraphs:
            p.font.color.rgb = hex_to_rgb(theme['bkgd'])
            if theme.get('fontFace'):
                p.font.name = theme.get('fontFace')
            
    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            if c_idx < num_cols:
                cell = table.cell(r_idx + 1, c_idx)
                cell.text = str(val)
                cell.fill.solid()
                if r_idx % 2 == 0:
                    cell.fill.fore_color.rgb = hex_to_rgb(theme['shapeFill'])
                else:
                    cell.fill.fore_color.rgb = hex_to_rgb(theme['bkgd'])
                for p in cell.text_frame.paragraphs:
                    p.font.color.rgb = hex_to_rgb(theme['textColor'])
                    if theme.get('bodyFontFace'):
                        p.font.name = theme.get('bodyFontFace')

def build_bento_grid_slide(slide, data, theme, img_path):
    add_text_box(slide, data.get("title", ""), 0.5, 0.4, 12.33, 1, 34, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    
    items = data.get("items", [])
    if not items:
        build_default_slide(slide, data, theme, img_path)
        return
        
    # Fixed 3-column grid mapping
    cols = 3
    col_w = (12.33 - 1.0 - (0.4 * (cols - 1))) / cols
    row_h = 2.0
    
    current_x = 0.5
    current_y = 1.5
    
    for item in items:
        size = item.get('size', 'small')
        
        # Calculate width and height based on size
        w = col_w
        h = row_h
        
        if size == 'large':
            w = (col_w * 2) + 0.4
            h = (row_h * 2) + 0.4
        elif size == 'wide':
            w = (col_w * 3) + 0.8
        elif size == 'tall':
            h = (row_h * 2) + 0.4
            
        rect = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(current_x), Inches(current_y), Inches(w), Inches(h))
        set_shape_color(rect, theme['shapeFill'])
        
        add_text_box(slide, item.get("title", ""), current_x + 0.2, current_y + 0.2, w - 0.4, 0.8, 20 if size == 'large' else 16, theme['titleColor'], PP_ALIGN.LEFT, True, theme.get('fontFace'))
        add_text_box(slide, item.get("desc", ""), current_x + 0.2, current_y + 1.0, w - 0.4, h - 1.2, 14 if size == 'large' else 12, theme['textColor'], PP_ALIGN.LEFT, False, theme.get('bodyFontFace'))
        
        # Simple flow layout (not true masonry for simplicity)
        current_x += w + 0.4
        if current_x > 12.0:
            current_x = 0.5
            current_y += h + 0.4

def build_metric_dashboard_slide(slide, data, theme, img_path):
    add_text_box(slide, data.get("title", ""), 0.5, 0.4, 12.33, 1, 34, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    
    metrics = data.get("metrics", [])
    if not metrics:
        build_default_slide(slide, data, theme, img_path)
        return
        
    box_w = 5.5
    box_h = 2.5
    
    for i, m in enumerate(metrics[:4]):
        r = i // 2
        c = i % 2
        x = 0.8 + (c * (box_w + 0.5))
        y = 1.5 + (r * (box_h + 0.5))
        
        rect = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(box_w), Inches(box_h))
        set_shape_color(rect, theme['shapeFill'])
        
        add_text_box(slide, m.get("change", ""), x + box_w - 1.5, y + 0.2, 1.3, 0.5, 14, theme['accent'], PP_ALIGN.RIGHT, True, theme.get('fontFace'))
        add_text_box(slide, m.get("value", ""), x + 0.2, y + 0.7, box_w - 0.4, 1.0, 48, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
        add_text_box(slide, m.get("label", ""), x + 0.2, y + 1.8, box_w - 0.4, 0.5, 16, theme['textColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))


def build_split_card_slide(slide, slide_data, theme, img_path):
    # 1. Main Outer Card Backdrop (Emulates Web UI Glassmorphism Container)
    outer_card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9)
    )
    outer_card.fill.solid()
    outer_card.fill.fore_color.rgb = hex_to_rgb(theme['shapeFill'])
    try:
        outer_card.line.color.rgb = hex_to_rgb(theme['accent'])
    except:
        pass
    
    # 2. Left Column: Title & Subtitle Frame
    text_box = slide.shapes.add_textbox(Inches(1.3), Inches(2.0), Inches(5.0), Inches(3.5))
    tf = text_box.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    
    # Render Title
    p_title = tf.paragraphs[0]
    p_title.text = slide_data.get("title", "")
    p_title.font.size = Pt(36)
    p_title.font.bold = True
    p_title.font.color.rgb = hex_to_rgb(theme['titleColor'])
    p_title.space_after = Pt(14)
    if theme.get('fontFace'):
        p_title.font.name = theme.get('fontFace')
    
    # Render Subtitle (If present)
    subtitle_text = slide_data.get("subtitle") or slide_data.get("description", "")
    if subtitle_text:
        p_sub = tf.add_paragraph()
        p_sub.text = subtitle_text
        p_sub.font.size = Pt(18)
        p_sub.font.color.rgb = hex_to_rgb(theme['textColor'])
        p_sub.space_after = Pt(14)
        if theme.get('bodyFontFace'):
            p_sub.font.name = theme.get('bodyFontFace')

    # Render Bullets (If present)
    for bullet in slide_data.get("bullets", []):
        p_b = tf.add_paragraph()
        p_b.text = f"• {bullet}"
        p_b.font.size = Pt(14)
        p_b.font.color.rgb = hex_to_rgb(theme['textColor'])
        if theme.get('bodyFontFace'):
            p_b.font.name = theme.get('bodyFontFace')

    # 3. Right Column: Dedicated Image Container
    if img_path and os.path.exists(img_path):
        # Insert image accurately constrained inside right half of card
        slide.shapes.add_picture(
            img_path, Inches(6.8), Inches(1.3), width=Inches(5.2), height=Inches(4.8)
        )
    else:
        # Fallback Placeholder Box if image hasn't loaded
        img_card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.3), Inches(5.2), Inches(4.8)
        )
        img_card.fill.solid()
        img_card.fill.fore_color.rgb = hex_to_rgb(theme['bkgd'])
        img_card.line.fill.background()

def build_default_slide(slide, data, theme, img_path):
    add_text_box(slide, data.get("title", ""), 0.5, 0.5, 12.33, 1, 34, theme['titleColor'], PP_ALIGN.CENTER, True, theme.get('fontFace'))
    
    bullets = data.get("bullets", [])
    if img_path:
        if bullets:
            add_bullets(slide, bullets, 0.5, 1.5, 6.0, 5.0, 20, theme['textColor'], theme.get('bodyFontFace'))
            pic = slide.shapes.add_picture(img_path, Inches(7.0), Inches(1.5), height=Inches(4.0))
            pic.left = int(Inches(7.0) + (Inches(5.8) - pic.width) / 2)
        else:
            pic = slide.shapes.add_picture(img_path, Inches(0), Inches(1.5), height=Inches(4.5))
            pic.left = int((Inches(13.333) - pic.width) / 2)
    else:
        if bullets:
            add_bullets(slide, bullets, 1.5, 1.8, 10.33, 5.0, 20, theme['textColor'], theme.get('bodyFontFace'))


def apply_custom_background(slide, bg_data, prs):
    bg_type = bg_data.get('type')
    bg_value = bg_data.get('value', '')
    
    # 1. Background Fill
    if bg_type == 'solid':
        color_rgb = hex_to_rgb(bg_value)
        slide.background.fill.solid()
        slide.background.fill.fore_color.rgb = color_rgb
    
    elif bg_type == 'image' and bg_value.startswith('data:image'):
        try:
            head, data = bg_value.split(',', 1)
            img_data = base64.b64decode(data)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
            temp_file.write(img_data)
            temp_file.close()
            
            # Add full-screen picture as background (send to back)
            pic = slide.shapes.add_picture(temp_file.name, Inches(0), Inches(0), prs.slide_width, prs.slide_height)
            os.remove(temp_file.name)
            
            # Move to back (z-order 0)
            pic._element.addprevious(pic._element.getparent()[0])
            pic._element.getparent().insert(0, pic._element)
        except Exception as e:
            print("Failed to set image background:", e)
            
    elif bg_type == 'gradient' and bg_value:
        try:
            # Simple gradient generator using Pillow
            # e.g., 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
            colors = re.findall(r'#([A-Fa-f0-9]{6})', bg_value)
            if len(colors) >= 2:
                c1 = hex_to_rgb(colors[0])
                c2 = hex_to_rgb(colors[1])
                
                width = 1280
                height = 720
                img = Image.new('RGB', (width, height))
                draw = ImageDraw.Draw(img)
                
                # Draw vertical gradient approximation for simplicity
                for y in range(height):
                    r = int(c1[0] + (c2[0] - c1[0]) * y / height)
                    g = int(c1[1] + (c2[1] - c1[1]) * y / height)
                    b = int(c1[2] + (c2[2] - c1[2]) * y / height)
                    draw.line([(0, y), (width, y)], fill=(r, g, b))
                
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                img.save(temp_file.name)
                temp_file.close()
                
                pic = slide.shapes.add_picture(temp_file.name, Inches(0), Inches(0), prs.slide_width, prs.slide_height)
                os.remove(temp_file.name)
                
                pic._element.addprevious(pic._element.getparent()[0])
                pic._element.getparent().insert(0, pic._element)
        except Exception as e:
            print("Failed to set gradient background:", e)

    # 2. Overlay Logic
    if bg_type in ['image', 'gradient'] and bg_data.get('overlayOpacity', 0) > 0:
        overlay_color = bg_data.get('overlayColor', '#000000')
        opacity = bg_data.get('overlayOpacity', 0.5)
        
        rect = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), prs.slide_width, prs.slide_height)
        set_shape_color(rect, overlay_color.replace('#', ''))
        rect.line.fill.background()
        
        # In PowerPoint, transparency is set on the fill format
        # However, python-pptx doesn't expose transparency directly on solid fill without XML manipulation.
        # We will use an XML hack to set alpha on the solid fill.
        try:
            fill = rect.fill
            fill.solid()
            # Alpha is 0-100000 (100% opaque = 100000, 0% = 0)
            alpha_val = int((1.0 - opacity) * 100000)
            
            # The XML structure for solid fill with alpha:
            # <a:solidFill> <a:srgbClr val="RRGGBB"> <a:alpha val="50000"/> </a:srgbClr> </a:solidFill>
            from pptx.oxml import parse_xml
            alpha_xml = f'<a:alpha xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" val="{alpha_val}"/>'
            
            srgbClr = rect.fill._xPr.solidFill.srgbClr
            if srgbClr is not None:
                srgbClr.append(parse_xml(alpha_xml))
        except Exception as e:
            print("Transparency XML injection failed:", e)

        # Move to back, but in front of background
        rect._element.addprevious(rect._element.getparent()[1])
        rect._element.getparent().insert(1, rect._element)


def export_presentation(data, output_path, custom_bg=None):
    prs = Presentation()
    
    slide_size = data.get("slideSize", "LAYOUT_16x9")
    if slide_size == "LAYOUT_4x3":
        prs.slide_width = Inches(10.0)
        prs.slide_height = Inches(7.5)
    elif slide_size == "LAYOUT_16x10":
        prs.slide_width = Inches(12.0)
        prs.slide_height = Inches(7.5)
    else: # LAYOUT_16x9
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)
    
    # We use a completely blank layout (typically layout 6 in default template)
    blank_slide_layout = prs.slide_layouts[6]
    
    theme = data.get("theme", {
        "bkgd": "FFFFFF", "titleColor": "000000", "textColor": "333333", 
        "accent": "3B82F6", "shapeFill": "F3F4F6"
    })
    
    slides_data = optimize_presentation(data.get("slides", []))
    
    # Track temp images to clean up
    temp_images = []
    
    for sdata in slides_data:
        slide = prs.slides.add_slide(blank_slide_layout)
        if custom_bg:
            apply_custom_background(slide, custom_bg, prs)
        else:
            # Default Background
            background = slide.background
            fill = background.fill
            fill.solid()
            fill.fore_color.rgb = hex_to_rgb(theme.get('bkgd', '000000'))
        
        stype = sdata.get("slide_type", "default")
        img_path = None
        
        if sdata.get("image_base64"):
            img_path = save_base64_image(sdata["image_base64"])
            temp_images.append(img_path)
            
        if stype == "comparison":
            build_comparison_slide(slide, sdata, theme, img_path)
        elif stype == "two_column_image" or stype == "hero_split" or stype == "title_hero":
            build_split_card_slide(slide, sdata, theme, img_path)
        elif stype == "timeline":
            build_timeline_slide(slide, sdata, theme, img_path)
        elif stype == "stat_callout":
            build_stat_slide(slide, sdata, theme, img_path)
        elif stype == "grid_list":
            build_grid_slide(slide, sdata, theme, img_path)
        elif stype == "chart_pie":
            build_chart_slide(slide, sdata, theme, img_path, "pie")
        elif stype == "chart_bar":
            build_chart_slide(slide, sdata, theme, img_path, "bar")
        elif stype == "data_table":
            build_data_table_slide(slide, sdata, theme, img_path)
        elif stype == "bento_grid":
            build_bento_grid_slide(slide, sdata, theme, img_path)
        elif stype == "metric_dashboard":
            build_metric_dashboard_slide(slide, sdata, theme, img_path)
        else:
            build_default_slide(slide, sdata, theme, img_path)
            
    prs.save(output_path)
    
    # Cleanup temp images
    for p in temp_images:
        if os.path.exists(p):
            os.remove(p)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input JSON file path")
    parser.add_argument("--output", required=True, help="Output PPTX file path")

    parser.add_argument("--custom_bg", required=False, help="Custom Background JSON string")

    args = parser.parse_args()
    
    with open(args.input, "r") as f:
        data = json.load(f)
        
    custom_bg_obj = None
    if args.custom_bg:
        custom_bg_obj = json.loads(args.custom_bg)
        
    export_presentation(data, args.output, custom_bg_obj)
    print("SUCCESS")
