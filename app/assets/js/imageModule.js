export function initImageModule({ els, state, createEl, openModal }) {

    function resizeImage(file, maxWidth) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onerror = () => reject("Failed to read image.");

            reader.onload = () => {
                const img = new Image();

                img.onerror = () => reject("Invalid image.");

                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) return reject("Canvas context unavailable.");

                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => blob ? resolve(blob) : reject("Resize failed"),
                        file.type || "image/jpeg"
                    );
                };

                img.src = reader.result;
            };

            reader.readAsDataURL(file);
        });
    }

    function addTextToImage(blob, text) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onerror = () => reject("Failed to read image blob.");

            reader.onload = () => {
                const img = new Image();

                img.onerror = () => reject("Invalid image.");

                img.onload = () => {
                    const barHeight = 120;

                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height + barHeight;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) return reject("Canvas context unavailable.");

                    ctx.drawImage(img, 0, 0);

                    ctx.fillStyle = "black";
                    ctx.fillRect(0, img.height, canvas.width, barHeight);

                    ctx.fillStyle = "white";
                    ctx.font = `${Math.floor(canvas.width / 15)}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    ctx.fillText(text, canvas.width / 2, img.height + (barHeight / 2));

                    canvas.toBlob(
                        (outputBlob) => outputBlob ? resolve(outputBlob) : reject("Markup failed"),
                        "image/jpeg"
                    );
                };

                img.src = reader.result;
            };

            reader.readAsDataURL(blob);
        });
    }

    function renderPreview(blob, label) {
        const url = URL.createObjectURL(blob);

        const wrapper = createEl("div", { className: "preview-item" });
        wrapper.appendChild(createEl("strong", { text: label }));
        wrapper.appendChild(document.createElement("br"));

        const img = new Image();
        img.src = url;
        img.alt = label;
        img.style.maxWidth = "200px";
        img.style.cursor = "pointer";

        img.addEventListener("click", () => openModal(url));

        const downloadLink = createEl("a", {
            text: "Download Image",
            attrs: {
                href: url,
                download: `${label}.jpg`
            }
        });

        wrapper.appendChild(img);
        wrapper.appendChild(document.createElement("br"));
        wrapper.appendChild(downloadLink);

        els.previewSection.appendChild(wrapper);
    }

    async function generate() {
        const first = els.siteNumber.value.trim();
        const second = els.secondPart.value.trim();
        const file = els.imageInput.files?.[0];

        if (!first || !second || !file) {
            alert("Enter site number, second part, and choose a file.");
            return;
        }

        try {
            let blob = file;

            if (els.resizeCheckbox.checked) {
                blob = await resizeImage(blob, 2048);
            }

            const label = `${first}-${second}`;

            if (els.markupCheckbox.checked) {
                blob = await addTextToImage(blob, label);
            }

            state.allImages.push({ blob, label });
            renderPreview(blob, label);

        } catch (err) {
            console.error(err);
            alert("Error generating image: " + err);
        }
    }

    function downloadAll() {
        if (!state.allImages.length) {
            alert("No images to download.");
            return;
        }

        state.allImages.forEach(({ blob, label }) => {
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${label}.jpg`;

            document.body.appendChild(a);
            a.click();
            a.remove();

            setTimeout(() => URL.revokeObjectURL(url), 0);
        });
    }

    function bindEvents() {
        els.generateBtn.addEventListener("click", generate);
        els.downloadAllBtn.addEventListener("click", downloadAll);
    }

    return { bindEvents };
}