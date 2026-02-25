from .base_formatter import BaseFormatter
from datetime import datetime

class WebsiteFormatter(BaseFormatter):
    """Formatter for website references using Harvard rules."""

    def format(self, data: dict) -> str:
        authors = self.format_authors(data.get("authors", []))
        organisation = data.get("organisation") or data.get("website_name", "")
        author_or_org = authors if authors else organisation

        year = data.get("year") or "n.d."
        page_title = data.get("title", "")
        website_name = data.get("website_name", "")
        url = data.get("url", "")

        access_date = data.get("accessed") or datetime.now().strftime("%d %B %Y")

        parts = [
            f"{author_or_org} ({year}) {page_title}.",
            f"{website_name}.",
            f"Available at: {url}",
            f"(Accessed: {access_date})."
        ]

        reference = " ".join([p for p in parts if p]).strip()
        return self.clean(reference)
