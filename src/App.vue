<script setup>
import Header from './components/layout/Header.vue'
import TabBar from './components/layout/TabBar.vue'
import DebtPaymentModal from './components/common/DebtPaymentModal.vue'
</script>

<template>
  <Header />
  <router-view />
  <DebtPaymentModal />
  <TabBar />
</template>

<style>
@import './assets/styles/main.css';
</style>
