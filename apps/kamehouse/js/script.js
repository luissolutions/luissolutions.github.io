const categoryInputEl = document.getElementById('category-input');
const typeInputEl = document.getElementById('type-input');
const descriptionInputEl = document.getElementById('description-input');
const amountInputEl = document.getElementById('amount-input');
const addButtonEl = document.getElementById('add-button');
const saveButtonEl = document.getElementById('save-button');
const pricesListEl = document.getElementById('prices-list');
const searchButtonEl = document.getElementById('search-button');
const searchInputEl = document.getElementById('search-input');
const saveChangesButtonEl = document.getElementById('save-changes-button');

let data;

addButtonEl.addEventListener("click", function () {
  let category = categoryInputEl.value.trim();
  let type = typeInputEl.value.trim();
  let description = descriptionInputEl.value.trim();
  let amount = amountInputEl.value.trim();

  if (category !== "" && type !== "" && description !== "" && amount !== "") {
    if (!data.Hardware[category]) {
      data.Hardware[category] = {};
    }
    if (!data.Hardware[category][type]) {
      data.Hardware[category][type] = {};
    }
    data.Hardware[category][type][description] = amount;

    // Just add a new row to the table instead of reloading all data.
    addRowToPricesList(category, type, description, amount);
  } else {
    alert("Please fill in all fields before adding data.");
  }
});

function saveJSON(jsonString, filePath) {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filePath;
  link.click();

  URL.revokeObjectURL(url);
}

saveChangesButtonEl.addEventListener("click", function () {
  const updatedData = {};

  const rows = pricesListEl.querySelectorAll("tr");
  rows.forEach((row) => {
    const categoryInput = row.cells[0].querySelector("input");
    const subCategoryInput = row.cells[1].querySelector("input");
    const repairTypeInput = row.cells[2].querySelector("input");
    const priceInput = row.cells[3].querySelector("input");

    const category = categoryInput.value.trim();
    const subCategory = subCategoryInput.value.trim();
    const repairType = repairTypeInput.value.trim();
    const price = priceInput.value.trim();

    if (category !== "" && subCategory !== "" && repairType !== "" && price !== "") {
      if (!updatedData[category]) {
        updatedData[category] = {};
      }
      if (!updatedData[category][subCategory]) {
        updatedData[category][subCategory] = {};
      }
      updatedData[category][subCategory][repairType] = price;
    }
  });

  const jsonString = JSON.stringify({ Hardware: updatedData }, null, 2);
  download(jsonString, "data2.json", "application/json");
});

searchButtonEl.addEventListener("click", function () {
  let searchString = searchInputEl.value.trim().toLowerCase();

  clearPricesList();

  for (let category in data.Hardware) {
    for (let subCategory in data.Hardware[category]) {
      for (let repairType in data.Hardware[category][subCategory]) {
        let price = data.Hardware[category][subCategory][repairType];

        if (typeof price === 'object') {
          for (let repairSubType in price) {
            let subPrice = price[repairSubType];
            if (category.toLowerCase().includes(searchString) || subCategory.toLowerCase().includes(searchString) || repairType.toLowerCase().includes(searchString) || repairSubType.toLowerCase().includes(searchString) || subPrice.toString().toLowerCase().includes(searchString)) {
              addRowToPricesList(category, subCategory, repairType, repairSubType + ': ' + subPrice);
            }
          }
        } else {
          if (category.toLowerCase().includes(searchString) || subCategory.toLowerCase().includes(searchString) || repairType.toLowerCase().includes(searchString) || price.toString().toLowerCase().includes(searchString)) {
            addRowToPricesList(category, subCategory, repairType, price);
          }
        }
      }
    }
  }
});

loadData();

function loadData() {
  fetch('js/data2.json')
    .then(response => response.json())
    .then(jsonData => {
      data = jsonData;
      loadDataFromJSON();
    })
    .catch(error => console.error('Error loading data:', error));
}

function loadDataFromJSON() {
  clearPricesList();

  for (let category in data.Hardware) {
    for (let subCategory in data.Hardware[category]) {
      for (let repairType in data.Hardware[category][subCategory]) {
        let price = data.Hardware[category][subCategory][repairType];
        addRowToPricesList(category, subCategory, repairType, price);
      }
    }
  }
}

function clearPricesList() {
  while (pricesListEl.firstChild) {
    pricesListEl.firstChild.remove();
  }
}

function addRowToPricesList(category, subCategory, repairType, price) {
  let row = document.createElement("tr");

  let categoryCell = document.createElement("td");
  addEditableInput(categoryCell, category);
  row.appendChild(categoryCell);

  let subCategoryCell = document.createElement("td");
  addEditableInput(subCategoryCell, subCategory);
  row.appendChild(subCategoryCell);

  let repairTypeCell = document.createElement("td");
  addEditableInput(repairTypeCell, repairType);
  row.appendChild(repairTypeCell);

  let priceCell = document.createElement("td");
  addEditableInput(priceCell, price);
  row.appendChild(priceCell);

  let actionCell = document.createElement("td");
  row.appendChild(actionCell);

  let deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", function () {
    row.remove();
  });
  actionCell.appendChild(deleteButton);

  pricesListEl.appendChild(row);
}

function addEditableInput(cell, value) {
  let input = document.createElement("input");
  input.type = "text";
  input.value = value;
  cell.textContent = "";
  cell.appendChild(input);
}

function download(data, filename, type) {
  let file = new Blob([data], { type: type });
  let a = document.createElement("a");
  let url = URL.createObjectURL(file);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}