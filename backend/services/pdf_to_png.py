import sys, os
try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not installed")
    sys.exit(1)

pdf_path = sys.argv[1]
out_dir = sys.argv[2]
basename = os.path.splitext(os.path.basename(pdf_path))[0]

doc = fitz.open(pdf_path)
for i in range(len(doc)):
    page = doc.load_page(i)
    pix = page.get_pixmap(dpi=150)
    out_name = os.path.join(out_dir, f"{basename}-{i}.png")
    pix.save(out_name)