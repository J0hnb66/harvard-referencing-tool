from flask import Flask, render_template, request, jsonify

from formatters.book_formatter import BookFormatter
from formatters.journal_formatter import JournalFormatter
from formatters.website_formatter import WebsiteFormatter

app = Flask(__name__)

# Formatter mapping
formatters = {
    "book": BookFormatter(),
    "journal": JournalFormatter(),
    "website": WebsiteFormatter(),
}


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/format", methods=["POST"])
def format_reference():
    data = request.json or {}
    source_type = data.get("source_type")
    fields = data.get("fields", {})

    if source_type not in formatters:
        return jsonify({"error": "Invalid source type"}), 400

    formatter = formatters[source_type]
    reference = formatter.format(fields)

    return jsonify({"reference": reference})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8501, debug=True)
