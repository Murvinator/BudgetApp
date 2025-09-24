// js/main.js
import * as Data from "./data.js";
import * as UI from "./ui.js";

// --- "Handlers" - Funktioner som anropas av händelser ---

function handleAddIncome() {
  const nameInput = document.getElementById("newIncomeName");
  const amountInput = document.getElementById("newIncomeAmount");
  const name = nameInput.value.trim();
  const amount = parseInt(amountInput.value);

  if (name && amount > 0) {
    Data.addIncome(name, amount);
    nameInput.value = "";
    amountInput.value = "";
    UI.updateAllViews(viewCallbacks);
  }
}

function handleAddExpense() {
  const nameInput = document.getElementById("newExpenseName");
  const amountInput = document.getElementById("newExpenseAmount");
  const categorySelect = document.getElementById("newExpenseCategory");
  const name = nameInput.value.trim();
  const amount = parseInt(amountInput.value);
  const category = categorySelect.value;

  if (name && amount > 0 && category) {
    Data.addExpense(name, amount, category);
    nameInput.value = "";
    amountInput.value = "";
    UI.updateAllViews(viewCallbacks);
  }
}

function handleAddCategory() {
  const nameInput = document.getElementById("newCategoryName");
  const name = nameInput.value.trim();
  if (name) {
    Data.addCategory(name);
    nameInput.value = "";
    UI.updateSettingsView(viewCallbacks);
  }
}

function handleDeleteIncome(index) {
  if (confirm("Är du säker på att du vill ta bort denna inkomst?")) {
    Data.deleteIncome(index);
    UI.updateAllViews(viewCallbacks);
  }
}

function handleDeleteExpense(index) {
  if (confirm("Är du säker på att du vill ta bort denna utgift?")) {
    Data.deleteExpense(index);
    UI.updateAllViews(viewCallbacks);
  }
}

function handleDeleteCategory(index) {
  if (Data.budgetData.categories.length === 1) {
    alert("Du måste ha minst en kategori.");
    return;
  }
  if (
    confirm(
      "Detta kommer att flytta alla utgifter till den första kategorin och sedan ta bort denna kategori. Fortsätt?"
    )
  ) {
    Data.deleteCategory(index);
    UI.updateAllViews(viewCallbacks);
  }
}

function handleTogglePayment(month, expenseIndex, isChecked, checkboxElement) {
  Data.togglePayment(month, expenseIndex, isChecked);
  const expenseItem = checkboxElement.closest(".expense-item");
  expenseItem.classList.toggle("paid", isChecked);
}

function handleResetMonth() {
  if (confirm("Vill du återställa alla checkboxar?")) {
    Data.resetCurrentMonth();
    UI.updateMonthlyView(viewCallbacks);
  }
}

function handleExport() {
  const dataStr = JSON.stringify(Data.budgetData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "budget-data.json";
  link.click();
  URL.revokeObjectURL(url);
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (confirm("Detta ersätter all nuvarande data. Fortsätt?")) {
        Data.importJSON(imported);
        UI.updateAllViews(viewCallbacks);
        UI.closeSettings();
        alert("Data importerad!");
      }
    } catch (error) {
      alert("Fel vid import av data. Kontrollera filen.");
    }
  };
  reader.readAsText(file);
  event.target.value = ""; // Rensa för att kunna importera samma fil igen
}

// Samla alla callbacks på ett ställe för att skicka till UI-funktioner
const viewCallbacks = {
  onDeleteIncome: handleDeleteIncome,
  onDeleteExpense: handleDeleteExpense,
  onDeleteCategory: handleDeleteCategory,
  onTogglePayment: handleTogglePayment,
};

// --- Initialisering av appen ---

function initialize() {
  // Koppla händelser från HTML till våra "handler"-funktioner
  // Detta gör att vi kan ta bort de flesta `onclick`-attribut från HTML i framtiden
  document.querySelector(".settings-btn").onclick = () => {
    UI.openSettings();
    UI.updateSettingsView(viewCallbacks);
  };
  document.querySelector(".modal .close").onclick = UI.closeSettings;
  document.querySelector('button[onclick="addIncome()"]').onclick =
    handleAddIncome;
  document.querySelector('button[onclick="addExpense()"]').onclick =
    handleAddExpense;
  document.querySelector('button[onclick="addCategory()"]').onclick =
    handleAddCategory;
  document.querySelector('button[onclick="resetCurrentMonth()"]').onclick =
    handleResetMonth;
  document.querySelector('button[onclick="exportData()"]').onclick =
    handleExport;
  document.getElementById("importFile").onchange = handleImport;

  // Gör de funktioner som anropas direkt från HTML globalt tillgängliga
  // Detta är en enkel lösning så du inte behöver ändra din HTML just nu
  window.showSection = UI.showSection;

  // Globala event listeners
  window.onclick = (event) => {
    if (event.target == document.getElementById("settingsModal")) {
      UI.closeSettings();
    }
  };
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") UI.closeSettings();
  });

  // Ladda data och rita om hela gränssnittet
  Data.loadData();
  UI.updateAllViews(viewCallbacks);
  UI.showSection("overview", document.querySelector(".tab-btn.active"));
}

// Kör igång allt när sidan har laddats
document.addEventListener("DOMContentLoaded", initialize);
