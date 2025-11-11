  // Header collapse on scroll: add/remove `.small` class to `.header`
  function setupHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    const threshold = 60; // px scrolled before collapsing

    function onScroll() {
      if (window.scrollY > threshold) header.classList.add('small');
      else header.classList.remove('small');
    }

    // Run on load and on scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('DOMContentLoaded', onScroll);
    // trigger once now in case app mounts after load
    onScroll();
  }

  // Initialize header scroll behavior
  try { setupHeaderScroll(); } catch (e) { console.warn('Header scroll init failed', e); }

/* ================================= */
/* DATA MODEL & STORAGE */
/* ================================= */

const DEBT_CATEGORY = "Skulder";

let budgetData = {
  income: [],
  expenses: [],
  categories: [],
  monthlyStatus: {},
  debtStatus: {}, // Track paid debt status (separate from debt items)
  debts: [], // Separate debt items (previously expenses with category 'Skulder')
  debtPayments: {}, // { "DebtName": [{amount, note, date}] }
  variableExpenses: [], // variable expense categories
  variableExpenseTransactions: {}, // track spending per category per month
};

function genId(prefix = 'd') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

let currentMonthIndex = 0;
const months = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];

// Track last non-settings view so Settings can breadcrumb back to it
let lastView = 'overview-view';

function getButtonForView(viewName) {
  const tabs = document.querySelectorAll('.tab-btn');
  if (!tabs || tabs.length === 0) return null;
  if (viewName === 'overview-view') return tabs[0];
  if (viewName === 'budget-view') return tabs[1];
  if (viewName === 'monthly-view') return tabs[2];
  return tabs[0];
}

function goBackFromSettings() {
  // fallback to overview if lastView is not set
  const target = lastView || 'overview-view';
  const button = getButtonForView(target);
  showView(target, button);
}

// Load data from localStorage
function loadData() {
  const saved = localStorage.getItem("budgetApp");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.income) budgetData.income = parsed.income;
      if (parsed.expenses) budgetData.expenses = parsed.expenses;
      if (parsed.categories) {
        // Ensure the special debt category is not treated as a user-editable category
        budgetData.categories = parsed.categories.filter((c) => c !== DEBT_CATEGORY);
      }
      if (parsed.monthlyStatus) budgetData.monthlyStatus = parsed.monthlyStatus;
      if (parsed.debtStatus) budgetData.debtStatus = parsed.debtStatus;
      // Backwards-compat: if the saved data has a dedicated debts array use it, otherwise migrate
      if (parsed.debts) {
        // Ensure debts have ids
        budgetData.debts = parsed.debts.map((d) => {
          if (!d.id) d.id = genId();
          return d;
        });
      } else if (parsed.expenses) {
        // Move any expense entries with category 'Skulder' into budgetData.debts
        const remaining = [];
        parsed.expenses.forEach((e) => {
          if (e.category === DEBT_CATEGORY) {
            budgetData.debts.push({ id: genId('debt'), name: e.name, amount: e.amount });
          } else {
            remaining.push(e);
          }
        });
        // Use migrated remaining expenses if not already assigned
        if (!parsed.expensesWasExplicitlySet) {
          budgetData.expenses = remaining;
        }
      }
      // If parsed.debtPayments exists, try to migrate keys to debt ids.
      if (parsed.debtPayments) {
        // If keys already match debt ids, keep as is.
        const keys = Object.keys(parsed.debtPayments);
        const looksLikeIds = keys.every((k) => budgetData.debts.some((d) => d.id === k));
        if (looksLikeIds) {
          budgetData.debtPayments = parsed.debtPayments;
        } else {
          const migrated = {};
          Object.keys(parsed.debtPayments).forEach((key) => {
            // find debt by name
            const match = budgetData.debts.find((d) => d.name === key);
            if (match) {
              migrated[match.id] = parsed.debtPayments[key];
            }
          });
          budgetData.debtPayments = migrated;
        }
      }
      if (parsed.variableExpenses)
        budgetData.variableExpenses = parsed.variableExpenses;
      if (parsed.variableExpenseTransactions)
        budgetData.variableExpenseTransactions =
          parsed.variableExpenseTransactions;
    } catch (e) {
      console.error("Error loading saved data:", e);
    }
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem("budgetApp", JSON.stringify(budgetData));
}

/* ================================= */
/* DATA IMPORT/EXPORT FUNCTIONS */
/* ================================= */

function exportData() {
  const dataStr = JSON.stringify(budgetData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "budget-data.json";
  link.click();
}

function importData(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (confirm("Detta kommer att ersätta all nuvarande data. Fortsätt?")) {
          budgetData = imported;
          // Migrate any legacy expenses that use the debt category into budgetData.debts
          migrateDebtsFromExpenses();
          // Migrate any legacy debtPayments keyed by name into id-keyed structure
          migrateDebtPaymentsAfterLoad();
          saveData();
          updateAllViews();
          // After importing, switch back to the main overview view
          showView('overview-view', document.querySelector('.tab-btn'));
          alert("Data importerad!");
        }
      } catch (error) {
        alert("Fel vid import av data. Kontrollera att filen är korrekt.");
        console.error(error);
      }
    };
    reader.readAsText(file);
  }
}

function migrateDebtPaymentsAfterLoad() {
  if (!budgetData.debtPayments || !budgetData.debts) return;
  const keys = Object.keys(budgetData.debtPayments);
  const looksLikeIds = keys.every((k) => budgetData.debts.some((d) => d.id === k));
  if (looksLikeIds) return; // already id-keyed

  const migrated = {};
  keys.forEach((key) => {
    const match = budgetData.debts.find((d) => d.name === key);
    if (match) migrated[match.id] = budgetData.debtPayments[key];
  });
  budgetData.debtPayments = migrated;
}

// Migrate legacy debt entries that were saved as expenses with category 'Skulder'
function migrateDebtsFromExpenses() {
  if (!budgetData.expenses || !Array.isArray(budgetData.expenses)) return;
  const remaining = [];
  budgetData.expenses.forEach((e) => {
    if (e.category === DEBT_CATEGORY) {
      budgetData.debts = budgetData.debts || [];
      // Ensure migrated debts have stable ids
      budgetData.debts.push({ id: genId('debt'), name: e.name, amount: e.amount });
    } else {
      remaining.push(e);
    }
  });
  budgetData.expenses = remaining;
}

/* ================================= */
/* VIEW NAVIGATION SYSTEM */
/* ================================= */

function showView(viewName, button) {
  // Remember current active view (so settings can breadcrumb back)
  const currentActive = document.querySelector('.view.active');
  const previous = currentActive ? currentActive.id : null;
  if (previous && previous !== viewName && previous !== 'settings-view') {
    lastView = previous;
  }

  

  // Update view visibility
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document.getElementById(viewName).classList.add("active");

  // Update tab button states
  // Clear active state from tab buttons and nav action buttons (e.g. settings bubble)
  document
    .querySelectorAll(".tab-btn, .nav-action-btn")
    .forEach((b) => b.classList.remove("active"));
  if (button) button.classList.add("active");

  // Update view content based on which view is shown
  if (viewName === "overview-view") {
    updateOverviewView();
  } else if (viewName === "monthly-view") {
    updateMonthlyView();
  } else if (viewName === "budget-view") {
    updateBudgetView();
  } else if (viewName === "settings-view") {
    updateSettingsView();
  }
}

/* ================================= */
/* SETTINGS MODAL FUNCTIONS */
/* ================================= */

/* NOTE: Settings were previously implemented as a modal (openSettings/closeSettings).
   The UI now uses a normal view with id `settings-view`. Use `showView('settings-view')`
   to navigate to settings and `showView('overview-view')` (or another view) to leave it.
*/

/* ================================= */
/* CATEGORY MANAGEMENT */
/* ================================= */

function addCategory() {
  const name = document.getElementById("newCategoryName").value.trim();
  if (name === DEBT_CATEGORY) {
    alert(`'${DEBT_CATEGORY}' är reserverat för skulder och kan inte läggas till som vanlig kategori.`);
    return;
  }

  if (name && !budgetData.categories.includes(name)) {
    budgetData.categories.push(name);
    document.getElementById("newCategoryName").value = "";
    updateSettingsView();
    saveData();
  }
}

function deleteCategory(index) {
  if (budgetData.categories.length === 1) {
    alert("Du måste ha minst en kategori.");
    return;
  }

  if (
    confirm(
      "Detta kommer att ta bort kategorin. Utgifter i denna kategori kommer att flyttas till första kategorin."
    )
  ) {
    const categoryName = budgetData.categories[index];
    budgetData.categories.splice(index, 1);

    // Move expenses to first category
    budgetData.expenses.forEach((expense) => {
      if (expense.category === categoryName) {
        expense.category = budgetData.categories[0];
      }
    });

    updateSettingsView();
    saveData();
  }
}

/* ================================= */
/* INCOME MANAGEMENT */
/* ================================= */

function addIncome() {
  const name = document.getElementById("newIncomeName").value.trim();
  const amount = parseInt(document.getElementById("newIncomeAmount").value);

  if (name && amount && amount > 0) {
    budgetData.income.push({ name, amount });
    document.getElementById("newIncomeName").value = "";
    document.getElementById("newIncomeAmount").value = "";
    updateSettingsView();
    updateOverviewView();
    saveData();
  }
}

function deleteIncome(index) {
  if (confirm("Är du säker på att du vill ta bort denna inkomst?")) {
    budgetData.income.splice(index, 1);
    updateSettingsView();
    updateOverviewView();
    saveData();
  }
}

/* ================================= */
/* EXPENSE MANAGEMENT */
/* ================================= */

function addExpense() {
  const name = document.getElementById("newExpenseName").value.trim();
  const amount = parseInt(document.getElementById("newExpenseAmount").value);
  const category = document.getElementById("newExpenseCategory").value;

  if (!name || !amount || amount <= 0 || !category) return;

  // If user somehow selects the special debt category, treat as debt and store separately
  if (category === DEBT_CATEGORY) {
    budgetData.debts.push({ name, amount });
  } else {
    budgetData.expenses.push({ name, amount, category });
  }
  document.getElementById("newExpenseName").value = "";
  document.getElementById("newExpenseAmount").value = "";
  updateSettingsView();
  updateOverviewView();
  saveData();
}

function deleteExpense(index) {
  if (confirm("Är du säker på att du vill ta bort denna utgift?")) {
    budgetData.expenses.splice(index, 1);
    updateSettingsView();
    updateOverviewView();
    saveData();
  }
}

function saveEditExpense(index, button) {
  const editForm = button.closest(".expense-edit-form");
  const newName = editForm.querySelector(".edit-name-input").value.trim();
  const newAmount = parseInt(
    editForm.querySelector(".edit-amount-input").value
  );
  const newCategory = editForm.querySelector(".edit-category-select").value;

  if (!newName || !newAmount || newAmount <= 0) {
    alert("Vänligen fyll i giltigt namn och belopp.");
    return;
  }

  // Update the expense
  budgetData.expenses[index].name = newName;
  budgetData.expenses[index].amount = newAmount;
  budgetData.expenses[index].category = newCategory;

  // Close edit form and refresh
  editForm.style.display = "none";
  editForm.previousElementSibling.classList.remove("editing");

  updateSettingsView();
  updateAllViews();
  saveData();
}

function cancelEditExpense(button) {
  const editForm = button.closest(".expense-edit-form");
  editForm.style.display = "none";
  editForm.previousElementSibling.classList.remove("editing");
}

/* ================================= */
/* VARIABLE EXPENSE MANAGEMENT */
/* ================================= */

function addVariableExpense() {
  const name = document.getElementById("newVariableExpenseName").value.trim();
  const budget = parseInt(
    document.getElementById("newVariableExpenseBudget").value
  );

  if (name && budget && budget > 0) {
    // Check if already exists
    if (budgetData.variableExpenses.find((e) => e.name === name)) {
      alert("En kategori med detta namn finns redan.");
      return;
    }

    budgetData.variableExpenses.push({ name, budget });
    document.getElementById("newVariableExpenseName").value = "";
    document.getElementById("newVariableExpenseBudget").value = "";
    updateSettingsView();
    saveData();
  }
}

function deleteVariableExpense(index) {
  if (
    confirm(
      "Är du säker på att du vill ta bort denna varierande utgift? All historik kommer att raderas."
    )
  ) {
    const expenseName = budgetData.variableExpenses[index].name;
    budgetData.variableExpenses.splice(index, 1);

    // Clean up transactions for this expense
    Object.keys(budgetData.variableExpenseTransactions).forEach((monthKey) => {
      if (budgetData.variableExpenseTransactions[monthKey][expenseName]) {
        delete budgetData.variableExpenseTransactions[monthKey][expenseName];
      }
    });

    updateSettingsView();
    saveData();
  }
}

/* ================================= */
/* OVERVIEW VIEW COMPONENTS */
/* ================================= */

function updateOverviewView() {
  updateSummaryCards();
  updateChartComponent();
  updateVariableExpensesMini();
  updateDebtSummaryComponent();
}

function updateSummaryCards() {
  const totalIncome = budgetData.income.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const expenses = budgetData.expenses
    .filter((e) => e.category !== "Skulder")
    .reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalIncome - expenses;

  document.getElementById("totalIncome").textContent =
    totalIncome.toLocaleString("sv-SE") + " kr";
  document.getElementById("expenses").textContent =
    expenses.toLocaleString("sv-SE") + " kr";
  document.getElementById("remaining").textContent =
    remaining.toLocaleString("sv-SE") + " kr";
}

function updateChartComponent() {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  if (!ctx) return;

  // 1. Beräkna den totala budgeten för alla rörliga utgifter.
  const totalVariableBudget = budgetData.variableExpenses.reduce(
    (sum, item) => sum + item.budget,
    0
  );

  // NYTT: 2. Beräkna totalt spenderat belopp för rörliga utgifter denna månad.
  let totalVariableSpent = 0;
  const monthKey = getCurrentMonthKey();
  if (budgetData.variableExpenseTransactions[monthKey]) {
    // Gå igenom alla kategorier med transaktioner för månaden
    Object.values(budgetData.variableExpenseTransactions[monthKey]).forEach(
      (categoryTransactions) => {
        // Addera summan av transaktionerna för varje kategori
        totalVariableSpent += categoryTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
      }
    );
  }

  // NYTT: 3. Bestäm vilket belopp som ska visas i diagrammet (det högsta av budget/spenderat).
  const amountForChart = Math.max(totalVariableBudget, totalVariableSpent);

  // 4. Skapa en tillfällig lista med utgifter för diagrammet.
  // Vi börjar med de vanliga utgifterna (exklusive skulder).
  // Use normal expenses (debts are handled separately in `budgetData.debts`)
  const chartExpenses = budgetData.expenses
    .filter((expense) => expense.category !== DEBT_CATEGORY)
    .map((expense) => ({ ...expense })); // Använd map för att skapa en kopia

  // 5. Lägg till den rörliga posten i listan, nu med det dynamiska beloppet.
  if (amountForChart > 0) {
    chartExpenses.push({
      name: "Rörliga", // Ändrat namn för att passa båda fallen
      amount: amountForChart,
      category: "Rörligt",
    });
  }

  // Från och med nu använder vi 'chartExpenses' istället för den gamla 'expenses'-variabeln.
  if (chartExpenses.length === 0) {
    if (window.budgetChart) {
      window.budgetChart.destroy();
    }
    return;
  }

  const total = chartExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Group small expenses together
  const threshold = total * 0.03; // 3% threshold
  const mainExpenses = [];
  let otherTotal = 0;
  const otherItems = [];

  chartExpenses.forEach((expense) => {
    if (expense.amount >= threshold) {
      mainExpenses.push(expense);
    } else {
      otherTotal += expense.amount;
      otherItems.push(expense.name);
    }
  });

  if (otherTotal > 0) {
    mainExpenses.push({
      name: `Övrigt`,
      // (${otherItems.length} poster)
      amount: otherTotal,
      category: "Övrigt",
    });
  }

  // Sort by amount descending
  mainExpenses.sort((a, b) => b.amount - a.amount);

  const colors = [
    "#007AFF",
    "#34C759",
    "#FF9500",
    "#FF3B30",
    "#AF52DE",
    "#5AC8FA",
    "#FFCC00",
    "#FF6482",
    "#30B0C7",
    "#32D74B",
  ];

  if (window.budgetChart) {
    window.budgetChart.destroy();
  }

  window.budgetChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: mainExpenses.map((e) => e.name),
      datasets: [
        {
          data: mainExpenses.map((e) => e.amount),
          backgroundColor: colors.slice(0, mainExpenses.length),
          borderWidth: 0,
          spacing: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false,
        },
        legend: {
          position: "right",
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
            font: { size: 14 },
            generateLabels: function (chart) {
              const data = chart.data;
              const total = data.datasets[0].data.reduce(
                (sum, value) => sum + value,
                0
              );

              return data.labels.map((label, index) => {
                const value = data.datasets[0].data[index];
                const percentage = ((value / total) * 100).toFixed(0);

                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[index],
                  strokeStyle: data.datasets[0].backgroundColor[index],
                  pointStyle: "circle",
                  hidden: false,
                  index: index,
                };
              });
            },
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-primary"
            ),
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce(
                (sum, value) => sum + value,
                0
              );
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ${context.raw} kr (${percentage}%)`;
            },
          },
        },
      },
      cutout: "0%",
    },
  });
}

function updateVariableExpensesMini() {
  const miniContainer = document.getElementById("variableExpensesMini");
  const miniContent = document.getElementById("variableExpensesMiniContent");
  const miniTitle = document.getElementById("variableExpensesMiniTitle");

  if (budgetData.variableExpenses.length === 0) {
    miniContainer.style.display = "none";
    return;
  }

  miniContainer.style.display = "block";
  
  // Set title to current month name
  const monthName = new Date().toLocaleString('sv-SE', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  miniTitle.textContent = capitalizedMonth;
  
  // Make the entire widget clickable
  miniContainer.style.cursor = "pointer";
  miniContainer.onclick = () => showView('budget-view', document.querySelectorAll('.tab-btn')[1]);
  
  miniContent.innerHTML = "";

  const monthKey = getCurrentMonthKey();

  budgetData.variableExpenses.forEach((expense) => {
    const transactions =
      budgetData.variableExpenseTransactions[monthKey]?.[expense.name] || [];
    const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = expense.budget - spent;
    const percentage = Math.min((spent / expense.budget) * 100, 100);

    const isOverBudget = spent > expense.budget;
    const progressColor = isOverBudget
      ? "var(--system-red)"
      : percentage > 80
      ? "var(--system-orange)"
      : "var(--system-green)";

    const miniItem = document.createElement("div");
    miniItem.className = "variable-mini-item";
    miniItem.innerHTML = `
            <div class="variable-mini-info">
                <span class="variable-mini-name">${expense.name}</span>
                <span class="variable-mini-amount ${
                  isOverBudget ? "over" : ""
                }">${remaining.toLocaleString("sv-SE")} kr kvar</span>
            </div>
            <div class="variable-mini-progress">
                <div class="variable-mini-progress-fill" style="width: ${percentage}%; background: ${progressColor};"></div>
            </div>
        `;
    miniContent.appendChild(miniItem);
  });
}

function updateDebtSummaryComponent() {
  const debts = budgetData.debts || [];
  const debtComponent = document.getElementById("debtSummaryComponent");
  const debtList = document.getElementById("debtList");
  const debtTotalContainer = document.getElementById("debtTotalContainer");

  if (debts.length === 0) {
    debtComponent.style.display = "none";
    return;
  }

  debtComponent.style.display = "block";
  debtList.innerHTML = "";

  let totalDebt = 0;
  debts.forEach((debt, idx) => {
    totalDebt += debt.amount;

    // Wrapper div for a debt row + expandable edit form (like expenses in settings)
    const wrapper = document.createElement('div');
    wrapper.className = 'expense-item-wrapper';

    // Main debt row (click to toggle)
    const debtRow = document.createElement('div');
    debtRow.className = 'expense-item editable-expense';
    debtRow.innerHTML = `
      <div class="expense-info">
        <div class="expense-name">${debt.name}</div>
      </div>
      <div class="expense-amount">${debt.amount.toLocaleString('sv-SE')} kr</div>
    `;

    // Edit form (initially hidden) — contains inline payment input and payments history
    const editForm = document.createElement('div');
    editForm.className = 'expense-edit-form';
    editForm.style.display = 'none';
    editForm.innerHTML = `
      <div class="edit-form-content">
        <div class="edit-input-group">
          <label>Belopp att betala</label>
          <input type="number" class="debt-pay-amount" placeholder="Belopp" min="0" step="0.01">
        </div>
        <div class="edit-actions">
          <button class="save-edit-btn" onclick="addPaymentInline(${idx}, this)">Betala</button>
          <button class="cancel-edit-btn" onclick="cancelDebtEdit(this)">Stäng</button>
        </div>
        <div class="payments-history" id="payments-for-${debt.id}"></div>
      </div>
    `;

    // Toggle edit form on row click (but not when clicking interactive controls inside)
    debtRow.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;

      // Close other open edit forms
      document.querySelectorAll('.expense-edit-form').forEach((form) => {
        if (form !== editForm) {
          form.style.display = 'none';
          form.previousElementSibling.classList.remove('editing');
        }
      });

      // Toggle this edit form
      if (editForm.style.display === 'none') {
        editForm.style.display = 'block';
        debtRow.classList.add('editing');
      } else {
        editForm.style.display = 'none';
        debtRow.classList.remove('editing');
      }
    });

    wrapper.appendChild(debtRow);
    wrapper.appendChild(editForm);
    debtList.appendChild(wrapper);

    // Render payment history inside the edit form (if any)
    renderPaymentsForDebtAtIndex(idx);
  });

  // The header does not show the total; total is visible in the expanded debt panel below.

  debtTotalContainer.innerHTML = `
        <span>Totalt</span>
        <span>${totalDebt.toLocaleString("sv-SE")} kr</span>
    `;
}

/* ================================= */
/* MONTHLY VIEW COMPONENTS */
/* ================================= */

function updateMonthlyView() {
  const container = document.getElementById("monthlyExpenses");
  container.innerHTML = "";

  // Filter out debt category from monthly view
  const monthlyCategories = budgetData.categories.filter(
    (category) => category !== DEBT_CATEGORY
  );

  monthlyCategories.forEach((category) => {
    const categoryExpenses = budgetData.expenses.filter(
      (e) => e.category === category
    );
    if (categoryExpenses.length === 0) return;
    categoryExpenses.sort((a, b) => b.amount - a.amount);

    // Create category header
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "category-header";
    const header = document.createElement("h3");
    header.textContent = category;
    categoryHeader.appendChild(header);
    container.appendChild(categoryHeader);

    // Create category list container
    const categoryList = document.createElement("div");
    categoryList.className = "category-list";

    // Store indices of expenses in this category for later reference
    const categoryExpenseIndices = [];

    categoryExpenses.forEach((expense) => {
      const globalIndex = budgetData.expenses.findIndex((e) => e === expense);
      categoryExpenseIndices.push(globalIndex);
      const isPaid =
        budgetData.monthlyStatus["current"] &&
        budgetData.monthlyStatus["current"][globalIndex];

      const expenseDiv = document.createElement("div");
      expenseDiv.className = `expense-item ${isPaid ? "paid" : ""}`;
      expenseDiv.style.cursor = "pointer";
      expenseDiv.innerHTML = `
                <div class="expense-info">
                    <div class="expense-name">${expense.name}</div>
                </div>
                <div class="expense-amount">${expense.amount.toLocaleString(
                  "sv-SE"
                )} kr</div>
                <input type="checkbox" class="checkbox" ${
                  isPaid ? "checked" : ""
                } 
                       onchange="togglePaymentFromCheckbox('current', ${globalIndex}, this)">
            `;

      // Add click handler to toggle checkbox when clicking anywhere on the expense item
      expenseDiv.addEventListener("click", function (e) {
        // Don't trigger if clicking directly on the checkbox
        if (e.target.type !== "checkbox") {
          const checkbox = expenseDiv.querySelector(".checkbox");
          checkbox.checked = !checkbox.checked;
          togglePaymentFromCheckbox("current", globalIndex, checkbox);
        }
      });

      categoryList.appendChild(expenseDiv);
    });

    // Calculate total for this category
    const categoryTotal = categoryExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Calculate paid amount for this category
    let paidAmount = 0;
    categoryExpenseIndices.forEach((idx) => {
      const isPaid =
        budgetData.monthlyStatus["current"] &&
        budgetData.monthlyStatus["current"][idx];
      if (isPaid) {
        paidAmount += budgetData.expenses[idx].amount;
      }
    });

    const remainingAmount = categoryTotal - paidAmount;
    const anyPaid = paidAmount > 0;

    // Check if remaining row already exists in the DOM (to detect first appearance)
    const existingRemainingRow = categoryList.querySelector(".remaining-row");
    const isFirstAppearance = !existingRemainingRow && anyPaid && remainingAmount > 0;

    // Create "Kvar att betala" (remaining to pay) row if any items are paid
    if (anyPaid && remainingAmount > 0) {
      const remainingDiv = document.createElement("div");
      remainingDiv.className = `expense-item remaining-row`;
      remainingDiv.innerHTML = `
            <div class="expense-info">
                <div class="expense-name" style="font-style: normal;">Kvar att betala</div>
            </div>
            <div class="expense-amount" style="font-style: normal;">${remainingAmount.toLocaleString(
              "sv-SE"
            )} kr</div>
        `;
      categoryList.appendChild(remainingDiv);
    }

    // Create total row
    const allPaid = remainingAmount === 0 && anyPaid;
    const totalDiv = document.createElement("div");
    totalDiv.className = `expense-item category-total ${allPaid ? "paid" : ""}`;
    totalDiv.innerHTML = `
            <div class="expense-info">
                <div class="expense-name" style="font-weight: 600;">Totalt</div>
            </div>
            <div class="expense-amount" style="font-weight: 600;">${categoryTotal.toLocaleString(
              "sv-SE"
            )} kr</div>
        `;
    categoryList.appendChild(totalDiv);

    container.appendChild(categoryList);
  });
}

function togglePayment(month, expenseIndex, checkbox) {
  if (!budgetData.monthlyStatus[month]) {
    budgetData.monthlyStatus[month] = {};
  }

  budgetData.monthlyStatus[month][expenseIndex] = checkbox.checked;

  // Update visual state
  const expenseItem = checkbox.closest(".expense-item");
  if (checkbox.checked) {
    expenseItem.classList.add("paid");
  } else {
    expenseItem.classList.remove("paid");
  }

  saveData();
  // Refresh the view so "Kvar att betala" row and total row update
  updateMonthlyView();
}

function togglePaymentFromCheckbox(month, expenseIndex, checkbox) {
  togglePayment(month, expenseIndex, checkbox);
}

function resetCurrentMonth() {
  if (confirm("Vill du återställa alla checkboxar?")) {
    budgetData.monthlyStatus["current"] = {};
    updateMonthlyView();
    saveData();
  }
}

/* ================================= */
/* BUDGET/VARIABLE EXPENSES VIEW */
/* ================================= */

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

function updateBudgetView() {
  // Update month display
  const now = new Date();
  const monthName = months[now.getMonth()];
  const monthDisplay = document.getElementById("currentMonth");
  if (monthDisplay) {
    monthDisplay.textContent = `${monthName} ${now.getFullYear()}`;
  }

  const monthKey = getCurrentMonthKey();
  const container = document.getElementById("variableExpensesContainer");
  container.innerHTML = "";

  if (budgetData.variableExpenses.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <p>Inga varierande utgifter än.</p>
                <p class="empty-state-hint">Lägg till kategorier i Inställningar</p>
            </div>
        `;
    updateBudgetSummary();
    return;
  }

  budgetData.variableExpenses.forEach((expense, index) => {
    const transactions =
      budgetData.variableExpenseTransactions[monthKey]?.[expense.name] || [];
    const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = expense.budget - spent;
    const percentage = Math.min((spent / expense.budget) * 100, 100);

    const isOverBudget = spent > expense.budget;
    const progressColor = isOverBudget
      ? "var(--system-red)"
      : percentage > 80
      ? "var(--system-orange)"
      : "var(--system-green)";

    const card = document.createElement("div");
    card.className = "variable-expense-card";
    card.innerHTML = `
            <div class="variable-expense-header">
                <h3>${expense.name}</h3>
                <button class="add-expense-btn" onclick="showAddExpensePrompt(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>
            <div class="variable-expense-stats">
                <div class="stat-row">
                    <span class="stat-label">Budget</span>
                    <span class="stat-value">${expense.budget.toLocaleString(
                      "sv-SE"
                    )} kr</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Använt</span>
                    <span class="stat-value spent">${spent.toLocaleString(
                      "sv-SE"
                    )} kr</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Kvar</span>
                    <span class="stat-value ${
                      isOverBudget ? "over-budget" : "remaining"
                    }">${remaining.toLocaleString("sv-SE")} kr</span>
                </div>
            </div>
            <div class="variable-progress-bar">
                <div class="variable-progress-fill" style="width: ${percentage}%; background: ${progressColor};"></div>
            </div>
            ${
              transactions.length > 0
                ? `
                <div class="transactions-toggle" onclick="toggleTransactions(${index})">
                    <span>Transaktioner (${transactions.length})</span>
                    <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="transactions-list" id="transactions-${index}" style="display: none;">
                    ${transactions
                      .map(
                        (t, tIndex) => `
                        <div class="transaction-item">
                            <div class="transaction-info">
                                <span class="transaction-note">${
                                  t.note || "Utgift"
                                }</span>
                                <span class="transaction-date">${new Date(
                                  t.date
                                ).toLocaleDateString("sv-SE", {
                                  month: "short",
                                  day: "numeric",
                                })}</span>
                            </div>
                            <div class="transaction-amount">${t.amount.toLocaleString(
                              "sv-SE"
                            )} kr</div>
                            <button class="delete-transaction-btn" onclick="deleteTransaction(${index}, ${tIndex})">×</button>
                        </div>
                    `
                      )
                      .reverse()
                      .join("")}
                </div>
            `
                : ""
            }
        `;
    container.appendChild(card);
  });

  updateBudgetSummary();
}

function updateBudgetSummary() {
  const monthKey = getCurrentMonthKey();
  let totalBudget = 0;
  let totalSpent = 0;

  budgetData.variableExpenses.forEach((expense) => {
    totalBudget += expense.budget;
    const transactions =
      budgetData.variableExpenseTransactions[monthKey]?.[expense.name] || [];
    totalSpent += transactions.reduce((sum, t) => sum + t.amount, 0);
  });

  const totalRemaining = totalBudget - totalSpent;
  const totalPercentage =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  document.getElementById("totalBudget").textContent =
    totalBudget.toLocaleString("sv-SE") + " kr";
  document.getElementById("totalSpent").textContent =
    totalSpent.toLocaleString("sv-SE") + " kr";
  document.getElementById("totalRemaining").textContent =
    totalRemaining.toLocaleString("sv-SE") + " kr";

  const progressBar = document.getElementById("totalProgress");
  progressBar.style.width = totalPercentage + "%";

  const isOverBudget = totalSpent > totalBudget;
  progressBar.style.background = isOverBudget
    ? "var(--system-red)"
    : totalPercentage > 80
    ? "var(--system-orange)"
    : "var(--system-green)";

  // Also add the totalBudget to the normal fixed expenses
}

function showAddExpensePrompt(expenseIndex) {
  const expense = budgetData.variableExpenses[expenseIndex];
  const amount = prompt(
    `Lägg till utgift för ${expense.name}:\n\nAnge belopp (kr):`
  );

  if (amount === null) return; // Cancelled

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    alert("Vänligen ange ett giltigt belopp.");
    return;
  }

  const note = prompt(`Anteckning (valfritt):`);

  const monthKey = getCurrentMonthKey();
  if (!budgetData.variableExpenseTransactions[monthKey]) {
    budgetData.variableExpenseTransactions[monthKey] = {};
  }
  if (!budgetData.variableExpenseTransactions[monthKey][expense.name]) {
    budgetData.variableExpenseTransactions[monthKey][expense.name] = [];
  }

  budgetData.variableExpenseTransactions[monthKey][expense.name].push({
    amount: amountNum,
    note: note || "",
    date: new Date().toISOString(),
  });

  saveData();
  updateBudgetView();
}

function toggleTransactions(expenseIndex) {
  const transactionsList = document.getElementById(
    `transactions-${expenseIndex}`
  );
  const isHidden = transactionsList.style.display === "none";
  transactionsList.style.display = isHidden ? "block" : "none";

  // Rotate chevron
  const toggle = transactionsList.previousElementSibling;
  const chevron = toggle.querySelector(".chevron");
  chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
}

function deleteTransaction(expenseIndex, transactionIndex) {
  if (!confirm("Ta bort denna transaktion?")) return;

  const monthKey = getCurrentMonthKey();
  const expense = budgetData.variableExpenses[expenseIndex];
  const transactions =
    budgetData.variableExpenseTransactions[monthKey][expense.name];

  // ÄNDRING: Vi tar bort den komplicerade uträkningen och använder rätt index direkt.
  transactions.splice(transactionIndex, 1);

  saveData();
  updateBudgetView();
}

/* ================================= */
/* SETTINGS VIEW COMPONENTS */
/* ================================= */

function updateSettingsView() {
  updateCategoryDropdown();
  updateCategoryList();
  updateIncomeList();
  updateExpensesList();
  updateVariableExpensesList();
  updateDebtList();
}

function updateCategoryDropdown() {
  const categorySelect = document.getElementById("newExpenseCategory");
  categorySelect.innerHTML = "";
  budgetData.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function updateCategoryList() {
  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = "";
  budgetData.categories.forEach((category, index) => {
    const div = document.createElement("div");
    div.className = "category-item";
    div.innerHTML = `
            <span>${category}</span>
            <button class="delete-btn" onclick="deleteCategory(${index})">Ta bort</button>
        `;
    categoryList.appendChild(div);
  });
}

function updateIncomeList() {
  const incomeList = document.getElementById("incomeList");
  incomeList.innerHTML = "";
  budgetData.income.forEach((income, index) => {
    const div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${income.name}</div>
            </div>
            <div class="expense-amount" style="color: var(--system-green)">${income.amount.toLocaleString(
              "sv-SE"
            )} kr</div>
            <button class="delete-btn" onclick="deleteIncome(${index})">Ta bort</button>
        `;
    incomeList.appendChild(div);
  });
}

function updateVariableExpensesList() {
  const variableExpensesList = document.getElementById("variableExpensesList");
  variableExpensesList.innerHTML = "";

  if (budgetData.variableExpenses.length === 0) {
    variableExpensesList.innerHTML =
      '<p style="color: var(--text-tertiary); font-size: 14px; padding: 12px;">Inga varierande utgifter ännu</p>';
    return;
  }

  budgetData.variableExpenses.forEach((expense, index) => {
    const div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${expense.name}</div>
            </div>
            <div class="expense-amount">${expense.budget.toLocaleString(
              "sv-SE"
            )} kr</div>
            <button class="delete-btn" onclick="deleteVariableExpense(${index})">Ta bort</button>
        `;
    variableExpensesList.appendChild(div);
  });
}

function updateDebtList() {
  const debtsList = document.getElementById("debtsList");
  if (!debtsList) return;
  debtsList.innerHTML = "";

  if (!budgetData.debts || budgetData.debts.length === 0) {
    debtsList.innerHTML =
      '<p style="color: var(--text-tertiary); font-size: 14px; padding: 12px;">Inga skulder registrerade</p>';
    return;
  }

  budgetData.debts.forEach((d, index) => {
    const div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${d.name}</div>
            </div>
            <div class="expense-amount">${d.amount.toLocaleString("sv-SE")} kr</div>
            <button class="delete-btn" onclick="deleteDebt(${index})">Ta bort</button>
        `;
    debtsList.appendChild(div);
  });
}

// Add a payment to a debt (index refers to position in budgetData.debts)
function addPaymentToDebt(index) {
  // legacy compatibility: previously used prompt; now we open modal
  openDebtPaymentModal(index);
}

function renderPaymentsForDebtAtIndex(index) {
  const debt = budgetData.debts[index];
  const container = document.getElementById(`payments-for-${debt.id}`);
  if (!container) return;
  container.innerHTML = '';
  const payments = (budgetData.debtPayments && budgetData.debtPayments[debt.id]) || [];
  if (payments.length === 0) return;

  payments.slice().reverse().forEach((p, i) => {
    // show newest first; compute actual index
    const realIndex = payments.length - 1 - i;
    const div = document.createElement('div');
    div.className = 'payment-item';
    div.innerHTML = `
      <div class="payment-info">
        <span class="payment-amount">${p.amount.toLocaleString('sv-SE')} kr</span>
        <span class="payment-date">${new Date(p.date).toLocaleDateString('sv-SE')}</span>
      </div>
      <div class="payment-actions">
        <button onclick="startEditPaymentInline(${index}, ${realIndex}, this)">Ändra</button>
        <button onclick="deleteDebtPayment(${index}, ${realIndex})">Ta bort</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function addPaymentInline(debtIndex, button) {
  const form = button.closest('.expense-edit-form');
  const amountInput = form.querySelector('.debt-pay-amount');
  const amount = parseFloat((amountInput.value || '').toString().replace(',', '.'));
  if (isNaN(amount) || amount <= 0) { alert('Ange ett giltigt belopp'); return; }

  const debt = budgetData.debts[debtIndex];
  if (!debt) return;

  budgetData.debtPayments = budgetData.debtPayments || {};
  if (!budgetData.debtPayments[debt.id]) budgetData.debtPayments[debt.id] = [];
  budgetData.debtPayments[debt.id].push({ amount, date: new Date().toISOString() });

  debt.amount = Math.max(0, debt.amount - amount);

  saveData();
  updateDebtSummaryComponent();
}

function startEditPaymentInline(debtIndex, paymentIndex, button) {
  // Replace payment row with inline edit controls
  const debt = budgetData.debts[debtIndex];
  const container = document.getElementById(`payments-for-${debt.id}`);
  if (!container) return;
  const payments = budgetData.debtPayments[debt.id] || [];
  const payment = payments[paymentIndex];
  if (!payment) return;

  // Find the DOM node for this payment (payments are rendered newest-first)
  const items = Array.from(container.querySelectorAll('.payment-item'));
  const domIndex = items.length - 1 - paymentIndex; // reverse mapping
  const node = items[domIndex];
  if (!node) return;

  // Create edit UI
  const editDiv = document.createElement('div');
  editDiv.className = 'payment-item edit-inline';
  editDiv.innerHTML = `
    <div class="payment-info">
      <input type="number" class="edit-payment-amount" value="${payment.amount}" min="0" step="0.01">
    </div>
    <div class="payment-actions">
      <button onclick="saveEditedPaymentInline(${debtIndex}, ${paymentIndex}, this)">Spara</button>
      <button onclick="cancelEditPaymentInline(${debtIndex}, ${paymentIndex})">Avbryt</button>
    </div>
  `;

  node.replaceWith(editDiv);
}

function saveEditedPaymentInline(debtIndex, paymentIndex, button) {
  const editDiv = button.closest('.edit-inline');
  const input = editDiv.querySelector('.edit-payment-amount');
  const newAmount = parseFloat((input.value || '').toString().replace(',', '.'));
  if (isNaN(newAmount) || newAmount <= 0) { alert('Ange ett giltigt belopp'); return; }

  const debt = budgetData.debts[debtIndex];
  const payments = budgetData.debtPayments[debt.id] || [];
  const p = payments[paymentIndex];
  if (!p) return;

  const delta = newAmount - p.amount;
  // Apply delta to debt amount (reduce debt by delta)
  debt.amount = Math.max(0, debt.amount - delta);

  p.amount = newAmount;
  p.date = new Date().toISOString();

  saveData();
  updateDebtSummaryComponent();
}

function cancelEditPaymentInline(debtIndex, paymentIndex) {
  // simply re-render the payments for this debt
  renderPaymentsForDebtAtIndex(debtIndex);
}

function cancelDebtEdit(button) {
  const editForm = button.closest('.expense-edit-form');
  if (!editForm) return;
  editForm.style.display = 'none';
  const prev = editForm.previousElementSibling;
  if (prev && prev.classList) prev.classList.remove('editing');
}

function openDebtPaymentModal(debtIndex, paymentIndex = null) {
  const modal = document.getElementById('debtPaymentModal');
  const title = document.getElementById('debtPaymentModalTitle');
  const amountInput = document.getElementById('paymentAmount');
  const noteInput = document.getElementById('paymentNote');
  const idxHidden = document.getElementById('_debtModalIndex');
  const pHidden = document.getElementById('_debtModalPaymentIndex');

  const debt = budgetData.debts[debtIndex];
  if (!debt) return;

  idxHidden.value = debtIndex;
  pHidden.value = paymentIndex === null ? '' : paymentIndex;

  if (paymentIndex === null || paymentIndex === '') {
    title.textContent = `Betala ${debt.name}`;
    amountInput.value = '';
    noteInput.value = '';
  } else {
    // load existing payment
    const payments = (budgetData.debtPayments && budgetData.debtPayments[debt.id]) || [];
    const p = payments[paymentIndex];
    if (!p) return;
    title.textContent = `Redigera betalning - ${debt.name}`;
    amountInput.value = p.amount;
    noteInput.value = p.note || '';
  }

  // Lock scroll (use same approach as settings modal)
  const scrollY = window.scrollY;
  document.body.dataset.scrollY = scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  modal.style.display = 'block';
}

function closeDebtPaymentModal() {
  const modal = document.getElementById('debtPaymentModal');
  const idxHidden = document.getElementById('_debtModalIndex');
  const pHidden = document.getElementById('_debtModalPaymentIndex');
  const amountInput = document.getElementById('paymentAmount');
  const noteInput = document.getElementById('paymentNote');
  modal.style.display = 'none';
  // restore scroll
  const scrollY = document.body.dataset.scrollY || 0;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, parseInt(scrollY || '0'));
  idxHidden.value = '';
  pHidden.value = '';
  amountInput.value = '';
  noteInput.value = '';
  const validation = document.getElementById('paymentValidation');
  if (validation) { validation.style.display = 'none'; validation.textContent = ''; }
}

function saveDebtPayment() {
  const idxHidden = document.getElementById('_debtModalIndex');
  const pHidden = document.getElementById('_debtModalPaymentIndex');
  const amountInput = document.getElementById('paymentAmount');
  const noteInput = document.getElementById('paymentNote');

  const debtIndex = parseInt(idxHidden.value);
  const paymentIndex = pHidden.value === '' ? null : parseInt(pHidden.value);
  const amount = parseFloat((amountInput.value || '').toString().replace(',', '.'));
  const note = noteInput.value || '';

  const validation = document.getElementById('paymentValidation');
  if (isNaN(debtIndex) || !budgetData.debts[debtIndex]) { if (validation) { validation.textContent = 'Ogiltig skuld'; validation.style.display='block'; } return; }
  if (isNaN(amount) || amount <= 0) { if (validation) { validation.textContent = 'Ange ett giltigt belopp'; validation.style.display='block'; } return; }

  const debt = budgetData.debts[debtIndex];
  budgetData.debtPayments = budgetData.debtPayments || {};
  if (!budgetData.debtPayments[debt.id]) budgetData.debtPayments[debt.id] = [];
  const payments = budgetData.debtPayments[debt.id];

  if (paymentIndex === null) {
    // add new payment
    payments.push({ amount, note, date: new Date().toISOString() });
    debt.amount = Math.max(0, debt.amount - amount);
  } else {
    // edit existing payment: compute delta
    const old = payments[paymentIndex];
    if (!old) { alert('Ogiltig betalning'); return; }
    const delta = amount - old.amount;
    // apply delta to debt (reverse old then apply new)
    debt.amount = Math.max(0, debt.amount - delta);
    old.amount = amount;
    old.note = note;
    old.date = new Date().toISOString();
  }

  saveData();
  updateDebtSummaryComponent();
  updateSettingsView();
  closeDebtPaymentModal();
}

function deleteDebtPayment(debtIndex, paymentIndex) {
  const debt = budgetData.debts[debtIndex];
  if (!debt) return;
  const payments = budgetData.debtPayments[debt.id] || [];
  if (!payments[paymentIndex]) return;
  if (!confirm('Ta bort denna betalning?')) return;

  // Revert payment amount back to debt
  const p = payments.splice(paymentIndex, 1)[0];
  debt.amount = (debt.amount || 0) + p.amount;

  saveData();
  updateDebtSummaryComponent();
  updateSettingsView();
}

function editDebtPayment(debtIndex, paymentIndex) {
  // replaced by modal-based edit flow; open modal with payment data
  openDebtPaymentModal(debtIndex, paymentIndex);
}

function addDebt() {
  const name = document.getElementById("newDebtName").value.trim();
  const amount = parseInt(document.getElementById("newDebtAmount").value);
  if (!name || !amount || amount <= 0) return;
  budgetData.debts = budgetData.debts || [];
  const id = genId('debt');
  budgetData.debts.push({ id, name, amount });
  // Initialize empty payments array for this debt (keyed by id)
  budgetData.debtPayments = budgetData.debtPayments || {};
  if (!budgetData.debtPayments[id]) budgetData.debtPayments[id] = [];
  document.getElementById("newDebtName").value = "";
  document.getElementById("newDebtAmount").value = "";
  updateSettingsView();
  saveData();
}

function deleteDebt(index) {
  if (!budgetData.debts || !budgetData.debts[index]) return;
  if (!confirm("Är du säker på att du vill ta bort denna skuld?")) return;
  const removed = budgetData.debts.splice(index, 1)[0];
  // remove any payment history keyed by id
  if (removed && removed.id && budgetData.debtPayments) {
    delete budgetData.debtPayments[removed.id];
  }
  updateSettingsView();
  saveData();
}

function updateExpensesList() {
  const expensesList = document.getElementById("expensesList");
  expensesList.innerHTML = "";

  budgetData.categories.forEach((category) => {
    const categoryExpenses = budgetData.expenses.filter(
      (e) => e.category === category
    );
    if (categoryExpenses.length === 0) return;

    // Create category header
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "category-header";
    categoryHeader.style.marginTop = "16px";
    const categoryTitle = document.createElement("h4");
    categoryTitle.textContent = category;
    categoryHeader.appendChild(categoryTitle);
    expensesList.appendChild(categoryHeader);

    // Create category list container
    const categoryList = document.createElement("div");
    categoryList.className = "category-list";

    categoryExpenses.forEach((expense) => {
      const globalIndex = budgetData.expenses.findIndex((e) => e === expense);
      const div = document.createElement("div");
      div.className = "expense-item-wrapper";

      // Main expense row
      const expenseRow = document.createElement("div");
      expenseRow.className = "expense-item editable-expense";
      expenseRow.innerHTML = `
                <div class="expense-info">
                    <div class="expense-name">${expense.name}</div>
                </div>
                <div class="expense-amount">${expense.amount.toLocaleString(
                  "sv-SE"
                )} kr</div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteExpense(${globalIndex})">Ta bort</button>
            `;

      // Edit form (initially hidden)
      const editForm = document.createElement("div");
      editForm.className = "expense-edit-form";
      editForm.style.display = "none";
      editForm.innerHTML = `
                <div class="edit-form-content">
                    <div class="edit-input-group">
                        <label>Namn</label>
                        <input type="text" class="edit-name-input" value="${
                          expense.name
                        }">
                    </div>
                    <div class="edit-input-group">
                        <label>Belopp</label>
                        <input type="number" class="edit-amount-input" value="${
                          expense.amount
                        }">
                    </div>
                    <div class="edit-input-group">
                        <label>Kategori</label>
                        <select class="edit-category-select">
                            ${budgetData.categories
                              .map(
                                (cat) =>
                                  `<option value="${cat}" ${
                                    cat === expense.category ? "selected" : ""
                                  }>${cat}</option>`
                              )
                              .join("")}
                        </select>
                    </div>
                    <div class="edit-actions">
                        <button class="cancel-edit-btn" onclick="cancelEditExpense(this)">Avbryt</button>
                        <button class="save-edit-btn" onclick="saveEditExpense(${globalIndex}, this)">Spara</button>
                    </div>
                </div>
            `;

      // Toggle edit form on row click
      expenseRow.addEventListener("click", function (e) {
        // Don't toggle if clicking delete button
        if (e.target.classList.contains("delete-btn")) return;

        // Close any other open edit forms
        document.querySelectorAll(".expense-edit-form").forEach((form) => {
          if (form !== editForm) {
            form.style.display = "none";
            form.previousElementSibling.classList.remove("editing");
          }
        });

        // Toggle this edit form
        if (editForm.style.display === "none") {
          editForm.style.display = "block";
          expenseRow.classList.add("editing");
        } else {
          editForm.style.display = "none";
          expenseRow.classList.remove("editing");
        }
      });

      div.appendChild(expenseRow);
      div.appendChild(editForm);
      categoryList.appendChild(div);
    });

    expensesList.appendChild(categoryList);
  });
}

/* ================================= */
/* UTILITY FUNCTIONS */
/* ================================= */

// *** NY FUNKTION HÄR ***
function toggleDebtSection() {
  const debtContent = document.getElementById("debtContent");
  const chevron = document.querySelector(".chevron-debt");
  const isHidden = debtContent.style.display === "none";

  debtContent.style.display = isHidden ? "block" : "none";
  chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
}

function updateAllViews() {
  updateOverviewView();
  updateMonthlyView();
  updateBudgetView();
  updateSettingsView();
}

// Setup settings nav button behavior: if already in settings-view, pressing it goes back like breadcrumb.
function setupSettingsButton() {
  const btn = document.querySelector('.nav-action-btn');
  if (!btn) return;
  btn.onclick = function (e) {
    e.preventDefault();
    const settingsView = document.getElementById('settings-view');
    if (settingsView && settingsView.classList.contains('active')) {
      goBackFromSettings();
    } else {
      showView('settings-view', btn);
    }
  };
}

/* ================================= */
/* EVENT HANDLERS & INITIALIZATION */
/* ================================= */

// Close debt payment modal when clicking outside it
window.onclick = function (event) {
  const debtModal = document.getElementById('debtPaymentModal');
  if (debtModal && event.target === debtModal) {
    closeDebtPaymentModal();
  }
};

// Handle escape key for closing debt payment modal
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const debtModal = document.getElementById('debtPaymentModal');
    if (debtModal && debtModal.style.display === 'block') {
      closeDebtPaymentModal();
    }
  }
});

// Prevent zoom on double tap for mobile
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function (event) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);

// Initialize app when DOM is loaded
window.addEventListener("DOMContentLoaded", function () {
  loadData();
  updateOverviewView();
  updateSettingsView();
  // Wire the settings nav button so clicking it while already in settings goes back
  setupSettingsButton();
});
