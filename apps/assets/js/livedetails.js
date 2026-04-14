import {
            auth, onAuthStateChanged, database, storage,
            ref as dbRef, set, update, get,
            storageRef, uploadBytes, getDownloadURL, listAll, deleteObject
        } from './firebase-init.js';

        import { accessToken, isTokenExpired } from '../apps/assets/js/microsoftAuth.js';
        import { getIP, updateVisitCount } from '../assets/js/visitLogger.js';

        let currentProject = '';
        let expectedSensors = 0;
        let modalItems = [];
        let modalIndex = 0;
        let DATABASE_BASE_PATH = 'public';
        let isLoadingProject = false;
        let currentProjectName = '';
        let currentCustomerName = '';
        let metaOwnerTaskId = '';
        let allProjects = [];

        const ADMIN_PASSWORD = "telaidadmin";
        const sanitize = str => (str || '').trim().replace(/\s+/g, '_');
        const normKey = s => (s || '').trim().toLowerCase();

        function getStorageFolderKey() {
            // Prefer customerName, fallback to projectName, then task id
            const cust = sanitize(currentCustomerName || '');
            const proj = sanitize(currentProjectName || '');
            return cust || proj || sanitize(currentProject || '');
        }

        // Choose best/freshest timestamp for a task
        function bestTime(task, id) {
            const candidates = [
                Number(task.updatedAt) || 0,
                Number(task.createdAt) || 0,
                Number(task.startTime) || 0,
                Number(task.timestamp) || 0,
                Number(id) || 0, // many IDs are Date.now()
            ];
            return Math.max(...candidates);
        }

        onAuthStateChanged(auth, (user) => {
            DATABASE_BASE_PATH = user ? user.uid : 'public';
            populateProjects();
        });

        let validated = false;

        async function validateCode() {
            const input = document.getElementById('accessCode').value.trim().toLowerCase();
            if (!input) return alert("Project ID cannot be blank.");

            const snapshot = await get(dbRef(database, `${DATABASE_BASE_PATH}/tasks`));
            if (!snapshot.exists()) return alert('No tasks found.');

            const tasks = snapshot.val();

            // ✅ 1) If they entered an exact numeric ID and it exists, use it
            if (/^\d+$/.test(input) && tasks[input]) {
                const matchedID = input;
                localStorage.setItem('lastProject', matchedID);
                validated = true;

                document.getElementById('authScreen')?.remove();
                document.getElementById('mainApp')?.classList.remove('hidden');

                await populateProjects();
                document.getElementById('projectList').value = matchedID;
                await loadProject(matchedID);
                return;
            }

            // ✅ 2) Otherwise match by project code, but pick the newest deterministically
            const matches = Object.entries(tasks)
                .filter(([id, data]) => (data.project || '').trim().toLowerCase() === input);

            if (matches.length) {
                matches.sort((a, b) => bestTime(b[1], b[0]) - bestTime(a[1], a[0]));
                const [matchedID] = matches[0];

                localStorage.setItem('lastProject', matchedID);
                validated = true;

                document.getElementById('authScreen')?.remove();
                document.getElementById('mainApp')?.classList.remove('hidden');

                await populateProjects();
                document.getElementById('projectList').value = matchedID;
                await loadProject(matchedID);
                return;
            }

            // Not found -> create flow
            const shouldCreate = confirm(`Project "${input}" not found. Would you like to create it?`);
            if (!shouldCreate) return;

            const inputPassword = prompt("Enter password to create a new project:");
            if (inputPassword !== ADMIN_PASSWORD) return alert("Incorrect password.");

            const newTimestamp = Date.now().toString();
            const taskRef = dbRef(database, `${DATABASE_BASE_PATH}/tasks/${newTimestamp}`);

            // NOTE: customerName is unknown at create-time here, so sensorCount defaults 0.
            // Once customerName is set (in your task system), owner anchoring takes over.
            await update(taskRef, {
                id: newTimestamp,
                project: input,
                sensorCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            localStorage.setItem('lastProject', newTimestamp);
            validated = true;

            alert("New project created. Please enter the total sensors and save.");
            document.getElementById('authScreen')?.remove();
            document.getElementById('mainApp')?.classList.remove('hidden');

            await populateProjects();
            document.getElementById('projectList').value = newTimestamp;
            await loadProject(newTimestamp);
        }

        document.getElementById('autoValidateBtn').addEventListener('click', async () => {
            const tasksSnapshot = await get(dbRef(database, `${DATABASE_BASE_PATH}/tasks`));
            if (!tasksSnapshot.exists()) {
                alert("No projects found.");
                return;
            }

            const tasks = tasksSnapshot.val();
            const taskEntries = Object.entries(tasks);
            if (taskEntries.length === 0) {
                alert("No projects available.");
                return;
            }

            let selectedID;

            const lastProjectID = localStorage.getItem('lastProject');
            const foundLast = taskEntries.find(([id]) => id === lastProjectID);
            if (lastProjectID && foundLast) {
                selectedID = lastProjectID;
            } else {
                const randomEntry = taskEntries[Math.floor(Math.random() * taskEntries.length)];
                selectedID = randomEntry[0];
            }

            validated = true;
            document.getElementById('authScreen')?.remove();
            document.getElementById('mainApp')?.classList.remove('hidden');
            localStorage.setItem('lastProject', selectedID);
            await populateProjects();
            document.getElementById('projectList').value = selectedID;
            await loadProject(selectedID);
        });

        document.getElementById('submitCode').addEventListener('click', validateCode);
        document.getElementById('accessCode').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                validateCode();
            }
        });

        const resizeImage = (file, maxWidth) => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    let [w, h] = [img.width, img.height];
                    if (w > maxWidth) h *= maxWidth / w, w = maxWidth;
                    const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob(resolve, file.type);
                };
            };
            reader.readAsDataURL(file);
        });

        const addTextToImage = (blob, text) => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = Object.assign(document.createElement('canvas'), {
                        width: img.width,
                        height: img.height + 100
                    });
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    ctx.fillStyle = 'white';
                    ctx.font = '80px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(text, canvas.width / 2, canvas.height - 20);
                    canvas.toBlob(resolve, 'image/jpeg');
                };
            };
            reader.readAsDataURL(blob);
        });

        async function resolveMetaOwnerTaskId() {
            metaOwnerTaskId = currentProject;

            const projKey = normKey(currentProjectName);
            const custKey = normKey(currentCustomerName);
            if (!projKey && !custKey) return metaOwnerTaskId;
            const snap = await get(dbRef(database, `${DATABASE_BASE_PATH}/tasks`));
            if (!snap.exists()) return metaOwnerTaskId;

            const tasks = snap.val();
            const matches = Object.entries(tasks)
                .filter(([id, t]) => normKey(t.project) === projKey && normKey(t.customerName) === custKey);

            if (!matches.length) return metaOwnerTaskId;

            matches.sort((a, b) => bestTime(a[1], a[0]) - bestTime(b[1], b[0])); // oldest first
            metaOwnerTaskId = matches[0][0];
            return metaOwnerTaskId;
        }

        function sensorMetaBasePath() {
            return `${DATABASE_BASE_PATH}/tasks/${metaOwnerTaskId}/sensorMeta`;
        }

        function commentsBasePath() {
            return `${DATABASE_BASE_PATH}/tasks/${metaOwnerTaskId}/comments`;
        }

        async function populateProjects() {
            const dropdown = document.getElementById('projectList');
            dropdown.innerHTML = '';
            dropdown.appendChild(new Option('-- Choose a customer --', ''));

            const snap = await get(dbRef(database, `${DATABASE_BASE_PATH}/tasks`));
            if (!snap.exists()) return;

            const tasks = snap.val();

            const byCustomer = new Map();

            for (const [id, task] of Object.entries(tasks)) {
                const customerRaw = (task.customerName || '').trim();
                if (!customerRaw) continue;

                const custKey = customerRaw.toLowerCase();
                const time = bestTime(task, id);
                const entry = byCustomer.get(custKey);

                if (!entry) {
                    byCustomer.set(custKey, {
                        ownerId: id,
                        ownerTask: task,
                        ownerTime: time,
                        newestTime: time
                    });
                } else {
                    // track newest activity
                    if (time > entry.newestTime) entry.newestTime = time;

                    // track oldest (first project ever)
                    if (time < entry.ownerTime) {
                        entry.ownerTime = time;
                        entry.ownerId = id;
                        entry.ownerTask = task;
                    }
                }
            }

            const sorted = [...byCustomer.values()]
                .sort((a, b) => b.newestTime - a.newestTime);

            allProjects = sorted.map(entry => {
                const customer = entry.ownerTask.customerName?.trim() || '';
                const project = entry.ownerTask.project?.trim() || '';
                return {
                    id: entry.ownerId,
                    customer,
                    project,
                    label: `${customer || '(No Customer)'} — ${project || '(No Project)'}`
                };
            });

            dropdown.innerHTML = '<option value="">-- Choose a customer --</option>';
            allProjects.forEach(p => {
                dropdown.appendChild(new Option(p.label, p.id));
            });
        }

        async function loadProject(id) {
            if (isLoadingProject) return;
            isLoadingProject = true;

            try {
                currentProject = id;
                localStorage.setItem('lastProject', id);

                const dataSnap = await get(dbRef(database, `${DATABASE_BASE_PATH}/tasks/${id}`));
                if (!dataSnap.exists()) throw new Error(`No task found for ID ${id}`);
                const data = dataSnap.val();

                currentProjectName = data.project || '';
                currentCustomerName = (data.customerName || '').trim();

                // ✅ resolve owner FIRST
                await resolveMetaOwnerTaskId();

                // ✅ Always read sensorCount from the owner task so it doesn’t “reset to 0”
                const ownerSnap = await get(dbRef(database, `${DATABASE_BASE_PATH}/tasks/${metaOwnerTaskId}`));
                const owner = ownerSnap.exists() ? ownerSnap.val() : data;

                expectedSensors = Number(owner.sensorCount) || 0;

                document.getElementById('project').value = currentProjectName;
                document.getElementById('sensorCount').value = expectedSensors;

                await updateSiteImages();
                await loadNotes();

                populateSensorDropdown(expectedSensors);
                await updateGallery();

            } catch (err) {
                console.error(`[loadProject] Failed:`, err);
                alert('Failed to load project. Check console for details.');
            } finally {
                isLoadingProject = false;
            }
        }

        function populateSensorDropdown(count) {
            const dropdowns = [
                document.getElementById('sensorMetaNumberDropdown'),
                document.getElementById('sensorNumberDropdown')
            ];
            dropdowns.forEach(dropdown => {
                dropdown.innerHTML = `<option value="">Select a Device</option>`;
                for (let i = 1; i <= count; i++) {
                    const padded = String(i).padStart(2, '0');
                    dropdown.innerHTML += `<option value="${i}">${padded}</option>`;
                }
            });
        }

        const getFavorites = () => JSON.parse(localStorage.getItem('favorites') || '{}');

        async function updateGallery() {
            const safeProjectName = sanitize(currentProjectName || currentProject);
            const isSensor = document.querySelector('input[name="viewMode"]:checked').value === 'sensors';
            const base = `${DATABASE_BASE_PATH}/tasks/images/${safeProjectName}/${isSensor ? 'sensors' : 'deliverables'}`;

            const snapshot = await listAll(storageRef(storage, base));
            const items = await Promise.all(snapshot.items.map(async item => {
                const url = await getDownloadURL(item);
                return { name: item.name, url, fullPath: item.fullPath };
            }));

            const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
            items.sort((a, b) => (favorites[b.fullPath] ? 1 : 0) - (favorites[a.fullPath] ? 1 : 0));

            modalItems = items;

            const gallery = document.getElementById('gallery');
            const dropdown = document.getElementById('imageDropdown');
            const missingList = document.getElementById('missingList');

            gallery.innerHTML = '';
            dropdown.innerHTML = '<option value="">-- Select an Image --</option>';
            missingList.innerHTML = '';

            items.forEach(item => {
                const container = document.createElement('div');
                container.className = 'image-container';

                const img = document.createElement('img');
                img.src = item.url;
                img.loading = 'lazy';
                img.alt = item.name;
                img.onclick = () => showModal(item.url, item.name, base);

                const star = document.createElement('span');
                star.className = 'favorite-star';
                star.textContent = favorites[item.fullPath] ? '★' : '☆';
                if (favorites[item.fullPath]) star.classList.add('favorited');
                star.onclick = e => {
                    e.stopPropagation();
                    if (favorites[item.fullPath]) delete favorites[item.fullPath];
                    else favorites[item.fullPath] = true;
                    localStorage.setItem('favorites', JSON.stringify(favorites));
                    updateGallery();
                };

                container.append(img, star);
                gallery.appendChild(container);

                dropdown.appendChild(new Option(item.name, item.url));
            });

            if (isSensor) {
                const countMap = {};
                items.forEach(item => {
                    const m = item.name.match(/(?:^|_)(\d{2})-/);
                    if (m) {
                        const idx = parseInt(m[1], 10);
                        countMap[idx] = (countMap[idx] || 0) + 1;
                    }
                });

                for (let i = 1; i <= expectedSensors; i++) {
                    const padded = String(i).padStart(2, '0');
                    const have = countMap[i] || 0;
                    if (have < 2) {
                        const li = document.createElement('li');
                        li.textContent = `Sensor ${padded} - Missing ${2 - have} image(s)`;
                        li.dataset.sensor = String(i);
                        li.className = 'missing-sensor';
                        li.setAttribute('role', 'button');
                        li.setAttribute('tabindex', '0');
                        missingList.appendChild(li);
                    }
                }

                const handlePickMissing = (sensorNum) => {
                    const sensorsRadio = document.querySelector('input[name="viewMode"][value="sensors"]');
                    if (sensorsRadio && !sensorsRadio.checked) {
                        sensorsRadio.checked = true;
                        document.getElementById('sensorUploadSection').style.display = 'block';
                        document.getElementById('deliverableUploadSection').style.display = 'none';
                    }

                    const uploadDd = document.getElementById('sensorNumberDropdown');
                    const metaDd = document.getElementById('sensorMetaNumberDropdown');

                    if (uploadDd) {
                        uploadDd.value = sensorNum;
                        uploadDd.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    if (metaDd) {
                        metaDd.value = sensorNum;
                        metaDd.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    const serialInput = document.getElementById('serialNumber');
                    document.getElementById('sensorUploadSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => serialInput?.focus(), 250);
                };

                missingList.onclick = (e) => {
                    const li = e.target.closest('li[data-sensor]');
                    if (!li) return;
                    handlePickMissing(li.dataset.sensor);
                };

                missingList.onkeydown = (e) => {
                    const li = e.target.closest('li[data-sensor]');
                    if (!li) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePickMissing(li.dataset.sensor);
                    }
                };
            }
        }

        async function uploadSensor() {
            const uploadBtn = document.getElementById('uploadImage');
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';

            const numEl = document.getElementById('sensorNumberDropdown');
            const serialEl = document.getElementById('serialNumber');
            const fileEl = document.getElementById('sensorImage');
            const skipMarkupEl = document.getElementById('skipMarkupCheckbox');

            const num = numEl.value;
            const serial = sanitize(serialEl.value);
            const file = fileEl.files[0];
            const skipMarkup = skipMarkupEl.checked;

            if (!currentProject || !num || !serial || !file) {
                alert('Fill out all fields');
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload';
                return;
            }

            const paddedNum = String(num).padStart(2, '0');
            const safeProjectName = sanitize(currentProjectName || currentProject);
            const folderPath = `${DATABASE_BASE_PATH}/tasks/images/${safeProjectName}/sensors`;

            try {
                const files = await listAll(storageRef(storage, folderPath));
                const matchCount = files.items.filter(f => f.name.startsWith(`${safeProjectName}_${paddedNum}`)).length;

                if (matchCount >= 2) {
                    const proceed = confirm(`Sensor ${paddedNum} already has 2 uploads. Upload another?`);
                    if (!proceed) {
                        uploadBtn.disabled = false;
                        uploadBtn.textContent = 'Upload';
                        return;
                    }
                }

                let blob = await resizeImage(file, 2048);
                if (!skipMarkup) {
                    const labelBase = (currentCustomerName || currentProjectName || safeProjectName).trim();
                    blob = await addTextToImage(blob, `${labelBase} ${paddedNum} - ${serial}`);
                }

                const safeCustomer = sanitize(currentCustomerName || '');
                const prefix = safeCustomer ? `${safeCustomer}` : '';
                const desired = `${prefix}_${paddedNum}-${serial}.jpg`;
                const uniqueName = await getUniqueFilename(folderPath, desired);

                await uploadBytes(storageRef(storage, `${folderPath}/${uniqueName}`), blob);

                const placeholderRef = storageRef(storage, `${folderPath}/.init.txt`);
                try { await deleteObject(placeholderRef); } catch (err) {
                    if (err.code !== 'storage/object-not-found') console.warn('Error deleting sensor placeholder:', err);
                }

                await updateGallery();
                alert(`Sensor image saved as “${uniqueName}”!`);

                fileEl.value = '';
                numEl.value = '';
                serialEl.value = '';
                skipMarkupEl.checked = false;

            } catch (err) {
                console.error('Upload failed:', err);
                alert('Sensor upload failed. See console for details.');
            }

            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload';
        }

        async function uploadDeliverable() {
            const safeProjectName = sanitize(currentProjectName || currentProject);
            const uploadBtn = document.getElementById('uploadDeliverableImage');
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';

            const fileEl = document.getElementById('fileUploader');
            const nameEl = document.getElementById('imageNameInput');
            const markupEl = document.getElementById('markupTextInput');

            const file = fileEl.files[0];
            const rawName = nameEl.value.trim();
            const rawMarkup = markupEl.value.trim();

            const nameInput = sanitize(rawName);

            if (!currentProject || !file || (!nameInput && !rawMarkup)) {
                alert('Please select a file and enter either a Name or Markup');
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload Image';
                return;
            }

            try {
                const baseName = nameInput || sanitize(rawMarkup);
                let blob = await resizeImage(file, 2048);

                if (rawMarkup) blob = await addTextToImage(blob, rawMarkup);

                const folder = `${DATABASE_BASE_PATH}/tasks/images/${safeProjectName}/deliverables`;
                const safeCustomer = sanitize(currentCustomerName || '');
                const prefix = safeCustomer ? `${safeCustomer}_` : '';
                const desired = `${prefix}${baseName}.jpg`;
                const uniqueName = await getUniqueFilename(folder, desired);

                await uploadBytes(storageRef(storage, `${folder}/${uniqueName}`), blob);

                const placeholderRef = storageRef(storage, `${folder}/.init.txt`);
                try { await deleteObject(placeholderRef); } catch (err) {
                    if (err.code !== 'storage/object-not-found') console.warn('Error deleting deliverable placeholder:', err);
                }

                await updateGallery();
                alert(`Deliverable saved as “${uniqueName}”!`);

                fileEl.value = '';
                nameEl.value = '';
                markupEl.value = '';

            } catch (err) {
                console.error('Upload failed:', err);
                alert('Deliverable upload failed. See console for details.');
            }

            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Image';
        }

        async function saveNote() {
            const dateInput = document.getElementById('noteDate').value;
            const text = document.getElementById('noteText').value.trim();
            if (!currentProject || !dateInput || !text) return;

            // store notes on the OWNER task so they persist across duplicate/new task IDs
            const utcTimestamp = Date.now();

            await update(dbRef(database, commentsBasePath()), {
                [utcTimestamp]: text
            });

            await loadNotes();
            alert('Note saved successfully!');
        }

        async function loadNotes() {
            const snapshot = await get(dbRef(database, commentsBasePath()));
            const list = document.getElementById('notesList');
            list.innerHTML = '';

            if (snapshot.exists()) {
                const notes = snapshot.val();

                Object.keys(notes)
                    .sort((a, b) => parseInt(b) - parseInt(a))
                    .forEach(timestamp => {
                        const dateStr = new Date(parseInt(timestamp)).toLocaleString();
                        const formattedNote = String(notes[timestamp]).replace(/\n/g, "<br>");
                        const div = document.createElement('div');

                        div.innerHTML = `
                            <strong>${dateStr}</strong><br>${formattedNote}
                            <button data-timestamp="${timestamp}" class="deleteNoteButton">🗑 Delete</button>
                            <hr>
                        `;

                        list.appendChild(div);
                    });

                document.querySelectorAll('.deleteNoteButton').forEach(button => {
                    button.addEventListener('click', async () => {
                        const timestamp = button.dataset.timestamp;
                        const confirmDelete = confirm(`Delete note from ${new Date(parseInt(timestamp)).toLocaleString()}?`);
                        if (confirmDelete) {
                            await set(dbRef(database, `${commentsBasePath()}/${timestamp}`), null);
                            await loadNotes();
                        }
                    });
                });
            }
        }

        async function saveProject() {
            const projectNameRaw = document.getElementById('project').value.trim();
            const count = parseInt(document.getElementById('sensorCount').value, 10);

            if (!projectNameRaw || Number.isNaN(count) || count < 1) {
                return alert('Enter a valid Project ID and Total Devices');
            }

            // update current task node
            const timestamp = currentProject || Date.now().toString();
            const taskRef = dbRef(database, `${DATABASE_BASE_PATH}/tasks/${timestamp}`);

            await update(taskRef, {
                id: timestamp,
                project: projectNameRaw,
                sensorCount: count,
                updatedAt: Date.now()
            });

            // update local state
            currentProject = timestamp;
            currentProjectName = projectNameRaw;

            await resolveMetaOwnerTaskId();

            const ownerRef = dbRef(database, `${DATABASE_BASE_PATH}/tasks/${metaOwnerTaskId}`);
            await update(ownerRef, {
                sensorCount: count,
                updatedAt: Date.now()
            });

            expectedSensors = count;

            await populateProjects();
            document.getElementById('projectList').value = timestamp;
            populateSensorDropdown(expectedSensors);
            await updateSiteImages();
            await loadNotes();
            await updateGallery();

            alert(`Project "${projectNameRaw}" saved successfully!`);

            // placeholders
            const safeProjectName = sanitize(projectNameRaw);
            const basePath = `${DATABASE_BASE_PATH}/tasks/images/${safeProjectName}`;
            const blob = createPlaceholderBlob();

            const uploadPlaceholder = async (folder, name = ".init.txt") => {
                const fullPath = `${basePath}/${folder}/${name}`;
                try { await uploadBytes(storageRef(storage, fullPath), blob); }
                catch (err) { console.warn(`Failed to upload dummy to ${folder}:`, err); }
            };

            await uploadPlaceholder('siteImages');
            await uploadPlaceholder('sensors');
            await uploadPlaceholder('deliverables');
        }

        function showModal(url, name, folderPath) {
            modalIndex = modalItems.findIndex(item => item.url === url);

            const modal = document.getElementById('modal');
            const img = document.getElementById('modalImage');
            const fn = document.getElementById('modalFileName');
            img.src = modalItems[modalIndex].url;
            fn.textContent = modalItems[modalIndex].name;
            modal.style.display = 'flex';

            document.getElementById('modalPrev').disabled = modalItems.length <= 1;
            document.getElementById('modalNext').disabled = modalItems.length <= 1;

            document.getElementById('downloadButton').onclick = () => window.open(url, '_blank');
            document.getElementById('closeModalButton').onclick = () => modal.style.display = 'none';
            modal.addEventListener('click', e => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }

        document.getElementById('deleteButton').onclick = async () => {
            const safeProjectName = sanitize(currentProjectName || currentProject);
            const item = modalItems[modalIndex];
            if (!(await confirmWithPassword("deleting this image"))) {
                alert("Incorrect password. Action cancelled.");
                return;
            }

            const isSensor = document.querySelector('input[name="viewMode"]:checked').value === 'sensors';
            const folder = isSensor ? 'sensors' : 'deliverables';
            const path = `${DATABASE_BASE_PATH}/tasks/images/${safeProjectName}/${folder}/${item.name}`;

            try {
                await deleteObject(storageRef(storage, path));
                document.getElementById('modal').style.display = 'none';
                updateGallery();
            } catch (err) {
                console.error("Failed to delete image:", err);
                alert("Failed to delete image. Check console for details.");
            }
        };

        document.getElementById('modalPrev').onclick = () => {
            if (modalItems.length < 2) return;
            modalIndex = (modalIndex - 1 + modalItems.length) % modalItems.length;
            const { url, name } = modalItems[modalIndex];
            document.getElementById('modalImage').src = url;
            document.getElementById('modalFileName').textContent = name;
            document.getElementById('downloadButton').onclick = () => window.open(url, '_blank');
        };

        document.getElementById('modalNext').onclick = () => {
            if (modalItems.length < 2) return;
            modalIndex = (modalIndex + 1) % modalItems.length;
            const { url, name } = modalItems[modalIndex];
            document.getElementById('modalImage').src = url;
            document.getElementById('modalFileName').textContent = name;
            document.getElementById('downloadButton').onclick = () => window.open(url, '_blank');
        };

        // Event bindings
        document.getElementById('projectList').addEventListener('change', (e) => {
            if (e.target.value) loadProject(e.target.value);
        });
        document.getElementById('saveProject').onclick = saveProject;
        document.getElementById('uploadImage').onclick = uploadSensor;
        document.getElementById('uploadDeliverableImage').onclick = uploadDeliverable;
        document.getElementById('saveNote').onclick = saveNote;

        document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const isSensor = document.querySelector('input[name="viewMode"]:checked').value === 'sensors';
                document.getElementById('sensorUploadSection').style.display = isSensor ? 'block' : 'none';
                document.getElementById('deliverableUploadSection').style.display = isSensor ? 'none' : 'block';
                updateGallery();
            });
        });

        document.getElementById('imageDropdown').addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            const url = selectedOption.value;
            const name = selectedOption.textContent;
            if (url) {
                showModal(url, name, '');
            }
        });

        document.getElementById("sensorMetaNumberDropdown").addEventListener("change", async (e) => {
            const num = e.target.value;
            if (!num || !currentProject) return;

            const snap = await get(dbRef(database, `${sensorMetaBasePath()}/${num}`));
            if (snap.exists()) {
                const data = snap.val();
                document.getElementById("sensorMetaSerial").value = data.serial || '';
                document.getElementById("sensorMetaM1").value = data.m1 || '';
                document.getElementById("sensorMetaM2").value = data.m2 || '';
                document.getElementById("sensorMetaM3").value = data.m3 || '';
            } else {
                document.getElementById("sensorMetaSerial").value = '';
                document.getElementById("sensorMetaM1").value = '';
                document.getElementById("sensorMetaM2").value = '';
                document.getElementById("sensorMetaM3").value = '';
            }
        });

        // ✅ WRITE meta using metaOwnerTaskId
        document.getElementById("saveSensorMeta").onclick = async () => {
            const num = document.getElementById("sensorMetaNumberDropdown").value;
            const serial = document.getElementById("sensorMetaSerial").value.trim();
            const m1 = document.getElementById("sensorMetaM1").value.trim();
            const m2 = document.getElementById("sensorMetaM2").value.trim();
            const m3 = document.getElementById("sensorMetaM3").value.trim();

            if (!num || !serial) return alert("Sensor number and serial are required.");

            const deviceData = { serial, m1, m2, m3 };
            await set(dbRef(database, `${sensorMetaBasePath()}/${num}`), deviceData);
            alert("Sensor info saved!");
        };

        // ✅ autofill serial using metaOwnerTaskId
        document.getElementById("sensorNumberDropdown").addEventListener("change", async (e) => {
            const num = e.target.value;
            const serialEl = document.getElementById("serialNumber");

            if (!num || !currentProject) {
                serialEl.value = '';
                return;
            }

            const snap = await get(dbRef(database, `${sensorMetaBasePath()}/${num}`));
            serialEl.value = snap.exists() ? (snap.val().serial || '') : '';
        });

        // -------------------- SITE IMAGES (unchanged logic) --------------------
        let siteImages = [];
        let currentSiteIndex = 0;
        let siteImageRotation = 0;
        let isSiteImageLoading = false;

        async function uploadSiteImage() {
            const uploadBtn = document.getElementById('uploadSiteImage');
            const fileEl = document.getElementById('siteImageUploader');
            const file = fileEl.files[0];

            if (!currentProject || !file) {
                alert("Select a project and choose an image first.");
                return;
            }

            uploadBtn.disabled = true;
            uploadBtn.textContent = "Uploading...";

            const safeProjectName = sanitize(currentProjectName || currentProject);
            const folderPath = `${DATABASE_BASE_PATH}/tasks/images/${safeProjectName}/siteImages`;

            try {
                let blob = await resizeImage(file, 2048);

                const timestamp = Date.now();
                const safeCustomer = sanitize(currentCustomerName || '');
                const prefix = safeCustomer ? `${safeCustomer}_` : '';
                const desiredName = `${prefix}site_${timestamp}.jpg`;
                const uniqueName = await getUniqueFilename(folderPath, desiredName);

                await uploadBytes(
                    storageRef(storage, `${folderPath}/${uniqueName}`),
                    blob
                );

                try {
                    await deleteObject(storageRef(storage, `${folderPath}/.init.txt`));
                } catch (e) {
                    if (e.code !== 'storage/object-not-found') console.warn(e);
                }

                fileEl.value = '';
                await updateSiteImages();

                alert(`Site image uploaded: ${uniqueName}`);
            } catch (err) {
                console.error("Site image upload failed:", err);
                alert("Site image upload failed. See console.");
            }

            uploadBtn.disabled = false;
            uploadBtn.textContent = "Upload Site Image";
        }

        function getSiteIndex() {
            return parseInt(localStorage.getItem(`${currentProject}_siteIdx`) || '0', 10);
        }

        function saveSiteIndex(idx) {
            localStorage.setItem(`${currentProject}_siteIdx`, idx);
        }

        async function updateSiteImages() {
            siteImages = [];
            const safeProjectName = sanitize(currentProjectName || currentProject);
            if (!currentProject) return;

            const base = `${DATABASE_BASE_PATH}/tasks/images/${safeProjectName}/siteImages`;
            const isImageName = (n) => /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(n);

            try {
                const snap = await listAll(storageRef(storage, base));
                const imageItems = snap.items.filter(item => isImageName(item.name));
                imageItems.sort((a, b) => a.name.localeCompare(b.name));

                siteImages = await Promise.all(
                    imageItems.map(async item => ({ name: item.name, url: await getDownloadURL(item) }))
                );
            } catch (e) {
                console.warn('[siteImages] list error:', e);
                siteImages = [];
            }

            currentSiteIndex = Math.min(getSiteIndex(), siteImages.length - 1);
            if (currentSiteIndex < 0) currentSiteIndex = 0;
            renderSiteImage();
        }

        function rotateSiteImage() {
            if (!siteImages.length) return;

            const img = document.getElementById('siteImageDisplay');
            const wrapper = document.getElementById('siteImageWrapper');

            siteImageRotation = (siteImageRotation + 90) % 360;
            img.style.transform = `rotate(${siteImageRotation}deg)`;

            const dispW = wrapper.clientWidth;
            const dispH = img.clientHeight;
            const θ = siteImageRotation * Math.PI / 180;
            const cos = Math.abs(Math.cos(θ));
            const sin = Math.abs(Math.sin(θ));
            const newH = dispW * sin + dispH * cos;

            wrapper.style.height = `${newH}px`;
        }

        // Add near your site image globals:
        let pendingSiteNav = 0; // -1 prev, +1 next

        function nextSiteImage() {
            if (!siteImages.length) return;
            if (isSiteImageLoading) {
                pendingSiteNav = 1; // keep the latest intent
                return;
            }
            isSiteImageLoading = true;
            currentSiteIndex = (currentSiteIndex + 1) % siteImages.length;
            saveSiteIndex(currentSiteIndex);
            renderSiteImage();
        }

        function prevSiteImage() {
            if (!siteImages.length) return;
            if (isSiteImageLoading) {
                pendingSiteNav = -1; // keep the latest intent
                return;
            }
            isSiteImageLoading = true;
            currentSiteIndex = (currentSiteIndex - 1 + siteImages.length) % siteImages.length;
            saveSiteIndex(currentSiteIndex);
            renderSiteImage();
        }

        function renderSiteImage() {
            const img = document.getElementById('siteImageDisplay');
            const wrapper = document.getElementById('siteImageWrapper');
            const prevBtns = document.querySelectorAll('.prevSiteImage');
            const nextBtns = document.querySelectorAll('.nextSiteImage');
            const rotBtns = document.querySelectorAll('.rotateSiteImage');

            const setControls = ({ canNav, canRotate }) => {
                [...prevBtns, ...nextBtns].forEach(b => b.disabled = !canNav);
                rotBtns.forEach(b => b.disabled = !canRotate);
            };

            const runQueuedNavIfAny = () => {
                if (!siteImages.length || siteImages.length <= 1) {
                    pendingSiteNav = 0;
                    return;
                }
                if (pendingSiteNav === 0) return;

                const delta = pendingSiteNav;
                pendingSiteNav = 0;

                isSiteImageLoading = true;
                currentSiteIndex = (currentSiteIndex + delta + siteImages.length) % siteImages.length;
                saveSiteIndex(currentSiteIndex);
                renderSiteImage();
            };

            const finalize = () => {
                const multi = siteImages.length > 1;
                setControls({ canNav: multi, canRotate: siteImages.length > 0 });
                isSiteImageLoading = false;
                runQueuedNavIfAny();
            };

            if (!siteImages.length) {
                wrapper.style.height = 'auto';
                img.src = '';
                img.alt = '';
                img.style.opacity = 1;
                setControls({ canNav: false, canRotate: false });
                isSiteImageLoading = false;
                pendingSiteNav = 0;
                return;
            }

            // Consistent: render implies "loading" until finalized.
            isSiteImageLoading = true;

            setControls({ canNav: false, canRotate: false });

            const { url, name } = siteImages[currentSiteIndex];
            img.alt = name;

            siteImageRotation = 0;
            img.style.transform = 'rotate(0deg)';
            img.style.opacity = 0.01;

            const src = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
            const pre = new Image();

            const safetyTimer = setTimeout(() => {
                console.warn('[siteImages] load timeout', name);
                img.style.opacity = 1;
                wrapper.style.height = 'auto';
                finalize(); // no auto-advance
            }, 4000);

            pre.onload = () => {
                clearTimeout(safetyTimer);
                img.src = src;

                requestAnimationFrame(() => {
                    wrapper.style.height = `${img.clientHeight}px`;
                    img.style.opacity = 1;
                    finalize();
                });
            };

            pre.onerror = () => {
                clearTimeout(safetyTimer);
                console.warn('[siteImages] load error', name);
                img.style.opacity = 1;
                wrapper.style.height = 'auto';
                finalize(); // no auto-advance
            };

            pre.src = src;
        }

        document.getElementById('uploadSiteImage').onclick = uploadSiteImage;
        document.querySelectorAll('.nextSiteImage').forEach(btn => btn.onclick = nextSiteImage);
        document.querySelectorAll('.prevSiteImage').forEach(btn => btn.onclick = prevSiteImage);
        document.querySelectorAll('.rotateSiteImage').forEach(btn => btn.onclick = rotateSiteImage);

        async function getUniqueFilename(folderPath, filename) {
            const idx = filename.lastIndexOf('.');
            const base = idx >= 0 ? filename.slice(0, idx) : filename;
            const ext = idx >= 0 ? filename.slice(idx) : '';
            let name = base;
            let suffix = 1;

            while (true) {
                const path = `${folderPath}/${name}${ext}`;
                try {
                    await getDownloadURL(storageRef(storage, path));
                    name = `${base}_${suffix++}`;
                } catch (e) {
                    if (e.code === 'storage/object-not-found') return name + ext;
                    throw e;
                }
            }
        }

        // -------------------- OneDrive upload (unchanged, BUT CSV now uses metaOwner) --------------------
        document.getElementById("uploadFolderToOneDrive").addEventListener("click", async () => {
            const uploadBtn = document.getElementById("uploadFolderToOneDrive");

            if (!currentProject) return alert("Select or load a project first.");
            if (!accessToken) return alert("You must be logged into Microsoft first.");
            if (isTokenExpired(accessToken)) {
                alert("Session expired. Please log in again.");
                logoutMicrosoft();
                return;
            }

            uploadBtn.disabled = true;
            uploadBtn.style.opacity = "0.5";
            uploadBtn.textContent = "Uploading...";

            const isSensor = document.querySelector('input[name="viewMode"]:checked').value === 'sensors';
            const folderType = isSensor ? 'sensors' : 'deliverables';

            // ✅ Firebase stays PROJECT-based (unchanged)
            const safeProjectName = sanitize(currentProjectName || currentProject);
            const firebaseFolder = `${DATABASE_BASE_PATH}/tasks/images/${safeProjectName}/${folderType}`;

            // ✅ OneDrive becomes CUSTOMER-based when available
            const safeCustomerName = sanitize(currentCustomerName || '');
            const oneDriveBase = safeCustomerName || safeProjectName; // fallback to project if no customer
            const oneDriveFolder = `JobPhotos/${oneDriveBase}/${folderType}`;

            try {
                const folderRef = storageRef(storage, firebaseFolder);
                const folderSnapshot = await listAll(folderRef);

                await ensureOneDriveFolder("JobPhotos");
                await ensureOneDriveFolder(`JobPhotos/${oneDriveBase}`);
                await ensureOneDriveFolder(oneDriveFolder);

                for (const item of folderSnapshot.items) {
                    const blob = await getBlob(item);
                    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${oneDriveFolder}/${item.name}:/content`;
                    const res = await fetch(uploadUrl, {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${accessToken}` },
                        body: blob
                    });
                    if (!res.ok) console.error(`Failed to upload ${item.name}:`, await res.text());
                }

                // ✅ Upload device CSV (ONLY in deliverables mode) - path unchanged (metaOwner stays same)
                if (!isSensor) {
                    const refPath = `${sensorMetaBasePath()}`;
                    const snapshot = await get(dbRef(database, refPath));

                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const headers = ["Sensor #", "Serial", "Info 1", "Info 2", "Info 3"];
                        const rows = [headers];

                        Object.entries(data).forEach(([sensorNum, meta]) => {
                            rows.push([
                                normalizeText(sensorNum),
                                normalizeText(meta.serial),
                                normalizeText(meta.m1),
                                normalizeText(meta.m2),
                                normalizeText(meta.m3)
                            ]);
                        });

                        const csvContent = rows.map(row => row.join(",")).join("\n");
                        const blob = new Blob([csvContent], { type: "text/csv" });

                        const filename = `${oneDriveBase}_DeviceData.csv`;

                        const csvUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${oneDriveFolder}/${filename}:/content`;
                        const csvRes = await fetch(csvUrl, {
                            method: "PUT",
                            headers: { Authorization: `Bearer ${accessToken}` },
                            body: blob
                        });

                        if (!csvRes.ok) console.error(`Failed to upload CSV:`, await csvRes.text());
                    }
                }

                alert(`Uploaded all images${!isSensor ? ' and CSV' : ''} to OneDrive folder: ${oneDriveFolder}`);
            } catch (err) {
                console.error("Upload error:", err);
                alert("Upload failed. See console for details.");
            }

            uploadBtn.disabled = false;
            uploadBtn.style.opacity = "1";
            uploadBtn.textContent = "Upload to OneDrive";
        });

        async function getBlob(storageItem) {
            const url = await getDownloadURL(storageItem);
            const res = await fetch(url);
            return await res.blob();
        }

        async function ensureOneDriveFolder(path) {
            const parts = path.split('/');
            let currentPath = '';
            for (const part of parts) {
                currentPath += (currentPath ? '/' : '') + part;
                const checkUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${currentPath}:/`;
                const res = await fetch(checkUrl, { headers: { Authorization: `Bearer ${accessToken}` } });

                if (res.status === 404) {
                    const parent = currentPath.substring(0, currentPath.lastIndexOf('/'));
                    const createUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${parent ? parent : ''}:/children`;
                    const createRes = await fetch(createUrl, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            name: part,
                            folder: {},
                            "@microsoft.graph.conflictBehavior": "rename"
                        })
                    });

                    if (!createRes.ok) throw new Error(`Failed to create folder "${part}": ${await createRes.text()}`);
                }
            }
        }

        async function confirmWithPassword(actionDescription = "this action") {
            const input = prompt(`Enter password to confirm ${actionDescription}:`);
            return input === ADMIN_PASSWORD;
        }

        document.addEventListener("DOMContentLoaded", async () => {
            const ip = await getIP();
            updateVisitCount(ip);
        });

        let clickCount = 0;
        let clickTimer = null;

        document.getElementById('siteImageDisplay').addEventListener('click', () => {
            clickCount++;
            if (clickCount === 3) {
                rotateSiteImage();
                clearTimeout(clickTimer);
                clickCount = 0;
            }
            if (!clickTimer) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                    clickTimer = null;
                }, 400);
            }
        });

        document.querySelector("h1").addEventListener("dblclick", () => {
            const loginSection = document.getElementById("logins-section");
            const adminSection = document.getElementById("adminSection");

            if (loginSection) {
                loginSection.style.display =
                    (loginSection.style.display === "none" || loginSection.style.display === "") ? "flex" : "none";
            }

            if (adminSection) {
                adminSection.style.display =
                    (adminSection.style.display === "none" || adminSection.style.display === "") ? "block" : "none";
            }
        });

        document.getElementById('downloadSiteImage').addEventListener('click', () => {
            if (!siteImages.length) return alert('No site image to open.');
            const currentImage = siteImages[currentSiteIndex];
            if (!currentImage) return alert('Image not found.');

            const sep = currentImage.url.includes('?') ? '&' : '?';
            window.open(`${currentImage.url}${sep}t=${Date.now()}`, '_blank', 'noopener');
        });

        function createPlaceholderBlob(content = "This is a placeholder file.") {
            return new Blob([content], { type: "text/plain" });
        }

        function normalizeText(text) {
            return (text || "")
                .replace(/[‘’‛`´]/g, "'")
                .replace(/[“”«»]/g, '"')
                .replace(/[–—−]/g, '-')
                .replace(/[′″]/g, match => match === '′' ? "'" : '"')
                .replace(/,+/g, " ")
                .replace(/"/g, '')
                .normalize('NFKD')
                .replace(/[^\x00-\x7F]/g, '');
        }

        // ✅ Export CSV uses metaOwnerTaskId
        document.getElementById("exportCSV").addEventListener("click", async () => {
            if (!currentProject) {
                alert("No project selected.");
                return;
            }

            const refPath = `${sensorMetaBasePath()}`;
            const snapshot = await get(dbRef(database, refPath));

            if (!snapshot.exists()) {
                alert("No device data found.");
                return;
            }

            const data = snapshot.val();
            const headers = ["Device #", "Serial", "Info 1", "Info 2", "Info 3"];
            const rows = [headers];

            Object.entries(data).forEach(([sensorNum, meta]) => {
                rows.push([
                    normalizeText(sensorNum),
                    normalizeText(meta.serial),
                    normalizeText(meta.m1),
                    normalizeText(meta.m2),
                    normalizeText(meta.m3)
                ]);
            });

            const csvContent = rows.map(row => row.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${sanitize(currentProjectName || currentProject)}_deviceData.csv`;
            a.click();

            URL.revokeObjectURL(url);
        });

        // Customize view toggles (unchanged)
        document.querySelectorAll('.section-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const targetClass = checkbox.dataset.target;
                const elements = document.getElementsByClassName(targetClass);
                for (let el of elements) el.style.display = checkbox.checked ? '' : 'none';

                const single = document.getElementById(targetClass);
                if (single) single.style.display = checkbox.checked ? '' : 'none';
            });
        });

        document.querySelectorAll('.section-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                localStorage.setItem(`toggle_${checkbox.dataset.target}`, checkbox.checked);
            });
        });

        window.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.section-toggle').forEach(checkbox => {
                const saved = localStorage.getItem(`toggle_${checkbox.dataset.target}`);
                if (saved !== null) {
                    checkbox.checked = saved === 'true';
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        });

        function updateUploadPermissions() {
            const isAdmin = document.getElementById('adminToggle').checked;

            document.getElementById('uploadDeliverableImage').disabled = !isAdmin;
            document.getElementById('uploadSiteImage').disabled = !isAdmin;
            document.getElementById('uploadFolderToOneDrive').disabled = !isAdmin;

            document.getElementById('saveNote').disabled = !isAdmin;
            document.getElementById('saveSensorMeta').disabled = !isAdmin;
            document.getElementById('saveProject').style.display = isAdmin ? 'inline-block' : 'none';

            document.getElementById('noteDate').disabled = !isAdmin;
            document.getElementById('noteText').disabled = !isAdmin;
            document.getElementById('skipMarkupCheckbox').disabled = !isAdmin;
            document.getElementById('fileUploader').disabled = !isAdmin;
            document.getElementById('imageNameInput').disabled = !isAdmin;
            document.getElementById('markupTextInput').disabled = !isAdmin;
            document.getElementById('sensorCount').disabled = !isAdmin;

            document.getElementById('fieldSelector').style.display = isAdmin ? 'block' : 'none';
        }

        document.getElementById('adminToggle').addEventListener('change', () => {
            const isAdmin = document.getElementById('adminToggle').checked;
            localStorage.setItem('adminMode', isAdmin ? 'true' : 'false');
            updateUploadPermissions();
        });

        window.addEventListener('DOMContentLoaded', () => {
            const saved = localStorage.getItem('adminMode');
            if (saved) document.getElementById('adminToggle').checked = saved === 'true';
            updateUploadPermissions();
        });

        document.getElementById('customizeToggle').addEventListener('click', () => {
            const panel = document.getElementById('customizePanel');
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        });

        document.getElementById('projectSearch').addEventListener('input', function () {
            const query = this.value.trim().toLowerCase();
            const dropdown = document.getElementById('projectList');

            dropdown.innerHTML = '<option value="">-- Choose a customer --</option>';

            allProjects
                .filter(p =>
                    p.customer.toLowerCase().includes(query) ||
                    p.project.toLowerCase().includes(query)
                )
                .forEach(p => {
                    dropdown.appendChild(new Option(p.label, p.id));
                });
        });
