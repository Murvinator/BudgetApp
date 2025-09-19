let budgetData = {
    income: [],
    expenses: [],
    categories: ['Fasta utgifter', 'Autogiro', 'Rörliga utgifter', 'Skulder'],
    monthlyStatus: {}
};

let currentMonthIndex = 0;
const months = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 
               'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('budgetApp');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.income) budgetData.income = parsed.income;
            if (parsed.expenses) budgetData.expenses = parsed.expenses;
            if (parsed.categories) budgetData.categories = parsed.categories;
            if (parsed.monthlyStatus) budgetData.monthlyStatus = parsed.monthlyStatus;
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
    
                }

                // Save data to localStorage
                function saveData() {
                    localStorage.setItem('budgetApp', JSON.stringify(budgetData));
                }

                // Export data
                function exportData() {
                    const dataStr = JSON.stringify(budgetData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'budget-data.json';
                    link.click();
                }

                // Import data
                function importData(event) {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            try {
                                const imported = JSON.parse(e.target.result);
                                if (confirm('Detta kommer att ersätta all nuvarande data. Fortsätt?')) {
                                    budgetData = imported;
                                    saveData();
                                    updateAllViews();
                                    closeSettings();
                                    alert('Data importerad!');
                                }
                            } catch (error) {
                                alert('Fel vid import av data. Kontrollera att filen är korrekt.');
                            }
                        };
                        reader.readAsText(file);
                    }
                }

                // Show specific section
                function showSection(sectionName, button) {
                    // Update sections
                    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                    document.getElementById(sectionName).classList.add('active');

                    // Update tab buttons
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    if (button) button.classList.add('active');

                    // Update view based on section
                    if (sectionName === 'overview') {
                        updateOverview();
                    } else if (sectionName === 'monthly') {
                        updateMonthlyView();
                    }
                }

                // Settings modal functions
                function openSettings() {
                    document.getElementById('settingsModal').style.display = 'block';
                    updateSettingsView();
                }

                function closeSettings() {
                    document.getElementById('settingsModal').style.display = 'none';
                }

                // Category management
                function addCategory() {
                    const name = document.getElementById('newCategoryName').value.trim();
                    if (name && !budgetData.categories.includes(name)) {
                        budgetData.categories.push(name);
                        document.getElementById('newCategoryName').value = '';
                        updateSettingsView();
                        saveData();
                    }
                }

                function deleteCategory(index) {
                    if (budgetData.categories.length === 1) {
                        alert('Du måste ha minst en kategori.');
                        return;
                    }

                    if (confirm('Detta kommer att ta bort kategorin. Utgifter i denna kategori kommer att flyttas till första kategorin.')) {
                        const categoryName = budgetData.categories[index];
                        budgetData.categories.splice(index, 1);

                        // Move expenses to first category
                        budgetData.expenses.forEach(expense => {
                            if (expense.category === categoryName) {
                                expense.category = budgetData.categories[0];
                            }
                        });

                        updateSettingsView();
                        saveData();
                    }
                }

                // Add income
                function addIncome() {
                    const name = document.getElementById('newIncomeName').value.trim();
                    const amount = parseInt(document.getElementById('newIncomeAmount').value);

                    if (name && amount && amount > 0) {
                        budgetData.income.push({ name, amount });
                        document.getElementById('newIncomeName').value = '';
                        document.getElementById('newIncomeAmount').value = '';
                        updateSettingsView();
                        updateOverview();
                        saveData();
                    }
                }

                // Add expense
                function addExpense() {
                    const name = document.getElementById('newExpenseName').value.trim();
                    const amount = parseInt(document.getElementById('newExpenseAmount').value);
                    const category = document.getElementById('newExpenseCategory').value;

                    if (name && amount && amount > 0 && category) {
                        budgetData.expenses.push({ name, amount, category });
                        document.getElementById('newExpenseName').value = '';
                        document.getElementById('newExpenseAmount').value = '';
                        updateSettingsView();
                        updateOverview();
                        saveData();
                    }
                }

                // Delete functions
                function deleteIncome(index) {
                    if (confirm('Är du säker på att du vill ta bort denna inkomst?')) {
                        budgetData.income.splice(index, 1);
                        updateSettingsView();
                        updateOverview();
                        saveData();
                    }
                }

                function deleteExpense(index) {
                    if (confirm('Är du säker på att du vill ta bort denna utgift?')) {
                        budgetData.expenses.splice(index, 1);
                        updateSettingsView();
                        updateOverview();
                        saveData();
                    }
                }

                // Update overview
                function updateOverview() {
                    const totalIncome = budgetData.income.reduce((sum, item) => sum + item.amount, 0);
                    const expenses = budgetData.expenses
                        .filter(e => e.category !== 'Skulder')
                        .reduce((sum, item) => sum + item.amount, 0);
                    const remaining = totalIncome - expenses;

                    document.getElementById('totalIncome').textContent = totalIncome.toLocaleString('sv-SE') + ' kr';
                    document.getElementById('expenses').textContent = expenses.toLocaleString('sv-SE') + ' kr';
                    document.getElementById('remaining').textContent = remaining.toLocaleString('sv-SE') + ' kr';

                    updateChart();
                    updateDebtSection();
                }

                // Update debt section
                function updateDebtSection() {
                    const debts = budgetData.expenses.filter(e => e.category === 'Skulder');
                    const debtSection = document.getElementById('debtSection');
                    const debtList = document.getElementById('debtList');
                    const debtTotalContainer = document.getElementById('debtTotalContainer');
                    

                    if (debts.length === 0) {
                        debtSection.style.display = 'none';
                        return;
                    }

                    debtSection.style.display = 'block';
                    debtList.innerHTML = '';

                    let totalDebt = 0;
                    debts.forEach(debt => {
                        totalDebt += debt.amount;
                        const div = document.createElement('div');
                        div.className = 'expense-item';
                        div.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${debt.name}</div>
            </div>
            <div class="expense-amount">${debt.amount.toLocaleString('sv-SE')} kr</div>
        `;
                        debtList.appendChild(div);
                    });
                     debtTotalContainer.innerHTML = `
        <span>Totalt</span>
        <span>${totalDebt.toLocaleString('sv-SE')} kr</span>
    `;
                    
                }

                // Update chart
                function updateChart() {
                    const ctx = document.getElementById('expenseChart').getContext('2d');

                    // Filter out debts
                    const expenses = budgetData.expenses
                        .filter(expense => expense.category !== 'Skulder')
                        .map(expense => ({ ...expense }));

                    if (expenses.length === 0) {
                        if (window.budgetChart) {
                            window.budgetChart.destroy();
                        }
                        return;
                    }

                    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

                    // Group small expenses
                    const threshold = total * 0.03; // 3% threshold
                    const mainExpenses = [];
                    let otherTotal = 0;
                    const otherItems = [];

                    expenses.forEach(expense => {
                        if (expense.amount >= threshold) {
                            mainExpenses.push(expense);
                        } else {
                            otherTotal += expense.amount;
                            otherItems.push(expense.name);
                        }
                    });

                    if (otherTotal > 0) {
                        mainExpenses.push({
                            name: `Övrigt (${otherItems.length} poster)`,
                            amount: otherTotal,
                            category: 'Övrigt'
                        });
                    }

                    // Sort by amount descending
                    mainExpenses.sort((a, b) => b.amount - a.amount);

                    const colors = [
                        '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE',
                        '#5AC8FA', '#FFCC00', '#FF6482', '#30B0C7', '#32D74B'
                    ];

                    if (window.budgetChart) {
                        window.budgetChart.destroy();
                    }

                    window.budgetChart = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: mainExpenses.map(e => e.name),
                            datasets: [{
                                data: mainExpenses.map(e => e.amount),
                                backgroundColor: colors.slice(0, mainExpenses.length),
                                borderWidth: 0,
                                spacing: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: {
                                    display: false,
                                    text: 'Fördelning',
                                    font: {
                                        size: 20,
                                        weight: '600'
                                    },
                                    padding: {
                                        top: 0,
                                        bottom: 20
                                    },
                                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                                },
                                legend: {
                                    position: 'right',
                                    labels: {
                                        padding: 20,
                                        usePointStyle: true,
                                        pointStyle: 'circle',
                                        font: {
                                            size: 14
                                        },
                                        generateLabels: function (chart) {
                                            const data = chart.data;
                                            const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);

                                            return data.labels.map((label, index) => {
                                                const value = data.datasets[0].data[index];
                                                const percentage = ((value / total) * 100).toFixed(0);

                                                return {
                                                    text: `${label}: ${percentage}%`,
                                                    fillStyle: data.datasets[0].backgroundColor[index],
                                                    strokeStyle: data.datasets[0].backgroundColor[index],
                                                    pointStyle: 'circle',
                                                    hidden: false,
                                                    index: index
                                                };
                                            });
                                        },
                                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                                            const percentage = ((context.raw / total) * 100).toFixed(1);
                                            return `${context.label}: ${context.raw} kr (${percentage}%)`;
                                        }
                                    }
                                }
                            },
                            cutout: '0%'
                        }
                    });
                }

                // Update monthly view
                function updateMonthlyView() {
                    const container = document.getElementById('monthlyExpenses');
                    container.innerHTML = '';

                    // Filter out debt category from monthly view
                    const monthlyCategories = budgetData.categories;

                    monthlyCategories.forEach(category => {
    const categoryExpenses = budgetData.expenses.filter(e => e.category === category);
    if (categoryExpenses.length === 0) return;

    // Create separate header
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    const header = document.createElement('h3');
    header.textContent = category;
    categoryHeader.appendChild(header);
    container.appendChild(categoryHeader);

    // Create separate list container
    const categoryList = document.createElement('div');
    categoryList.className = 'category-list';

    categoryExpenses.forEach((expense) => {
        const globalIndex = budgetData.expenses.findIndex(e => e === expense);
        const isPaid = budgetData.monthlyStatus['current'] && budgetData.monthlyStatus['current'][globalIndex];

        const expenseDiv = document.createElement('div');
        expenseDiv.className = `expense-item ${isPaid ? 'paid' : ''}`;
        expenseDiv.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${expense.name}</div>
            </div>
            <div class="expense-amount">${expense.amount.toLocaleString('sv-SE')} kr</div>
            <input type="checkbox" class="checkbox" ${isPaid ? 'checked' : ''} 
                   onchange="togglePayment('current', ${globalIndex}, this)">
        `;
        categoryList.appendChild(expenseDiv);
    });

    container.appendChild(categoryList);
});
                }

                // Toggle payment status
                function togglePayment(month, expenseIndex, checkbox) {
                    if (!budgetData.monthlyStatus[month]) {
                        budgetData.monthlyStatus[month] = {};
                    }

                    budgetData.monthlyStatus[month][expenseIndex] = checkbox.checked;

                    // Update visual state
                    const expenseItem = checkbox.closest('.expense-item');
                    if (checkbox.checked) {
                        expenseItem.classList.add('paid');
                    } else {
                        expenseItem.classList.remove('paid');
                    }

                    saveData();
                }

                // Reset current month
                function resetCurrentMonth() {
                    if (confirm('Vill du återställa alla checkboxar?')) {
                        budgetData.monthlyStatus['current'] = {};
                        updateMonthlyView();
                        saveData();
                    }
                }

                // Update settings view
                function updateSettingsView() {
                    // Update category dropdown
                    const categorySelect = document.getElementById('newExpenseCategory');
                    categorySelect.innerHTML = '';
                    budgetData.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        categorySelect.appendChild(option);
                    });

                    // Update category list
                    const categoryList = document.getElementById('categoryList');
                    categoryList.innerHTML = '';
                    budgetData.categories.forEach((category, index) => {
                        const div = document.createElement('div');
                        div.className = 'category-item';
                        div.innerHTML = `
            <span>${category}</span>
            <button class="delete-btn" onclick="deleteCategory(${index})">Ta bort</button>
        `;
                        categoryList.appendChild(div);
                    });

                    // Update income list
                    const incomeList = document.getElementById('incomeList');
                    incomeList.innerHTML = '';
                    budgetData.income.forEach((income, index) => {
                        const div = document.createElement('div');
                        div.className = 'expense-item';
                        div.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${income.name}</div>
            </div>
            <div class="expense-amount" style="color: var(--system-green)">${income.amount.toLocaleString('sv-SE')} kr</div>
            <button class="delete-btn" onclick="deleteIncome(${index})">Ta bort</button>
        `;
                        incomeList.appendChild(div);
                    });

                    // Update expenses list
                    const expensesList = document.getElementById('expensesList');
                    expensesList.innerHTML = '';

                    budgetData.categories.forEach(category => {
                        const categoryExpenses = budgetData.expenses.filter(e => e.category === category);
                        if (categoryExpenses.length === 0) return;

                        const categorySection = document.createElement('div');
                        categorySection.style.marginBottom = '20px';

                        const categoryTitle = document.createElement('h4');
                        categoryTitle.style.cssText = 'margin: 16px 0 8px 0; color: var(--text-secondary); font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;';
                        categoryTitle.textContent = category;
                        categorySection.appendChild(categoryTitle);

                        categoryExpenses.forEach(expense => {
                            const globalIndex = budgetData.expenses.findIndex(e => e === expense);
                            const div = document.createElement('div');
                            div.className = 'expense-item';
                            div.innerHTML = `
                <div class="expense-info">
                    <div class="expense-name">${expense.name}</div>
                </div>
                <div class="expense-amount">${expense.amount.toLocaleString('sv-SE')} kr</div>
                <button class="delete-btn" onclick="deleteExpense(${globalIndex})">Ta bort</button>
            `;
                            categorySection.appendChild(div);
                        });

                        expensesList.appendChild(categorySection);
                    });
                }

                // Update all views
                function updateAllViews() {
                    updateOverview();
                    updateMonthlyView();
                    updateSettingsView();
                }

                // Close modal when clicking outside
                window.onclick = function (event) {
                    const modal = document.getElementById('settingsModal');
                    if (event.target === modal) {
                        closeSettings();
                    }
                }

                // Handle escape key
                document.addEventListener('keydown', function (event) {
                    if (event.key === 'Escape') {
                        closeSettings();
                    }
                });

                // Initialize app
                window.addEventListener('DOMContentLoaded', function () {
                    loadData();
                    updateOverview();
                    updateSettingsView();
                });

                // Prevent zoom on double tap for mobile
                let lastTouchEnd = 0;
                document.addEventListener('touchend', function (event) {
                    const now = (new Date()).getTime();
                    if (now - lastTouchEnd <= 300) {
                        event.preventDefault();
                    }
                    lastTouchEnd = now;
                }, false);