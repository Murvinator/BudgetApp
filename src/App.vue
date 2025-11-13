<script setup>
import Header from "@/components/layout/Header.vue";
import TabBar from "@/components/layout/TabBar.vue";
</script>

<template>
  <div id="app">
    <Header />
    <main class="main-view">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <TabBar />
  </div>
</template>

<style>
@import './assets/styles/main.css';

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
  /* transition:cubic-bezier(0.6, -0.28, 0.735, 0.045) */
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
