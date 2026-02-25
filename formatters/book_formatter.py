from .base_formatter import BaseFormatter

class BookFormatter(BaseFormatter):
    """Formatter for book references using Harvard rules."""

    def format(self, data: dict) -> str:
        # Correct: use "author" (string)
        authors = self.format_authors(data.get("author", ""))

        year = data.get("year") or "n.d."
        title = self.italic(data.get("title", ""))
        edition = self.format_edition(data.get("edition"))
        place = data.get("place", "")
        publisher = data.get("publisher", "")

        parts = [
            f"{authors} ({year}) {title}.",
            f"{edition}" if edition else "",
            f"{place}: {publisher}."
        ]

        reference = " ".join([p for p in parts if p]).strip()
        return self.clean(reference)
