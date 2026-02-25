let currentSourceType = null;
let referenceList = [];
let history = [];

// Field definitions for each source type
const fieldDefinitions = {
    book: [
        { id: "author", label: "Author(s)" },
        { id: "year", label: "Year" },
        { id: "title", label: "Title" },
        { id: "edition", label: "Edition (leave blank for 1st)" },
        { id: "place", label: "Place of Publication" },
        { id: "publisher", label: "Publisher" }
    ],
    journal: [
        { id: "author", label: "Author" },
        { id: "year", label: "Year" },
        { id: "title", label: "Article Title" },
        { id: "journal", label: "Journal Title" },
        { id: "volume", label: "Volume" },
        { id: "issue", label: "Issue" },
        { id: "pages", label: "Pages" }
    ],
    website: [
        { id: "author", label: "Author" },
        { id: "year", label: "Year" },
        { id: "title", label: "Title" },
        { id: "website_name", label: "Website Name" },
        { id: "url", label: "URL" },
        { id: "accessed", label: "Accessed Date" }
    ]
};


// ------------------------------
// BUILD FORM FIELDS
// ------------------------------
function renderFormFields(type) {
    const container = document.getElementById("form-fields");
    container.innerHTML = "";

    fieldDefinitions[type].forEach(field => {
        const wrapper = document.createElement("div");

        wrapper.innerHTML = `
            <label>${field.label}</label>
            <input type="text" id="${field.id}" />
        `;

        container.appendChild(wrapper);
    });
}


// ------------------------------
// SEND DATA TO FLASK (PREVIEW ONLY)
// ------------------------------
async function generateReference() {
    if (!currentSourceType) return;

    const fields = {};
    fieldDefinitions[currentSourceType].forEach(f => {
        fields[f.id] = document.getElementById(f.id).value;
    });

    const output = document.getElementById("reference-output");

    try {
        const response = await fetch("/format", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                source_type: currentSourceType,
                fields: fields
            })
        });

        const data = await response.json();

        if (data.error) {
            output.innerHTML = `<span style="color:red;">${data.error}</span>`;
            return;
        }

        output.innerHTML = data.reference;

    } catch (err) {
        output.innerHTML = `<span style="color:red;">Connection error.</span>`;
    }
}


// ------------------------------
// BUTTON HANDLING (Book / Journal / Website)
// ------------------------------
function setupSourceButtons() {
    const buttons = document.querySelectorAll(".source-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentSourceType = btn.dataset.type;
            renderFormFields(currentSourceType);

            setTimeout(() => {
                document.querySelectorAll("#form-fields input").forEach(input => {
                    input.addEventListener("input", generateReference);
                });
            }, 50);
        });
    });
}


// ------------------------------
// ACTION BUTTONS (Copy, Clear, Add to List)
// ------------------------------
function setupActionButtons() {
    const copyBtn = document.getElementById("copy-btn");
    const clearBtn = document.getElementById("clear-btn");
    const addBtn = document.getElementById("add-btn");
    const clearHistoryBtn = document.getElementById("clear-history-btn");

    // Copy rich text so Word keeps italics
    copyBtn.addEventListener("click", () => {
        const output = document.getElementById("reference-output");

        const range = document.createRange();
        range.selectNodeContents(output);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("copy");

        selection.removeAllRanges();
    });

    // Clear all fields
    clearBtn.addEventListener("click", () => {
        if (!currentSourceType) return;

        fieldDefinitions[currentSourceType].forEach(f => {
            document.getElementById(f.id).value = "";
        });

        document.getElementById("reference-output").innerHTML =
            "<em>Your formatted reference will appear here.</em>";
    });

    // Add to reference list AND history (user-controlled)
    addBtn.addEventListener("click", () => {
        const previewEl = document.getElementById("reference-output");
        const htmlRef = previewEl.innerHTML;
        const textRef = previewEl.textContent.trim();

        if (textRef === "" || textRef.includes("appear here")) return;

        // Store HTML in referenceList so formatting is preserved
        if (!referenceList.includes(htmlRef)) {
            referenceList.push(htmlRef);
            referenceList.sort((a, b) =>
                a.replace(/<[^>]+>/g, "").localeCompare(b.replace(/<[^>]+>/g, ""))
            );
        }

        // Add to history (HTML version)
        if (!history.includes(htmlRef)) {
            history.push(htmlRef);
            if (history.length > 50) history.shift();
            localStorage.setItem("history", JSON.stringify(history));
        }

        renderReferenceList();
        renderHistory();
    });

    // Clear history
    clearHistoryBtn.addEventListener("click", () => {
        history = [];
        localStorage.removeItem("history");
        renderHistory();
    });
}


// ------------------------------
// RENDER REFERENCE LIST
// ------------------------------
function renderReferenceList() {
    const container = document.getElementById("reference-list");
    container.innerHTML = "";

    referenceList.forEach((ref, index) => {
        const div = document.createElement("div");
        div.innerHTML = `${index + 1}. ${ref}`;
        container.appendChild(div);
    });
}


// ------------------------------
// RENDER HISTORY
// ------------------------------
function renderHistory() {
    const box = document.getElementById("history-box");
    box.innerHTML = "";

    history.forEach((ref, index) => {
        const div = document.createElement("div");
        div.className = "history-item";

        const textSpan = document.createElement("span");
        textSpan.className = "history-text";
        textSpan.innerHTML = ref;

        textSpan.addEventListener("click", () => {
            document.getElementById("reference-output").innerHTML = ref;
        });

        const del = document.createElement("span");
        del.className = "history-delete";
        del.textContent = "×";

        del.addEventListener("click", (event) => {
            event.stopPropagation();
            history.splice(index, 1);
            localStorage.setItem("history", JSON.stringify(history));
            renderHistory();
        });

        div.appendChild(textSpan);
        div.appendChild(del);
        box.appendChild(div);
    });
}


// ------------------------------
// DOWNLOAD BUTTON (FORMATTED, USER-FRIENDLY)
// ------------------------------
function setupDownloadButton() {
    const btn = document.getElementById("download-btn");

    btn.addEventListener("click", () => {
        if (referenceList.length === 0) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Reference List</title>
                <style>
                    body {
                        font-family: "Segoe UI", Arial, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        margin: 40px;
                    }
                    h1 {
                        font-size: 22px;
                        margin-bottom: 20px;
                    }
                    p {
                        margin: 0 0 12px 0;
                    }
                </style>
            </head>
            <body>
                <h1>Reference List</h1>
                ${referenceList.map(ref => `<p>${ref}</p>`).join("")}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "references.html";
        a.click();

        URL.revokeObjectURL(url);
    });
}


// ------------------------------
// INIT
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {

    const savedHistory = localStorage.getItem("history");
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        renderHistory();
    }

    setupSourceButtons();
    setupActionButtons();
    setupDownloadButton();
});
