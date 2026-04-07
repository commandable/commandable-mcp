#!/usr/bin/env python3
import argparse
import base64
import csv
import html
import json
import mimetypes
import re
import zipfile
from pathlib import Path

from markitdown import MarkItDown

try:
    import fitz  # PyMuPDF
    _FITZ_AVAILABLE = True
except ImportError:
    _FITZ_AVAILABLE = False


def collapse_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def join_blocks(blocks):
    cleaned = [str(block).strip() for block in blocks if str(block or "").strip()]
    return "\n\n".join(cleaned).strip()


MARKITDOWN_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
}


DIRECT_TEXT_EXTENSIONS = {
    ".txt",
    ".md",
    ".mdx",
    ".rtf",
    ".log",
    ".json",
    ".xml",
    ".csv",
    ".yaml",
    ".yml",
    ".ini",
    ".cfg",
    ".properties",
    ".html",
    ".htm",
}


def sniff_kind(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in DIRECT_TEXT_EXTENSIONS | MARKITDOWN_EXTENSIONS:
        return suffix.lstrip(".")

    mime_guess, _ = mimetypes.guess_type(path.name)
    if mime_guess == "application/pdf":
        return "pdf"

    with path.open("rb") as handle:
        prefix = handle.read(16)
    if prefix.startswith(b"%PDF"):
        return "pdf"

    if zipfile.is_zipfile(path):
        with zipfile.ZipFile(path, "r") as archive:
            names = set(archive.namelist())
            if "word/document.xml" in names:
                return "docx"
            if "xl/workbook.xml" in names:
                return "xlsx"
            if "ppt/presentation.xml" in names:
                return "pptx"

    return "unknown"


def parse_pdf_date(date_str: str):
    """Parse a PDF date string (D:YYYYMMDDHHmmSS...) to ISO-8601."""
    if not date_str or not isinstance(date_str, str) or not date_str.startswith("D:"):
        return None
    try:
        raw = date_str[2:]
        m = re.match(r"(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})", raw)
        if not m:
            return None
        y, mo, d, h, mi, s = m.groups()
        return f"{y}-{mo}-{d}T{h}:{mi}:{s}Z"
    except Exception:
        return None


def get_xlsx_sheet_names(path: Path) -> list:
    try:
        with zipfile.ZipFile(path, "r") as archive:
            if "xl/workbook.xml" not in archive.namelist():
                return []
            content = archive.read("xl/workbook.xml").decode("utf-8", errors="replace")
            return re.findall(r'<sheet\b[^>]+\bname="([^"]+)"', content)
    except Exception:
        return []


def get_pptx_slide_count(path: Path) -> int:
    try:
        with zipfile.ZipFile(path, "r") as archive:
            return sum(
                1 for name in archive.namelist()
                if re.match(r"ppt/slides/slide\d+\.xml$", name)
            )
    except Exception:
        return 0


def get_office_core_props(path: Path) -> dict:
    """Read author and lastModifiedBy from docProps/core.xml (all Office formats)."""
    try:
        with zipfile.ZipFile(path, "r") as archive:
            if "docProps/core.xml" not in archive.namelist():
                return {}
            content = archive.read("docProps/core.xml").decode("utf-8", errors="replace")
            props = {}
            m = re.search(r"<dc:creator[^>]*>([^<]+)</dc:creator>", content)
            if m:
                props["author"] = m.group(1).strip()
            m = re.search(r"<cp:lastModifiedBy[^>]*>([^<]+)</cp:lastModifiedBy>", content)
            if m:
                props["lastModifiedBy"] = m.group(1).strip()
            return props
    except Exception:
        return {}


def has_tracked_changes_docx(path: Path) -> bool:
    try:
        with zipfile.ZipFile(path, "r") as archive:
            if "word/document.xml" not in archive.namelist():
                return False
            content = archive.read("word/document.xml").decode("utf-8", errors="replace")
            return bool(re.search(r"<w:(del|ins)\s", content))
    except Exception:
        return False


def read_text(path: Path) -> dict:
    content = path.read_text(encoding="utf-8", errors="replace").strip()
    return {"kind": "text", "content": content, "metadata": {"filename": path.name}}


def read_markdown(path: Path) -> dict:
    content = path.read_text(encoding="utf-8", errors="replace").strip()
    return {"kind": "markdown", "content": content, "metadata": {"filename": path.name}}


def read_json(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8", errors="replace")
    try:
        data = json.loads(raw)
        content = json.dumps(data, indent=2, ensure_ascii=False)
    except Exception:
        content = raw
    return {"kind": "json", "content": content.strip(), "metadata": {"filename": path.name}}


def read_html(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8", errors="replace")
    text = re.sub(r"<script[\s\S]*?</script>", " ", raw, flags=re.IGNORECASE)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</(p|div|section|article|li|tr|h[1-6])>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return {"kind": "html", "content": text, "metadata": {"filename": path.name}}


def read_csv_file(path: Path) -> dict:
    with path.open("r", encoding="utf-8", errors="replace", newline="") as handle:
        reader = csv.reader(handle)
        rows = list(reader)

    if not rows:
        return {"kind": "csv", "content": "", "metadata": {"filename": path.name, "rowCount": 0}}

    header_width = max(len(row) for row in rows)
    normalized = [row + [""] * (header_width - len(row)) for row in rows]
    headers = normalized[0]
    body = normalized[1:]

    md_rows = [
        f"| {' | '.join(headers)} |",
        f"| {' | '.join(['---'] * header_width)} |",
    ]
    md_rows.extend(f"| {' | '.join(row)} |" for row in body[:200])
    warnings = []
    if len(body) > 200:
        warnings.append("CSV output truncated to first 200 data rows.")

    return {
        "kind": "csv",
        "content": "\n".join(md_rows).strip(),
        "warnings": warnings or None,
        "metadata": {"filename": path.name, "rowCount": len(body), "columnCount": header_width},
    }


def read_with_markitdown(path: Path, kind: str) -> dict:
    try:
        result = MarkItDown().convert(str(path))
    except Exception as exc:
        raise RuntimeError(f"MarkItDown extraction failed for {path.name}: {exc}") from exc

    content = (getattr(result, "text_content", "") or "").strip()
    metadata: dict = {"filename": path.name, "parser": "markitdown"}

    # XLSX: surface sheet names so the agent knows the workbook structure upfront.
    if kind == "xlsx":
        sheet_names = get_xlsx_sheet_names(path)
        if sheet_names:
            metadata["sheetNames"] = sheet_names

    # DOCX: tracked changes flag + author metadata from core properties.
    if kind == "docx":
        metadata["hasTrackedChanges"] = has_tracked_changes_docx(path)
        core = get_office_core_props(path)
        if core.get("author"):
            metadata["author"] = core["author"]
        if core.get("lastModifiedBy"):
            metadata["lastModifiedBy"] = core["lastModifiedBy"]

    # PPTX: slide count.
    if kind == "pptx":
        count = get_pptx_slide_count(path)
        if count:
            metadata["slideCount"] = count

    return {
        "kind": kind,
        "content": content,
        "metadata": metadata,
    }


def read_pdf(path: Path, preview_pages: int = 0) -> dict:
    # Text extraction via MarkItDown (higher quality than pymupdf for most PDFs).
    try:
        md_result = MarkItDown().convert(str(path))
        content = (getattr(md_result, "text_content", "") or "").strip()
    except Exception as exc:
        raise RuntimeError(f"MarkItDown extraction failed for {path.name}: {exc}") from exc

    metadata: dict = {"filename": path.name, "parser": "markitdown"}

    if not _FITZ_AVAILABLE:
        return {"kind": "pdf", "content": content, "metadata": metadata}

    page_images = []

    try:
        doc = fitz.open(str(path))
        page_count = doc.page_count
        metadata["pageCount"] = page_count

        # Document info dictionary (title, author, etc.)
        info = doc.metadata or {}
        for src_key, out_key in [
            ("title", "title"),
            ("author", "author"),
            ("subject", "subject"),
            ("keywords", "keywords"),
            ("creator", "creator"),
        ]:
            val = (info.get(src_key) or "").strip()
            if val:
                metadata[out_key] = val

        created = parse_pdf_date(info.get("creationDate", ""))
        if created:
            metadata["createdAt"] = created
        modified = parse_pdf_date(info.get("modDate", ""))
        if modified:
            metadata["modifiedAt"] = modified

        metadata["isEncrypted"] = bool(doc.is_encrypted)

        # Single pass over all pages: signatures, annotations, form fields.
        sig_widget_type = getattr(fitz, "PDF_WIDGET_TYPE_SIGNATURE", 7)
        non_content_annot_types = {"Widget", "Link"}
        has_annotations = False
        has_form_fields = False
        signatures = []

        for i in range(page_count):
            page = doc.load_page(i)

            # Widgets: split into signatures and fillable form fields.
            for widget in (page.widgets() or []):
                if widget.field_type == sig_widget_type:
                    signer = (widget.field_value or "").strip() or None
                    signatures.append({
                        "fieldName": (widget.field_name or "").strip() or None,
                        "signer": signer,
                        "isSigned": bool(signer),
                    })
                else:
                    has_form_fields = True

            # Annotations: exclude widget and link annotations.
            if not has_annotations:
                for annot in page.annots():
                    if annot.type[1] not in non_content_annot_types:
                        has_annotations = True
                        break

        metadata["hasAnnotations"] = has_annotations
        metadata["hasFormFields"] = has_form_fields
        if signatures:
            metadata["signatures"] = signatures

        # Page preview images (opt-in via previewPages > 0).
        if preview_pages > 0:
            n = min(preview_pages, page_count)
            for i in range(n):
                pixmap = doc.load_page(i).get_pixmap(dpi=96)
                jpeg_bytes = pixmap.tobytes("jpeg")
                page_images.append(base64.b64encode(jpeg_bytes).decode("ascii"))

        doc.close()

    except Exception:
        pass  # Metadata and image enhancement is best-effort; don't fail the extraction.

    result: dict = {"kind": "pdf", "content": content, "metadata": metadata}
    if page_images:
        result["pageImages"] = page_images
    return result


def extract(path: Path, preview_pages: int = 0) -> dict:
    kind = sniff_kind(path)
    if kind == "txt":
        return read_text(path)
    if kind == "md":
        return read_markdown(path)
    if kind == "json":
        return read_json(path)
    if kind in {"html", "htm"}:
        return read_html(path)
    if kind == "csv":
        return read_csv_file(path)
    if kind == "pdf":
        return read_pdf(path, preview_pages)
    if path.suffix.lower() in MARKITDOWN_EXTENSIONS or kind in {"doc", "docx", "xls", "xlsx", "ppt", "pptx"}:
        return read_with_markitdown(path, kind)

    raw = path.read_text(encoding="utf-8", errors="replace")
    return {
        "kind": "unknown",
        "content": raw.strip(),
        "warnings": ["Unknown file type; returned best-effort UTF-8 text decode."],
        "metadata": {"filename": path.name},
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--preview-pages", type=int, default=0)
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    result = extract(input_path, preview_pages=args.preview_pages)
    output_path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
