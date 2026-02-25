from .base_formatter import BaseFormatter

class JournalFormatter(BaseFormatter):
    """Formatter for journal article references using Harvard rules."""

    def format(self, data: dict) -> str:
        authors = self.format_authors(data.get("authors", []))
        year = data.get("year") or "n.d."
        title = self.quote(data.get("title", ""))
        journal = self.italic(data.get("journal", ""))
        volume = data.get("volume", "")
        issue = data.get("issue", "")
        pages = data.get("pages", "")

        if volume and issue:
            vol_issue = f"{volume}({issue})"
        elif volume:
            vol_issue = f"{volume}"
        else:
            vol_issue = ""

        parts = [
            f"{authors} ({year}) {title},",
            f"{journal},",
            f"{vol_issue}," if vol_issue else "",
            f"pp. {pages}."
        ]

        reference = " ".join([p for p in parts if p]).strip()
        return self.clean(reference)
