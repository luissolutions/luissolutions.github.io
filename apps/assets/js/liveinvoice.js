import { auth, onAuthStateChanged, database, ref, onValue, set, remove, get, update } from './firebase-init.js';

    let DATABASE_BASE_PATH = 'public';

    const partsTableBody = document.querySelector('.parts-table tbody');
    const subtotalInput = document.getElementById('subtotal');
    const taxPercentInput = document.getElementById('tax-percent');
    const taxInput = document.getElementById('tax');
    const totalInput = document.getElementById('total');

    const addPartRowButton = document.getElementById('add-part-row');
    const delPartRowButton = document.getElementById('del-part-row');

    const partCategory = document.getElementById('part-category');
    const partSubcategory = document.getElementById('part-subcategory');
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

    /* =========================================================
       NEW INVENTORY DB (ledgerTx) -> category/sub/parts dropdowns
       - Reads:  ${BASE}/ledgerTx/{year}/{id}
       - Uses:   only expense lines tagged "inv"
       - Groups: sku if present else name (newest wins)
       - Allows missing category/subcategory
    ========================================================= */
    const INV_NODE = 'ledgerTx';
    const INV_TAG = 'inv';
    const ALL = '__ALL__';
    const NO_CATEGORY = '__NO_CATEGORY__';
    const NO_SUBCATEGORY = '__NO_SUBCATEGORY__';

    let INVENTORY_ITEMS = []; // grouped inventory list

    function safeStr(v) { return (typeof v === 'string' ? v.trim() : ''); }

    function hasTag(tags, want) {
      const w = String(want || '').toLowerCase();
      return (Array.isArray(tags) ? tags : []).some(t => String(t).toLowerCase() === w);
    }

    function roundMoney(n) {
      return Math.round((Number(n) || 0) * 100) / 100;
    }

    function setSelectOptions(selectEl, options, placeholderText) {
      selectEl.innerHTML = '';
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = placeholderText || 'Select...';
      selectEl.appendChild(ph);

      for (const opt of options) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        selectEl.appendChild(o);
      }
    }

    function buildInventoryFromLedgerTx(rawYearsObj) {
      const allLines = [];

      for (const [year, yearObj] of Object.entries(rawYearsObj || {})) {
        if (!yearObj || typeof yearObj !== 'object') continue;

        for (const [id, v] of Object.entries(yearObj)) {
          if (!v || typeof v !== 'object') continue;

          const type = String(v.type || '').toLowerCase();
          if (type !== 'expense') continue;
          if (!hasTag(v.tags, INV_TAG)) continue;

          const name = safeStr(v.name);
          const sku = safeStr(v.sku);
          if (!name && !sku) continue;

          const date = Number(v.date || 0);

          allLines.push({
            id: String(id),
            date,
            part: name || sku,
            sku,
            category: safeStr(v.cat),
            subcategory: safeStr(v.sub),
            price: roundMoney(Math.abs(Number(v.amt || 0))),
            actualPrice: roundMoney(Math.abs(Number(v.altAmt || 0))),
          });
        }
      }

      // Group by sku else name; newest line wins
      const map = new Map();
      for (const line of allLines) {
        const key = line.sku ? `sku:${line.sku.toLowerCase()}` : `name:${line.part.toLowerCase()}`;
        const cur = map.get(key);

        if (!cur) { map.set(key, line); continue; }

        const isNewer =
          (Number(line.date) > Number(cur.date)) ||
          (Number(line.date) === Number(cur.date) && String(line.id) > String(cur.id));

        if (isNewer) map.set(key, line);
      }

      const items = Array.from(map.values());
      items.sort((a, b) => a.part.localeCompare(b.part));
      return items;
    }

    function buildCategoryOptions(items) {
      const cats = new Set();
      let hasNoCat = false;

      for (const it of items) {
        if (it.category) cats.add(it.category);
        else hasNoCat = true;
      }

      const opts = [{ value: ALL, label: 'All Categories' }];
      if (hasNoCat) opts.push({ value: NO_CATEGORY, label: '(No Category)' });

      [...cats].sort((a, b) => a.localeCompare(b)).forEach(c => opts.push({ value: c, label: c }));
      return opts;
    }

    function buildSubcategoryOptions(items, categoryValue) {
      const subs = new Set();
      let hasNoSub = false;

      const filtered = items.filter(it => {
        if (!categoryValue || categoryValue === ALL) return true;
        if (categoryValue === NO_CATEGORY) return !it.category;
        return it.category === categoryValue;
      });

      for (const it of filtered) {
        if (it.subcategory) subs.add(it.subcategory);
        else hasNoSub = true;
      }

      const opts = [{ value: ALL, label: 'All Subcategories' }];
      if (hasNoSub) opts.push({ value: NO_SUBCATEGORY, label: '(No Subcategory)' });

      [...subs].sort((a, b) => a.localeCompare(b)).forEach(s => opts.push({ value: s, label: s }));
      return opts;
    }

    function populatePartSelector(items, categoryValue, subcategoryValue) {
      partSelector.innerHTML = '';

      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = 'Select Part';
      partSelector.appendChild(ph);

      const filtered = items.filter(it => {
        // category filter
        let catOk = true;
        if (!categoryValue || categoryValue === ALL) catOk = true;
        else if (categoryValue === NO_CATEGORY) catOk = !it.category;
        else catOk = (it.category === categoryValue);

        // subcategory filter
        let subOk = true;
        if (!subcategoryValue || subcategoryValue === ALL) subOk = true;
        else if (subcategoryValue === NO_SUBCATEGORY) subOk = !it.subcategory;
        else subOk = (it.subcategory === subcategoryValue);

        return catOk && subOk;
      });

      if (!filtered.length) {
        const o = document.createElement('option');
        o.value = '';
        o.textContent = 'No Parts Available';
        partSelector.appendChild(o);
        return;
      }

      for (const it of filtered) {
        const option = document.createElement('option');
        option.value = it.id;
        option.textContent = it.part;

        // used by addPartRow()
        option.dataset.price = String(it.price || 0);
        option.dataset.actualPrice = String(it.actualPrice || 0);
        option.dataset.category = it.category || '';
        option.dataset.component = it.subcategory || '';

        partSelector.appendChild(option);
      }
    }

    function loadInventoryFromLedgerTx() {
      const rootRef = ref(database, `${DATABASE_BASE_PATH}/${INV_NODE}`);

      onValue(rootRef, (snapshot) => {
        const raw = snapshot.exists() ? snapshot.val() : {};
        INVENTORY_ITEMS = buildInventoryFromLedgerTx(raw);

        if (!INVENTORY_ITEMS.length) {
          setSelectOptions(partCategory, [], 'No Categories Available');
          setSelectOptions(partSubcategory, [], 'No Subcategories Available');
          partSelector.innerHTML = '<option value="">No Parts Available</option>';
          return;
        }

        setSelectOptions(partCategory, buildCategoryOptions(INVENTORY_ITEMS), 'Select Category');
        setSelectOptions(partSubcategory, buildSubcategoryOptions(INVENTORY_ITEMS, ALL), 'Select Subcategory');
        partSubcategory.value = ALL;

        populatePartSelector(INVENTORY_ITEMS, ALL, ALL);
      }, (err) => console.error('❌ inventory ledgerTx listener error:', err));
    }

    partCategory.addEventListener('change', () => {
      const catVal = partCategory.value || ALL;

      setSelectOptions(
        partSubcategory,
        buildSubcategoryOptions(INVENTORY_ITEMS, catVal),
        'Select Subcategory'
      );

      partSubcategory.value = ALL;
      populatePartSelector(INVENTORY_ITEMS, catVal, ALL);
    });

    partSubcategory.addEventListener('change', () => {
      const catVal = partCategory.value || ALL;
      const subVal = partSubcategory.value || ALL;
      populatePartSelector(INVENTORY_ITEMS, catVal, subVal);
    });

    // =========================
    // Ledger TX helpers (for "Amount Paid" -> ledgerTx income entry)
    // =========================
    const TX_NODE = 'ledgerTx';

    function pad2(n) { return String(n).padStart(2, '0'); }

    // invoice-date is datetime-local (local time). We only care about the date bucket.
    // We'll store ledger date as UTC noon timestamp (same pattern as your ledger app).
    function utcNoonTSFromLocalDateTime(localDT) {
      // localDT like "2026-01-07T14:30"
      if (!localDT || typeof localDT !== 'string') return Date.UTC(new Date().getUTCFullYear(), 0, 1, 12, 0, 0);

      const ymd = localDT.slice(0, 10); // "YYYY-MM-DD"
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return Date.now();

      const y = +ymd.slice(0, 4);
      const m = +ymd.slice(5, 7) - 1;
      const d = +ymd.slice(8, 10);
      return Date.UTC(y, m, d, 12, 0, 0);
    }

    function yearFromTS(ts) {
      return new Date(Number(ts)).getUTCFullYear();
    }

    async function upsertInvoicePaymentTx({ invoiceId, existingInvoice = {}, invoiceData }) {
      const amountPaidNum = Math.round((Math.abs(Number(invoiceData.amountPaid || 0)) * 100)) / 100;

      const prevTxId = existingInvoice.paymentTxId || '';
      const prevTxYear = Number(existingInvoice.paymentTxYear || 0) || null;

      // If amountPaid cleared/0 -> delete prior payment tx (optional but usually desired)
      if (!amountPaidNum) {
        if (prevTxId && prevTxYear) {
          await set(ref(database, `${DATABASE_BASE_PATH}/${TX_NODE}/${prevTxYear}/${prevTxId}`), null);
        } else if (prevTxId && !prevTxYear) {
          // best-effort search not available here; just clear meta
        }

        // clear meta fields on the invoice
        await update(ref(database, `${DATABASE_BASE_PATH}/tasks/${invoiceId}`), {
          paymentTxId: '',
          paymentTxYear: ''
        });

        return;
      }

      // pick date for the ledger entry
      const paidSourceDT = (invoiceData.paidDate || invoiceData.startTime || '');
      const dateTS = utcNoonTSFromLocalDateTime(paidSourceDT);
      const year = yearFromTS(dateTS);

      // reuse existing txId if present, else create one
      const txId = prevTxId || String(Date.now());

      // if year changed since last save, delete old location first
      if (prevTxId && prevTxYear && prevTxYear !== year) {
        await set(ref(database, `${DATABASE_BASE_PATH}/${TX_NODE}/${prevTxYear}/${prevTxId}`), null);
      }

      const customer = (invoiceData.customerName || '').trim();
      const project = (invoiceData.project || '').trim();
      const title = (invoiceData.invoiceTitle || '').trim();

      // Build a nice ledger name
      const name =
        `Invoice Payment — ${customer || 'Unknown'}`
        + (project ? ` (${project})` : '')
        + (title ? ` • ${title}` : '');

      // Keep tags simple; you can change these any time
      const tags = ['invoice', 'payment'];

      const tx = {
        amt: amountPaidNum,
        cat: '',
        sub: '',
        sku: '',
        link: '',
        img: '',
        imgPath: '',
        desc: `Source invoiceId: ${invoiceId}`,
        name,
        tags,
        type: 'income',
        date: dateTS
      };

      await set(ref(database, `${DATABASE_BASE_PATH}/${TX_NODE}/${year}/${txId}`), tx);

      // persist tx link on the invoice so future saves update (not duplicate)
      await update(ref(database, `${DATABASE_BASE_PATH}/tasks/${invoiceId}`), {
        paymentTxId: txId,
        paymentTxYear: year
      });

      
    }

    /* =========================
       AUTH + INIT
    ========================== */
    onAuthStateChanged(auth, (user) => {
      DATABASE_BASE_PATH = user ? `${user.uid}` : 'public';

      loadInventoryFromLedgerTx();
      populateInvoiceDropdown();
    });

    /* =========================
       INVOICE SAVE / LOAD
    ========================== */
    async function saveInvoice() {
      const projectInput = document.getElementById('invoice-number');
      let invoiceId = projectInput.dataset.id;

      if (!invoiceId) {
        invoiceId = String(Date.now());
        projectInput.dataset.id = invoiceId;
      }

      const invoiceType = document.getElementById('invoice-type').value;
      const amountPaid = document.getElementById('amount-paid').value;
      const startTime = document.getElementById('invoice-date').value;
      const paidDate = document.getElementById('paid-date').value;

      const partsData = Array.from(partsTableBody.querySelectorAll('tr')).map(row => ({
        part: row.dataset.part || '',
        quantity: row.querySelector('input[name="part-quantity"]').value || 0,
        price: row.querySelector('input[name="part-price"]').value || 0,
        actualPrice: row.querySelector('input[name="part-actual-price"]').value || 0,
        total: row.querySelector('input[name="part-total"]').value || 0,
        category: row.dataset.category || '',
        component: row.dataset.component || '',
      }));

      const laborData = Array.from(laborTableBody.querySelectorAll('tr')).map(row => ({
        description: row.querySelector('input[name="labor-description"]').value.trim() || '',
        hours: row.querySelector('input[name="labor-hours"]').value || 0,
        rate: row.querySelector('input[name="labor-rate"]').value || 0,
        total: row.querySelector('input[name="labor-total"]').value || 0,
      }));

      const newInvoiceData = {
        id: invoiceId,
        invoiceType,
        invoiceTitle: document.getElementById('title-input').value,
        customerName: document.getElementById('customer-name').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerEmail: document.getElementById('customer-email').value,
        customerAddress: document.getElementById('customer-address').value,
        project: projectInput.value.trim(),
        notes: document.getElementById('notes').value,
        startTime,
        parts: partsData,
        labor: laborData,
        taxPercent: taxPercentInput.value,
        paidDate,
        amountPaid,
      };

      const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${invoiceId}`);

      try {
        const snapshot = await get(invoiceRef);
        const existingData = snapshot.exists() ? snapshot.val() : {};

        const updatedInvoiceData = { ...existingData, ...newInvoiceData };
        await update(invoiceRef, updatedInvoiceData);

        // ✅ Create/update ONE income transaction in ledgerTx based on Amount Paid
        await upsertInvoicePaymentTx({
          invoiceId,
          existingInvoice: existingData,
          invoiceData: updatedInvoiceData
        });

        console.log(`Invoice ${invoiceId} saved/updated successfully.`);
        clearInvoice();
        populateInvoiceDropdown();

      } catch (error) {
        console.error("Error saving/updating invoice:", error);
      }
    }

    async function addPartRow(partData = null) {
      let part, price, actualPrice, category, component, quantity;

      if (partData) {
        part = partData.part;
        price = parseFloat(partData.price) || 0;
        actualPrice = parseFloat(partData.actualPrice) || 0;
        category = partData.category || '';
        component = partData.component || '';
        quantity = parseInt(partData.quantity) || 1;
      } else {
        const selectedOption = partSelector.options[partSelector.selectedIndex];
        if (!selectedOption || !selectedOption.value) {
          console.warn("⚠️ No part selected.");
          return;
        }

        part = selectedOption.textContent;
        price = parseFloat(selectedOption.dataset.price) || 0;
        actualPrice = parseFloat(selectedOption.dataset.actualPrice) || 0;
        category = selectedOption.dataset.category || '';
        component = selectedOption.dataset.component || '';
        quantity = 1;
      }

      // merge if same part name already exists
      const existingRow = Array.from(partsTableBody.querySelectorAll('tr')).find(row => row.dataset.part === part);

      if (existingRow) {
        const quantityInput = existingRow.querySelector('input[name="part-quantity"]');
        const currentQuantity = parseInt(quantityInput.value) || 0;
        quantityInput.value = currentQuantity + quantity;
        updatePartRowTotal(existingRow);
        return;
      }

      const newRow = document.createElement('tr');
      newRow.dataset.part = part;
      newRow.dataset.category = category;
      newRow.dataset.component = component;

      newRow.innerHTML = `
        <td>${part}</td>
        <td><input type="number" name="part-quantity" min="1" value="${quantity}"></td>
        <td><input type="number" name="part-price" min="0" value="${price}" class="part-price-input"></td>
        <td class="actual-price-hide"><input type="number" name="part-actual-price" min="0" value="${actualPrice}" class="actual-price-input"></td>
        <td><input type="number" name="part-total" min="0" value="${(price * quantity).toFixed(2)}" readonly></td>
      `;

      partsTableBody.appendChild(newRow);

      const priceInput = newRow.querySelector('input[name="part-price"]');
      const quantityInput = newRow.querySelector('input[name="part-quantity"]');

      priceInput.addEventListener('input', () => updatePartRowTotal(newRow));
      quantityInput.addEventListener('input', () => updatePartRowTotal(newRow));

      updateTotals();
      updatePriceDifference();
      updateRemainingBalance();
    }

    addPartRowButton.addEventListener('click', () => {
      const selectedOption = partSelector.options[partSelector.selectedIndex];
      if (selectedOption && selectedOption.value) {
        addPartRow({
          part: selectedOption.textContent,
          price: selectedOption.dataset.price,
          actualPrice: selectedOption.dataset.actualPrice,
          category: selectedOption.dataset.category,
          component: selectedOption.dataset.component,
          quantity: 1
        });
      } else {
        alert("Please select a part first.");
      }
    });

    function delPartRow() {
      const lastRow = partsTableBody.querySelector('tr:last-child');
      if (!lastRow) {
        console.warn('⚠️ No parts available to undo.');
        return;
      }

      const partName = lastRow.cells[0].textContent.trim();
      lastRow.remove();

      updateTotals();
      updatePriceDifference();
      updateRemainingBalance();

      const invoiceId = document.getElementById('invoice-number').dataset.id;
      if (!invoiceId) return;

      const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${invoiceId}/parts`);
      get(invoiceRef).then((snapshot) => {
        if (snapshot.exists()) {
          const parts = snapshot.val();
          const updatedParts = (Array.isArray(parts) ? parts : []).filter(p => p.part !== partName);

          update(ref(database, `${DATABASE_BASE_PATH}/tasks/${invoiceId}`), { parts: updatedParts })
            .then(() => console.log(`✅ Removed part: ${partName} from Firebase.`))
            .catch(error => console.error('❌ Error updating parts in Firebase:', error));
        }
      }).catch(error => console.error('❌ Error fetching parts:', error));
    }

    delPartRowButton.addEventListener('click', delPartRow);

    function addLaborRow(description = '', hours = 0, rate = 0) {
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td><input type="text" name="labor-description" value="${description}"></td>
        <td><input type="number" name="labor-hours" min="0" value="${hours}"></td>
        <td><input type="number" name="labor-rate" min="0" value="${rate}"></td>
        <td><input type="number" name="labor-total" readonly></td>
      `;
      laborTableBody.appendChild(newRow);

      const hoursInput = newRow.querySelector('input[name="labor-hours"]');
      const rateInput = newRow.querySelector('input[name="labor-rate"]');
      const totalInput = newRow.querySelector('input[name="labor-total"]');

      const recalc = () => updateLaborTotal(hoursInput, rateInput, totalInput);
      hoursInput.addEventListener('input', recalc);
      rateInput.addEventListener('input', recalc);
      recalc();
    }

    addLaborRowButton.addEventListener('click', () => addLaborRow());

    function updatePriceDifference() {
      let totalDifference = 0;
      const rows = partsTableBody.querySelectorAll('tr');
      rows.forEach(row => {
        const quantity = parseInt(row.querySelector('input[name="part-quantity"]').value) || 0;
        const price = parseFloat(row.querySelector('input[name="part-price"]').value) || 0;
        const actualPrice = parseFloat(row.querySelector('input[name="part-actual-price"]').value) || 0;
        totalDifference += (quantity * price) - (quantity * actualPrice);
      });
      document.getElementById('price-difference').innerText = totalDifference.toFixed(2);
    }

    function updateLaborTotal(hoursInput, rateInput, totalInput) {
      const hours = parseFloat(hoursInput.value) || 0;
      const rate = parseFloat(rateInput.value) || 0;
      totalInput.value = (hours * rate).toFixed(2);
      updateTotals();
      updateRemainingBalance();
    }

    function updatePartRowTotal(row) {
      const quantity = parseInt(row.querySelector('input[name="part-quantity"]').value) || 0;
      const price = parseFloat(row.querySelector('input[name="part-price"]').value) || 0;
      row.querySelector('input[name="part-total"]').value = (quantity * price).toFixed(2);

      updateTotals();
      updatePriceDifference();
      updateRemainingBalance();
    }

    function updateRemainingBalance() {
      const amountPaid = parseFloat(amountPaidInput.value) || 0;
      const total = parseFloat(totalInput.value) || 0;
      remainingBalanceSpan.textContent = (total - amountPaid).toFixed(2);
    }

    function updateTotals() {
      let partsTotal = 0;
      let laborTotal = 0;

      document.querySelectorAll('.parts-table tbody tr').forEach(row => {
        partsTotal += parseFloat(row.querySelector('input[name="part-total"]').value) || 0;
      });

      document.querySelectorAll('.labor-table tbody tr').forEach(row => {
        laborTotal += parseFloat(row.querySelector('input[name="labor-total"]').value) || 0;
      });

      const subtotal = partsTotal + laborTotal;
      const taxPercent = parseFloat(taxPercentInput.value) || 0;
      const tax = partsTotal * (taxPercent / 100);
      const total = subtotal + tax;

      subtotalInput.value = subtotal.toFixed(2);
      taxInput.value = tax.toFixed(2);
      totalInput.value = total.toFixed(2);
    }

    remainingCheckbox.addEventListener('change', function () {
      remainingDiv.style.display = this.checked ? 'block' : 'none';
    });

    amountPaidInput.addEventListener('input', updateRemainingBalance);

    taxPercentInput.addEventListener('input', () => {
      updateTotals();
      updateRemainingBalance();
    });

    saveButton.addEventListener('click', async () => {
      await saveInvoice();
    });

    /* =========================
       INVOICE DROPDOWN + SEARCH
    ========================== */
    function populateInvoiceDropdown() {
      const dropdown = document.getElementById('invoice-dropdown');
      dropdown.innerHTML = '';

      const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks`);

      onValue(invoiceRef, (snapshot) => {
        dropdown.innerHTML = '';
        if (snapshot.exists()) {
          const invoices = snapshot.val();
          const fragment = document.createDocumentFragment();

          const sorted = Object.entries(invoices).sort((a, b) => {
            const dateA = new Date(a[1].startTime || 0);
            const dateB = new Date(b[1].startTime || 0);
            return dateB - dateA;
          });

          sorted.forEach(([id, invoice]) => {
            const customerName = invoice.customerName || 'Unknown';
            const startTime = invoice.startTime ? new Date(invoice.startTime).toLocaleDateString() : 'No Date';

            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${customerName} - ${startTime}`;
            fragment.appendChild(option);
          });

          dropdown.appendChild(fragment);

          if (!dropdown.options.length) {
            const noResults = document.createElement('option');
            noResults.textContent = 'No invoices found';
            dropdown.appendChild(noResults);
          }
        } else {
          const noResults = document.createElement('option');
          noResults.textContent = 'No invoices found';
          dropdown.appendChild(noResults);
        }
      }, (error) => {
        console.error("Error fetching invoices:", error);
      });
    }

    searchInput.addEventListener('input', () => {
      // simplest behavior: re-run populate (you can add client-side filtering later)
      populateInvoiceDropdown();
    });

    /* =========================
       DELETE INVOICE
    ========================== */
    deleteButton.addEventListener('click', async () => {
      const selectedId = invoiceDropdown.value;
      if (!selectedId) return;

      const isConfirmed = confirm(`Are you sure you want to delete invoice ${selectedId}? This action cannot be undone.`);
      if (!isConfirmed) return;

      const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${selectedId}`);
      try {
        await remove(invoiceRef);
        console.log(`Invoice ${selectedId} deleted successfully`);
        populateInvoiceDropdown();
      } catch (error) {
        console.error(`Error deleting invoice ${selectedId}:`, error);
      }
    });

    /* =========================
       LOAD INVOICE
    ========================== */
    document.getElementById('load-invoice-button').addEventListener('click', function () {
      const selectedId = invoiceDropdown.value;
      if (!selectedId) {
        alert('Please select an invoice to load.');
        return;
      }

      clearInvoice();

      const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${selectedId}`);

      get(invoiceRef).then((snapshot) => {
        if (!snapshot.exists()) {
          alert('Invoice not found.');
          return;
        }

        const invoiceData = snapshot.val() || {};

        document.getElementById('invoice-number').dataset.id = invoiceData.id || selectedId;
        document.getElementById('invoice-type').value = invoiceData.invoiceType || 'invoice';
        document.getElementById('title-input').value = invoiceData.invoiceTitle || '';
        document.getElementById('customer-name').value = invoiceData.customerName || '';
        document.getElementById('customer-phone').value = invoiceData.customerPhone || '';
        document.getElementById('customer-email').value = invoiceData.customerEmail || '';
        document.getElementById('customer-address').value = invoiceData.customerAddress || '';
        document.getElementById('invoice-number').value = invoiceData.project || '';
        document.getElementById('notes').value = invoiceData.notes || '';

        if (invoiceData.startTime) {
          const startTime = new Date(invoiceData.startTime);
          const localStart = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          document.getElementById('invoice-date').value = localStart;
        }

        if (invoiceData.paidDate) {
          const dt = new Date(invoiceData.paidDate);
          const localDT = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          document.getElementById('paid-date').value = localDT;
        } else {
          document.getElementById('paid-date').value = '';
        }

        document.getElementById('amount-paid').value = invoiceData.amountPaid || '';
        document.getElementById('tax-percent').value = invoiceData.taxPercent || '';

        if (Array.isArray(invoiceData.parts)) invoiceData.parts.forEach(p => addPartRow(p));
        if (Array.isArray(invoiceData.labor)) invoiceData.labor.forEach(l => addLaborRow(l.description || '', l.hours || 0, l.rate || 0));

        updateTotals();
        updateRemainingBalance();
      }).catch((error) => {
        console.error('Error fetching selected invoice:', error);
      });
    });

    /* =========================
       EXPORT INVOICE
    ========================== */
    document.getElementById('exportButton').addEventListener('click', function () {
      const selectedId = invoiceDropdown.value;
      if (!selectedId) {
        alert('Please select a file to export.');
        return;
      }

      const invoiceRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${selectedId}`);
      get(invoiceRef).then((snapshot) => {
        if (!snapshot.exists()) {
          alert('No data available for selected invoice');
          return;
        }

        const invoiceData = snapshot.val();
        const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `invoice-${selectedId}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch((error) => console.error('Error fetching invoice:', error));
    });

    function saveDataToLocalStorage() {
      const inputData = {
        invoiceTitle: document.getElementById('title-input').value,
        customerName: document.getElementById('customer-name').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerEmail: document.getElementById('customer-email').value,
        customerAddress: document.getElementById('customer-address').value,
        startTime: document.getElementById('invoice-date').value,
        project: document.getElementById('invoice-number').value,
        notes: document.getElementById('notes').value,
        paidDate: document.getElementById('paid-date').value,
      };

      localStorage.setItem('inputData', JSON.stringify(inputData));
    }

    function loadDataFromLocalStorage() {
      const savedData = localStorage.getItem('inputData');
      if (!savedData) return;

      const inputData = JSON.parse(savedData);
      document.getElementById('title-input').value = inputData.invoiceTitle || '';
      document.getElementById('customer-name').value = inputData.customerName || '';
      document.getElementById('customer-phone').value = inputData.customerPhone || '';
      document.getElementById('customer-email').value = inputData.customerEmail || '';
      document.getElementById('customer-address').value = inputData.customerAddress || '';
      document.getElementById('invoice-date').value = inputData.startTime || '';
      document.getElementById('invoice-number').value = inputData.project || '';
      document.getElementById('notes').value = (inputData.notes || '').replace(/\r?\n/g, ' ');
      document.getElementById('paid-date').value = inputData.paidDate || '';
    }

    function clearInvoice() {
      ['title-input', 'customer-name', 'customer-phone', 'customer-email',
        'customer-address', 'invoice-date', 'paid-date', 'invoice-number', 'notes']
        .forEach(id => document.getElementById(id).value = '');

      document.getElementById('invoice-number').dataset.id = '';
      document.querySelector('.parts-table tbody').innerHTML = '';
      document.querySelector('.labor-table tbody').innerHTML = '';

      ['subtotal', 'tax-percent', 'tax', 'total', 'amount-paid'].forEach(id => {
        document.getElementById(id).value = '';
      });

      document.getElementById('remaining').checked = false;
      document.querySelector('.remaining').style.display = 'none';

      localStorage.removeItem('inputData');
    }

    const hideParentCheckboxes = document.querySelectorAll('.hide-parent-checkbox');
    hideParentCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const parentDiv = checkbox.closest('div');
        if (parentDiv) parentDiv.style.display = checkbox.checked ? 'none' : 'block';
      });
    });

    ['title-input', 'customer-name', 'customer-phone', 'customer-email', 'customer-address',
      'invoice-date', 'invoice-number', 'notes', 'paid-date']
      .forEach((id) => {
        document.getElementById(id)?.addEventListener('input', saveDataToLocalStorage);
      });

    document.getElementById('print-button')?.addEventListener('click', () => window.print());
    document.getElementById('reset-button')?.addEventListener('click', clearInvoice);
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    /* =========================
       NOTES AUTO-RESIZE
    ========================== */
    document.addEventListener('DOMContentLoaded', function () {
      const textarea = document.getElementById('notes');
      textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      }, false);

      taxPercentInput.addEventListener('input', updateTotals);
      updatePriceDifference();
      loadDataFromLocalStorage();
    });

    document.addEventListener('input', function (event) {
      if (event.target.classList.contains('actual-price-input') || event.target.classList.contains('part-price-input')) {
        updatePriceDifference();
        updateTotals();
      }
    });
