import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getDatabase, ref, onValue, set, update, remove } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js';

const appSettings = {
    databaseURL: "https://test-3d36b-default-rtdb.firebaseio.com/"
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
            <td><input type="number" name="part-price" min="0" value="${price}" readonly></td>
            <td><input type="number" name="part-actual-price" min="0" value="${actualPrice}" readonly class="actual-price-input"></td>
            <td><input type="number" name="part-total" min="0" value="${price}" readonly></td>
        `;

        partsTableBody.appendChild(newRow);

        const quantityInput = newRow.querySelector('input[name="part-quantity"]');
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
    const totalInput = row.querySelector('input[name="part-total"]');

    const quantity = parseInt(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
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

addLaborRowButton.addEventListener('click', addLaborRow);

async function saveInvoice() {
    const invoiceData = {
        customerName: document.getElementById('customer-name').value,
        customerAddress: document.getElementById('customer-address').value,
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

printButton.addEventListener('click', printInvoice);

saveButton.addEventListener('click', async () => {
    const invoiceData = await saveInvoice();
    if (invoiceData) {
        downloadObjectAsJson(invoiceData, 'invoice');
    }
});

function updatePriceDifference() {
    console.log('Updating price difference');
    let totalDifference = 0;
    const rows = partsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const price = parseFloat(row.querySelector('input[name="part-price"]').value) || 0;
        const actualPrice = parseFloat(row.querySelector('input[name="part-actual-price"]').value) || 0;
        totalDifference += (price - actualPrice);
    });
    console.log('Total Price Difference:', totalDifference.toFixed(2));
    document.getElementById('price-difference').innerText = totalDifference.toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    taxPercentInput.addEventListener('input', updateTotals);
    updatePriceDifference();
});

document.addEventListener('input', function (event) {
    if (event.target.classList.contains('actual-price-input')) {
        console.log('Actual price input changed');
        updatePriceDifference();
    }
});
