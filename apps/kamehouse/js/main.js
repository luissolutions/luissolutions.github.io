const modelSelect = document.getElementById('modelSelect');
const repairOptions = document.getElementById('repairOptions');
const phoneImage = document.getElementById('phoneImage');
const totalPriceElement = document.getElementById('totalPrice');
const categoryContainer = document.querySelector('.radios');

let data;

async function loadData() {
  const response = await fetch('js/data2.json');
  data = await response.json();
  createRadioButtons();
  modelSelect.dispatchEvent(new Event('change'));
}

document.querySelectorAll('input[name="brand"]').forEach(radio => {
  radio.addEventListener('change', loadDataFromJSON);
});

function loadDataFromJSON() {
  modelSelect.innerHTML = '';
  phoneImage.src = '';
  phoneImage.alt = '';
  repairOptions.innerHTML = '';
  totalPriceElement.textContent = '0';

  const brand = document.querySelector('input[name="brand"]:checked').value;
  const hardwareData = data.Hardware[brand];

  const keys = Object.keys(hardwareData).sort();

  modelSelect.innerHTML = keys.map(key => `<option value="${key}">${key}</option>`).join('');

  modelSelect.dispatchEvent(new Event('change'));
}

modelSelect.addEventListener('change', () => {
  const brand = document.querySelector('input[name="brand"]:checked').value;
  const selectedModel = modelSelect.value;
  const modelData = data.Hardware[brand][selectedModel];

  if (modelData) {
    phoneImage.src = `img/${selectedModel}.png`;
    phoneImage.alt = selectedModel;

    repairOptions.innerHTML = '';

    Object.keys(modelData).sort().forEach(repair => {
      const repairLabel = document.createElement('label');
      repairLabel.textContent = `${repair}: ${modelData[repair]}`;
      repairLabel.style.display = 'block';

      const repairCheckbox = document.createElement('input');
      repairCheckbox.type = 'checkbox';
      repairCheckbox.dataset.price = modelData[repair];

      repairCheckbox.addEventListener('change', updateTotalPriceWithDiscount);

      repairLabel.prepend(repairCheckbox);
      repairOptions.appendChild(repairLabel);
    });
  }
});

function updateTotalPriceWithDiscount() {
  const selectedRepairs = Array.from(repairOptions.querySelectorAll('input[type="checkbox"]:checked'));
  const total = selectedRepairs.reduce((acc, curr) => acc + parseFloat(curr.dataset.price), 0);

  totalPriceElement.textContent = total.toFixed(2);

  const selectedItemsImages = document.getElementById('selectedItemsImages');
  selectedItemsImages.innerHTML = '';

  selectedRepairs.forEach(selectedCheckbox => {
    const selectedModel = modelSelect.value;
    const brand = document.querySelector('input[name="brand"]:checked').value;
    const modelData = data.Hardware[brand][selectedModel];
    const repair = selectedCheckbox.nextSibling.textContent.split(':')[0].trim();

    if (modelData && modelData[repair]) {
      const imageName = repair; // Use the key as the image name
      const imageUrl = `img/${imageName}.png`;

      const imageElement = document.createElement('img');
      imageElement.src = imageUrl;
      imageElement.alt = repair;
      imageElement.onerror = function () {
        this.src = 'img/default.png'; // Use default.png if image not found
      };

      selectedItemsImages.appendChild(imageElement);
    }
  });
}

function createRadioButtons() {
  const categories = Object.keys(data.Hardware);

  categories.forEach(category => {
    const radioBtn = document.createElement('input');
    radioBtn.type = 'radio';
    radioBtn.name = 'brand';
    radioBtn.value = category;
    radioBtn.id = category;

    const label = document.createElement('label');
    label.textContent = category;
    label.setAttribute('for', category);

    categoryContainer.appendChild(radioBtn);
    categoryContainer.appendChild(label);
  });

  // Add event listener to each radio button
  document.querySelectorAll('input[name="brand"]').forEach(radio => {
    radio.addEventListener('change', loadDataFromJSON);
  });
}

loadData();
