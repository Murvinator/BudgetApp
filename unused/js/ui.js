// js/ui.js
import { budgetData } from "./data.js";
import { updateChart } from "./chart.js";

// --- Modalfunktioner ---
export function openSettings() {
  document.getElementById("settingsModal").style.display = "block";
}

export function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

// --- Vy-specifika uppdateringar ---

export function showSection(sectionName, button) {
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(sectionName).classList.add("active");

  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  if (button) button.classList.add("active");
}

function updateDebtSection() {
  const debts = budgetData.expenses.filter((e) => e.category === "Skulder");
  const debtSection = document.getElementById("debtSection");
  const debtList = document.getElementById("debtList");
  const debtTotalContainer = document.getElementById("debtTotalContainer");

  if (debts.length === 0) {
    debtSection.style.display = "none";
    return;
  }

  debtSection.style.display = "block";
  debtList.innerHTML = "";
  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);

  debts.forEach((debt) => {
    const div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML = `
            <div class="expense-info"><div class="expense-name">${
              debt.name
            }</div></div>
            <div class="expense-amount">${debt.amount.toLocaleString(
              "sv-SE"
            )} kr</div>`;
    debtList.appendChild(div);
  });

  debtTotalContainer.innerHTML = `
        <span>Totalt</span>
        <span>${totalDebt.toLocaleString("sv-SE")} kr</span>`;
}

export function updateOverview() {
  const totalIncome = budgetData.income.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const expenses = budgetData.expenses
    .filter((e) => e.category !== "Skulder")
    .reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalIncome - expenses;

  document.getElementById(
    "totalIncome"
  ).textContent = `${totalIncome.toLocaleString("sv-SE")} kr`;
  document.getElementById("expenses").textContent = `${expenses.toLocaleString(
    "sv-SE"
  )} kr`;
  document.getElementById(
    "remaining"
  ).textContent = `${remaining.toLocaleString("sv-SE")} kr`;

  updateChart(budgetData.expenses);
  updateDebtSection();
}

export function updateMonthlyView(callbacks) {
  const { onTogglePayment } = callbacks;
  const container = document.getElementById("monthlyExpenses");
  container.innerHTML = "";

  budgetData.categories.forEach((category) => {
    const categoryExpenses = budgetData.expenses.filter(
      (e) => e.category === category
    );
    if (categoryExpenses.length === 0) return;

    categoryExpenses.sort((a, b) => b.amount - a.amount);

    container.innerHTML += `<div class="category-header"><h3>${category}</h3></div>`;
    const categoryList = document.createElement("div");
    categoryList.className = "category-list";

    categoryExpenses.forEach((expense) => {
      const globalIndex = budgetData.expenses.findIndex((e) => e === expense);
      const isPaid = budgetData.monthlyStatus["current"]?.[globalIndex];

      const expenseDiv = document.createElement("div");
      expenseDiv.className = `expense-item ${isPaid ? "paid" : ""}`;
      expenseDiv.innerHTML = `
        <div class="expense-info"><div class="expense-name">${
          expense.name
        }</div></div>
        <div class="expense-amount">${expense.amount.toLocaleString(
          "sv-SE"
        )} kr</div>
        <input type="checkbox" class="checkbox" ${isPaid ? "checked" : ""}>`;

      expenseDiv.querySelector(".checkbox").onchange = (e) =>
        onTogglePayment("current", globalIndex, e.target.checked, e.target);
      categoryList.appendChild(expenseDiv);
    });

    const categoryTotal = categoryExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    categoryList.innerHTML += `
      <div class="expense-item category-total">
        <div class="expense-info"><div class="expense-name" style="font-weight: 600;">Totalt</div></div>
        <div class="expense-amount" style="font-weight: 600;">${categoryTotal.toLocaleString(
          "sv-SE"
        )} kr</div>
      </div>`;

    container.appendChild(categoryList);
  });
}

export function updateSettingsView(callbacks) {
  const { onDeleteCategory, onDeleteIncome, onDeleteExpense } = callbacks;

  // Fyll kategoriväljaren
  const categorySelect = document.getElementById("newExpenseCategory");
  categorySelect.innerHTML = budgetData.categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");

  // Fyll kategorilistan
  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = budgetData.categories
    .map(
      (cat, i) => `
    <div class="category-item">
      <span>${cat}</span>
      <button class="delete-btn" data-index="${i}">Ta bort</button>
    </div>`
    )
    .join("");
  categoryList
    .querySelectorAll(".delete-btn")
    .forEach(
      (btn) =>
        (btn.onclick = () => onDeleteCategory(parseInt(btn.dataset.index)))
    );

  // Fyll inkomstlistan
  const incomeList = document.getElementById("incomeList");
  incomeList.innerHTML = budgetData.income
    .map(
      (inc, i) => `
    <div class="expense-item">
      <div class="expense-info"><div class="expense-name">${
        inc.name
      }</div></div>
      <div class="expense-amount" style="color: var(--system-green)">${inc.amount.toLocaleString(
        "sv-SE"
      )} kr</div>
      <button class="delete-btn" data-index="${i}">Ta bort</button>
    </div>`
    )
    .join("");
  incomeList
    .querySelectorAll(".delete-btn")
    .forEach(
      (btn) => (btn.onclick = () => onDeleteIncome(parseInt(btn.dataset.index)))
    );

  // Fyll utgiftslistan
  const expensesList = document.getElementById("expensesList");
  expensesList.innerHTML = "";
  budgetData.categories.forEach((cat) => {
    const catExpenses = budgetData.expenses.filter((e) => e.category === cat);
    if (catExpenses.length === 0) return;

    expensesList.innerHTML += `<div class="category-header" style="margin-top: 16px;"><h3>${cat}</h3></div>`;
    const listContainer = document.createElement("div");
    listContainer.className = "category-list";
    listContainer.innerHTML = catExpenses
      .map((exp) => {
        const globalIndex = budgetData.expenses.findIndex((e) => e === exp);
        return `
        <div class="expense-item">
            <div class="expense-info"><div class="expense-name">${
              exp.name
            }</div></div>
            <div class="expense-amount">${exp.amount.toLocaleString(
              "sv-SE"
            )} kr</div>
            <button class="delete-btn" data-index="${globalIndex}">Ta bort</button>
        </div>`;
      })
      .join("");
    listContainer
      .querySelectorAll(".delete-btn")
      .forEach(
        (btn) =>
          (btn.onclick = () => onDeleteExpense(parseInt(btn.dataset.index)))
      );
    expensesList.appendChild(listContainer);
  });
}

export function updateAllViews(callbacks) {
  updateOverview();
  updateMonthlyView(callbacks);
  updateSettingsView(callbacks);
}
