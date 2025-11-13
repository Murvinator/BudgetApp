<script setup>
import SummaryCards from '@/components/features/overview/SummaryCards.vue'
import VariableExpensesMini from '@/components/features/overview/VariableExpensesMini.vue'
import ChartComponent from '@/components/features/overview/ChartComponent.vue'
import DebtSummary from '@/components/features/overview/DebtSummary.vue'
</script>

<template>
  <section class="view active" id="overview-view">
    <SummaryCards />
    <VariableExpensesMini />
    <ChartComponent />
    <DebtSummary />
    
    <!-- Temporary: Add content to test scrollbar -->
    <div style="height: 2000px; padding: 20px; background: linear-gradient(to bottom, transparent, var(--bg-secondary));">
      <p>Scroll test content...</p>
    </div>
  </section>
  
</template>

<style scoped>
</style>
