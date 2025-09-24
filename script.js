/* ================================= */
/* DATA MODEL & STORAGE */
/* ================================= */

let budgetData = {
  income: [],
  expenses: [],
  categories: [],
  monthlyStatus: {},
  debtStatus: {}, // Track paid debt status
};

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
  } else if (viewName === "debts-view") {
    updateDebtsView();
  }
}

/* ================================= */
/* SETTINGS MODAL FUNCTIONS */
/* ================================= */

function openSettings() {
  document.getElementById("settingsModal").style.display = "block";
  // Prevent background scrolling
  document.body.style.overflow = "hidden";
  updateSettingsView();
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
  // Restore background scrolling
  document.body.style.overflow = "auto";
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

/* ================================= */
/* OVERVIEW VIEW COMPONENTS */
/* ================================= */

function updateOverviewView() {
  updateSummaryCards();
  updateChartComponent();
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

  // Filter out debts from chart
  const expenses = budgetData.expenses
    .filter((expense) => expense.category !== "Skulder")
    .map((expense) => ({ ...expense }));

  if (expenses.length === 0) {
    if (window.budgetChart) {
      window.budgetChart.destroy();
    }
    return;
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Group small expenses together
  const threshold = total * 0.03; // 3% threshold
  const mainExpenses = [];
  let otherTotal = 0;
  const otherItems = [];

  expenses.forEach((expense) => {
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

// function updateDebtSummaryComponent() {
//   const debts = budgetData.expenses.filter((e) => e.category === "Skulder");
//   const debtComponent = document.getElementById("debtSummaryComponent");
//   const debtList = document.getElementById("debtList");
//   const debtTotalContainer = document.getElementById("debtTotalContainer");

//   if (debts.length === 0) {
//     debtComponent.style.display = "none";
//     return;
//   }

//   debtComponent.style.display = "block";
//   debtList.innerHTML = "";

//   debts.sort((a, b) => a.amount - b.amount);

//   let totalDebt = 0;
//   debts.forEach((debt) => {
//     totalDebt += debt.amount;
//     const div = document.createElement("div");
//     div.className = "expense-item";
//     div.innerHTML = `
//             <div class="expense-info">
//                 <div class="expense-name">${debt.name}</div>
//             </div>
//             <div class="expense-amount">${debt.amount.toLocaleString(
//               "sv-SE"
//             )} kr</div>
//         `;
//     debtList.appendChild(div);
//   });

//   debtTotalContainer.innerHTML = `
//         <span>Totalt</span>
//         <span>${totalDebt.toLocaleString("sv-SE")} kr</span>
//     `;
// }

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
/* DEBTS VIEW COMPONENTS */
/* ================================= */

function updateDebtsView() {
  const debts = budgetData.expenses.filter((e) => e.category === "Skulder");
  const debtComponent = document.getElementById("debtDisplayComponent");
  const debtList = document.getElementById("debtListFull");
  const debtTotalContainer = document.getElementById("debtTotalContainerFull");

  if (debts.length === 0) {
    debtComponent.style.display = "none";
    return;
  }

  debtComponent.style.display = "block";
  debtList.innerHTML = "";

  // Sort debts from low to high amount
  debts.sort((a, b) => a.amount - b.amount);

  let totalDebt = 0;
  let remainingDebt = 0;

  debts.forEach((debt) => {
    const globalIndex = budgetData.expenses.findIndex((e) => e === debt);
    const isPaid = budgetData.debtStatus[globalIndex] || false;

    totalDebt += debt.amount;
    if (!isPaid) {
      remainingDebt += debt.amount;
    }

    const div = document.createElement("div");
    div.className = `expense-item ${isPaid ? "paid" : ""}`;
    div.style.cursor = "pointer";
    div.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${debt.name}</div>
            </div>
            <div class="expense-amount">${debt.amount.toLocaleString(
              "sv-SE"
            )} kr</div>
            <div class="debt-actions">
                <input type="checkbox" class="checkbox" ${
                  isPaid ? "checked" : ""
                } 
                       onchange="toggleDebtPayment(${globalIndex}, this)">
                ${
                  isPaid
                    ? `<button class="remove-debt-btn" onclick="removeDebt(${globalIndex})">Ta bort</button>`
                    : ""
                }
            </div>
        `;

    // Add click handler to toggle debt payment when clicking on the debt item
    div.addEventListener("click", function (e) {
      // Don't trigger if clicking on checkbox or remove button
      if (
        e.target.type !== "checkbox" &&
        !e.target.classList.contains("remove-debt-btn")
      ) {
        const checkbox = div.querySelector(".checkbox");
        if (!checkbox.checked) {
          // Only show confirm dialog when checking (paying), not unchecking
          if (
            confirm(
              `Är du säker på att du har betalat skulden "${
                debt.name
              }" (${debt.amount.toLocaleString("sv-SE")} kr)?`
            )
          ) {
            checkbox.checked = true;
            toggleDebtPayment(globalIndex, checkbox);
          }
        } else {
          // Allow unchecking without confirmation
          checkbox.checked = false;
          toggleDebtPayment(globalIndex, checkbox);
        }
      }
    });

    debtList.appendChild(div);
  });

  debtTotalContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
                <span>Totalt</span>
                <span>${totalDebt.toLocaleString("sv-SE")} kr</span>
            </div>
            ${
              remainingDebt !== totalDebt
                ? `
                <div style="display: flex; justify-content: space-between; width: 100%; font-size: 14px; opacity: 0.8;">
                    <span>Kvar att betala</span>
                    <span>${remainingDebt.toLocaleString("sv-SE")} kr</span>
                </div>
            `
                : ""
            }
        </div>
    `;
}

function toggleDebtPayment(debtIndex, checkbox) {
  budgetData.debtStatus[debtIndex] = checkbox.checked;

  // Update visual state
  const expenseItem = checkbox.closest(".expense-item");
  if (checkbox.checked) {
    expenseItem.classList.add("paid");
    // Add remove button if it doesn't exist
    const actionsDiv = expenseItem.querySelector(".debt-actions");
    if (!actionsDiv.querySelector(".remove-debt-btn")) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-debt-btn";
      removeBtn.textContent = "Ta bort";
      removeBtn.onclick = () => removeDebt(debtIndex);
      actionsDiv.appendChild(removeBtn);
    }
  } else {
    expenseItem.classList.remove("paid");
    // Remove the remove button
    const removeBtn = expenseItem.querySelector(".remove-debt-btn");
    if (removeBtn) {
      removeBtn.remove();
    }
  }

  // Update the total display
  updateDebtsView();
  saveData();
}

function removeDebt(debtIndex) {
  const debt = budgetData.expenses[debtIndex];
  if (
    confirm(`Vill du permanent ta bort skulden "${debt.name}" från listan?`)
  ) {
    // Remove from expenses array
    budgetData.expenses.splice(debtIndex, 1);

    // Clean up debt status - need to adjust indices for remaining debts
    const newDebtStatus = {};
    Object.keys(budgetData.debtStatus).forEach((index) => {
      const oldIndex = parseInt(index);
      if (oldIndex < debtIndex) {
        newDebtStatus[oldIndex] = budgetData.debtStatus[oldIndex];
      } else if (oldIndex > debtIndex) {
        newDebtStatus[oldIndex - 1] = budgetData.debtStatus[oldIndex];
      }
      // Skip the removed debt index
    });
    budgetData.debtStatus = newDebtStatus;

    // Update all views
    updateAllViews();
    saveData();
  }
}

/* ================================= */
/* SETTINGS VIEW COMPONENTS */
/* ================================= */

function updateSettingsView() {
  updateCategoryDropdown();
  updateCategoryList();
  updateIncomeList();
  updateExpensesList();
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
    const categoryTitle = document.createElement("h3");
    categoryTitle.textContent = category;
    categoryHeader.appendChild(categoryTitle);
    expensesList.appendChild(categoryHeader);

    // Create category list container
    const categoryList = document.createElement("div");
    categoryList.className = "category-list";

    categoryExpenses.forEach((expense) => {
      const globalIndex = budgetData.expenses.findIndex((e) => e === expense);
      const div = document.createElement("div");
      div.className = "expense-item";
      div.innerHTML = `
                <div class="expense-info">
                    <div class="expense-name">${expense.name}</div>
                </div>
                <div class="expense-amount">${expense.amount.toLocaleString(
                  "sv-SE"
                )} kr</div>
                <button class="delete-btn" onclick="deleteExpense(${globalIndex})">Ta bort</button>
            `;
      categoryList.appendChild(div);
    });

    expensesList.appendChild(categoryList);
  });
}

/* ================================= */
/* UTILITY FUNCTIONS */
/* ================================= */

function updateAllViews() {
  updateOverviewView();
  updateMonthlyView();
  updateDebtsView();
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
