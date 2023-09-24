document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners to the radio buttons
  document.getElementById('iphone').addEventListener('change', loadData);
  document.getElementById('samsung').addEventListener('change', loadData);

  // Initial load
  loadData();
});

function loadData() {
  const brand = document.querySelector('input[name="brand"]:checked').value;
  const dataFile = brand === 'iphone' ? 'js/iphone_data.json' : 'js/samsung_data.json';

  fetch(dataFile)
    .then((response) => response.json())
    .then((jsonData) => {
      const modelSelect = document.getElementById('modelSelect');
      const repairOptions = document.getElementById('repairOptions');
      const totalPriceElement = document.getElementById('totalPrice');
      const discountAmountInput = document.getElementById('discountAmount');
      const applyDiscountButton = document.getElementById('applyDiscount');
      const phoneImage = document.getElementById('phoneImage');

      modelSelect.innerHTML = '';
      repairOptions.innerHTML = '';

      for (const model in jsonData.Phones) {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      }

      modelSelect.addEventListener('change', () => {
        repairOptions.innerHTML = '';
        const selectedModel = modelSelect.value;
        const repairs = jsonData.Phones[selectedModel];

        phoneImage.src = `img/${selectedModel}.png`;
        phoneImage.alt = selectedModel;

        for (const repair in repairs) {
          const repairLabel = document.createElement('label');
          repairLabel.textContent = repair + ': $' + repairs[repair];
          repairLabel.style.display = 'block';

          const repairCheckbox = document.createElement('input');
          repairCheckbox.type = 'checkbox';
          repairCheckbox.dataset.price = repairs[repair];

          repairCheckbox.addEventListener('change', updateTotalPriceWithDiscount);

          repairLabel.insertBefore(repairCheckbox, repairLabel.firstChild);
          repairOptions.appendChild(repairLabel);
        }
      });

      applyDiscountButton.addEventListener('click', updateTotalPriceWithDiscount);

      modelSelect.dispatchEvent(new Event('change'));

      function updateTotalPriceWithDiscount() {
        const selectedRepairs = repairOptions.querySelectorAll('input[type="checkbox"]:checked');
        let total = 0;

        selectedRepairs.forEach((selectedRepair) => {
          total += parseFloat(selectedRepair.dataset.price);
        });

        const discountAmount = parseFloat(discountAmountInput.value) || 0;
        total = total - discountAmount;

        if (total < 0) {
          total = 0;
        }

        totalPriceElement.textContent = total.toFixed(2);
      }
    })
    .catch((error) => {
      console.error('Error fetching JSON data:', error);
    });
}
