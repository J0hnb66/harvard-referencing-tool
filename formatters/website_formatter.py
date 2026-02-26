from datetime import datetime
from .base_formatter import BaseFormatter

class WebsiteFormatter(BaseFormatter):
    """Formatter for website references using Harvard rules."""

    def format(self, data: dict) -> str:
        # Extract fields
        raw_authors = data.get("author", "") or data.get("authors", "")
        year = data.get("year") or "n.d."
        title = data.get("title", "")
        website_name = data.get("website_name", "")
        url = data.get("url", "")
        accessed = data.get("accessed", "").strip()

        # Auto-fill today's date if user leaves it blank
        if not accessed:
            accessed = datetime.now().strftime("%-d %B %Y")

        # Format author(s)
        authors = self.format_author_string(raw_authors)

        # Format title (sentence case + single quotes)
        title = f"‘{self.sentence_case(title)}’"

        # Italicise website name
        website_name = self.italic(website_name)

        # Build reference
        parts = [
            f"{authors} ({year}) {title},",
            f"{website_name}.",
            f"Available at: {url}",
            f"(Accessed: {accessed})."
        ]

        reference = " ".join([p for p in parts if p]).strip()
        return self.clean(reference)

    # Reuse the same helpers as journal formatter
    def format_author_string(self, raw: str) -> str:
        if not raw:
            return ""
        authors = [a.strip() for a in raw.split(",") if a.strip()]
        formatted = []
        for name in authors:
            parts = name.split()
            surname = parts[-1]
            initials = "".join([p[0].upper() + "." for p in parts[:-1]])
            formatted.append(f"{surname}, {initials}")
        if len(formatted) == 1:
            return formatted[0]
        elif len(formatted) == 2:
            return f"{formatted[0]} and {formatted[1]}"
        else:
            return ", ".join(formatted[:-1]) + " and " + formatted[-1]

    def sentence_case(self, text: str) -> str:
        if not text:
            return ""
        text = text.strip()
        return text[0].upper() + text[1:].lower()
