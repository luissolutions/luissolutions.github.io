import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getDatabase, ref, onValue, set, remove } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js';

const appSettings = {
    databaseURL: "https://inventory-54829-default-rtdb.firebaseio.com/"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);

function loadDatabaseEntries() {
    loadAndDisplayEntries();

    const entriesRef = ref(database, 'Items');
    onValue(entriesRef, (snapshot) => {
        const entries = snapshot.val();
        updateCategoryFilter(entries);
        displayEntries(entries);
    }, (error) => {
        console.error("Error loading database entries:", error);
    });
}

function updateCategoryFilter(entries) {
    const categorySet = new Set();
    for (const category in entries) {
        categorySet.add(category);
    }

    const categoryFilter = document.getElementById('category-filter');

    categoryFilter.innerHTML = '';

    categorySet.forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.innerText = category;
        categoryFilter.appendChild(option);
    });
}

loadDatabaseEntries();

document.getElementById('save-button').addEventListener('click', () => {
    const category = document.getElementById('category').value;
    const component = document.getElementById('component').value;
    const partName = document.getElementById('partName').value;
    const price = document.getElementById('price').value;
    const actualPrice = document.getElementById('actualPrice').value;
    const quantity = document.getElementById('quantity').value;

    const entryRef = ref(database, `Items/${category}/${component}/${partName}`);
    set(entryRef, { price, actualPrice, quantity })
        .then(() => {
            console.log('Entry saved successfully');
        })
        .catch((error) => {
            console.error('Error saving entry:', error);
        });
});

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
                <label><strong>Category:</strong> <input type="text" class="category" value="${category}"></label>
                <label><strong>Component:</strong> <input type="text" class="component" value="${component}"></label>
                <label><strong>Part Name:</strong> <input type="text" class="partName" value="${partName}"></label>
                <label><strong>Price:</strong> <input type="number" class="price" value="${entry.price}"></label>
                <label><strong>Actual Price:</strong> <input type="number" class="actualPrice" value="${entry.actualPrice || ''}"></label>
                <label><strong>Quantity:</strong> <input type="number" class="quantity" value="${entry.quantity}"></label>
                <button class="save-button">Save</button>
                <button class="delete-button">Delete</button>
                `;

                const saveButton = entryDiv.querySelector('.save-button');
                saveButton.addEventListener('click', () => saveEntry(entryDiv, category, component, partName));

                const deleteButton = entryDiv.querySelector('.delete-button');
                deleteButton.addEventListener('click', () => deleteEntry(category, component, partName, entryDiv));

                container.appendChild(entryDiv);
            }
        }
    }
}

function saveEntry(entryDiv, oldCategory, oldComponent, oldPartName) {
    const categoryInput = entryDiv.querySelector('.category');
    const componentInput = entryDiv.querySelector('.component');
    const partNameInput = entryDiv.querySelector('.partName');
    const price = entryDiv.querySelector('.price').value;
    const actualPrice = entryDiv.querySelector('.actualPrice').value;
    const quantity = entryDiv.querySelector('.quantity').value;

    const newCategory = categoryInput.value;
    const newComponent = componentInput.value;
    const newPartName = partNameInput.value;

    const entryRef = ref(database, `Items/${newCategory}/${newComponent}/${newPartName}`);
    const oldEntryRef = ref(database, `Items/${oldCategory}/${oldComponent}/${oldPartName}`);

    set(entryRef, { price, actualPrice, quantity })
        .then(() => {
            console.log('Entry saved successfully');
            // Check if the category, component, or partName has changed
            if (
                newCategory !== oldCategory ||
                newComponent !== oldComponent ||
                newPartName !== oldPartName
            ) {
                // Delete the old entry if any of the key fields have changed
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
    const entryRef = ref(database, `Items/${category}/${component}/${partName}`);
    remove(entryRef)
        .then(() => {
            console.log('Entry deleted successfully');
            entryDiv.remove();
        })
        .catch((error) => {
            console.error('Error deleting entry:', error);
        });
}

function loadAndDisplayEntries(filterCategory) {
    const entriesRef = ref(database, 'Items');
    onValue(entriesRef, (snapshot) => {
        const entries = snapshot.val();
        displayEntries(entries, filterCategory);
    }, (error) => {
        console.error("Error loading database entries:", error);
    });
}

document.getElementById('category-filter').addEventListener('change', (event) => {
    const selectedCategory = event.target.value;
    loadAndDisplayEntries(selectedCategory);
});