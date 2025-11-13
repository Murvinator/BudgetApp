<template>
  <div class="modal" style="display:none;">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Betala skuld</h2>
        <button class="close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="settings-content">
          <div class="input-group">
            <input type="number" placeholder="Belopp (kr)" min="0" step="0.01">
            <input type="text" placeholder="Anteckning (valfritt)">
          </div>
          <div class="payment-validation" style="display:none;"></div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button>Spara</button>
            <button>Avbryt</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>
