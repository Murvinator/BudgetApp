<script setup>
import { useRouter } from 'vue-router'
import VariableExpensesSettings from '@/components/features/settings/VariableExpensesSettings.vue'
import CategorySettings from '@/components/features/settings/CategorySettings.vue'
import ExpenseSettings from '@/components/features/settings/ExpenseSettings.vue'
import IncomeSettings from '@/components/features/settings/IncomeSettings.vue'
import DebtSettings from '@/components/features/settings/DebtSettings.vue'
import DataSettings from '@/components/features/settings/DataSettings.vue'

const router = useRouter()
const goBack = () => router.back()
</script>

<template>
  <section class="view" id="settings-view">
    <div class="settings-header">
      <div class="settings-header-left">
        <button class="back-btn" @click="goBack" title="Tillbaka" aria-label="Tillbaka">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h2>Inställningar</h2>
      </div>
    </div>

    <div class="settings-root">
      <VariableExpensesSettings />
      <CategorySettings />
      <ExpenseSettings />
      <IncomeSettings />
      <DebtSettings />
      <DataSettings />

      <div class="settings-footer">
        <a href="/about.html" target="_blank" rel="noopener noreferrer">Om MurvBudget</a>
      </div>
      <div class="swish-footer">
        <button class="swish-btn" @click="() => window.location.href='https://app.swish.nu/1/p/sw/?sw=46701484473&amt=10.0&msg=Cool%20app&edit=amt,msg'">Swisha en gåva</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
