import { createRouter, createWebHistory } from 'vue-router'

const OverviewView = () => import('../views/OverviewView.vue')
const BudgetView = () => import('../views/BudgetView.vue')
const MonthlyView = () => import('../views/MonthlyView.vue')
const SettingsView = () => import('../views/SettingsView.vue')

const routes = [
	{ path: '/', redirect: '/overview' },
	{ path: '/overview', name: 'overview', component: OverviewView },
	{ path: '/budget', name: 'budget', component: BudgetView },
	{ path: '/monthly', name: 'monthly', component: MonthlyView },
	{ path: '/settings', name: 'settings', component: SettingsView },
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router

