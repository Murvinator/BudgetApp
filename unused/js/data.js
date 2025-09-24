// js/data.js

// Appens "state" eller minne. All data lagras här.
export let budgetData = {
  income: [],
  expenses: [],
  categories: [],
  monthlyStatus: {},
};

// --- Kärnfunktioner för datahantering ---

export function loadData() {
  const saved = localStorage.getItem("budgetApp");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ersätt nuvarande data med den laddade datan
      if (parsed.income) budgetData.income = parsed.income;
      if (parsed.expenses) budgetData.expenses = parsed.expenses;
      if (parsed.categories) budgetData.categories = parsed.categories;
      if (parsed.monthlyStatus) budgetData.monthlyStatus = parsed.monthlyStatus;
    } catch (e) {
      console.error("Kunde inte ladda sparad data:", e);
    }
  }
}

// Save data to localStorage
export function saveData() {
  localStorage.setItem("budgetApp", JSON.stringify(budgetData));
}

// --- Funktioner som modifierar datan ---

export function addIncome(name, amount) {
  budgetData.income.push({ name, amount });
  saveData();
}

export function deleteIncome(index) {
  budgetData.income.splice(index, 1);
  saveData();
}

export function addExpense(name, amount, category) {
  budgetData.expenses.push({ name, amount, category });
  saveData();
}

export function deleteExpense(index) {
  budgetData.expenses.splice(index, 1);
  saveData();
}

export function addCategory(name) {
  if (!budgetData.categories.includes(name)) {
    budgetData.categories.push(name);
    saveData();
  }
}

export function deleteCategory(index) {
  const categoryToDelete = budgetData.categories[index];
  const firstCategory = budgetData.categories[0];

  // Flytta utgifter till den första kategorin
  budgetData.expenses.forEach((expense) => {
    if (expense.category === categoryToDelete) {
      expense.category = firstCategory;
    }
  });

  budgetData.categories.splice(index, 1);
  saveData();
}

export function togglePayment(month, expenseIndex, isChecked) {
  if (!budgetData.monthlyStatus[month]) {
    budgetData.monthlyStatus[month] = {};
  }
  budgetData.monthlyStatus[month][expenseIndex] = isChecked;
  saveData();
}

export function resetCurrentMonth() {
  budgetData.monthlyStatus["current"] = {};
  saveData();
}

export function importJSON(importedData) {
  budgetData.income = importedData.income || [];
  budgetData.expenses = importedData.expenses || [];
  budgetData.categories = importedData.categories || [];
  budgetData.monthlyStatus = importedData.monthlyStatus || {};
  saveData();
}
