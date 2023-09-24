import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Initialize Firebase
const appSettings = {
  databaseURL: "https://cprapp-21e27-default-rtdb.firebaseio.com/"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);

// Query DOM elements
const DOMElements = {
  inputFieldEl: document.getElementById("input-field"),
  repairFieldEl: document.getElementById("repair-field"),
  categoryRadios: document.querySelectorAll('input[name="category"]'),
  addButtonEl: document.getElementById("add-button"),
  phonesListEl: document.getElementById("phones-list"),
  phoneNameEl: document.getElementById("phone-name-input"),
  searchInputEl: document.getElementById("search-input"),
  searchButtonEl: document.getElementById('search-button'),
  exportButtonEl: document.getElementById("export-button"),
}

let selectedCategory = localStorage.getItem("selectedCategory") || "Apple";

// Event Listener Functions
function onSearchButtonClick() {
  /* ... */
}

function onSearchInputKeyDown() {
  /* ... */
}

function onCategoryRadioChange() {
  /* ... */
}

function onAddButtonClick() {
  let phoneName = phoneNameEl.value.trim();
  let repairType = repairFieldEl.value.trim();
  let price = inputFieldEl.value.trim();

  if (phoneName !== "" && repairType !== "" && price !== "") {
    const categoryRef = ref(database, `Devices/Phones/${selectedCategory}/${phoneName}/${repairType}`);
    set(categoryRef, price)
      .then(() => {
        clearInputFieldEl();
        repairFieldEl.value = "";
        phoneNameEl.value = "";
      })
      .catch((error) => {
        console.error("Error adding data:", error);
      });
  } else {
    alert("Please fill in all fields before adding data.");
  }
}

function onExportButtonClick() {
  /* ... */
}

// Utility Functions
function fetchDataForSelectedCategory() {
  const phonesInDB = ref(database, `Devices/Phones/${selectedCategory}`);

  onValue(phonesInDB, function (snapshot) {
    let itemsObject = snapshot.val();
    clearPhoneListEl();
    recursivelyAppendItemsToPhonesListEl(itemsObject);
  });
}

function clearPhoneListEl() {
  phonesListEl.innerHTML = "";
}

function clearInputFieldEl() {
  inputFieldEl.value = "";
}

function clearPhoneListEl() {
  /* ... */
}

function clearInputFieldEl() {
  /* ... */
}

function filterItemsBySearch() {
  return Object.keys(itemsObject).reduce((obj, key) => {
    let device = itemsObject[key];

    if (key.toLowerCase().includes(searchString)) {
      obj[key] = device;
    } else {
      let filteredDevice = Object.keys(device).reduce((subObj, subKey) => {
        if (subKey.toLowerCase().includes(searchString) || device[subKey].toString().toLowerCase().includes(searchString)) {
          subObj[subKey] = device[subKey];
        }
        return subObj;
      }, {});

      if (Object.keys(filteredDevice).length > 0) {
        obj[key] = filteredDevice;
      }
    }

    return obj;
  }, {});
}

function recursivelyAppendItemsToPhonesListEl() {
  let phonesTableBody = document.getElementById("phones-list");

  for (let key in obj) {
    let currentKey = prefix + key;
    let currentItem = obj[key];
    let phoneModel = currentKey.substring(0, currentKey.indexOf("/"));

    if (typeof currentItem === "object" && currentItem !== null) {
      recursivelyAppendItemsToPhonesListEl(currentItem, currentKey + "/");
    } else {
      let newRow = phonesTableBody.insertRow();
      let modelCell = newRow.insertCell();
      let repairCell = newRow.insertCell();
      let priceCell = newRow.insertCell();
      let actionCell = newRow.insertCell();

      let modelInput = document.createElement("input");
      modelInput.type = "text";
      modelInput.value = phoneModel;
      modelCell.appendChild(modelInput);

      let repairInput = document.createElement("input");
      repairInput.type = "text";
      repairInput.value = key;
      repairCell.appendChild(repairInput);

      let priceInput = document.createElement("input");
      priceInput.type = "text";
      priceInput.value = currentItem;
      priceCell.appendChild(priceInput);

      let addButton = document.createElement("button");
      addButton.textContent = "Add Repair";
      addButton.addEventListener("click", function () {
        let newRepair = repairInput.value.trim();
        let newPrice = priceInput.value.trim();

        if (newRepair !== "" && newPrice !== "") {
          let exactLocationOfItemInDB = ref(database, `Devices/Phones/${selectedCategory}/${phoneModel}`);
          let updates = {};
          updates[newRepair] = newPrice;

          update(exactLocationOfItemInDB, updates)
            .then(() => {
              location.reload();
            })
            .catch((error) => {
              console.error("Error adding repair:", error);
            });
        }
      });
      actionCell.appendChild(addButton);

      let updateButton = document.createElement("button");
      updateButton.textContent = "Update";
      updateButton.addEventListener("click", function () {
        let newModel = modelInput.value.trim();
        let newRepair = repairInput.value.trim();
        let newPrice = priceInput.value.trim();
        let exactLocationOfItemInDB = ref(database, `Devices/Phones/${selectedCategory}/${phoneModel}/${key}`);

        if (newModel !== "" && newRepair !== "" && newPrice !== "") {
          if (newModel !== phoneModel || newRepair !== key) {
            remove(exactLocationOfItemInDB);
            exactLocationOfItemInDB = ref(database, `Devices/Phones/${selectedCategory}/${newModel}/${newRepair}`);
          }

          set(exactLocationOfItemInDB, newPrice)
            .then(() => {
              location.reload();
            })
            .catch((error) => {
              console.error("Error updating repair:", error);
            });
        }
      });
      actionCell.appendChild(updateButton);

      let deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", function () {
        let exactLocationOfItemInDB = ref(database, `Devices/Phones/${selectedCategory}/${currentKey}`);
        remove(exactLocationOfItemInDB);
      });
      actionCell.appendChild(deleteButton);
    }
  }
}

function updateCategoryRadios() {
  /* ... */
}

// Event Listeners
DOMElements.searchButtonEl.addEventListener("click", onSearchButtonClick);
DOMElements.searchInputEl.addEventListener("keydown", onSearchInputKeyDown);
DOMElements.addButtonEl.addEventListener("click", onAddButtonClick);
DOMElements.exportButtonEl.addEventListener("click", onExportButtonClick);

DOMElements.categoryRadios.forEach(radio => {
  radio.addEventListener("change", onCategoryRadioChange);
});

// Fetch initial data
fetchDataForSelectedCategory();
updateCategoryRadios();
