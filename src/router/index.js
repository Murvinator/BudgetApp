import { createRouter, createWebHistory } from "vue-router";
import OverviewView from "@/views/OverviewView.vue";
import BudgetView from "@/views/BudgetView.vue";
import MonthlyView from "@/views/MonthlyView.vue";
import SettingsView from "@/views/SettingsView.vue";

const routes = [
  { path: "/", redirect: "/overview" },
  { path: "/overview", component: OverviewView },
  { path: "/budget", component: BudgetView },
  { path: "/monthly", component: MonthlyView },
  { path: "/settings", component: SettingsView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    // Gör så att varje ny vy scrollar till toppen
    return { top: 0 };
  },
});

export default router;