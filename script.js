/* ================================= */
/* DATA MODEL & STORAGE */
/* ================================= */

let budgetData = {
  income: [],
  expenses: [],
  categories: [],
  monthlyStatus: {},
  debtStatus: {}, // Track paid debt status
  variableExpenses: [], // New: variable expense categories
  variableExpenseTransactions: {}, // New: track spending per category per month
};

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

// Load data from localStorage
function loadData() {
  const saved = localStorage.getItem("budgetApp");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.income) budgetData.income = parsed.income;
      if (parsed.expenses) budgetData.expenses = parsed.expenses;
      if (parsed.categories) budgetData.categories = parsed.categories;
      if (parsed.monthlyStatus) budgetData.monthlyStatus = parsed.monthlyStatus;
      if (parsed.debtStatus) budgetData.debtStatus = parsed.debtStatus;
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
          saveData();
          updateAllViews();
          closeSettings();
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

/* ================================= */
/* VIEW NAVIGATION SYSTEM */
/* ================================= */

function showView(viewName, button) {
  // Update view visibility
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document.getElementById(viewName).classList.add("active");

  // Update tab button states
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  if (button) button.classList.add("active");

  // Update view content based on which view is shown
  if (viewName === "overview-view") {
    updateOverviewView();
  } else if (viewName === "monthly-view") {
    updateMonthlyView();
  } else if (viewName === "budget-view") {
    updateBudgetView();
  }
}

/* ================================= */
/* SETTINGS MODAL FUNCTIONS */
/* ================================= */

function openSettings() {
  document.getElementById("settingsModal").style.display = "block";
  // Prevent background scrolling on iOS-friendly way
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  updateSettingsView();
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
  // Restore background scrolling and position
  const scrollY = document.body.style.top;
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, parseInt(scrollY || "0") * -1);
  // Refresh all views to show any changes made in settings
  updateAllViews();
}

/* ================================= */
/* CATEGORY MANAGEMENT */
/* ================================= */

function addCategory() {
  const name = document.getElementById("newCategoryName").value.trim();
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

  if (name && amount && amount > 0 && category) {
    budgetData.expenses.push({ name, amount, category });
    document.getElementById("newExpenseName").value = "";
    document.getElementById("newExpenseAmount").value = "";
    updateSettingsView();
    updateOverviewView();
    saveData();
  }
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
  const chartExpenses = budgetData.expenses
    .filter((expense) => expense.category !== "Skulder")
    .map((expense) => ({ ...expense })); // Använd map för att skapa en kopia

  // 5. Lägg till den rörliga posten i listan, nu med det dynamiska beloppet.
  if (amountForChart > 0) {
    chartExpenses.push({
      name: "Rörliga Utgifter", // Ändrat namn för att passa båda fallen
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
      name: `Övrigt (${otherItems.length} poster)`,
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

  if (budgetData.variableExpenses.length === 0) {
    miniContainer.style.display = "none";
    return;
  }

  miniContainer.style.display = "block";
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
  const debts = budgetData.expenses.filter((e) => e.category === "Skulder");
  const debtComponent = document.getElementById("debtSummaryComponent");
  const debtList = document.getElementById("debtList");
  const debtTotalContainer = document.getElementById("debtTotalContainer");
  const debtQuickTotal = document.getElementById("debtQuickTotal");

  if (debts.length === 0) {
    debtComponent.style.display = "none";
    return;
  }

  debtComponent.style.display = "block";
  debtList.innerHTML = "";

  let totalDebt = 0;
  debts.forEach((debt) => {
    totalDebt += debt.amount;
    const div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${debt.name}</div>
            </div>
            <div class="expense-amount">${debt.amount.toLocaleString(
              "sv-SE"
            )} kr</div>
        `;
    debtList.appendChild(div);
  });

  // Also update the quick total in the header
  debtQuickTotal.textContent = totalDebt.toLocaleString("sv-SE") + " kr";

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
    (category) => category !== "Skulder"
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

    categoryExpenses.forEach((expense) => {
      const globalIndex = budgetData.expenses.findIndex((e) => e === expense);
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
                       onchange="togglePayment('current', ${globalIndex}, this)">
            `;

      // Add click handler to toggle checkbox when clicking on the expense item
      expenseDiv.addEventListener("click", function (e) {
        // Don't trigger if clicking directly on the checkbox
        if (e.target.type !== "checkbox") {
          const checkbox = expenseDiv.querySelector(".checkbox");
          checkbox.checked = !checkbox.checked;
          togglePayment("current", globalIndex, checkbox);
        }
      });

      categoryList.appendChild(expenseDiv);
    });

    // Calculate total for this category
    const categoryTotal = categoryExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Create total row
    const totalDiv = document.createElement("div");
    totalDiv.className = "expense-item category-total";
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

/* ================================= */
/* EVENT HANDLERS & INITIALIZATION */
/* ================================= */

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("settingsModal");
  if (event.target === modal) {
    closeSettings();
  }
};

// Handle escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const modal = document.getElementById("settingsModal");
    if (modal.style.display === "block") {
      closeSettings();
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
});
