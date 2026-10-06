from .base_formatter import BaseFormatter

class BookFormatter(BaseFormatter):
    """Formatter for book references using Harvard rules."""

    def remove_trailing_full_stop(self, text: str) -> str:
        """Ensure organisation names do not end with a full stop."""
        return text.rstrip().rstrip(".")

    def format(self, data: dict) -> str:
        # Extract fields
        raw_author = data.get("author", "").strip()
        year = data.get("year") or "n.d."
        title = self.italic(data.get("title", ""))
        edition = self.format_edition(data.get("edition"))
        place = data.get("place", "")
        publisher = data.get("publisher", "")

        # --- Handle personal vs corporate authors ---
        if raw_author:
            # Personal author(s)
            authors = self.format_authors(raw_author)
        else:
            # No personal author → use publisher or organisation name
            authors = self.remove_trailing_full_stop(publisher.strip())

        # Build reference (IMPORTANT: no full stop after authors)
        parts = [
            f"{authors} ({year}) {title}.",
            f"{edition}" if edition else "",
            f"{place}: {publisher}."
        ]

        reference = " ".join([p for p in parts if p]).strip()
        return self.clean(reference)
