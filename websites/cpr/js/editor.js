import { ref, database, onValue, set, update, remove } from "./firebase-init.js";

const inputFieldEl = document.getElementById("input-field");
const repairFieldEl = document.getElementById("repair-field");
const categoryRadios = document.querySelectorAll('input[name="category"]');
const addButtonEl = document.getElementById("add-button");
const phonesListEl = document.getElementById("phones-list");
const phoneNameEl = document.getElementById("phone-name-input");
const searchInputEl = document.getElementById('search-input');
const searchButtonEl = document.getElementById('search-button');
const exportButtonEl = document.getElementById("export-button");

let csvContent = ""; // Declare csvContent variable

exportButtonEl.addEventListener("click", function () {
  exportToCSV();
});

function exportToCSV() {
  const phonesInDB = ref(database, `devices/Phones/${selectedCategory}`);
  const fileName = "data.csv";
  csvContent = "Phone Model,Repair Type,Price\n";

  onValue(phonesInDB, function (snapshot) {
    let itemsObject = snapshot.val();

    recursivelyAppendToCSV(itemsObject);

    const csvData = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', csvData);
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function recursivelyAppendToCSV(obj, prefix = "") {
  for (let key in obj) {
    let currentKey = prefix + key;
    let currentItem = obj[key];
    let phoneModel = currentKey.substring(0, currentKey.indexOf("/"));
    let repairType = currentKey.substring(currentKey.indexOf("/") + 1);

    if (typeof currentItem === "object" && currentItem !== null) {
      recursivelyAppendToCSV(currentItem, currentKey + "/");
    } else {
      csvContent += `"${phoneModel}","${repairType}","${currentItem}"\n`;
    }
  }
}

function downloadCSV(content, fileName) {
  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(content);
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

let selectedCategory = localStorage.getItem("selectedCategory") || "Apple";

document.addEventListener('input', function (event) {
  if (event.target.tagName.toLowerCase() === 'input') {
    const inputElement = event.target;
    const inputValue = inputElement.value;
    const sanitizedValue = sanitizeInput(inputValue);

    if (inputValue !== sanitizedValue) {
      inputElement.value = sanitizedValue;
    }
  }
});

document.addEventListener('paste', function (event) {
  if (event.target.tagName.toLowerCase() === 'input') {
    const inputElement = event.target;
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text/plain');
    const sanitizedText = sanitizeInput(pastedText);

    if (pastedText !== sanitizedText) {
      event.preventDefault();
      inputElement.value += sanitizedText;
    }
  }
});

function sanitizeInput(input) {
  const forbiddenChars = ['$', '#', '[', ']', '/'];
  let sanitizedValue = input;
  for (const char of forbiddenChars) {
    sanitizedValue = sanitizedValue.replace(new RegExp(char, 'g'), '');
  }
  return sanitizedValue;
}

searchButtonEl.addEventListener("click", function () {
  let searchString = searchInputEl.value.trim().toLowerCase();
  clearPhoneListEl();
  const phonesInDB = ref(database, `devices/Phones/${selectedCategory}`);

  onValue(phonesInDB, function (snapshot) {
    let itemsObject = snapshot.val();
    let filteredItemsObject = filterItemsBySearch(itemsObject, searchString);
    recursivelyAppendItemsToPhonesListEl(filteredItemsObject);
  });
});

searchInputEl.addEventListener("keydown", function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    searchButtonEl.click();
  }
});

categoryRadios.forEach(function (radio) {
  radio.addEventListener("change", function () {
    selectedCategory = this.value;
    fetchDataForSelectedCategory();
    updateCategoryRadios();
  });
});

addButtonEl.addEventListener("click", function () {
  let phoneName = phoneNameEl.value.trim();
  let repairType = repairFieldEl.value.trim();
  let price = inputFieldEl.value.trim();

  if (phoneName !== "" && repairType !== "" && price !== "") {
    const categoryRef = ref(database, `devices/Phones/${selectedCategory}/${phoneName}/${repairType}`);
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
});

function fetchDataForSelectedCategory() {
  const phonesInDB = ref(database, `devices/Phones/${selectedCategory}`);

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

function filterItemsBySearch(itemsObject, searchString) {
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

function recursivelyAppendItemsToPhonesListEl(obj, prefix = "") {
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
          let exactLocationOfItemInDB = ref(database, `devices/Phones/${selectedCategory}/${phoneModel}`);
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

        // Check for forbidden characters
        const forbiddenChars = ['$', '#', '[', ']', '/'];
        let containsForbiddenChar = forbiddenChars.some(char => newModel.includes(char) || newRepair.includes(char) || newPrice.includes(char));

        if (containsForbiddenChar) {
          alert("Contains forbidden characters. Remove '$', '#', '[', ']', '/'.");
          return;
        }

        if (newModel !== "" && newRepair !== "" && newPrice !== "") {
          let exactLocationOfItemInDB = ref(database, `devices/Phones/${selectedCategory}/${phoneModel}/${key}`);

          if (newModel !== phoneModel || newRepair !== key) {
            remove(exactLocationOfItemInDB);
            exactLocationOfItemInDB = ref(database, `devices/Phones/${selectedCategory}/${newModel}/${newRepair}`);
          }

          set(exactLocationOfItemInDB, newPrice)
            .then(() => {
              location.reload();
            })
            .catch((error) => {
              console.error("Error updating repair:", error);
            });
        } else {
          alert("Please fill in all fields before updating data.");
        }
      });
      actionCell.appendChild(updateButton);

      let deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", function () {
        let exactLocationOfItemInDB = ref(database, `devices/Phones/${selectedCategory}/${currentKey}`);
        remove(exactLocationOfItemInDB);
      });
      actionCell.appendChild(deleteButton);
    }
  }
}

fetchDataForSelectedCategory();

function updateCategoryRadios() {
  categoryRadios.forEach(function (radio) {
    radio.checked = radio.value === selectedCategory;
  });

  localStorage.setItem("selectedCategory", selectedCategory);
}