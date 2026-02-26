from .base_formatter import BaseFormatter

class JournalFormatter(BaseFormatter):
    """Formatter for journal article references using Harvard rules."""

    def format(self, data: dict) -> str:
        # --- Extract fields ---
        raw_authors = data.get("author", "") or data.get("authors", "")
        year = data.get("year") or "n.d."
        title = data.get("title", "")
        journal = data.get("journal", "")
        volume = data.get("volume", "")
        issue = data.get("issue", "")
        pages = data.get("pages", "")
        url = data.get("url", "")
        accessed = data.get("accessed", "")

        # --- Format authors ---
        authors = self.format_author_string(raw_authors)

        # --- Format title (sentence case + single quotes) ---
        title = f"‘{self.sentence_case(title)}’"

        # --- Format journal title (capitalise major words + italics) ---
        journal = self.italic(self.capitalise_journal_title(journal))

        # --- Volume + issue ---
        if volume and issue:
            vol_issue = f"{volume}({issue})"
        elif volume:
            vol_issue = volume
        else:
            vol_issue = ""

        # --- Pages ---
        pages_part = f"pp. {pages}" if pages else ""

        # --- URL (non-active) ---
        url_part = f"Available at: {url}" if url else ""

        # --- Accessed date ---
        accessed_part = f"(Accessed: {accessed})" if accessed else ""

        # --- Build final reference ---
        parts = [
            f"{authors} ({year}) {title},",
            f"{journal},",
            f"{vol_issue}," if vol_issue else "",
            f"{pages_part}.",
            url_part,
            accessed_part
        ]

        reference = " ".join([p for p in parts if p]).strip()
        return self.clean(reference)

    # ---------------------------------------------------------
    # Helper: Convert "John Smith, Rebecca Jones" → "Smith, J. and Jones, R."
    # ---------------------------------------------------------
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

    # ---------------------------------------------------------
    # Helper: Sentence case for article titles
    # ---------------------------------------------------------
    def sentence_case(self, text: str) -> str:
        if not text:
            return ""
        text = text.strip()
        return text[0].upper() + text[1:].lower()

    # ---------------------------------------------------------
    # Helper: Capitalise major words in journal titles
    # ---------------------------------------------------------
    def capitalise_journal_title(self, title: str) -> str:
        exceptions = {"and", "or", "but", "for", "nor", "the", "a", "an", "of", "in", "on"}
        words = title.split()
        result = []

        for i, w in enumerate(words):
            lw = w.lower()
            if i == 0 or lw not in exceptions:
                result.append(w.capitalize())
            else:
                result.append(lw)

        return " ".join(result)
