import { auth, onAuthStateChanged, database, ref, onValue } from './firebase-init.js';

        let createListenerRegistry = () => {
            const cleanups = new Set();
            return {
                track(unsubscribe) {
                    if (typeof unsubscribe === 'function') cleanups.add(unsubscribe);
                    return unsubscribe;
                },
                clearAll() {
                    for (const unsubscribe of cleanups) {
                        try { unsubscribe(); } catch { }
                    }
                    cleanups.clear();
                }
            };
        };

        import('./listeners.js')
            .then((mod) => {
                if (typeof mod.createListenerRegistry === 'function') {
                    createListenerRegistry = mod.createListenerRegistry;
                }
            })
            .catch(() => {
                console.warn('listeners helper missing; using local fallback in liveanalytics.');
            });

        let DATABASE_BASE_PATH = 'public';
        let currentLedgerYear = new Date().getUTCFullYear();
        const listeners = createListenerRegistry();
        let uiBound = false;
        let stopLedgerDataListener = null;

        onAuthStateChanged(auth, (user) => {
            DATABASE_BASE_PATH = user ? `${user.uid}` : 'public';
            listeners.clearAll();
            setupRealTimeListeners();
        });

        function setupRealTimeListeners() {
            analyzeInvoiceData();
            populateCustomerDropdown();
            attachLedgerYearListener();
            analyzeLedgerData();
        }

        function analyzeInvoiceData() {
            const invoicesRef = ref(database, `${DATABASE_BASE_PATH}/tasks`);
            listeners.track(onValue(invoicesRef, (snapshot) => {
                if (snapshot.exists()) {
                    const invoices = snapshot.val();
                    let totalAmountPaid = 0;
                    let totalSales = 0;
                    let totalLaborCost = 0;
                    let totalPartsUsed = 0;
                    let totalPartsProfit = 0;
                    let totalPartsValue = 0;
                    let partsSold = {};
                    let totalInvoices = 0;

                    for (const invoiceId in invoices) {
                        const invoice = invoices[invoiceId];

                        if (invoice.invoiceType === "invoice") {
                            totalAmountPaid += parseFloat(invoice.amountPaid) || 0;
                            totalSales += parseFloat(invoice.total) || 0;

                            (invoice.labor || []).forEach(labor => {
                                totalLaborCost += parseFloat(labor.cost) || 0;
                            });

                            (invoice.parts || []).forEach(part => {
                                const partName = part.part;
                                const quantity = parseInt(part.quantity) || 0;
                                const price = parseFloat(part.price) || 0;
                                const actualPrice = parseFloat(part.actualPrice) || 0;
                                totalPartsProfit += (price - actualPrice) * quantity;
                                totalPartsValue += price * quantity;
                                totalPartsUsed += quantity;
                                partsSold[partName] = (partsSold[partName] || 0) + quantity;
                            });

                            totalInvoices++;
                        }
                    }

                    document.getElementById('total-amount-paid').textContent = `$${totalAmountPaid.toFixed(2)}`;
                    document.getElementById('total-sales').textContent = `$${totalSales.toFixed(2)}`;
                    document.getElementById('total-labor-cost').textContent = `$${totalLaborCost.toFixed(2)}`;
                    document.getElementById('total-parts-used').textContent = totalPartsUsed;
                    document.getElementById('total-parts-profit').textContent = `$${totalPartsProfit.toFixed(2)}`;
                    document.getElementById('total-parts-value').textContent = `$${totalPartsValue.toFixed(2)}`;
                    document.getElementById('total-invoices').textContent = totalInvoices;

                    const partsSoldList = document.getElementById('parts-sold');
                    partsSoldList.innerHTML = '';
                    Object.keys(partsSold).forEach(partName => {
                        const li = document.createElement('li');
                        li.textContent = `${partName}: ${partsSold[partName]} units`;
                        partsSoldList.appendChild(li);
                    });
                }
            }, (error) => {
                console.error('Error fetching invoices:', error);
            }));
        }

        function populateCustomerDropdown() {
            const invoicesRef = ref(database, `${DATABASE_BASE_PATH}/tasks`);
            listeners.track(onValue(invoicesRef, (snapshot) => {
                if (snapshot.exists()) {
                    const invoices = snapshot.val();
                    const customers = {};

                    for (const invoiceId in invoices) {
                        const invoice = invoices[invoiceId];
                        const customerName = invoice.customerName;

                        if (!customerName) continue;

                        if (!customers[customerName]) {
                            customers[customerName] = {
                                phones: new Set(),
                                addresses: new Set(),
                                emails: new Set()
                            };
                        }

                        if (invoice.customerPhone && invoice.customerPhone !== 'undefined') {
                            customers[customerName].phones.add(invoice.customerPhone);
                        }
                        if (invoice.customerAddress && invoice.customerAddress !== 'undefined') {
                            customers[customerName].addresses.add(invoice.customerAddress);
                        }
                        if (invoice.customerEmail && invoice.customerEmail !== 'undefined') {
                            customers[customerName].emails.add(invoice.customerEmail);
                        }
                    }

                    const sortedCustomerNames = Object.keys(customers).sort();

                    const dropdown = document.getElementById('customer-dropdown');
                    dropdown.innerHTML = '<option value="">Select a Customer</option>';
                    sortedCustomerNames.forEach(name => {
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name;
                        dropdown.appendChild(option);
                    });

                    window.customers = customers;
                    window.sortedCustomerNames = sortedCustomerNames;
                }
            }, (error) => {
                console.error('Error fetching invoices:', error);
            }));
        }

        function updateCustomerDetails(customerName) {
            if (!window.customers || !window.customers[customerName]) return;

            const customer = window.customers[customerName];

            const phoneNumbersList = document.getElementById('customer-phone-numbers');
            phoneNumbersList.innerHTML = '';
            customer.phones.forEach(phone => {
                const li = document.createElement('li');
                li.textContent = phone;
                phoneNumbersList.appendChild(li);
            });

            const addressesList = document.getElementById('customer-addresses');
            addressesList.innerHTML = '';
            customer.addresses.forEach(address => {
                const li = document.createElement('li');
                li.textContent = address;
                addressesList.appendChild(li);
            });

            const emailsList = document.getElementById('customer-emails');
            emailsList.innerHTML = '';
            customer.emails.forEach(email => {
                const li = document.createElement('li');
                li.textContent = email;
                emailsList.appendChild(li);
            });
        }

        function filterCustomerList(searchTerm) {
            const dropdown = document.getElementById('customer-dropdown');
            dropdown.innerHTML = '<option value="">Select a Customer</option>';

            const filteredNames = window.sortedCustomerNames.filter(name =>
                name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            filteredNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                dropdown.appendChild(option);
            });
        }

        function bindUiOnce() {
            if (uiBound) return;
            uiBound = true;

            document.getElementById('customer-search').addEventListener('input', function () {
                filterCustomerList(this.value);
            });

            document.getElementById('customer-dropdown').addEventListener('change', function () {
                const selectedCustomer = this.value;
                updateCustomerDetails(selectedCustomer);
            });

            const ledgerYearSelect = document.getElementById('ledger-year');
            ledgerYearSelect.addEventListener('change', () => {
                currentLedgerYear = parseInt(ledgerYearSelect.value, 10);
                analyzeLedgerData();
            });
        }

        function attachLedgerYearListener() {
            const ledgerYearSelect = document.getElementById('ledger-year');
            const ledgerRootRef = ref(database, `${DATABASE_BASE_PATH}/ledgerTx`);
            
            listeners.track(onValue(ledgerRootRef, (snapshot) => {
                if (snapshot.exists()) {
                    const years = Object.keys(snapshot.val() || {})
                        .map(y => parseInt(y, 10))
                        .filter(n => Number.isFinite(n))
                        .sort((a, b) => b - a);
                    
                    if (!years.includes(currentLedgerYear)) {
                        years.push(currentLedgerYear);
                        years.sort((a, b) => b - a);
                    }
                    
                    ledgerYearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
                    ledgerYearSelect.value = String(currentLedgerYear);
                } else {
                    ledgerYearSelect.innerHTML = `<option value="${currentLedgerYear}">${currentLedgerYear}</option>`;
                }
            }, (error) => {
                console.error('Error fetching ledger years:', error);
            }));
        }

        function analyzeLedgerData() {
            if (typeof stopLedgerDataListener === 'function') {
                stopLedgerDataListener();
                stopLedgerDataListener = null;
            }

            const ledgerRef = ref(database, `${DATABASE_BASE_PATH}/ledgerTx/${currentLedgerYear}`);
            stopLedgerDataListener = listeners.track(onValue(ledgerRef, (snapshot) => {
                if (!snapshot.exists()) {
                    document.getElementById('ledger-total-count').textContent = '0';
                    document.getElementById('ledger-total-expenses').textContent = '$0.00';
                    document.getElementById('ledger-by-category').innerHTML = '';
                    document.getElementById('ledger-top-skus').innerHTML = '';
                    return;
                }

                const ledger = snapshot.val();
                let totalCost = 0;
                let categoryMap = {};
                let skuMap = {};
                let txCount = 0;

                for (const id in ledger) {
                    const tx = ledger[id];
                    if (!tx) continue;

                    // Only include items tagged with "inv"
                    const tags = Array.isArray(tx.tags) ? tx.tags : [];
                    const hasInvTag = tags.some(t => String(t).toLowerCase() === 'inv');
                    if (!hasInvTag) continue;

                    txCount++;
                    const amount = Math.abs(parseFloat(tx.amt) || 0);
                    totalCost += amount;

                    // By Category
                    const cat = String(tx.cat || 'Uncategorized').trim();
                    if (cat) {
                        categoryMap[cat] = (categoryMap[cat] || 0) + amount;
                    }

                    // By SKU
                    const sku = String(tx.sku || '').trim();
                    if (sku) {
                        skuMap[sku] = (skuMap[sku] || 0) + 1;
                    }
                }

                document.getElementById('ledger-total-count').textContent = txCount;
                document.getElementById('ledger-total-expenses').textContent = `$${totalCost.toFixed(2)}`;

                // Render Categories
                const categoryList = document.getElementById('ledger-by-category');
                categoryList.innerHTML = '';
                Object.entries(categoryMap)
                    .sort((a, b) => b[1] - a[1])
                    .forEach(([cat, total]) => {
                        const li = document.createElement('li');
                        li.textContent = `${cat}: $${total.toFixed(2)}`;
                        categoryList.appendChild(li);
                    });

                // Render Top SKUs
                const skuList = document.getElementById('ledger-top-skus');
                skuList.innerHTML = '';
                Object.entries(skuMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 20)
                    .forEach(([sku, count]) => {
                        const li = document.createElement('li');
                        li.textContent = `${sku}: ${count} item(s)`;
                        skuList.appendChild(li);
                    });

            }, (error) => {
                console.error('Error fetching ledger data:', error);
            }));
        }

        document.addEventListener('DOMContentLoaded', bindUiOnce);
