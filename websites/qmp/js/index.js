import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getDatabase, ref, onValue, set, update, remove } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js';

const appSettings = {
    databaseURL: "https://inventory-54829-default-rtdb.firebaseio.com/"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);

const partsTableBody = document.querySelector('.parts-table tbody');
const subtotalInput = document.getElementById('subtotal');
const taxPercentInput = document.getElementById('tax-percent');
const taxInput = document.getElementById('tax');
const totalInput = document.getElementById('total');
const addPartRowButton = document.getElementById('add-part-row');
const saveButton = document.getElementById('save-button');
const printButton = document.getElementById('print-button');
const partSelector = document.getElementById('part-selector');
const addLaborRowButton = document.getElementById('add-labor-row');
const laborTableBody = document.querySelector('.labor-table tbody');
const importFileInput = document.getElementById('import-file');

function loadDatabase() {
    const partsRef = ref(database, 'Items');

    onValue(partsRef, (snapshot) => {
        const items = snapshot.val();

        partSelector.innerHTML = '';

        for (const category in items) {
            const components = items[category];
            for (const component in components) {
                const parts = components[component];
                for (const partName in parts) {
                    const part = parts[partName];
                    const option = document.createElement('option');
                    option.value = partName;
                    option.textContent = partName;
                    option.dataset.price = part.price;
                    option.dataset.actualPrice = part.actualPrice;
                    option.dataset.quantity = part.quantity;
                    option.dataset.category = category;
                    option.dataset.component = component;

                    partSelector.appendChild(option);
                }
            }
        }

    }, (error) => {
        console.error("Error loading parts database:", error);
        updateLaborTotal(hoursInput, rateInput, totalInput);
    });
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

function addPartRow(part) {
    const selectedOption = partSelector.querySelector(`option[value="${part}"]`);
    if (!selectedOption) return;

    const price = parseFloat(selectedOption.dataset.price) || 0;
    const actualPrice = parseFloat(selectedOption.dataset.actualPrice) || 0;
    const availableQuantity = parseInt(selectedOption.dataset.quantity) || 0;
    const existingRow = partsTableBody.querySelector(`tr[data-part="${part}"]`);

    if (existingRow) {
        const quantityInput = existingRow.querySelector('input[name="part-quantity"]');
        const currentQuantity = parseInt(quantityInput.value) || 0;

        if (currentQuantity + 1 <= availableQuantity) {
            quantityInput.value = currentQuantity + 1;
            updatePartRowTotal(existingRow);
        } else {
            alert("Not enough stock available!");
        }
    } else {
        const newRow = document.createElement('tr');
        newRow.dataset.part = part;

        newRow.innerHTML = `
            <td>${part}</td>
            <td><input type="number" name="part-quantity" min="1" max="${availableQuantity}" value="1"></td>
            <td><input type="number" name="part-price" min="0" value="${price}" class="part-price-input"></td>
            <td class="actual-price-hide"><input type="number" name="part-actual-price" min="0" value="${actualPrice}" class="actual-price-input"></td>
            <td><input type="number" name="part-total" min="0" value="${price}" readonly></td>
        `;

        partsTableBody.appendChild(newRow);

        const priceInput = newRow.querySelector('input[name="part-price"]');
        const quantityInput = newRow.querySelector('input[name="part-quantity"]');

        priceInput.addEventListener('input', function () {
            updatePartRowTotal(newRow);
        });

        quantityInput.addEventListener('input', function () {
            updatePartRowTotal(newRow);
        });

        updateTotals();
    }
    updatePriceDifference();
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

function updateLaborTotal(hoursInput, rateInput, totalInput) {
    const hours = parseFloat(hoursInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const total = hours * rate;
    totalInput.value = total.toFixed(2);
    updateTotals();
}

async function saveInvoice() {
    const invoiceData = {
        customerName: document.getElementById('customer-name').value,
        customerAddress: document.getElementById('customer-address').value,
        invoiceNumber: document.getElementById('invoice-number').value, // Include invoice-number
        notes: document.getElementById('notes').value, // Include notes
        invoiceDate: document.getElementById('invoice-date').value,
        parts: [...partsTableBody.querySelectorAll('tr')].map(row => ({
            part: row.querySelector('td').textContent.trim(),
            quantity: row.querySelector('input[name="part-quantity"]').value,
            price: row.querySelector('input[name="part-price"]').value,
            total: row.querySelector('input[name="part-total"]').value,
        })),
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
    };

    try {
        for (const part of invoiceData.parts) {
            const partName = part.part.trim();
            const selectedOption = partSelector.querySelector(`option[value="${partName}"]`);

            if (!selectedOption) {
                console.error(`Error: Part ${partName} not found in part selector`);
                continue;
            }

            const currentQuantity = parseInt(selectedOption.dataset.quantity, 10) || 0;
            const quantityToDeduct = parseInt(part.quantity, 10) || 0;
            const newQuantity = currentQuantity - quantityToDeduct;

            if (newQuantity < 0) {
                console.error(`Error: Quantity for ${partName} cannot be negative`);
                return;
            }

            const category = selectedOption.dataset.category;
            const component = selectedOption.dataset.component;
            await updatePartQuantityInDatabase(category, component, partName, newQuantity);

            // Optionally remove the option from the selector if the quantity is now 0
            if (newQuantity === 0) {
                selectedOption.remove();
            } else {
                selectedOption.dataset.quantity = newQuantity; // Update quantity in the selector
            }
        }

        console.log('Invoice saved successfully');
        return invoiceData;
    } catch (error) {
        console.error('Error updating the database:', error);
        return null;
    }
}

async function updatePartQuantityInDatabase(category, component, partName, newQuantity) {
    const partsRef = ref(database, `Items/${category}/${component}/${partName}`);
    await update(partsRef, { quantity: newQuantity });
}

addPartRowButton.addEventListener('click', () => {
    const selectedPart = partSelector.value;
    if (selectedPart) {
        addPartRow(selectedPart);
    }
});

function printInvoice() {
    window.print();
}

function downloadObjectAsJson(exportObj, exportName) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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

function readFileAsJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (event) => {
            reject(new Error('Error reading the file'));
        };

        reader.readAsText(file);
    });
}

function saveDataToLocalStorage() {
    const inputData = {
        customerName: document.getElementById('customer-name').value,
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

        document.getElementById('customer-name').value = inputData.customerName || '';
        document.getElementById('customer-address').value = inputData.customerAddress || '';
        document.getElementById('invoice-date').value = inputData.invoiceDate || '';
        document.getElementById('invoice-number').value = inputData.invoiceNumber || '';
        document.getElementById('notes').value = inputData.notes || '';
    }
}

function clearInvoice() {
    const inputElements = [
        'customer-name',
        'customer-address',
        'invoice-date',
        'invoice-number',
        'notes'
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

    document.getElementById('remaining').checked = false;
    document.querySelector('.remaining').style.display = 'none';

    document.getElementById('price-difference').innerText = '';

    localStorage.removeItem('inputData');
}

printButton.addEventListener('click', printInvoice);

saveButton.addEventListener('click', async () => {
    const invoiceData = await saveInvoice();
    if (invoiceData) {
        downloadObjectAsJson(invoiceData, 'invoice');
    }
});

addLaborRowButton.addEventListener('click', addLaborRow);

importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];

    if (file) {
        try {
            const invoiceData = await readFileAsJSON(file);

            if (invoiceData) {
                document.getElementById('customer-name').value = invoiceData.customerName;
                document.getElementById('customer-address').value = invoiceData.customerAddress;
                document.getElementById('invoice-date').value = invoiceData.invoiceDate;
                document.getElementById('invoice-number').value = invoiceData.invoiceNumber;
                document.getElementById('notes').value = invoiceData.notes;

                const partsTableBody = document.querySelector('.parts-table tbody');
                partsTableBody.innerHTML = '';
                invoiceData.parts.forEach((part) => {
                    const partName = part.part;
                    if (!partsTableBody.querySelector(`[data-part="${partName}"]`)) {
                        addPartRow(partName);
                    }
                    const newRow = partsTableBody.querySelector(`[data-part="${partName}"]`);
                    newRow.querySelector('input[name="part-quantity"]').value = part.quantity;
                    newRow.querySelector('input[name="part-price"]').value = part.price;
                    updatePartRowTotal(newRow);
                });

                const laborTableBody = document.querySelector('.labor-table tbody');
                laborTableBody.innerHTML = '';
                invoiceData.labor.forEach((labor) => {
                    addLaborRow();
                    const newRow = document.querySelector('.labor-table tbody tr:last-child');
                    newRow.querySelector('input[name="labor-description"]').value = labor.description;
                    newRow.querySelector('input[name="labor-hours"]').value = labor.hours;
                    newRow.querySelector('input[name="labor-rate"]').value = labor.rate;

                    const hoursInput = newRow.querySelector('input[name="labor-hours"]');
                    const rateInput = newRow.querySelector('input[name="labor-rate"]');
                    const totalInput = newRow.querySelector('input[name="labor-total"]');
                    updateLaborTotal(hoursInput, rateInput, totalInput);

                    updateTotals();
                });

                document.getElementById('tax-percent').value = invoiceData.taxPercent;
                updateTotals();
            } else {
                console.error('Invalid JSON data in the imported file');
            }
        } catch (error) {
            console.error('Error reading the imported file:', error);
        }
    }
});

function updateRemainingBalance() {
    const amountPaidInput = document.getElementById('amount-paid');
    const remainingBalanceSpan = document.getElementById('remaining-balance');
    const totalInput = document.getElementById('total');

    const amountPaid = parseFloat(amountPaidInput.value) || 0;
    const total = parseFloat(totalInput.value) || 0;
    const remainingBalance = total - amountPaid;

    remainingBalanceSpan.textContent = remainingBalance.toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    taxPercentInput.addEventListener('input', updateTotals);
    updatePriceDifference();
});

document.addEventListener('input', function (event) {
    if (event.target.classList.contains('actual-price-input') || event.target.classList.contains('part-price-input')) {
        console.log('Part price input or actual price input changed');
        updatePriceDifference();
        updateTotals();
    }
});

document.getElementById('remaining').addEventListener('change', function () {
    var remainingDiv = document.querySelector('.remaining');

    if (this.checked) {
        remainingDiv.style.display = 'flex';
    } else {
        remainingDiv.style.display = 'none';
    }
});

window.onload = function () {
    var checkbox = document.getElementById('remaining');
    var remainingDiv = document.querySelector('.remaining');
    remainingDiv.style.display = checkbox.checked ? 'block' : 'none';
}

document.getElementById('customer-name').addEventListener('input', saveDataToLocalStorage);
document.getElementById('customer-address').addEventListener('input', saveDataToLocalStorage);
document.getElementById('invoice-date').addEventListener('input', saveDataToLocalStorage);
document.getElementById('invoice-number').addEventListener('input', saveDataToLocalStorage);
document.getElementById('notes').addEventListener('input', saveDataToLocalStorage);

document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    taxPercentInput.addEventListener('input', updateTotals);
    updatePriceDifference();

    loadDataFromLocalStorage();
});

document.getElementById('clear-button').addEventListener('click', clearInvoice);

document.getElementById('amount-paid').addEventListener('input', updateRemainingBalance);

updateRemainingBalance();