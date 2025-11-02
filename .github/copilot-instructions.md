## BudgetApp — quick agent guide

This repository is a small static web app (single-page UI) for personal budgets. The goal of these instructions is to give an AI coding agent the precise, discoverable knowledge needed to make safe, focused changes.

### Where the app lives
- UI and app logic are in the repo root: `index.html`, `style.css`, and `script.js` (there is no bundler or build step). Treat `script.js` as the single source of application logic.
- Chart rendering uses Chart.js loaded from CDN in `index.html`.

### Big-picture architecture
- Single-page app using imperative DOM manipulation (no frameworks). `script.js` exposes functions that read/modify a global `budgetData` object and update DOM fragments.
- Persistence: uses `localStorage` under the key `budgetApp` via `loadData()` / `saveData()`.
- Views: three main UI views switched by `showView(...)` — `overview-view`, `budget-view`, `monthly-view`. Rendering entry points:
  - `updateOverviewView()`
  - `updateBudgetView()`
  - `updateMonthlyView()`
  - `updateSettingsView()` (settings modal)

### Key data shape (examples from `script.js`)
budgetData (shape):
```
{
  income: [{name, amount}],
  expenses: [{name, amount, category}],
  categories: ["Kategori1", ...],
  monthlyStatus: { current: { expenseIndex: true } },
  debtStatus: { /* reserved */ },
  debts: [{name, amount}],
  variableExpenses: [{name, budget}],
  variableExpenseTransactions: { "YYYY-M": { "CategoryName": [{amount, note, date}] } }
}
```
Notes: debts are now stored in `budgetData.debts` (the app uses a special static debt category named `Skulder`). The code defines a constant `DEBT_CATEGORY = "Skulder"` and excludes it from user-editable `categories`. Month keys are produced with `getCurrentMonthKey()` (format: `YYYY-M`).

### Patterns & conventions to follow
- Keep changes within `script.js` unless you're changing styles (`style.css`) or layout (`index.html`). There is no module system; prefer minimal, local edits.
- UI changes should update both the DOM and the underlying `budgetData`, then call `saveData()` and the relevant `update*View()` function.
- Use existing helper functions (e.g. `saveData()`, `loadData()`, `updateAllViews()`) instead of duplicating persistence/render logic.
- Currency formatting uses `toLocaleString('sv-SE')`. Preserve this for UX consistency.
- Avoid changing user-facing Swedish strings without explicit instruction (they're intentionally localized in-place).
 - `Skulder` is reserved; do not add a regular category named `Skulder`. Use the debts APIs (`budgetData.debts`, `addDebt()`, `deleteDebt()`, `updateDebtList()`) or the settings modal section labeled "Skulder".

### Integration points & external deps
- Chart.js is loaded from CDN in `index.html`. If you need to change chart behavior, edit `updateChartComponent()` inside `script.js`.
- Import/export uses the browser File API (`FileReader`) and downloads a JSON file named `budget-data.json`.

### Developer workflows (how to run & debug)
- No build step. Open `index.html` in a browser. For local development use a simple HTTP server (recommended):
```bash
# from repo root
python3 -m http.server 8000
# then open http://localhost:8000/
```
- Debugging: open browser DevTools Console. `budgetData` and `localStorage.getItem('budgetApp')` are the primary places to inspect state.

### Safe-edit checklist for changes
1. Identify which view(s) are affected and call the corresponding `update*View()` after state changes.  
2. Persist with `saveData()` if you mutate `budgetData`.  
3. Maintain Swedish locale formatting (`sv-SE`) for displayed amounts.  
4. If adding new categories, ensure they are not named `Skulder` unless intended as debt.  

### Files to reference when making edits
- `script.js` — read first; contains app model, DOM rendering and event handlers.  
- `index.html` — layout + includes Chart.js CDN and root containers for views.  
- `style.css` — CSS variables (themes) and component styles; prefer using existing CSS variables for colors.

Notes on import/export and debt IDs
- The JSON exported by the app contains `debts` entries with an `id` field and `debtPayments` keyed by debt id. Example (migrated format):
```json
"debts": [{ "id": "debt-ks1abc", "name": "Banklån", "amount": 48000 }],
"debtPayments": { "debt-ks1abc": [{ "amount": 2000, "note": "Inbetalning", "date": "2024-10-01T12:00:00.000Z" }] }
```
- Older (legacy) exports stored debts as `expenses` with category `"Skulder"` and `debtPayments` keyed by debt name. The app migrates these on load/import — see sample files in `sample-imports/legacy-format.json` and `sample-imports/migrated-format.json` for examples.

If any section is unclear or you want more examples (e.g., a small unit of functionality to change), tell me which area you'd like expanded and I will iterate. 
