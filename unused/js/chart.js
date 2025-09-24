// js/chart.js

let budgetChart = null; // Håller en referens till vårt Chart-objekt

export function updateChart(expensesData) {
  const ctx = document.getElementById("expenseChart").getContext("2d");

  // Ta bort det gamla diagrammet om det finns
  if (budgetChart) {
    budgetChart.destroy();
  }

  const expenses = expensesData.filter(
    (expense) => expense.category !== "Skulder"
  );

  if (expenses.length === 0) {
    return; // Avbryt om det inte finns några utgifter att visa
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const threshold = total * 0.03; // 3% tröskel

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

  budgetChart = new Chart(ctx, {
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
        legend: {
          position: "right",
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
            font: { size: 14 },
            generateLabels: function (chart) {
              const data = chart.data;
              const total = data.datasets[0].data.reduce((s, v) => s + v, 0);
              return data.labels.map((label, i) => ({
                text: `${label}: ${(
                  (data.datasets[0].data[i] / total) *
                  100
                ).toFixed(0)}%`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].backgroundColor[i],
                pointStyle: "circle",
                hidden: false,
                index: i,
              }));
            },
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-primary"
            ),
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((s, v) => s + v, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ${context.raw.toLocaleString(
                "sv-SE"
              )} kr (${percentage}%)`;
            },
          },
        },
      },
      cutout: "0%",
    },
  });
}
