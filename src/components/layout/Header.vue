<template>
  <div class="header" :class="{small: isSmall}">
    <div class="header-content">
      <h1>MurvBudget</h1>
    </div>
  </div>
  
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isSmall = ref(false)
const threshold = 60

function onScroll() {
  isSmall.value = window.scrollY > threshold
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>


<style scoped>

.header {
    background: rgba(255, 255, 255, 1);
    /* Extend padding to cover the status bar area on iPhone */
    padding: calc(20px + var(--safe-area-top)) 20px 24px;
    /* removed bottom hairline to match iOS settings look */
    border-bottom: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    overflow: hidden;
    text-align: left;
    /* Prevent header from bouncing */
    overscroll-behavior: none;
}

@media (prefers-color-scheme: dark) {
    .header {
        background: rgba(0, 0, 0, 1);
    }
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    
}

.header h1 {
    font-size: 35px; /* larger title for native iOS-style header */
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.5px;
}

.header.small {
    padding: 8px 16px 26px;
    border-bottom: none;
}

.header.small .header-content {
    justify-content: center;
    padding-left: 0;
}

.header.small h1 {
    padding-top: 15px;
    font-size: 18px;
    font-weight: 600;
    animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    color: var(--text-primary);
}

/* header overlay colors for light/dark modes */
@media (prefers-color-scheme: dark) {
    .header.small { background: linear-gradient(180deg,
      rgba(0, 0, 0, 1) 0%,
      rgba(0, 0, 0, 1) 30%,
      rgba(0, 0, 0, 0) 100%); }
}
@media (prefers-color-scheme: light) {
    .header.small { background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 1) 30%,
      rgba(255, 255, 255, 0) 100%
    );}
}



.header p {
    color: var(--text-tertiary);
    font-size: 15px;
    font-weight: 400;
}


@keyframes slideUp {
    from {
        transform: translateX(-0%) translateY(20px);
        opacity: 0;
    }

    to {
        transform: translateX(-0%) translateY(0);
        opacity: 1;
    }
}
</style>