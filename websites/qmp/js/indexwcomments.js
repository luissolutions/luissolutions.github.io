// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getDatabase, ref, onValue, set, update, remove } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js';

// Firebase configuration
const appSettings = {
    databaseURL: "https://inventory-54829-default-rtdb.firebaseio.com/"
};

// Initialize Firebase app
const app = initializeApp(appSettings);
const database = getDatabase(app);

// Select DOM elements
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

// Function to load data from Firebase database
function loadDatabase() {
    const partsRef = ref(database, 'Items');

    onValue(partsRef, (snapshot) => {
        const items = snapshot.val();

        // Populate partSelector with data from the database
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
    });
}

// Function to update totals
function updateTotals() {
    // Calculate totals for parts and labor
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

    // Calculate subtotal, tax, and total
    const subtotal = partsTotal + laborTotal;
    const taxPercent = parseFloat(taxPercentInput.value) || 0;
    const tax = partsTotal * (taxPercent / 100);
    const total = subtotal + tax;

    subtotalInput.value = subtotal.toFixed(2);
    taxInput.value = tax.toFixed(2);
    totalInput.value = total.toFixed(2);
}

// Function to add a row for a selected part
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
            <td style="display:none"><input type="number" name="part-actual-price" min="0" value="${actualPrice}" readonly class="actual-price-input"></td>
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

// Function to update the total for a part row
function updatePartRowTotal(row) {
    const quantityInput = row.querySelector('input[name="part-quantity"]');
    const priceInput = row.querySelector('input[name="part-price"]');
    const actualPriceInput = row.querySelector('input[name="part-actual-price"]');
    const totalInput = row.querySelector('input[name="part-total"]');

    const quantity = parseInt(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    const actualPrice = parseFloat(actualPriceInput.value) || 0;
    const total = quantity * price;
    const totalActualPrice = quantity * actualPrice;

    totalInput.value = total.toFixed(2);

    updateTotals();
    updatePriceDifference();
}

// Function to add a row for labor
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

    const updateLaborTotal = () => {
        const hours = parseFloat(hoursInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const total = hours * rate;
        totalInput.value = total.toFixed(2);
        updateTotals();
    };

    hoursInput.addEventListener('input', updateLaborTotal);
    rateInput.addEventListener('input', updateLaborTotal);
}

// Function to save the invoice data
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

// Function to update the quantity of a part in the database
async function updatePartQuantityInDatabase(category, component, partName, newQuantity) {
    const partsRef = ref(database, `Items/${category}/${component}/${partName}`);
    await update(partsRef, { quantity: newQuantity });
}

// Event listeners for buttons and inputs
addPartRowButton.addEventListener('click', () => {
    const selectedPart = partSelector.value;
    if (selectedPart) {
        addPartRow(selectedPart);
    }
});

// ... (other event listeners)

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    taxPercentInput.addEventListener('input', updateTotals);
    updatePriceDifference();

    loadDataFromLocalStorage();
});

// Function to clear the invoice
function clearInvoice() {
    // ... (rest of the code for clearing the invoice)
}

// Event listener for the "Clear" button
document.getElementById('clear-button').addEventListener('click', clearInvoice);
