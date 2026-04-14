import { accessToken } from './microsoftAuth.js';
        import {
            storage, storageRef, uploadBytesResumable, getDownloadURL,
            listAll, deleteObject, onAuthStateChanged, auth,
            getBlob, uploadBytes, database, get, ref
        } from './firebase-init.js';

        /* ===============================
           GLOBAL STATE
        ================================ */
        let DATABASE_BASE_PATH = 'public';
        let currentImages = [];
        let currentIndex = -1;
        let currentFolderLoadToken = 0;

        /* ===============================
           DOM REFERENCES
        ================================ */
        const fileUploader = document.getElementById('fileUploader');
        const imageLabel = document.getElementById('imageLabel');
        const imageNameInput = document.getElementById('imageNameInput');
        const markupTextInput = document.getElementById('markupTextInput');
        const uploadButton = document.getElementById('uploadButton');
        const folderDropdown = document.getElementById('folderDropdown');
        const gallery = document.getElementById('gallery');
        const modal = document.getElementById('modal');
        const modalImage = document.getElementById('modalImage');
        const modalFileName = document.getElementById('modalFileName');
        const downloadButton = document.getElementById('downloadButton');
        const deleteButton = document.getElementById('deleteButton');
        const closeModalButton = document.getElementById('closeModalButton');
        const moveButton = document.getElementById('moveButton');
        const moveToFolder = document.getElementById('moveToFolder');
        const imageDropdown = document.getElementById('imageDropdown');

        /* ===============================
           LOADING OVERLAY
        ================================ */
        const loadingOverlay = document.createElement("div");
        loadingOverlay.id = "loadingOverlay";
        loadingOverlay.innerHTML = `
            <div class="spinner"></div>
            <p id="loadingText">Loading...</p>
        `;
        document.body.appendChild(loadingOverlay);

        const loadingText = loadingOverlay.querySelector("#loadingText");

        function showLoading(text = "Loading...") {
            loadingText.textContent = text;
            loadingOverlay.style.display = "flex";
        }

        function hideLoading() {
            loadingOverlay.style.display = "none";
        }

        modal.addEventListener('click', (event) => {
            // Only close if clicking the dark background
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });

        const modalNavLeft = document.getElementById('modalNavLeft');
        const modalNavRight = document.getElementById('modalNavRight');

        modalNavLeft.addEventListener('click', () => {
            if (currentIndex > 0) {
                const prev = currentImages[currentIndex - 1];
                openModal(prev);
            }
        });

        modalNavRight.addEventListener('click', () => {
            if (currentIndex < currentImages.length - 1) {
                const next = currentImages[currentIndex + 1];
                openModal(next);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (modal.style.display !== "flex") return;

            if (e.key === "ArrowLeft" && currentIndex > 0) {
                const prev = currentImages[currentIndex - 1];
                openModal(prev);
            }

            if (e.key === "ArrowRight" && currentIndex < currentImages.length - 1) {
                const next = currentImages[currentIndex + 1];
                openModal(next);
            }

            if (e.key === "Escape") {
                modal.style.display = "none";
            }
        });

        /* ===============================
           AUTH
        ================================ */
        onAuthStateChanged(auth, (user) => {
            DATABASE_BASE_PATH = user ? `${user.uid}` : 'public';
            loadFolderOptions();
        });

        /* ===============================
           UTILITIES
        ================================ */
        function sanitizeInput(input) {
            return input.trim().replace(/\s+/g, "_").replace(/[^\w-]/gi, "");
        }

        imageDropdown.addEventListener('change', () => {
            const selectedOption = imageDropdown.options[imageDropdown.selectedIndex];
            const imageUrl = selectedOption.value;
            const fullPath = selectedOption.dataset.fullPath;
            const fileName = selectedOption.textContent;

            if (!imageUrl || !fullPath) return;

            openModal({
                url: imageUrl,
                fullPath: fullPath,
                name: fileName
            });
        });
        /* ===============================
           IMAGE RESIZE
        ================================ */
        function resizeImage(file, maxWidth) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.src = reader.result;
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        canvas.toBlob(resolve, file.type);
                    };
                };
                reader.readAsDataURL(file);
            });
        }

        /* ===============================
           ADD TEXT TO IMAGE (IMPROVED)
        ================================ */
        function addTextToImage(blob, text) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.src = reader.result;

                    img.onload = () => {

                        const barHeight = Math.floor(img.width * 0.12);
                        const fontSize = Math.floor(img.width / 18);

                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height + barHeight;

                        const ctx = canvas.getContext("2d");

                        // Draw original image
                        ctx.drawImage(img, 0, 0);

                        // Black bar below image
                        ctx.fillStyle = "black";
                        ctx.fillRect(0, img.height, img.width, barHeight);

                        // White centered text
                        ctx.fillStyle = "white";
                        ctx.font = `${fontSize}px Arial`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";

                        ctx.fillText(
                            text,
                            img.width / 2,
                            img.height + barHeight / 2
                        );

                        canvas.toBlob(resolve, "image/jpeg", 0.95);
                    };
                };
                reader.readAsDataURL(blob);
            });
        }

        /* ===============================
           UPLOAD IMAGE
        ================================ */
        uploadButton.addEventListener("click", async () => {

            const files = fileUploader.files;
            if (!files.length) return alert("Select an image.");

            showLoading("Uploading image...");

            try {
                const file = files[0];

                // 🔥 PRIORITY LOGIC
                const typedFolder = sanitizeInput(imageLabel.value);
                const selectedFolder = folderDropdown.value;

                const folder = typedFolder || selectedFolder || "default";

                let imageName = sanitizeInput(imageNameInput.value) ||
                    file.name.split('.').slice(0, -1).join('_');

                const markupText = markupTextInput.value.trim();
                const fileExtension = file.name.split('.').pop();

                let finalFileName = `${imageName}.${fileExtension}`;
                const folderPath = `${DATABASE_BASE_PATH}/tasks/images/${folder}`;

                const existingFiles = await listAll(storageRef(storage, folderPath));
                const existingNames = new Set(existingFiles.items.map(i => i.name));

                let counter = 1;
                while (existingNames.has(finalFileName)) {
                    finalFileName = `${imageName}_${counter++}.${fileExtension}`;
                }

                let blob = await resizeImage(file, 2048);
                if (markupText) blob = await addTextToImage(blob, markupText);

                await uploadBytes(
                    storageRef(storage, `${folderPath}/${finalFileName}`),
                    blob
                );

                alert(`Uploaded to folder: ${folder}`);

                // 🔥 AUTO NAVIGATE TO THAT FOLDER
                await loadFolderOptions();

                folderDropdown.value = folder;
                await loadImages(folder);

            } catch (err) {
                console.error(err);
                alert("Upload failed.");
            } finally {
                hideLoading();
                fileUploader.value = "";
                imageNameInput.value = "";
                markupTextInput.value = "";
                imageLabel.value = "";
            }
        });

        /* ===============================
           LOAD FOLDERS
        ================================ */
        async function loadFolderOptions() {
            folderDropdown.innerHTML = '<option value="">-- Select --</option>';
            moveToFolder.innerHTML = '<option value="">-- Select Destination --</option>';

            const baseRef = storageRef(storage, `${DATABASE_BASE_PATH}/tasks/images`);

            try {
                const snapshot = await listAll(baseRef);

                snapshot.prefixes.forEach(folder => {
                    const option1 = document.createElement('option');
                    option1.value = folder.name;
                    option1.textContent = folder.name;
                    folderDropdown.appendChild(option1);

                    const option2 = document.createElement('option');
                    option2.value = folder.name;
                    option2.textContent = folder.name;
                    moveToFolder.appendChild(option2);
                });

            } catch (err) {
                console.error("Folder load error:", err);
            }
        }
        /* ===============================
           LOAD IMAGES
        ================================ */
        folderDropdown.addEventListener("change", async () => {
            const selected = folderDropdown.value;
            if (!selected) return;

            showLoading("Loading images...");

            // Make sure dropdown truly holds value
            folderDropdown.value = selected;

            await loadImages(selected);

            hideLoading();
        });

        async function loadImages(folder) {
            folderDropdown.value = folder;
            gallery.innerHTML = '';
            currentImages = [];

            const basePath = `${DATABASE_BASE_PATH}/tasks/images/${folder}`;
            const baseRef = storageRef(storage, basePath);

            const baseSnapshot = await listAll(baseRef);

            // Load images directly inside folder
            for (const item of baseSnapshot.items) {
                const url = await getDownloadURL(item);
                currentImages.push({
                    url,
                    fullPath: item.fullPath,
                    name: item.name
                });
            }

            // Load images inside subfolders
            for (const subfolder of baseSnapshot.prefixes) {
                const subSnap = await listAll(subfolder);
                for (const item of subSnap.items) {
                    const url = await getDownloadURL(item);
                    currentImages.push({
                        url,
                        fullPath: item.fullPath,
                        name: item.name
                    });
                }
            }

            renderImages();
        }

        moveButton.addEventListener('click', async () => {
            const fullPath = modal.dataset.fullPath;
            const toFolder = moveToFolder.value;

            if (!fullPath) {
                alert("No image selected.");
                return;
            }

            if (!toFolder) {
                alert("Select a destination folder.");
                return;
            }

            const fileName = fullPath.split('/').pop();

            showLoading("Moving image...");

            try {
                const fromRef = storageRef(storage, fullPath);
                const blob = await getBlob(fromRef);

                const newPath = `${DATABASE_BASE_PATH}/tasks/images/${toFolder}/${fileName}`;
                const toRef = storageRef(storage, newPath);

                await uploadBytes(toRef, blob);
                await deleteObject(fromRef);

                alert(`Moved "${fileName}" to "${toFolder}"`);

                modal.style.display = "none";
                await loadImages(folderDropdown.value);

            } catch (error) {
                console.error("Move failed:", error);
                alert("Failed to move image.");
            } finally {
                hideLoading();
            }
        });
        function renderImages() {
            gallery.innerHTML = '';
            imageDropdown.innerHTML = '<option value="">-- Select --</option>';

            currentImages.forEach(item => {
                const img = document.createElement('img');
                img.src = item.url;
                img.className = "thumbnail";
                img.onclick = () => openModal(item);
                gallery.appendChild(img);

                const option = document.createElement('option');
                option.value = item.url;
                option.textContent = item.name;
                option.dataset.fullPath = item.fullPath;
                imageDropdown.appendChild(option);
            });
        }

        /* ===============================
           MODAL
        ================================ */
        function openModal(item) {
            modal.style.display = "flex";
            modalImage.src = item.url;
            modal.dataset.fullPath = item.fullPath;

            // Show file name
            modalFileName.textContent = item.name;

            currentIndex = currentImages.findIndex(
                i => i.fullPath === item.fullPath
            );
        }

        closeModalButton.onclick = () => modal.style.display = "none";

        deleteButton.onclick = async () => {
            if (!confirm("Delete this image?")) return;
            showLoading("Deleting...");
            try {
                await deleteObject(storageRef(storage, modal.dataset.fullPath));
                modal.style.display = "none";
                await loadImages(folderDropdown.value);
            } finally {
                hideLoading();
            }
        };

        /* ===============================
           APPLY MARKUP TO EXISTING IMAGE
        ================================ */
        const editMarkupInput = document.createElement("input");
        editMarkupInput.placeholder = "Add markup...";
        const applyMarkupButton = document.createElement("button");
        applyMarkupButton.textContent = "Apply Markup";
        document.getElementById("modalContent").append(editMarkupInput, applyMarkupButton);
        const removeMarkupButton = document.createElement("button");
        removeMarkupButton.textContent = "Remove Markup";
        document.getElementById("modalContent").append(removeMarkupButton);

        applyMarkupButton.onclick = async () => {
            const text = editMarkupInput.value.trim();
            if (!text) return alert("Enter markup text.");

            showLoading("Applying markup...");
            try {
                const refImage = storageRef(storage, modal.dataset.fullPath);
                const blob = await getBlob(refImage);
                const newBlob = await addTextToImage(blob, text);
                await uploadBytes(refImage, newBlob);
                modal.style.display = "none";
                await loadImages(folderDropdown.value);
            } finally {
                hideLoading();
            }
        };

        removeMarkupButton.onclick = async () => {

            if (!modal.dataset.fullPath) {
                alert("No image selected.");
                return;
            }

            if (!confirm("Remove markup from this image?")) return;

            showLoading("Removing markup...");

            try {
                const imageRef = storageRef(storage, modal.dataset.fullPath);
                const blob = await getBlob(imageRef);

                const reader = new FileReader();
                reader.onload = async () => {
                    const img = new Image();
                    img.src = reader.result;

                    img.onload = async () => {

                        // 🔥 SAME FORMULA used in markup
                        const barHeight = Math.floor(img.width * 0.12);

                        // Safety check
                        if (img.height <= barHeight) {
                            alert("Image too small to remove markup.");
                            hideLoading();
                            return;
                        }

                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height - barHeight;

                        const ctx = canvas.getContext("2d");

                        // Crop bottom portion off
                        ctx.drawImage(
                            img,
                            0,
                            0,
                            img.width,
                            img.height - barHeight,
                            0,
                            0,
                            img.width,
                            img.height - barHeight
                        );

                        canvas.toBlob(async (croppedBlob) => {
                            await uploadBytes(imageRef, croppedBlob);

                            modal.style.display = "none";
                            await loadImages(folderDropdown.value);
                            hideLoading();
                        }, "image/jpeg", 0.95);
                    };
                };

                reader.readAsDataURL(blob);

            } catch (err) {
                console.error("Remove markup failed:", err);
                alert("Failed to remove markup.");
                hideLoading();
            }
        };
