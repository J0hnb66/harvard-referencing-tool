import re

class BaseFormatter:
    """Base class for all reference formatters with shared Harvard helpers."""

    def format(self, data: dict) -> str:
        raise NotImplementedError("Subclasses must implement this method.")

    # -------------------------
    # Shared Harvard Formatting
    # -------------------------

    def format_authors(self, author_string: str) -> str:
        """Format one or more authors into Harvard style."""
        if not author_string:
            return ""

        # Split multiple authors by comma or semicolon
        authors = [a.strip() for a in re.split(r"[;,]", author_string) if a.strip()]

        formatted = []
        for name in authors:
            parts = name.split()
            surname = parts[-1]
            initials = " ".join([p[0].upper() + "." for p in parts[:-1]])
            formatted.append(f"{surname}, {initials}")

        if len(formatted) == 1:
            return formatted[0]
        if len(formatted) == 2:
            return f"{formatted[0]} and {formatted[1]}"
        return ", ".join(formatted[:-1]) + f" and {formatted[-1]}"

    def format_edition(self, edition: str) -> str:
        """Convert edition number into Harvard format."""
        if not edition or edition == "1":
            return ""
        return f"{edition} edn."

    def italic(self, text: str) -> str:
        """Return text wrapped in HTML italics."""
        if not text:
            return ""
        return f"<em>{text}</em>"

    def quote(self, text: str) -> str:
        return f"‘{text}’"

    def clean(self, text: str) -> str:
        """Remove double punctuation and tidy spacing."""
        while ".." in text:
            text = text.replace("..", ".")
        return text.strip()
