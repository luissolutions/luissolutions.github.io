import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, get, off, remove, runTransaction } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
    apiKey: "AIzaSyAg4UO0ASr-M19XCtoI8AZiNK2l5ddFDd0",
    authDomain: "notes-fba33.firebaseapp.com",
    databaseURL: "https://notes-fba33-default-rtdb.firebaseio.com",
    projectId: "notes-fba33",
    storageBucket: "notes-fba33.appspot.com",
    messagingSenderId: "312617117650",
    appId: "1:312617117650:web:721cc5bf322af639410a0b"
};

const app = initializeApp(appSettings);
const auth = getAuth(app);
const database = getDatabase(app);

const nameInput = document.getElementById('input-name');
const notesTextarea = document.getElementById('notes');
const mainWindow = document.getElementById('main-window')

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        populateNoteList();
    } else {
        window.location.href = 'login.html';
    }
});

function copyNote() {
    notesTextarea.select();
    document.execCommand('copy');
    console.log('Copied to clipboard');
}

async function pasteNote() {
    const clipboardData = await navigator.clipboard.readText();
    notesTextarea.value += clipboardData;
}

async function saveNote() {
    const nameToSave = nameInput.value.trim();
    const noteToSave = notesTextarea.value.trim();

    if (nameToSave && noteToSave) {
        const notesRef = ref(database, `notes/${nameToSave}`);
        set(notesRef, { name: nameToSave, note: noteToSave })
            .then(() => {
                console.log('Note saved successfully');
            })
            .catch(error => {
                console.error('Failed to save the note:', error);
            });
    } else {
        console.log('Please enter both the name and note before saving');
    }
}

async function deleteNote() {
    const nameToDelete = nameInput.value.trim();

    if (nameToDelete) {
        const notesRef = ref(database, 'notes');
        const snapshot = await get(notesRef);
        const notes = snapshot.val();
        if (notes) {
            const noteId = Object.keys(notes).find(id => notes[id].name === nameToDelete);
            if (noteId) {
                const deletedNote = notes[noteId]; // Get the deleted note
                storeDeletedNote(deletedNote.name, deletedNote.note); // Store the deleted note
                set(ref(database, `notes/${noteId}`), null)
                    .then(() => {
                        nameInput.value = '';
                        notesTextarea.value = '';
                        console.log(`Deleted the note with name: ${nameToDelete}`);
                    })
                    .catch(error => {
                        console.error('Failed to delete the note:', error);
                    });
            }
        }
    } else {
        console.log('Please enter the name of the note to delete');
    }
}

function loadNote() {
    const nameToLoad = nameInput.value.trim();

    if (nameToLoad) {
        const notesRef = ref(database, 'notes');
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
}

function exportNotes() {
    const notesRef = ref(database, 'notes');
    onValue(notesRef, snapshot => {
        const notes = snapshot.val();

        if (notes) {
            const notesData = Object.values(notes);
            const dataBlob = new Blob([JSON.stringify(notesData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'notes.json';
            link.click();
        } else {
            console.log('No notes found to export');
        }
    });
}

function clearNoteInputs() {
    nameInput.value = '';
    notesTextarea.value = '';
}

function populateNoteList() {
    const notesRef = ref(database, 'notes');
    const noteList = document.getElementById('note-list');

    onValue(notesRef, snapshot => {
        const notes = snapshot.val();
        noteList.innerHTML = '';

        if (notes) {
            Object.values(notes).forEach(note => {
                const listItem = document.createElement('li');
                listItem.textContent = note.name;
                listItem.addEventListener('click', () => {
                    nameInput.value = note.name;
                    notesTextarea.value = note.note;
                });

                noteList.appendChild(listItem);
            });
        } else {
            noteList.innerHTML = '<li>No notes found</li>';
        }
    });
}

let deletedNotes = [];

function storeDeletedNote(name, note) {
    deletedNotes.push({ name, note });
}

function undoDelete() {
    if (deletedNotes.length > 0) {
        const lastDeletedNote = deletedNotes.pop();
        const { name, note } = lastDeletedNote;

        const notesRef = ref(database, `notes/${name}`);
        set(notesRef, { name, note })
            .then(() => {
                console.log(`Undone the deletion of the note with name: ${name}`);
                populateNoteList();
            })
            .catch(error => {
                console.error('Failed to undo the deletion:', error);
            });
    } else {
        console.log('No deleted notes to undo');
    }
}

const setupEventListeners = () => {
    document.getElementById('copy-btn').addEventListener('click', copyNote);
    document.getElementById('paste-btn').addEventListener('click', pasteNote);
    document.getElementById('save-btn').addEventListener('click', saveNote);
    document.getElementById('delete-btn').addEventListener('click', deleteNote);
    document.getElementById('export-btn').addEventListener('click', exportNotes);
    document.getElementById('clear-btn').addEventListener('click', clearNoteInputs);
}

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    populateNoteList();
});

document.getElementById('undo-btn').addEventListener('click', undoDelete);

document.addEventListener("keydown", event => {
    if (event.ctrlKey && event.key === "s") {
        event.preventDefault();

        const saveBtn = document.getElementById("save-btn");
        if (saveBtn) {
            saveBtn.click();
        }
    }
});

document.getElementById('signOutButton').addEventListener('click', function () {
    signOut(auth).then(() => {
        console.log('User signed out');
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Sign out error:', error);
    });
});

const partsTableBody = document.querySelector('.parts-table tbody');
const subtotalInput = document.getElementById('subtotal');
const taxPercentInput = document.getElementById('tax-percent');
const taxInput = document.getElementById('tax');
const totalInput = document.getElementById('total');
const addPartRowButton = document.getElementById('add-part-row');
const delPartRowButton = document.getElementById('del-part-row');
const partCategory = document.getElementById('part-category');
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
const invoiceParts = {};

function loadDatabase() {
    const partsRef = ref(database, 'inventory');

    onValue(partsRef, (snapshot) => {
        const items = snapshot.val();
        const categories = Object.keys(items);

        partCategory.innerHTML = '';

        categories.forEach(category => {
            const option = createOptionElement(category, category);
            partCategory.appendChild(option);
        });

        updatePartSelector(partCategory.value, items[partCategory.value]);

        partCategory.addEventListener('change', (event) => {
            updatePartSelector(event.target.value, items[event.target.value]);
        });

    }, (error) => {
        console.error("Error loading parts database:", error);
    });
}

function updateInvoiceDropdown(searchQuery) {
    const invoicesRef = ref(database, 'invoices');
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

    for (const invoiceNumber in invoices) {
        if (invoices.hasOwnProperty(invoiceNumber)) {
            if (filterText === '' || invoiceNumber.toLowerCase().includes(filterText)) {
                const option = document.createElement('option');
                option.value = invoiceNumber;
                option.textContent = invoiceNumber;
                invoiceDropdown.appendChild(option);
            }
        }
    }
}

async function saveInvoice() {
    const invoiceNumberInput = document.getElementById('invoice-number');
    const invoiceNumber = invoiceNumberInput.value.trim();
    const invoiceType = document.getElementById('invoice-type').value;

    if (invoiceNumber.length === 0) {
        console.error('Invoice number is required.');
        return;
    }

    const amountPaid = document.getElementById('amount-paid').value;
    const partsData = Array.from(partsTableBody.querySelectorAll('tr')).map(row => {
        return {
            category: row.dataset.category,
            component: row.dataset.component,
            part: row.querySelector('td#populated-part').textContent,
            quantity: row.querySelector('input[name="part-quantity"]').value,
            price: row.querySelector('input[name="part-price"]').value,
            actualPrice: row.querySelector('input[name="part-actual-price"]').value, // Include actualPrice
            total: row.querySelector('input[name="part-total"]').value,
        };
    });
    const invoiceData = {
        invoiceType,
        invoiceTitle: document.getElementById('title-input').value,
        customerName: document.getElementById('customer-name').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerEmail: document.getElementById('customer-email').value,
        customerAddress: document.getElementById('customer-address').value,
        invoiceNumber: document.getElementById('invoice-number').value,
        notes: document.getElementById('notes').value,
        invoiceDate: document.getElementById('invoice-date').value,
        parts: partsData,
        labor: [...laborTableBody.querySelectorAll('tr')].map(row => ({
            description: row.querySelector('input[name="labor-description"]').value.trim(),
            hours: row.querySelector('input[name="labor-hours"]').value,
            rate: row.querySelector('input[name="labor-rate"]').value,
            cost: row.querySelector('input[name="labor-total"]').value,
        })),
        subtotal: subtotalInput.value,
        taxPercent: taxPercentInput.value,
        tax: taxInput.value,
        total: totalInput.value,
        amountPaid: amountPaid,
    };

    for (const part of invoiceData.parts) {
        try {
            await updatePartQuantityInDatabase(part.category, part.component, part.part, part.quantity);
        } catch (error) {
            console.error(`Error updating part ${part.part}:`, error);
        }
    }

    const invoiceRef = ref(database, 'invoices/' + invoiceNumber);

    try {
        await set(invoiceRef, invoiceData);

        console.log('Invoice saved successfully');
        clearInvoice();
        populateInvoiceDropdown();
        return;
    } catch (error) {
        console.error('Error saving invoice to Realtime Database:', error);
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

function addPartRow(partName, category = null, component = null, quantity = 1, price = 0, actualPrice = 0) {
    if (!category || !component) {
        const selectedOption = partSelector.querySelector(`option[value="${partName}"]`);
        if (!selectedOption) return;

        price = parseFloat(selectedOption.dataset.price) || 0;
        actualPrice = parseFloat(selectedOption.dataset.actualPrice) || 0;
        category = selectedOption.dataset.category;
        component = selectedOption.dataset.component;
    }

    const existingRow = partsTableBody.querySelector(`tr[data-part="${partName}"][data-category="${category}"][data-component="${component}"]`);
    if (existingRow) {
        const quantityInput = existingRow.querySelector('input[name="part-quantity"]');
        quantityInput.value = parseInt(quantityInput.value, 10) + quantity;
        updatePartRowTotal(existingRow);
    } else {
        const newRow = document.createElement('tr');
        newRow.dataset.part = partName;
        newRow.dataset.category = category;
        newRow.dataset.component = component;

        newRow.innerHTML = `
            <td id="populated-part">${partName}</td>
            <td><input type="number" name="part-quantity" min="1" value="${quantity}"></td>
            <td><input type="number" name="part-price" min="0" value="${price}" class="part-price-input"></td>
            <td class="actual-price-hide"><input type="number" name="part-actual-price" min="0" value="${actualPrice}" class="actual-price-input"></td>
            <td><input type="number" name="part-total" min="0" value="${price * quantity}" readonly></td>
        `;

        partsTableBody.appendChild(newRow);

        const priceInput = newRow.querySelector('input[name="part-price"]');
        const quantityInput = newRow.querySelector('input[name="part-quantity"]');

        priceInput.addEventListener('input', () => updatePartRowTotal(newRow));
        quantityInput.addEventListener('input', () => updatePartRowTotal(newRow));
    }

    updateTotals();
    updatePriceDifference();
    updateRemainingBalance();
}

function delPartRow() {
    const lastRow = partsTableBody.querySelector('tr:last-child');

    if (lastRow) {
        partsTableBody.removeChild(lastRow);
    }

    updateTotals();
    updatePriceDifference();
    updateRemainingBalance();
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

async function updatePartQuantityInDatabase(category, component, partName, quantity) {
    if (!category || !component || !partName || quantity === undefined) {
        throw new Error('Missing parameters to update database.');
    }

    const partRef = ref(database, `inventory/${category}/${component}/${partName}/quantity`);

    try {
        await runTransaction(partRef, (currentQuantity) => {
            if (currentQuantity === null) {
                throw new Error('Part does not exist in database.');
            } else {
                const updatedQuantity = currentQuantity - parseInt(quantity, 10);
                if (updatedQuantity < 0) {
                    throw new Error('Not enough stock.');
                }
                return updatedQuantity;
            }
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
}

function populateInvoiceDropdown(searchQuery = '', selectedInvoiceNumber = '') {
    const dropdown = document.getElementById('invoice-dropdown');
    dropdown.innerHTML = '';

    const invoicesRef = ref(database, 'invoices');
    get(invoicesRef).then((snapshot) => {
        if (snapshot.exists()) {
            const invoices = snapshot.val();
            for (const invoiceNumber in invoices) {
                if (invoices.hasOwnProperty(invoiceNumber)) {
                    const invoice = invoices[invoiceNumber];
                    if (searchQuery === '' ||
                        invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        invoice.customerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        invoice.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        invoice.customerPhone.toLowerCase().includes(searchQuery.toLowerCase())) {
                        const option = document.createElement('option');
                        option.value = invoiceNumber;
                        option.textContent = invoiceNumber;
                        if (invoiceNumber === selectedInvoiceNumber) {
                            option.selected = true;
                        }
                        dropdown.appendChild(option);
                    }
                }
            }
        }
    }).catch((error) => {
        console.error('Error fetching invoices:', error);
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
        const invoiceRef = ref(database, 'invoices/' + selectedInvoiceNumber);

        try {
            await remove(invoiceRef);
            console.log(`Invoice ${selectedInvoiceNumber} deleted successfully`);
            populateInvoiceDropdown();
        } catch (error) {
            console.error(`Error deleting invoice ${selectedInvoiceNumber}:`, error);
        }
    } else {
        console.error('No invoice selected for deletion.');
    }
});

addPartRowButton.addEventListener('click', () => {
    const selectedPart = partSelector.value;
    if (selectedPart) {
        addPartRow(selectedPart);
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
    if (selectedInvoiceNumber) {
        clearInvoice();
        const invoiceRef = ref(database, 'invoices/' + selectedInvoiceNumber);
        get(invoiceRef).then((snapshot) => {
            if (snapshot.exists()) {
                const invoiceData = snapshot.val();

                document.getElementById('invoice-type').value = invoiceData.invoiceType;
                document.getElementById('title-input').value = invoiceData.invoiceTitle;
                document.getElementById('invoice-type').value = invoiceData.invoiceType;
                document.getElementById('customer-name').value = invoiceData.customerName;
                document.getElementById('customer-phone').value = invoiceData.customerPhone;
                document.getElementById('customer-email').value = invoiceData.customerEmail;
                document.getElementById('customer-address').value = invoiceData.customerAddress;
                document.getElementById('invoice-number').value = invoiceData.invoiceNumber;
                document.getElementById('notes').value = invoiceData.notes;
                document.getElementById('invoice-date').value = invoiceData.invoiceDate;
                document.getElementById('amount-paid').value = invoiceData.amountPaid;
                document.getElementById('tax-percent').value = invoiceData.taxPercent;

                if (invoiceData.parts && invoiceData.parts.length > 0) {
                    invoiceData.parts.forEach(part => {
                        addPartRow(part.part, part.category, part.component);
                        const newRow = document.querySelector(`[data-part="${part.part}"]`);
                        newRow.querySelector('input[name="part-quantity"]').value = part.quantity;
                        newRow.querySelector('input[name="part-price"]').value = part.price;
                        newRow.querySelector('input[name="part-actual-price"]').value = part.actualPrice;
                        updatePartRowTotal(newRow);
                    });
                }

                if (invoiceData.labor && invoiceData.labor.length > 0) {
                    invoiceData.labor.forEach((labor) => {
                        addLaborRow(labor.description, labor.hours, labor.rate);
                        const newRow = laborTableBody.querySelector('tr:last-child');

                        newRow.querySelector('input[name="labor-description"]').value = labor.description;
                        newRow.querySelector('input[name="labor-hours"]').value = labor.hours;
                        newRow.querySelector('input[name="labor-rate"]').value = labor.rate;

                        const hoursInput = newRow.querySelector('input[name="labor-hours"]');
                        const rateInput = newRow.querySelector('input[name="labor-rate"]');
                        const totalInput = newRow.querySelector('input[name="labor-total"]');

                        updateLaborTotal(hoursInput, rateInput, totalInput);
                    });
                }

                updateTotals();
                updateRemainingBalance();
            }
        }).catch((error) => {
            console.error('Error fetching selected invoice:', error);
        });
    } else {
        alert('Please select an invoice to load.');
    }
});

document.getElementById('exportButton').addEventListener('click', function () {
    const selectedInvoiceNumber = document.getElementById('invoice-dropdown').value;

    if (selectedInvoiceNumber) {
        const invoiceRef = ref(database, 'invoices/' + selectedInvoiceNumber);

        get(invoiceRef).then((snapshot) => {
            if (snapshot.exists()) {
                const invoiceData = snapshot.val();

                // Convert invoice data to JSON string
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

populateInvoiceDropdown();

const categoryFilter = document.getElementById('category-filter');
const entriesContainer = document.getElementById('entries-container');
const categoryInput = document.getElementById('category');
const componentInput = document.getElementById('component');
const partNameInput = document.getElementById('partName');
const priceInput = document.getElementById('price');
const actualPriceInput = document.getElementById('actualPrice');
const quantityInput = document.getElementById('quantity');
const descriptionInput = document.getElementById('description');
const inventoryRef = ref(database, 'inventory');

function loadDatabaseEntries() {
    onValue(inventoryRef, (snapshot) => {
        const entries = snapshot.val();
        updateCategoryFilter(entries);
        displayEntries(entries);
    }, handleError);
}

function updateCategoryFilter(entries) {
    const categorySet = new Set(Object.keys(entries));
    categoryFilter.innerHTML = '';
    categorySet.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.innerText = category;
        categoryFilter.appendChild(option);
    });
}

function displayEntries(entries, filterCategory = '') {
    const container = document.getElementById('entries-container');
    container.innerHTML = '';

    for (const category in entries) {
        if (filterCategory && category !== filterCategory) continue;
        for (const component in entries[category]) {
            for (const partName in entries[category][component]) {
                const entry = entries[category][component][partName];
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('data');

                entryDiv.innerHTML = `
                <label>Category:<input type="text" class="category" value="${category || ''}"></label>
                <label>Sub-Category:<input type="text" class="component" value="${component || ''}"></label>
                <label>Part Info:<input type="text" class="partName" value="${partName || ''}"></label>
                <label>Price: $<input type="number" class="price" value="${entry.price || 0}"></label>
                <label>Cost: $<input type="number" class="actualPrice" value="${entry.actualPrice || 0}"></label>
                <label>Quantity:<input type="number" class="quantity" value="${entry.quantity || 0}"></label>
                <label>Description:<textarea class="description">${entry.description || ''}</textarea></label>                        <button class="view-image-btn" data-partname="${partName}">View Image</button>
                <button class="save-button">Update</button>
                <button class="delete-button">Delete</button>
                `;

                const saveButton = entryDiv.querySelector('.save-button');
                saveButton.addEventListener('click', () => saveEntry(entryDiv, category, component, partName));

                const deleteButton = entryDiv.querySelector('.delete-button');
                deleteButton.addEventListener('click', () => deleteEntry(category, component, partName, entryDiv));

                const viewImageButton = entryDiv.querySelector('.view-image-btn');
                viewImageButton.addEventListener('click', function () {
                    showPartImage(this.dataset.partname);
                });

                container.appendChild(entryDiv);
            }
        }
    }
}

function handleError(error) {
    console.error("Database operation failed:", error);
}

function showPartImage(partName) {
    const modal = document.getElementById('modal');
    const img = document.getElementById('part-image');
    const imgSrc = `img/database/${partName}.png`;

    const imageExists = new Promise((resolve) => {
        const testImage = new Image();
        testImage.src = imgSrc;
        testImage.onload = () => resolve(true);
        testImage.onerror = () => resolve(false);
    });

    imageExists.then((exists) => {
        img.src = exists ? imgSrc : 'img/database/default.png';
        modal.style.display = 'block';

        img.addEventListener('click', function () {
            modal.style.display = 'none';
        });
    });
}


function loadAndDisplayEntries(filterCategory) {
    const entriesRef = ref(database, 'inventory');
    onValue(entriesRef, (snapshot) => {
        const entries = snapshot.val();
        displayEntries(entries, filterCategory);
    }, (error) => {
        console.error("Error loading database entries:", error);
    });
}

function loadAndDisplayEntriesBySearch(searchText) {
    const entriesRef = ref(database, 'inventory');
    onValue(entriesRef, (snapshot) => {
        const entries = snapshot.val();
        const filteredEntries = filterEntries(entries, searchText);
        displayEntries(filteredEntries);
    }, (error) => {
        console.error("Error loading database entries:", error);
    });
}

function filterEntries(entries, searchText) {
    const filteredEntries = {};

    for (const category in entries) {
        for (const component in entries[category]) {
            for (const partName in entries[category][component]) {
                const entry = entries[category][component][partName];
                const entryText = `${category} ${component} ${partName} ${entry.description}`.toLowerCase();
                if (entryText.includes(searchText)) {
                    if (!filteredEntries[category]) {
                        filteredEntries[category] = {};
                    }
                    if (!filteredEntries[category][component]) {
                        filteredEntries[category][component] = {};
                    }
                    filteredEntries[category][component][partName] = entry;
                }
            }
        }
    }

    return filteredEntries;
}

function sanitizeInput(input) {
    return input.replace(/\//g, '_');
}

function saveEntry(entryDiv, oldCategory, oldComponent, oldPartName) {
    const categoryInput = entryDiv.querySelector('.category');
    const componentInput = entryDiv.querySelector('.component');
    const partNameInput = entryDiv.querySelector('.partName');
    const price = entryDiv.querySelector('.price').value;
    const actualPrice = entryDiv.querySelector('.actualPrice').value;
    const quantity = entryDiv.querySelector('.quantity').value;
    const description = entryDiv.querySelector('.description').value;

    const sanitizedCategory = sanitizeInput(categoryInput.value);
    const sanitizedComponent = sanitizeInput(componentInput.value);
    const sanitizedPartName = sanitizeInput(partNameInput.value);

    if (!sanitizedCategory || !sanitizedComponent || !sanitizedPartName) {
        console.error('Please fill in all required fields.', error);
        return;
    }

    const entryRef = ref(database, `inventory/${sanitizedCategory}/${sanitizedComponent}/${sanitizedPartName}`);
    const dataToSave = {
        price: price,
        actualPrice: actualPrice,
        quantity: quantity,
        description: description
    };

    set(entryRef, dataToSave)
        .then(() => {
            console.log('Entry saved successfully');
            if (
                sanitizedCategory !== oldCategory ||
                sanitizedComponent !== oldComponent ||
                sanitizedPartName !== oldPartName
            ) {
                const oldEntryRef = ref(database, `inventory/${oldCategory}/${oldComponent}/${oldPartName}`);
                remove(oldEntryRef).catch((error) => {
                    console.error('Error deleting old entry:', error);
                });
            }
        })
        .catch((error) => {
            console.error('Error saving entry:', error);
        });
}

function deleteEntry(category, component, partName, entryDiv) {
    const entryRef = ref(database, `inventory/${category}/${component}/${partName}`);
    remove(entryRef)
        .then(() => {
            console.log('Entry deleted successfully');
            entryDiv.remove();
        })
        .catch((error) => {
            console.error('Error deleting entry:', error);
        });
}

function convertToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = 'Category,Component,Part Name,Price,Actual Price,Quantity,Description\n';

    for (let category in array) {
        for (let component in array[category]) {
            for (let partName in array[category][component]) {
                const entry = array[category][component][partName];
                str += `${category},${component},${partName},${entry.price},${entry.actualPrice},${entry.quantity},"${entry.description}"\n`;
            }
        }
    }
    return str;
}

function downloadCSV(csvData) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'database_entries.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.getElementById('save-data-button').addEventListener('click', (event) => {
    event.preventDefault();

    const category = sanitizeInput(document.getElementById('category').value);
    const component = sanitizeInput(document.getElementById('component').value);
    const partName = sanitizeInput(document.getElementById('partName').value);
    const price = document.getElementById('price').value;
    const actualPrice = document.getElementById('actualPrice').value;
    const quantity = document.getElementById('quantity').value;
    const description = document.getElementById('description').value;

    if (!category || !component || !partName) {
        console.error('Please fill in all required fields.', error);
        return;
    }

    const entryRef = ref(database, `inventory/${category}/${component}/${partName}`);
    const dataToSave = {
        price: price,
        actualPrice: actualPrice,
        quantity: quantity,
        description: description
    };

    set(entryRef, dataToSave)
        .then(() => {
            console.log('Data saved successfully');
        })
        .catch((error) => {
            console.error('Error saving data:', error);
        });
});

document.getElementById('category-filter').addEventListener('change', (event) => {
    const selectedCategory = event.target.value;
    loadAndDisplayEntries(selectedCategory);
});

document.getElementById('search-input').addEventListener('input', (event) => {
    const searchText = event.target.value.toLowerCase();
    loadAndDisplayEntriesBySearch(searchText);
});

document.getElementById('download-csv-button').addEventListener('click', () => {
    const entriesRef = ref(database, 'inventory');
    onValue(entriesRef, (snapshot) => {
        const entries = snapshot.val();
        const csvData = convertToCSV(entries);
        downloadCSV(csvData);
    }, (error) => {
        console.error("Error fetching data for CSV:", error);
    });
});

loadDatabaseEntries();

// Hiding Fields
const hideParentCheckboxes = document.querySelectorAll('.hide-parent-checkbox');

hideParentCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const parentDiv = checkbox.closest('div');
        if (parentDiv) {
            parentDiv.style.display = checkbox.checked ? 'none' : 'block';
        }
    });
});

// Local Storage Save/Load State
function saveDataToLocalStorage() {
    const inputData = {
        invoiceTitle: document.getElementById('title-input').value,
        customerName: document.getElementById('customer-name').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerEmail: document.getElementById('customer-email').value,
        customerAddress: document.getElementById('customer-address').value,
        invoiceDate: document.getElementById('invoice-date').value,
        invoiceNumber: document.getElementById('invoice-number').value,
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
        document.getElementById('invoice-date').value = inputData.invoiceDate || '';
        document.getElementById('invoice-number').value = inputData.invoiceNumber || '';
        document.getElementById('notes').value = inputData.notes || '';
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
// Clear Invoice Fields
function clearInvoice() {
    const inputElements = [
        'title-input',
        'customer-name',
        'customer-phone',
        'customer-email',
        'customer-address',
        'invoice-date',
        'invoice-number',
        'notes',
    ];

    inputElements.forEach((elementId) => {
        document.getElementById(elementId).value = '';
    });

    const partsTableBody = document.querySelector('.parts-table tbody');
    partsTableBody.innerHTML = '';

    const laborTableBody = document.querySelector('.labor-table tbody');
    laborTableBody.innerHTML = '';

    document.getElementById('subtotal').value = '';
    document.getElementById('tax-percent').value = '';
    document.getElementById('tax').value = '';
    document.getElementById('total').value = '';
    document.getElementById('amount-paid').value = '';

    document.getElementById('remaining').checked = false;
    document.querySelector('.remaining').style.display = 'none';

    document.getElementById('price-difference').innerText = '';
    document.getElementById('remaining-balance').innerText = '';

    localStorage.removeItem('inputData');
}

document.getElementById('clear-button').addEventListener('click', clearInvoice);

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

async function analyzeInvoiceData() {
    const invoicesRef = ref(database, 'invoices');
    try {
        const snapshot = await get(invoicesRef);
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

                // Check if the entry is an invoice, not a quote
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
        } else {
            console.error('No invoice data found.');
        }
    } catch (error) {
        console.error('Error fetching invoices:', error);
    }
}

async function populateCustomerDropdown() {
    const invoicesRef = ref(database, 'invoices');
    try {
        const snapshot = await get(invoicesRef);
        if (snapshot.exists()) {
            const invoices = snapshot.val();
            const customerNames = new Set();

            for (const invoiceId in invoices) {
                const customerName = invoices[invoiceId].customerName;
                if (customerName) {
                    customerNames.add(customerName);
                }
            }

            const dropdown = document.getElementById('customer-dropdown');
            dropdown.innerHTML = '<option value="">Select a Customer</option>';
            customerNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                dropdown.appendChild(option);
            });
        } else {
            console.error('No invoice data found.');
        }
    } catch (error) {
        console.error('Error fetching invoices:', error);
    }
}

function updateCustomerDetails(customerName) {
    const invoicesRef = ref(database, 'invoices');
    get(invoicesRef).then(snapshot => {
        if (snapshot.exists()) {
            const invoices = snapshot.val();
            const phoneNumbers = new Set();
            const addresses = new Set();

            for (const invoiceId in invoices) {
                const invoice = invoices[invoiceId];
                if (invoice.customerName === customerName) {
                    phoneNumbers.add(invoice.customerPhone);
                    addresses.add(invoice.customerAddress);
                }
            }

            const phoneNumbersList = document.getElementById('customer-phone-numbers');
            phoneNumbersList.innerHTML = '';
            phoneNumbers.forEach(phone => {
                const li = document.createElement('li');
                li.textContent = phone;
                phoneNumbersList.appendChild(li);
            });

            const addressesList = document.getElementById('customer-addresses');
            addressesList.innerHTML = '';
            addresses.forEach(address => {
                const li = document.createElement('li');
                li.textContent = address;
                addressesList.appendChild(li);
            });
        }
    }).catch(error => {
        console.error('Error fetching invoices:', error);
    });
}

document.getElementById('customer-dropdown').addEventListener('change', function () {
    const selectedCustomer = this.value;
    if (selectedCustomer) {
        updateCustomerDetails(selectedCustomer);
    } else {
        document.getElementById('customer-phone-numbers').innerHTML = '';
        document.getElementById('customer-addresses').innerHTML = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    analyzeInvoiceData();
    populateCustomerDropdown();
});

document.addEventListener('DOMContentLoaded', analyzeInvoiceData);
