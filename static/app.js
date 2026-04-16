let currentSourceType = null;
let referenceList = [];

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
        { id: "author", label: "Author(s)" },
        { id: "year", label: "Year" },
        { id: "title", label: "Article Title" },
        { id: "journal", label: "Journal Title" },
        { id: "volume", label: "Volume" },
        { id: "issue", label: "Issue" },
        { id: "pages", label: "Pages" },

        // Optional fields
        { id: "doi", label: "DOI (optional)", optional: true },
        { id: "url", label: "URL (optional)", optional: true },
        { id: "accessed", label: "Accessed Date (optional)", optional: true }
    ],

    website: [
        { id: "author", label: "Author(s)" },
        { id: "year", label: "Year" },
        { id: "title", label: "Title" },
        { id: "website_name", label: "Website Name" },
        { id: "url", label: "Paste full URL" },
        { id: "accessed", label: "Date of access (current date unless changed)" }
    ]
};


//AUTO-FORMATTING HELPERS//

function autoCapitaliseTitle(str) {
    if (!str) return "";
    return str.replace(/\b\w+/g, word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    );
}

function autoFixPunctuation(str) {
    if (!str) return "";
    return str
        .replace(/\.\./g, ".")
        .replace(/,,/g, ",")
        .replace(/:\./g, ":")
        .replace(/\s+\./g, ".")
        .replace(/\s+,/g, ",");
}


//  BUILD FORM FIELDS //

function renderFormFields(type) {
    const container = document.getElementById("form-fields");
    container.innerHTML = "";

    const hasOptional = fieldDefinitions[type].some(f => f.optional);

    let toggle = null;
    if (hasOptional) {
        toggle = document.createElement("button");
        toggle.textContent = "Show optional fields";
        toggle.className = "action-btn optional-toggle";
        toggle.dataset.open = "false";
        container.appendChild(toggle);
    }

    const fieldsWrapper = document.createElement("div");
    fieldsWrapper.id = "fields-wrapper";
    container.appendChild(fieldsWrapper);

    fieldDefinitions[type].forEach(field => {
        const wrapper = document.createElement("div");
        wrapper.className = field.optional ? "optional-field hidden" : "field";

        wrapper.innerHTML = `
            <label>${field.label}</label>
            <input type="text" id="${field.id}" />
        `;

        fieldsWrapper.appendChild(wrapper);
    });

    if (toggle) {
        toggle.addEventListener("click", () => {
            const isOpen = toggle.dataset.open === "true";
            toggle.dataset.open = isOpen ? "false" : "true";
            toggle.textContent = isOpen ? "Show optional fields" : "Hide optional fields";

            document.querySelectorAll(".optional-field").forEach(el => {
                el.classList.toggle("hidden");
            });
        });
    }
}


// SEND DATA TO FLASK // ---

async function generateReference() {
    if (!currentSourceType) return;

    const fields = {};
    fieldDefinitions[currentSourceType].forEach(f => {
        fields[f.id] = document.getElementById(f.id).value;
    });

    Object.keys(fields).forEach(id => {
        clearTimeout(window._formatTimer);
        window._formatTimer = setTimeout(() => {
            const inputEl = document.getElementById(id);
            if (!inputEl) return;

            let v = inputEl.value;
            v = v.replace(/\s{2,}/g, " ");

            if (id === "title") v = autoCapitaliseTitle(v);
            if (["title", "author", "journal", "website_name", "publisher", "place"].includes(id))
                v = autoFixPunctuation(v);

            inputEl.value = v;
            fields[id] = v;
        }, 400);
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


// SOURCE BUTTONS //

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


// ACTION BUTTONS //

function setupActionButtons() {
    const copyBtn = document.getElementById("copy-btn");
    const clearBtn = document.getElementById("clear-btn");
    const addBtn = document.getElementById("add-btn");

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

    clearBtn.addEventListener("click", () => {
        if (!currentSourceType) return;

        fieldDefinitions[currentSourceType].forEach(f => {
            document.getElementById(f.id).value = "";
        });

        document.getElementById("reference-output").innerHTML =
            "<em>Your formatted reference will appear here.</em>";
    });

    addBtn.addEventListener("click", () => {
        const previewEl = document.getElementById("reference-output");
        const htmlRef = previewEl.innerHTML;
        const textRef = previewEl.textContent.trim();

        if (textRef === "" || textRef.includes("appear here")) return;

        if (!referenceList.includes(htmlRef)) {
            referenceList.push(htmlRef);
        }

        renderReferenceList();
    });
}


// COPY ALL REFERENCES //

function setupCopyAllButton() {
    const btn = document.getElementById("copy-all-btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        if (referenceList.length === 0) return;

        const htmlBlock = referenceList.map(ref => `<p>${ref}</p>`).join("");

        const temp = document.createElement("div");
        temp.innerHTML = htmlBlock;
        document.body.appendChild(temp);

        const range = document.createRange();
        range.selectNodeContents(temp);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("copy");

        selection.removeAllRanges();
        document.body.removeChild(temp);
    });
}


// SINGLE COMBINED REFERENCE LIST //

function renderReferenceList() {
    const container = document.getElementById("reference-list");
    container.innerHTML = "";

    // Alphabetise by plain text (strip HTML tags)
    referenceList.sort((a, b) =>
        a.replace(/<[^>]+>/g, "").localeCompare(b.replace(/<[^>]+>/g, ""))
    );

    referenceList.forEach((ref, index) => {
        const div = document.createElement("div");
        div.className = "reference-item";

        // Reference text (click to restore)
        const textSpan = document.createElement("span");
        textSpan.className = "reference-text";
        textSpan.innerHTML = ref;

        textSpan.addEventListener("click", () => {
            document.getElementById("reference-output").innerHTML = ref;
        });

        // Delete button (aligned right)
        const del = document.createElement("span");
        del.className = "reference-delete";
        del.textContent = "×";

        del.addEventListener("click", (event) => {
            event.stopPropagation();
            referenceList.splice(index, 1);
            localStorage.setItem("referenceList", JSON.stringify(referenceList));
            renderReferenceList();
        });

        div.appendChild(textSpan);
        div.appendChild(del);
        container.appendChild(div);
    });

    localStorage.setItem("referenceList", JSON.stringify(referenceList));
}



// DOWNLOAD BUTTON //

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
                        text-indent: -20px;
                        margin-left: 20px;
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


// INIT //

document.addEventListener("DOMContentLoaded", () => {

    const saved = localStorage.getItem("referenceList");
    if (saved) {
        referenceList = JSON.parse(saved);
        renderReferenceList();
    }

    setupSourceButtons();
    setupActionButtons();
    setupDownloadButton();
    setupCopyAllButton();
});
