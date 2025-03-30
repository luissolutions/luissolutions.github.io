import { auth, onAuthStateChanged, initializeAuth , database, ref, onValue, set, get, off, app, update, remove, storage, storageRef, 
    getStorage, uploadBytesResumable, deleteObject, getDownloadURL, push } from '../../../../apps/assets/js/firebase-init.js';

let DATABASE_BASE_PATH = 'public';

onAuthStateChanged(auth, (user) => {
    DATABASE_BASE_PATH = user ? `${user.uid}` : 'public';
    populateNoteList();
    populateInvoiceDropdown();
    setupRealTimeListeners();
    loadDatabaseEntries();
    loadDatabase();
});

// Notes Section

const nameInput = document.getElementById('input-name');
const notesTextarea = document.getElementById('note');
const noteList = document.getElementById('note-list');
let deletedNotes = [];
let autoSaveInterval;

const setupEventListeners = () => {
    document.getElementById('copy-btn').addEventListener('click', copyNote);
    document.getElementById('paste-btn').addEventListener('click', pasteNote);
    document.getElementById('save-btn').addEventListener('click', saveNote);
    document.getElementById('delete-btn').addEventListener('click', deleteNote);
    document.getElementById('clear-btn').addEventListener('click', clearNoteInputs);
    document.getElementById('undo-btn').addEventListener('click', undoDelete);
    document.getElementById('autosave-checkbox').addEventListener('change', toggleAutoSave);
    document.addEventListener("keydown", handleKeyboardShortcuts);
    notesTextarea.addEventListener('input', () => autoResizeTextarea('note'));
};

const copyNote = () => {
    notesTextarea.select();
    document.execCommand('copy');
    console.log('Copied to clipboard');
};

const pasteNote = async () => {
    const clipboardData = await navigator.clipboard.readText();
    notesTextarea.value += clipboardData;
};

const saveNote = async () => {
    const nameToSave = nameInput.value.trim();
    const noteToSave = notesTextarea.value.trim();
    const saveBtn = document.getElementById('save-btn');
    const timestamp = new Date().toISOString();

    if (!nameToSave || !noteToSave) {
        console.log('Please enter both the name and note before saving');
        return;
    }

    const notesRef = ref(database, `${DATABASE_BASE_PATH}/notes/${nameToSave}`);
    const snapshot = await get(notesRef);
    const existingNote = snapshot.val();

    if (!existingNote || new Date(timestamp) > new Date(existingNote.timestamp)) {
        await set(notesRef, { name: nameToSave, note: noteToSave, timestamp });
        console.log('Note saved successfully');
        updateSaveButton(saveBtn);
    } else {
        const userChoice = confirm(
            `⚠️ A newer version of "${nameToSave}" already exists.\nDo you want to overwrite it with your current changes?`
        );
        if (userChoice) {
            await set(notesRef, { name: nameToSave, note: noteToSave, timestamp });
            console.log('Note overwritten by user choice');
            updateSaveButton(saveBtn);
        } else {
            console.log('Save cancelled. Newer note preserved.');
        }
    }
};

const updateSaveButton = (button) => {
    button.textContent = 'Saved';
    button.style.backgroundColor = 'lightblue';
    setTimeout(() => {
        button.textContent = '💾';
        button.style.backgroundColor = '';
    }, 2000);
};

const deleteNote = async () => {
    const nameToDelete = nameInput.value.trim();

    if (nameToDelete) {
        const userConfirmed = confirm(`Are you sure you want to delete the note with name: ${nameToDelete}?`);
        if (!userConfirmed) {
            console.log('Note deletion cancelled.');
            return;
        }

        const notesRef = ref(database, `${DATABASE_BASE_PATH}/notes`);
        const snapshot = await get(notesRef);
        const notes = snapshot.val();

        if (notes) {
            const noteId = Object.keys(notes).find(id => notes[id].name === nameToDelete);
            if (noteId) {
                const deletedNote = notes[noteId];
                storeDeletedNote(deletedNote.name, deletedNote.note);
                await set(ref(database, `${DATABASE_BASE_PATH}/notes/${noteId}`), null);
                clearNoteInputs();
                console.log(`Deleted the note with name: ${nameToDelete}`);
            } else {
                console.log('Note not found.');
            }
        } else {
            console.log('No notes available.');
        }
    } else {
        console.log('Please enter the name of the note to delete.');
    }
};

const loadNote = async () => {
    const nameToLoad = nameInput.value.trim();

    if (nameToLoad) {
        const notesRef = ref(database, `${DATABASE_BASE_PATH}/notes/`);
        onValue(notesRef, snapshot => {
            const notes = snapshot.val();
            if (notes) {
                const noteId = Object.keys(notes).find(id => notes[id].name === nameToLoad);
                if (noteId) {
                    const selectedNote = notes[noteId];
                    notesTextarea.value = selectedNote.note;
                    console.log(`Loaded the note with name: ${nameToLoad}`);
                } else {
                    console.log(`No note found with the name: ${nameToLoad}`);
                }
            } else {
                console.log('No notes found');
            }
        });
    } else {
        console.log('Please enter the name of the note to load');
    }
};

const clearNoteInputs = () => {
    nameInput.value = '';
    notesTextarea.value = '';
};

const populateNoteList = () => {
    const notesRef = ref(database, `${DATABASE_BASE_PATH}/notes`);
    onValue(notesRef, snapshot => {
        const notes = snapshot.val();
        noteList.innerHTML = '';

        if (notes) {
            const sortedNotes = Object.values(notes).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            sortedNotes.forEach(note => createNoteListItem(note));
        } else {
            noteList.innerHTML = '<li>No notes found</li>';
        }
    });
};

const createNoteListItem = (note) => {
    const listItem = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.style.fontWeight = 'bold';
    nameSpan.textContent = note.name;

    const timestampSpan = document.createElement('span');
    timestampSpan.style.fontWeight = 'normal';
    timestampSpan.style.marginLeft = '10px';
    timestampSpan.textContent = ` (${new Date(note.timestamp).toLocaleString()})`;

    listItem.appendChild(nameSpan);
    listItem.appendChild(timestampSpan);

    listItem.addEventListener('click', () => {
        nameInput.value = note.name;
        notesTextarea.value = note.note;
    });

    noteList.appendChild(listItem);
};

const storeDeletedNote = (name, note) => {
    deletedNotes.push({ name, note });
};

const undoDelete = async () => {
    if (deletedNotes.length > 0) {
        const lastDeletedNote = deletedNotes.pop();
        const { name, note } = lastDeletedNote;

        const notesRef = ref(database, `${DATABASE_BASE_PATH}/notes/${name}`);
        try {
            await set(notesRef, { name, note, timestamp: new Date().toISOString() });
            console.log(`Undone the deletion of the note with name: ${name}`);
            populateNoteList();
        } catch (error) {
            console.error('Failed to undo the deletion:', error);
        }
    } else {
        console.log('No deleted notes to undo');
    }
};

const autoResizeTextarea = (id) => {
    const textarea = document.getElementById(id);
    textarea.style.height = textarea.scrollHeight + 'px';
};

const toggleAutoSave = (event) => {
    if (event.target.checked) {
        autoSaveInterval = setInterval(saveNote, 40000);
    } else {
        clearInterval(autoSaveInterval);
    }
};

const handleKeyboardShortcuts = (event) => {
    if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        document.getElementById("save-btn").click();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    autoSaveInterval = setInterval(saveNote, 40000);
});

document.getElementById('resizeTextareaBtn').addEventListener('click', () => {
    autoResizeTextarea('notes');
});


// Invoice Section

const partsTableBody = document.querySelector('.parts-table tbody');
const subtotalInput = document.getElementById('subtotal');
const taxPercentInput = document.getElementById('tax-percent');
const taxInput = document.getElementById('tax');
const totalInput = document.getElementById('total');
const addPartRowButton = document.getElementById('add-part-row');
const delPartRowButton = document.getElementById('del-part-row');
const partCategory = document.getElementById('part-category');
const partSubcategory = document.getElementById('part-subcategory');
const partSelector = document.getElementById('part-selector');
const addLaborRowButton = document.getElementById('add-labor-row');
const laborTableBody = document.querySelector('.labor-table tbody');
const remainingCheckbox = document.getElementById('remaining');
const remainingDiv = document.querySelector('.remaining');
const amountPaidInput = document.getElementById('amount-paid');
const remainingBalanceSpan = document.getElementById('remaining-balance');
const saveButton = document.getElementById('save-button');
const invoiceDropdown = document.getElementById('invoice-dropdown');
const deleteButton = document.getElementById('deleteButton');
const searchInput = document.getElementById('invoice-search');

function loadDatabase() {
    const partsRef = ref(database, `${DATABASE_BASE_PATH}/inventory`);

    onValue(partsRef, (snapshot) => {
        const items = snapshot.val();

        if (!items || typeof items !== 'object') {
            partCategory.innerHTML = '<option value="">No Categories Available</option>';
            return;
        }

        partCategory.innerHTML = '<option value="">Select Category</option>';

        Object.keys(items).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            partCategory.appendChild(option);
        });

    }, (error) => {
        console.error("Error loading inventory data:", error);
    });
}

partCategory.addEventListener('change', () => {
    const selectedCategory = partCategory.value;
    loadSubcategories(selectedCategory);
});

function loadSubcategories(category) {
    if (!category) {
        partSubcategory.innerHTML = '<option value="">No Subcategories Available</option>';
        return;
    }

    const subcategoriesRef = ref(database, `${DATABASE_BASE_PATH}/inventory/${category}`);

    onValue(subcategoriesRef, (snapshot) => {
        const subcategories = snapshot.val();

        if (!subcategories) {
            console.warn(`No subcategories found for category: ${category}`);
            partSubcategory.innerHTML = '<option value="">No Subcategories Available</option>';
            return;
        }

        partSubcategory.innerHTML = '<option value="">Select Subcategory</option>';
        partSelector.innerHTML = '';

        Object.keys(subcategories).forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = subcategory;
            partSubcategory.appendChild(option);
        });
    }, (error) => {
        console.error("Error loading subcategories:", error);
    });
}

partSubcategory.addEventListener('change', () => {
    const selectedCategory = partCategory.value;
    const selectedSubcategory = partSubcategory.value;
    loadParts(selectedCategory, selectedSubcategory);
});

function loadParts(category, subcategory) {
    partSelector.innerHTML = '<option value="">Select Part</option>';

    if (!category || !subcategory) {
        partSelector.innerHTML = '<option value="">No Parts Available</option>';
        return;
    }

    const partsRef = ref(database, `${DATABASE_BASE_PATH}/inventory/${category}/${subcategory}`);

    onValue(partsRef, (snapshot) => {
        const parts = snapshot.val();

        if (!parts || typeof parts !== 'object') {
            console.warn(`No parts found for ${category} > ${subcategory}`);
            partSelector.innerHTML = '<option value="">No Parts Available</option>';
            return;
        }

        partSelector.innerHTML = '<option value="">Select Part</option>';

        Object.entries(parts).forEach(([timestampKey, partData]) => {
            if (partData.part) {
                const option = document.createElement('option');
                option.value = timestampKey;
                option.textContent = partData.part;
                option.dataset.price = partData.price || 0;
                option.dataset.actualPrice = partData.actualPrice || 0;
                option.dataset.category = category;
                option.dataset.component = subcategory;
                partSelector.appendChild(option);
            }
        });

        console.log(`Loaded parts for ${category} > ${subcategory}`);
    }, (error) => {
        console.error("Error loading parts:", error);
    });
}

function updateInvoiceDropdown(searchQuery) {
    const invoicesRef = ref(database, `${DATABASE_BASE_PATH}/tasks`);
    get(invoicesRef).then((snapshot) => {
        if (snapshot.exists()) {
            const invoices = snapshot.val();
            populateDropdownWithFilteredInvoices(invoices, searchQuery);
        }
    }).catch((error) => {
        console.error("Error fetching invoices:", error);
    });
}

function updateDropdownOptions(invoices, filterText) {

    for (const project in invoices) {
        if (invoices.hasOwnProperty(project)) {
            if (filterText === '' || project.toLowerCase().includes(filterText)) {
                const option = document.createElement('option');
                option.value = project;
                option.textContent = project;
                invoiceDropdown.appendChild(option);
            }
        }
    }
}

async function saveInvoice() {
    const projectInput = document.getElementById('invoice-number');
    let invoiceId = projectInput.dataset.id || projectInput.value.trim();

    if (!invoiceId) {
        alert("Invoice ID is required.");
        return;
    }

    const invoiceType = document.getElementById('invoice-type').value;
    const amountPaid = document.getElementById('amount-paid').value;
    const startTime = document.getElementById('invoice-date').value;

    const partsData = Array.from(partsTableBody.querySelectorAll('tr')).map(row => ({
        part: row.dataset.part || '',
        quantity: row.querySelector('input[name="part-quantity"]').value || 0,
        price: row.querySelector('input[name="part-price"]').value || 0,
        actualPrice: row.querySelector('input[name="part-actual-price"]').value || 0,
        total: row.querySelector('input[name="part-total"]').value || 0,
    }));

    const laborData = Array.from(laborTableBody.querySelectorAll('tr')).map(row => ({
        description: row.querySelector('input[name="labor-description"]').value.trim() || '',
        hours: row.querySelector('input[name="labor-hours"]').value || 0,
        rate: row.querySelector('input[name="labor-rate"]').value || 0,
        total: row.querySelector('input[name="labor-total"]').value || 0,
    }));

    const newInvoiceData = {
        id: invoiceId,
        invoiceType,
        invoiceTitle: document.getElementById('title-input').value,
        customerName: document.getElementById('customer-name').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerEmail: document.getElementById('customer-email').value,
        customerAddress: document.getElementById('customer-address').value,
        project: invoiceId,
        notes: document.getElementById('notes').value,
        startTime,
        parts: partsData,
        labor: laborData,
        taxPercent: taxPercentInput.value,
        amountPaid,
    };

    const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${invoiceId}`);

    try {
        const snapshot = await get(invoiceRef);
        let existingData = snapshot.exists() ? snapshot.val() : {};

        const updatedInvoiceData = {
            ...existingData,
            ...newInvoiceData
        };

        await update(invoiceRef, updatedInvoiceData);
        console.log(`Invoice ${invoiceId} saved/updated successfully.`);
        clearInvoice();
        populateInvoiceDropdown();
    } catch (error) {
        console.error("Error saving/updating invoice:", error);
    }
}

function createOptionElement(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
}

function updatePartSelector(selectedCategory, components) {
    partSelector.innerHTML = '';

    const parts = components;
    for (const component in parts) {
        for (const partName in parts[component]) {
            const part = parts[component][partName];
            const option = createOptionElement(partName, partName);
            option.dataset.price = part.price;
            option.dataset.actualPrice = part.actualPrice;
            option.dataset.quantity = part.quantity;
            option.dataset.category = selectedCategory;
            option.dataset.component = component;

            partSelector.appendChild(option);
        }
    }
}

async function addPartRow(partData = null) {
    let part, price, actualPrice, category, component, quantity;

    if (partData) {
        part = partData.part;
        price = parseFloat(partData.price) || 0;
        actualPrice = parseFloat(partData.actualPrice) || 0;
        category = partData.category;
        component = partData.component;
        quantity = parseInt(partData.quantity) || 1;
    } else {
        const selectedOption = partSelector.options[partSelector.selectedIndex];

        if (!selectedOption || !selectedOption.value) {
            console.warn("⚠️ No part selected.");
            return;
        }

        part = selectedOption.textContent;
        price = parseFloat(selectedOption.dataset.price) || 0;
        actualPrice = parseFloat(selectedOption.dataset.actualPrice) || 0;
        category = selectedOption.dataset.category;
        component = selectedOption.dataset.component;
        quantity = 1;
    }

    let existingRow = Array.from(partsTableBody.querySelectorAll('tr')).find(row => {
        return row.dataset.part === part;
    });

    if (existingRow) {
        let quantityInput = existingRow.querySelector('input[name="part-quantity"]');
        let currentQuantity = parseInt(quantityInput.value) || 0;
        quantityInput.value = currentQuantity + quantity;
        updatePartRowTotal(existingRow);
        return;
    }

    const newRow = document.createElement('tr');
    newRow.dataset.part = part;
    newRow.dataset.category = category;
    newRow.dataset.component = component;

    newRow.innerHTML = `
        <td>${part}</td>
        <td><input type="number" name="part-quantity" min="1" value="${quantity}"></td>
        <td><input type="number" name="part-price" min="0" value="${price}" class="part-price-input"></td>
        <td class="actual-price-hide"><input type="number" name="part-actual-price" min="0" value="${actualPrice}" class="actual-price-input"></td>
        <td><input type="number" name="part-total" min="0" value="${(price * quantity).toFixed(2)}" readonly></td>
    `;

    partsTableBody.appendChild(newRow);

    const priceInput = newRow.querySelector('input[name="part-price"]');
    const quantityInput = newRow.querySelector('input[name="part-quantity"]');

    priceInput.addEventListener('input', () => updatePartRowTotal(newRow));
    quantityInput.addEventListener('input', () => updatePartRowTotal(newRow));

    updateTotals();
    updatePriceDifference();
    updateRemainingBalance();
}

addPartRowButton.addEventListener('click', () => {
    const selectedOption = partSelector.options[partSelector.selectedIndex];
    if (selectedOption && selectedOption.value) {
        const partData = {
            part: selectedOption.textContent,
            price: selectedOption.dataset.price,
            actualPrice: selectedOption.dataset.actualPrice,
            category: selectedOption.dataset.category,
            component: selectedOption.dataset.component,
            quantity: 1
        };
        addPartRow(partData);
    } else {
        alert("Please select a part first.");
    }
});

function delPartRow() {
    const lastRow = partsTableBody.querySelector('tr:last-child');

    if (!lastRow) {
        console.warn('⚠️ No parts available to undo.');
        return;
    }

    const partName = lastRow.cells[0].textContent.trim();
    const category = lastRow.dataset.category;
    const component = lastRow.dataset.component;

    if (!category || !component || !partName) {
        console.error('❌ Missing category, component, or part name.');
        return;
    }

    lastRow.remove();
    updateTotals();
    updatePriceDifference();
    updateRemainingBalance();

    const invoiceId = document.getElementById('invoice-number').dataset.id;
    if (!invoiceId) {
        console.warn('⚠️ No invoice ID found.');
        return;
    }

    const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${invoiceId}/parts`);

    get(invoiceRef).then((snapshot) => {
        if (snapshot.exists()) {
            let parts = snapshot.val();
            const updatedParts = parts.filter(part => part.part !== partName);

            update(ref(database, `${DATABASE_BASE_PATH}/tasks/${invoiceId}`), { parts: updatedParts })
                .then(() => console.log(`✅ Removed part: ${partName} from Firebase.`))
                .catch(error => console.error('❌ Error updating parts in Firebase:', error));
        }
    }).catch(error => console.error('❌ Error fetching parts:', error));
}

function addLaborRow() {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" name="labor-description"></td>
        <td><input type="number" name="labor-hours" min="0"></td>
        <td><input type="number" name="labor-rate" min="0"></td>
        <td><input type="number" name="labor-total" readonly></td>
    `;

    laborTableBody.appendChild(newRow);

    const hoursInput = newRow.querySelector('input[name="labor-hours"]');
    const rateInput = newRow.querySelector('input[name="labor-rate"]');
    const totalInput = newRow.querySelector('input[name="labor-total"]');

    hoursInput.addEventListener('input', () => {
        updateLaborTotal(hoursInput, rateInput, totalInput);
    });

    rateInput.addEventListener('input', () => {
        updateLaborTotal(hoursInput, rateInput, totalInput);
    });
}

function updatePriceDifference() {
    let totalDifference = 0;
    const rows = partsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const quantityInput = row.querySelector('input[name="part-quantity"]');
        const priceInput = row.querySelector('input[name="part-price"]');
        const actualPriceInput = row.querySelector('input[name="part-actual-price"]');

        const quantity = parseInt(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const actualPrice = parseFloat(actualPriceInput.value) || 0;
        totalDifference += (quantity * price) - (quantity * actualPrice);
    });
    document.getElementById('price-difference').innerText = totalDifference.toFixed(2);
}

function updateLaborTotal(hoursInput, rateInput, totalInput) {
    const hours = parseFloat(hoursInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const total = hours * rate;
    totalInput.value = total.toFixed(2);
    updateTotals();
    updateRemainingBalance();
}

function updatePartRowTotal(row) {
    const quantityInput = row.querySelector('input[name="part-quantity"]');
    const priceInput = row.querySelector('input[name="part-price"]');
    const actualPriceInput = row.querySelector('input[name="part-actual-price"]');
    const totalInput = row.querySelector('input[name="part-total"]');

    const quantity = parseInt(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const actualPrice = parseFloat(actualPriceInput.value) || 0;
    const total = quantity * price;

    totalInput.value = total.toFixed(2);

    updateTotals();
    updatePriceDifference();
    updateRemainingBalance();
}

function updateRemainingBalance() {
    const amountPaid = parseFloat(amountPaidInput.value) || 0;
    const total = parseFloat(totalInput.value) || 0;
    const remainingBalance = total - amountPaid;
    remainingBalanceSpan.textContent = remainingBalance.toFixed(2);
}

function updateTotals() {
    let partsTotal = 0;
    let laborTotal = 0;

    const partRows = document.querySelectorAll('.parts-table tbody tr');
    partRows.forEach(row => {
        const total = parseFloat(row.querySelector('input[name="part-total"]').value) || 0;
        partsTotal += total;
    });

    const laborRows = document.querySelectorAll('.labor-table tbody tr');
    laborRows.forEach(row => {
        const total = parseFloat(row.querySelector('input[name="labor-total"]').value) || 0;
        laborTotal += total;
    });

    const subtotal = partsTotal + laborTotal;
    const taxPercent = parseFloat(taxPercentInput.value) || 0;
    const tax = partsTotal * (taxPercent / 100);
    const total = subtotal + tax;

    subtotalInput.value = subtotal.toFixed(2);
    taxInput.value = tax.toFixed(2);
    totalInput.value = total.toFixed(2);
}

function populateInvoiceDropdown() {
    const dropdown = document.getElementById('invoice-dropdown');
    dropdown.innerHTML = '';

    const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks`);

    onValue(invoiceRef, (snapshot) => {
        dropdown.innerHTML = '';
        if (snapshot.exists()) {
            const invoices = snapshot.val();
            const fragment = document.createDocumentFragment();

            const sortedInvoices = Object.entries(invoices).sort((a, b) => {
                const dateA = new Date(a[1].startTime || 0);
                const dateB = new Date(b[1].startTime || 0);
                return dateB - dateA;
            });

            sortedInvoices.forEach(([project, invoice]) => {
                const customerName = invoice.customerName || 'Unknown';
                const startTime = invoice.startTime ? new Date(invoice.startTime).toLocaleDateString() : 'No Date';

                const option = document.createElement('option');
                option.value = project;
                option.textContent = `${customerName} - ${startTime}`;
                fragment.appendChild(option);
            });

            dropdown.appendChild(fragment);

            if (dropdown.options.length === 0) {
                const noResultsOption = document.createElement('option');
                noResultsOption.textContent = 'No invoices found';
                dropdown.appendChild(noResultsOption);
            }
        } else {
            const noResultsOption = document.createElement('option');
            noResultsOption.textContent = 'No invoices found';
            dropdown.appendChild(noResultsOption);
        }
    }, (error) => {
        console.error("Error fetching invoices:", error);
    });
}

searchInput.addEventListener('input', () => {
    populateInvoiceDropdown(searchInput.value);
});

saveButton.addEventListener('click', async () => {
    const invoiceData = await saveInvoice();
});

deleteButton.addEventListener('click', async () => {
    const selectedInvoiceNumber = invoiceDropdown.value;

    if (selectedInvoiceNumber) {
        const isConfirmed = confirm(`Are you sure you want to delete invoice ${selectedInvoiceNumber}? This action cannot be undone.`);

        if (isConfirmed) {
            const invoiceRef = ref(database, DATABASE_BASE_PATH + "/tasks/" + selectedInvoiceNumber);

            try {
                await remove(invoiceRef);
                console.log(`Invoice ${selectedInvoiceNumber} deleted successfully`);
                populateInvoiceDropdown();
            } catch (error) {
                console.error(`Error deleting invoice ${selectedInvoiceNumber}:`, error);
            }
        } else {
            console.log('Invoice deletion canceled.');
        }
    } else {
        console.error('No invoice selected for deletion.');
    }
});

delPartRowButton.addEventListener('click', delPartRow);

addLaborRowButton.addEventListener('click', addLaborRow);

document.addEventListener('input', function (event) {
    if (event.target.classList.contains('actual-price-input') || event.target.classList.contains('part-price-input')) {
        console.log('Part price input or actual price input changed');
        updatePriceDifference();
        updateTotals();
    }
});

remainingCheckbox.addEventListener('change', function () {
    remainingDiv.style.display = this.checked ? 'block' : 'none';
});

amountPaidInput.addEventListener('input', updateRemainingBalance);

document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    taxPercentInput.addEventListener('input', updateTotals);
    updatePriceDifference();
});

taxPercentInput.addEventListener('input', () => {
    updateTotals();
    updateRemainingBalance();
});

document.getElementById('load-invoice-button').addEventListener('click', function () {
    const selectedInvoiceNumber = invoiceDropdown.value;

    if (!selectedInvoiceNumber) {
        alert('Please select an invoice to load.');
        return;
    }

    clearInvoice();

    const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${selectedInvoiceNumber}`);

    get(invoiceRef).then((snapshot) => {
        if (snapshot.exists()) {
            const invoiceData = snapshot.val();

            if (!invoiceData) {
                console.warn("Invoice data is empty.");
                return;
            }

            document.getElementById('invoice-number').dataset.id = invoiceData.id || selectedInvoiceNumber;
            document.getElementById('invoice-type').value = invoiceData.invoiceType || 'invoice';
            document.getElementById('title-input').value = invoiceData.invoiceTitle || '';
            document.getElementById('customer-name').value = invoiceData.customerName || '';
            document.getElementById('customer-phone').value = invoiceData.customerPhone || '';
            document.getElementById('customer-email').value = invoiceData.customerEmail || '';
            document.getElementById('customer-address').value = invoiceData.customerAddress || '';
            document.getElementById('invoice-number').value = invoiceData.project || '';
            document.getElementById('notes').value = invoiceData.notes || '';

            if (invoiceData.startTime) {
                try {
                    const startTime = new Date(invoiceData.startTime);
                    const localStartTime = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                    document.getElementById('invoice-date').value = localStartTime;
                } catch (error) {
                    console.error("Error parsing startTime:", error);
                }
            }

            document.getElementById('amount-paid').value = invoiceData.amountPaid || '';
            document.getElementById('tax-percent').value = invoiceData.taxPercent || '';

            if (invoiceData.parts && Array.isArray(invoiceData.parts)) {
                invoiceData.parts.forEach(part => {
                    addPartRow(part);
                });
            }

            if (invoiceData.labor && Array.isArray(invoiceData.labor)) {
                invoiceData.labor.forEach((labor) => {
                    addLaborRow(labor.description, labor.hours, labor.rate);
                    const newRow = laborTableBody.querySelector('tr:last-child');

                    if (newRow) {
                        newRow.querySelector('input[name="labor-description"]').value = labor.description || '';
                        newRow.querySelector('input[name="labor-hours"]').value = labor.hours || 0;
                        newRow.querySelector('input[name="labor-rate"]').value = labor.rate || 0;

                        const hoursInput = newRow.querySelector('input[name="labor-hours"]');
                        const rateInput = newRow.querySelector('input[name="labor-rate"]');
                        const totalInput = newRow.querySelector('input[name="labor-total"]');

                        updateLaborTotal(hoursInput, rateInput, totalInput);
                    }
                });
            }

            updateTotals();
            updateRemainingBalance();
        } else {
            console.warn("Invoice not found:", selectedInvoiceNumber);
            alert('Invoice not found.');
        }
    }).catch((error) => {
        console.error('Error fetching selected invoice:', error);
    });
});

document.getElementById('exportButton').addEventListener('click', function () {
    const selectedInvoiceNumber = document.getElementById('invoice-dropdown').value;

    if (selectedInvoiceNumber) {
        const invoiceRef = ref(database, DATABASE_BASE_PATH + "/tasks/" + selectedInvoiceNumber);

        get(invoiceRef).then((snapshot) => {
            if (snapshot.exists()) {
                const invoiceData = snapshot.val();

                const jsonString = JSON.stringify(invoiceData, null, 2);

                const blob = new Blob([jsonString], { type: 'application/json' });

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `invoice-${selectedInvoiceNumber}.json`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                console.error('No data available for selected invoice');
            }
        }).catch((error) => {
            console.error('Error fetching invoice:', error);
        });
    } else {
        alert('Please select a file to export.');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const textarea = document.getElementById('notes');
    textarea.addEventListener('input', autoResize, false);

    function autoResize() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    }
});

const hideParentCheckboxes = document.querySelectorAll('.hide-parent-checkbox');

hideParentCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const parentDiv = checkbox.closest('div');
        if (parentDiv) {
            parentDiv.style.display = checkbox.checked ? 'none' : 'block';
        }
    });
});
function saveDataToLocalStorage() {
    const inputData = {
        invoiceTitle: document.getElementById('title-input').value,
        customerName: document.getElementById('customer-name').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerEmail: document.getElementById('customer-email').value,
        customerAddress: document.getElementById('customer-address').value,
        startTime: document.getElementById('invoice-date').value,
        project: document.getElementById('invoice-number').value,
        notes: document.getElementById('notes').value,
    };

    localStorage.setItem('inputData', JSON.stringify(inputData));
}

function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('inputData');
    if (savedData) {
        const inputData = JSON.parse(savedData);

        document.getElementById('title-input').value = inputData.invoiceTitle || '';
        document.getElementById('customer-name').value = inputData.customerName || '';
        document.getElementById('customer-phone').value = inputData.customerPhone || '';
        document.getElementById('customer-email').value = inputData.customerEmail || '';
        document.getElementById('customer-address').value = inputData.customerAddress || '';
        document.getElementById('invoice-date').value = inputData.startTime || '';
        document.getElementById('invoice-number').value = inputData.project || '';
        document.getElementById('notes').value = (inputData.notes || '').replace(/\r?\n/g, " ");
    }
}

document.getElementById('title-input').addEventListener('input', saveDataToLocalStorage);
document.getElementById('customer-name').addEventListener('input', saveDataToLocalStorage);
document.getElementById('customer-phone').addEventListener('input', saveDataToLocalStorage);
document.getElementById('customer-email').addEventListener('input', saveDataToLocalStorage);
document.getElementById('customer-address').addEventListener('input', saveDataToLocalStorage);
document.getElementById('invoice-date').addEventListener('input', saveDataToLocalStorage);
document.getElementById('invoice-number').addEventListener('input', saveDataToLocalStorage);
document.getElementById('notes').addEventListener('input', saveDataToLocalStorage);

document.addEventListener('DOMContentLoaded', loadDataFromLocalStorage);

function clearInvoice() {
    ['title-input', 'customer-name', 'customer-phone', 'customer-email',
        'customer-address', 'invoice-date', 'invoice-number', 'notes']
        .forEach(id => document.getElementById(id).value = '');

    document.getElementById('invoice-number').dataset.id = '';
    document.querySelector('.parts-table tbody').innerHTML = '';
    document.querySelector('.labor-table tbody').innerHTML = '';

    ['subtotal', 'tax-percent', 'tax', 'total', 'amount-paid'].forEach(id => {
        document.getElementById(id).value = '';
    });

    document.getElementById('remaining').checked = false;
    document.querySelector('.remaining').style.display = 'none';

    localStorage.removeItem('inputData');
}


// Inventory Section

function loadDatabaseEntries() {
    const inventoryRef = ref(database, `${DATABASE_BASE_PATH}/inventory`);
    onValue(inventoryRef, (snapshot) => {
        const entries = snapshot.val() || {};
        updateCategoryFilter(entries);
        displayEntries(entries);
        loadColumnVisibility();
        applyColumnVisibility();
    });
}

function updateCategoryFilter(entries) {
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.innerHTML = '<option value="">All</option>';
    Object.keys(entries).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.innerText = category;
        categoryFilter.appendChild(option);
    });
}

function displayEntries(entries) {
    const container = document.getElementById('entries-container');
    container.innerHTML = `<table id="inventory-table">
        <thead>
            <tr>
                <th class="category-column">Category</th>
                <th class="component-column">Sub-Category</th>
                <th class="item-column">Item Name</th>
                <th class="price-column">Price</th>
                <th class="cost-column">Cost</th>
                <th class="quantity-column">Quantity</th>
                <th class="description-column">Description</th>
                <th class="image-column">Image</th>
                <th class="actions-column">Actions</th>
            </tr>
        </thead>
        <tbody id="inventory-body"></tbody>
    </table>`;

    const tbody = document.getElementById('inventory-body');

    Object.entries(entries).forEach(([category, components]) => {
        Object.entries(components).forEach(([component, items]) => {
            Object.entries(items).forEach(([uniqueKey, data]) => {
                const partName = data.part ? data.part.replace(/[^a-zA-Z0-9_-]/g, "_") : "Unnamed_Item";

                const row = document.createElement('tr');
                row.dataset.uniqueKey = uniqueKey;
                row.dataset.category = category;
                row.dataset.component = component;
                row.dataset.part = partName;

                const imageUrl = data.imageUrl ? data.imageUrl : "./assets/img/default.png";

                row.innerHTML = `
                    <td class="category-column">${category}</td>
                    <td class="component-column">${component}</td>
                    <td class="item-column" contenteditable="true" data-key="part">${data.part || "Unnamed Item"}</td>
                    <td class="price-column" contenteditable="true" data-key="price">${data.price || 0}</td>
                    <td class="cost-column" contenteditable="true" data-key="actualPrice">${data.actualPrice || 0}</td>
                    <td class="quantity-column" contenteditable="true" data-key="quantity">${data.quantity || 0}</td>
                    <td class="description-column" contenteditable="true" data-key="description">${data.description || ''}</td>
                    <td class="image-column">
                    <img src="${imageUrl}" width="50" height="50" style="cursor: pointer;" data-part="${partName}">
                        <input type="file" class="image-upload" accept="image/*">
                    </td>
                    <td class="actions-column">
                        <button class="delete-button">Delete</button>
                    </td>
                `;

                tbody.appendChild(row);
            });
        });
    });

    attachEventListeners();
    attachImageClickEvent();
}

const imageCache = {};

async function fetchImageForPart(category, component, partName, row) {
    const sanitizedPartName = partName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePathBase = `${DATABASE_BASE_PATH}/inventory/${category}/${component}/${sanitizedPartName}`;

    if (imageCache[storagePathBase]) {
        row.querySelector('img').src = imageCache[storagePathBase];
        return;
    }

    const possibleExtensions = ['png', 'jpg', 'jpeg', 'webp'];

    for (let ext of possibleExtensions) {
        const storagePath = `${storagePathBase}.${ext}`;
        const fileReference = storageRef(storage, storagePath);

        try {
            const downloadURL = await getDownloadURL(fileReference);
            imageCache[storagePathBase] = downloadURL;
            row.querySelector('img').src = downloadURL;
            return;
        } catch (error) {
            if (error.code !== 'storage/object-not-found') {
                console.error(`Error fetching image for ${sanitizedPartName}:`, error);
            }
        }
    }

    imageCache[storagePathBase] = "./assets/img/default.png";
    row.querySelector('img').src = "./assets/img/default.png";
}

function attachEventListeners() {
    document.querySelectorAll('[contenteditable="true"]').forEach(cell => {
        cell.addEventListener('blur', (event) => {
            const row = event.target.closest("tr");
            updateInventoryField(event, row);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const row = event.target.closest("tr");
            deleteEntry(row);
        });
    });

    document.querySelectorAll('.image-upload').forEach(input => {
        input.addEventListener('change', uploadImage);
    });
}

function updateInventoryField(event, row) {
    const key = event.target.dataset.key;
    const value = event.target.innerText.trim();
    const category = row.dataset.category;
    const component = row.dataset.component;
    const uniqueKey = row.dataset.uniqueKey;

    const selectedCategory = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    update(ref(database, `${DATABASE_BASE_PATH}/inventory/${category}/${component}/${uniqueKey}`), { [key]: value })
        .then(() => {
            console.log(`Updated ${key} to "${value}" for ${category} -> ${component}`);

            setTimeout(() => {
                document.getElementById('category-filter').value = selectedCategory;
                document.getElementById('search-input').value = searchTerm;
                filterEntries();
            }, 100);
        })
        .catch(error => console.error("Error updating entry:", error));
}

async function deleteEntry(row) {
    const category = row.dataset.category;
    const component = row.dataset.component;
    const uniqueKey = row.dataset.uniqueKey;
    const partName = row.dataset.part;

    const confirmation = confirm(`Are you sure you want to delete "${partName}"? This action cannot be undone.`);

    if (!confirmation) {
        console.log("Deletion canceled.");
        return;
    }

    await deletePreviousImage(category, component, partName);

    remove(ref(database, `${DATABASE_BASE_PATH}/inventory/${category}/${component}/${uniqueKey}`))
        .then(() => {
            console.log(`Deleted entry: ${category} -> ${component} -> ${partName}`);
            row.remove();
        })
        .catch(error => console.error("Error deleting entry:", error));
}

function filterEntries() {
    const selectedCategory = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    document.querySelectorAll('#inventory-body tr').forEach(row => {
        const category = row.children[0].innerText.trim();
        const part = row.children[2].innerText.toLowerCase().trim();

        const matchesCategory = selectedCategory === '' || category === selectedCategory;
        const matchesSearch = searchTerm === '' || part.includes(searchTerm);

        row.style.display = matchesCategory && matchesSearch ? '' : 'none';
    });
}

async function uploadImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const row = event.target.closest("tr");
    const category = row.dataset.category;
    const component = row.dataset.component;
    const uniqueKey = row.dataset.uniqueKey;
    const partName = row.dataset.part.trim().replace(/[^a-zA-Z0-9_-]/g, "_");

    if (!category || !component || !partName) {
        alert("Error: Missing entry information for image upload.");
        return;
    }

    console.log(`Uploading new image for ${category} -> ${component} -> ${partName}`);

    const storagePath = `${DATABASE_BASE_PATH}/inventory/${category}/${component}/${partName}.png`;
    const fileReference = storageRef(storage, storagePath);

    try {
        await deletePreviousImage(category, component, partName);

        const uploadTask = await uploadBytesResumable(fileReference, file);
        const imageUrl = await getDownloadURL(uploadTask.ref);

        await update(ref(database, `${DATABASE_BASE_PATH}/inventory/${category}/${component}/${uniqueKey}`), {
            imageUrl: imageUrl
        });

        row.querySelector("img").src = imageUrl;
        console.log(`Image uploaded and URL saved: ${imageUrl}`);
    } catch (error) {
        console.error("Error uploading image:", error);
    }
    filterEntries();
}

async function convertToPng(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function () {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], "converted.png", { type: "image/png" }));
                    } else {
                        reject(new Error("Failed to convert image to PNG"));
                    }
                }, "image/png");
            };
        };
        reader.onerror = reject;
    });
}

async function deletePreviousImage(category, component, partName) {
    const storagePathBase = `${DATABASE_BASE_PATH}/inventory/${category}/${component}/${partName}`;
    const possibleExtensions = ['png', 'jpg', 'jpeg', 'webp'];

    for (let ext of possibleExtensions) {
        const storagePath = `${storagePathBase}.${ext}`;
        const fileReference = storageRef(storage, storagePath);

        try {
            await deleteObject(fileReference);
            console.log(`Deleted old image: ${storagePath}`);
            return;
        } catch (error) {
            if (error.code === 'storage/object-not-found') {
                console.warn(`Image not found for deletion: ${storagePath}`);
            } else {
                console.error(`Error deleting previous image: ${error}`);
            }
        }
    }
}

document.getElementById('save-data-button').addEventListener('click', async (event) => {
    event.preventDefault();

    const category = document.getElementById('category').value.trim();
    const component = document.getElementById('component').value.trim();
    const partName = document.getElementById('part').value.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    const price = parseFloat(document.getElementById('price').value) || 0;
    const actualPrice = parseFloat(document.getElementById('actualPrice').value) || 0;
    const quantity = parseInt(document.getElementById('quantity').value) || 0;
    const description = document.getElementById('description').value.trim();
    const imageFile = document.getElementById('imageInput').files[0];

    if (!category || !component || !partName) {
        alert("Category, Sub-Category, and Item Name are required.");
        return;
    }

    const uniqueKey = Date.now().toString();
    const inventoryRef = ref(database, `${DATABASE_BASE_PATH}/inventory/${category}/${component}/${uniqueKey}`);

    let imageUrl = null;

    if (imageFile) {
        try {
            imageUrl = await uploadImageForNewEntry(imageFile, category, component, partName);
        } catch (error) {
            console.error("Image upload failed:", error);
            alert("Failed to upload image. Try again.");
            return;
        }
    }

    const itemData = {
        part: partName,
        price,
        actualPrice,
        quantity,
        description,
        imageUrl
    };

    set(inventoryRef, itemData)
        .then(() => {
            console.log("Item saved successfully:", itemData);
            resetForm();
            loadDatabaseEntries();
        })
        .catch(error => console.error("Error saving item:", error));
});

function resetForm() {
    document.getElementById('category').value = "";
    document.getElementById('component').value = "";
    document.getElementById('part').value = "";
    document.getElementById('price').value = "";
    document.getElementById('actualPrice').value = "";
    document.getElementById('quantity').value = "";
    document.getElementById('description').value = "";
    document.getElementById('imageInput').value = "";
}

async function uploadImageForNewEntry(file, category, component, partName) {
    const sanitizedPartName = partName.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `${DATABASE_BASE_PATH}/inventory/${category}/${component}/${sanitizedPartName}.png`;
    const fileReference = storageRef(storage, storagePath);

    await deletePreviousImage(category, component, sanitizedPartName);

    try {
        const uploadTask = await uploadBytesResumable(fileReference, file);
        const imageUrl = await getDownloadURL(uploadTask.ref);
        console.log(`Image uploaded successfully: ${imageUrl}`);
        return imageUrl;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}

function attachImageClickEvent() {
    document.querySelectorAll("#inventory-body img").forEach(img => {
        img.addEventListener("click", function () {
            const modal = document.getElementById("modal");
            const modalImg = document.getElementById("part-image");
            modal.style.display = "flex";
            modalImg.src = this.src;
        });
    });

    document.getElementById("modal").addEventListener("click", function (event) {
        if (event.target === this) {
            this.style.display = "none";
        }
    });
}

document.getElementById('category-filter').addEventListener('change', filterEntries);
document.getElementById('search-input').addEventListener('input', filterEntries);

document.querySelectorAll('.toggle-column').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        saveColumnVisibility();
        applyColumnVisibility();
    });
});

function saveColumnVisibility() {
    const checkboxStates = {};
    document.querySelectorAll('.toggle-column').forEach(checkbox => {
        checkboxStates[checkbox.value] = checkbox.checked;
    });
    localStorage.setItem('inventoryColumnVisibility', JSON.stringify(checkboxStates));
}

function loadColumnVisibility() {
    const savedStates = JSON.parse(localStorage.getItem('inventoryColumnVisibility'));
    if (savedStates) {
        document.querySelectorAll('.toggle-column').forEach(checkbox => {
            checkbox.checked = savedStates[checkbox.value] !== undefined ? savedStates[checkbox.value] : checkbox.checked;
        });
    }
}

function applyColumnVisibility() {
    document.querySelectorAll('.toggle-column').forEach(checkbox => {
        const columnClass = checkbox.value;
        document.querySelectorAll(`.${columnClass}`).forEach(cell => {
            cell.style.display = checkbox.checked ? '' : 'none';
        });
    });
}


// Analytics Section

function setupRealTimeListeners() {
    analyzeInvoiceData();
    analyzeInventoryData();
    populateCustomerDropdown();
}

function analyzeInventoryData() {
    const inventoryRef = ref(database, `${DATABASE_BASE_PATH}/inventory`);
    onValue(inventoryRef, (snapshot) => {
        if (snapshot.exists()) {
            const inventory = snapshot.val();
            let totalInventoryItems = 0;
            let totalItemsInStock = 0;

            Object.values(inventory).forEach(category => {
                Object.values(category).forEach(item => {
                    Object.values(item).forEach(detail => {
                        totalInventoryItems++;
                        totalItemsInStock += parseInt(detail.quantity, 10);
                    });
                });
            });

            document.getElementById('total-inventory-items').textContent = totalInventoryItems;
            document.getElementById('total-items-in-stock').textContent = totalItemsInStock;
        }
    }, (error) => {
        console.error('Error fetching inventory:', error);
    });
}

function analyzeInvoiceData() {
    const invoicesRef = ref(database, `${DATABASE_BASE_PATH}/tasks`);
    onValue(invoicesRef, (snapshot) => {
        if (snapshot.exists()) {
            const invoices = snapshot.val();
            let totalAmountPaid = 0;
            let totalSales = 0;
            let totalLaborCost = 0;
            let totalPartsUsed = 0;
            let totalPartsProfit = 0;
            let totalPartsValue = 0;
            let partsSold = {};
            let totalInvoices = 0;

            for (const invoiceId in invoices) {
                const invoice = invoices[invoiceId];

                if (invoice.invoiceType === "invoice") {
                    totalAmountPaid += parseFloat(invoice.amountPaid) || 0;
                    totalSales += parseFloat(invoice.total) || 0;

                    (invoice.labor || []).forEach(labor => {
                        totalLaborCost += parseFloat(labor.cost) || 0;
                    });

                    (invoice.parts || []).forEach(part => {
                        const partName = part.part;
                        const quantity = parseInt(part.quantity) || 0;
                        const price = parseFloat(part.price) || 0;
                        const actualPrice = parseFloat(part.actualPrice) || 0;
                        totalPartsProfit += (price - actualPrice) * quantity;
                        totalPartsValue += price * quantity;
                        totalPartsUsed += quantity;
                        partsSold[partName] = (partsSold[partName] || 0) + quantity;
                    });

                    totalInvoices++;
                }
            }

            document.getElementById('total-amount-paid').textContent = `$${totalAmountPaid.toFixed(2)}`;
            document.getElementById('total-sales').textContent = `$${totalSales.toFixed(2)}`;
            document.getElementById('total-labor-cost').textContent = `$${totalLaborCost.toFixed(2)}`;
            document.getElementById('total-parts-used').textContent = totalPartsUsed;
            document.getElementById('total-parts-profit').textContent = `$${totalPartsProfit.toFixed(2)}`;
            document.getElementById('total-parts-value').textContent = `$${totalPartsValue.toFixed(2)}`;
            document.getElementById('total-invoices').textContent = totalInvoices;

            const partsSoldList = document.getElementById('parts-sold');
            partsSoldList.innerHTML = '';
            Object.keys(partsSold).forEach(partName => {
                const li = document.createElement('li');
                li.textContent = `${partName}: ${partsSold[partName]} units`;
                partsSoldList.appendChild(li);
            });
        }
    }, (error) => {
        console.error('Error fetching invoices:', error);
    });
}

function populateCustomerDropdown() {
    const invoicesRef = ref(database, `${DATABASE_BASE_PATH}/tasks`);
    onValue(invoicesRef, (snapshot) => {
        if (snapshot.exists()) {
            const invoices = snapshot.val();
            const customers = {};

            for (const invoiceId in invoices) {
                const invoice = invoices[invoiceId];
                const customerName = invoice.customerName;

                if (!customerName) continue;

                if (!customers[customerName]) {
                    customers[customerName] = {
                        phones: new Set(),
                        addresses: new Set(),
                        emails: new Set()
                    };
                }

                if (invoice.customerPhone && invoice.customerPhone !== 'undefined') {
                    customers[customerName].phones.add(invoice.customerPhone);
                }
                if (invoice.customerAddress && invoice.customerAddress !== 'undefined') {
                    customers[customerName].addresses.add(invoice.customerAddress);
                }
                if (invoice.customerEmail && invoice.customerEmail !== 'undefined') {
                    customers[customerName].emails.add(invoice.customerEmail);
                }
            }

            const sortedCustomerNames = Object.keys(customers).sort();

            const dropdown = document.getElementById('customer-dropdown');
            dropdown.innerHTML = '<option value="">Select a Customer</option>';
            sortedCustomerNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                dropdown.appendChild(option);
            });

            window.customers = customers;
            window.sortedCustomerNames = sortedCustomerNames;
        }
    }, (error) => {
        console.error('Error fetching invoices:', error);
    });
}

function updateCustomerDetails(customerName) {
    if (!window.customers || !window.customers[customerName]) return;

    const customer = window.customers[customerName];

    const phoneNumbersList = document.getElementById('customer-phone-numbers');
    phoneNumbersList.innerHTML = '';
    customer.phones.forEach(phone => {
        const li = document.createElement('li');
        li.textContent = phone;
        phoneNumbersList.appendChild(li);
    });

    const addressesList = document.getElementById('customer-addresses');
    addressesList.innerHTML = '';
    customer.addresses.forEach(address => {
        const li = document.createElement('li');
        li.textContent = address;
        addressesList.appendChild(li);
    });

    const emailsList = document.getElementById('customer-emails');
    emailsList.innerHTML = '';
    customer.emails.forEach(email => {
        const li = document.createElement('li');
        li.textContent = email;
        emailsList.appendChild(li);
    });
}

function filterCustomerList(searchTerm) {
    const dropdown = document.getElementById('customer-dropdown');
    dropdown.innerHTML = '<option value="">Select a Customer</option>';

    const filteredNames = window.sortedCustomerNames.filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option);
    });
}

document.getElementById('customer-search').addEventListener('input', function () {
    filterCustomerList(this.value);
});

document.getElementById('customer-dropdown').addEventListener('change', function () {
    const selectedCustomer = this.value;
    updateCustomerDetails(selectedCustomer);
});

document.addEventListener('DOMContentLoaded', setupRealTimeListeners);
//Other

function updateTime() {
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    document.getElementById('clock').innerText = strTime;
    setTimeout(updateTime, 1000);
}

updateTime();

const clocks = document.getElementsByClassName("clock");

for (const clock of clocks) {
    clock.addEventListener("dblclick", function () {
        clock.style.display = "none";
    });
}