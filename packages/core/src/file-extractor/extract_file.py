#!/usr/bin/env python3
import argparse
import csv
import html
import json
import mimetypes
import re
import zipfile
from pathlib import Path

from markitdown import MarkItDown


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
    return {
        "kind": kind,
        "content": content,
        "metadata": {"filename": path.name, "parser": "markitdown"},
    }


def extract(path: Path) -> dict:
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
    if path.suffix.lower() in MARKITDOWN_EXTENSIONS or kind in {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"}:
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
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    result = extract(input_path)
    output_path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
