

<script setup>
import { RouterLink } from "vue-router";
</script>






<template>
  <div class="tab-bar">
    <div class="tab-bar-container">
      <div class="tab-group liquidGlass-wrapper">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>

        <RouterLink to="/overview" class="tab-btn" active-class="active">Översikt</RouterLink>
        <RouterLink to="/budget" class="tab-btn" active-class="active">Rörliga</RouterLink>
        <RouterLink to="/monthly" class="tab-btn" active-class="active">Checklista</RouterLink>
      </div>

      <RouterLink to="/settings" class="nav-action-btn liquidGlass-wrapper" active-class="active">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </RouterLink>
    </div>
  </div>
</template>


<style scoped>
/* LIQUID GLASS BASE */
.liquidGlass-wrapper {
    position: relative;
    overflow: hidden;
}

.liquidGlass-effect,
.liquidGlass-tint,
.liquidGlass-shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

/* Distortion layer */
.liquidGlass-effect {
    z-index: 0;
    backdrop-filter: blur(3px) saturate(1.6) brightness(1.05);
    filter: url(#glass-distortion);
}

/* Tint layer */
.liquidGlass-tint {
    z-index: 1;
    background: rgba(255, 255, 255, 0.45);
}

/* Shine highlight */
.liquidGlass-shine {
    z-index: 2;
    box-shadow:
        inset 1px 1px 1px rgba(255,255,255,0.5),
        inset -1px -1px 1px rgba(255,255,255,0.3);
}

/* Make content appear above */
.liquidGlass-wrapper > *:not(.liquidGlass-effect):not(.liquidGlass-tint):not(.liquidGlass-shine) {
    position: relative;
    z-index: 3;
}



@media (prefers-color-scheme: dark) {

    .liquidGlass-tint {
        background: rgba(30, 30, 30, 0.45); /* mindre vitt */
    }

    .liquidGlass-shine {
        box-shadow:
            inset 0.5px 0.5px 1px rgba(255,255,255,0.15),
            inset -0.5px -0.5px 1px rgba(255,255,255,0.05); /* mer diskret */
    }

    /* Optional: För att se ut som iOS dark dock */
    .liquidGlass-effect {
        backdrop-filter: blur(4px) brightness(0.9);
    }
}

.tab-bar {
    position: fixed;
    bottom: var(--tab-bar-bottom);
    left: 0;
    right: 0; 
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;

    animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;

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

.tab-bar-container {
    max-width: 402px;
    width: 100%;
    margin: 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 8px 30px; 
    border-radius: 999px;
    background: transparent; /* leave visual styling to inner group and bubbles */
}


/* Ensure the bubbles use a subtle border similar to the pill but remain independent */
.tab-bar-container .nav-action-btn {
    z-index: 1210;
    /* display: flex; */
    backdrop-filter: blur(6px);
}

/* The centered group of three tabs should be its own inner pill so it reads as the primary control
   while the two circular action bubbles sit outside it */
.tab-group {
    width: 100%;
    display: flex;
    align-items: center;
    /* gap: 18px;  */
    padding: 5px; 
    justify-content: center;


    border-radius: 999px;
    background: transparent;
    border: 1px solid var(--separator);
    box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}


/* Nav action button (circular) outside the nav bar */
.nav-action-btn {
    width: 53px;
    height: 53px;
    border-radius: 50%;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 22px rgba(0,0,0,0.12);
    cursor: pointer;
    border: 1px solid rgba(0,0,0,0.06);
    flex-shrink: 0; /* Prevent shrinking */
    flex-grow: 0;   /* Prevent growing */
}

.nav-action-btn svg { width: 20px; height: 20px; color: var(--text-secondary); }

.nav-action-btn {
    border: 1px solid rgba(0,0,0,0.06);
    backdrop-filter: blur(6px);
}

.nav-action-btn { color: var(--text-secondary); }



/* Individual tab buttons inside the tab group */

.tab-btn {
    flex : 1 1 auto;
    padding: 12px;
    min-width: 0;
    background: transparent; /* sit on top of the group surface */
    border-radius: 30px;
    border: none;
    color: var(--text-primary);
    font-weight: 550;
    font-size: 15px;    
    font-family: "SF Pro Text", sans-serif;
    text-decoration: inherit;
}

.tab-btn.active {
    background: var(--bg-secondary);
}


@media (prefers-color-scheme: dark) {
    .tab-bar .nav-action-btn { border: 1px solid rgba(255,255,255,0.06); }
    .tab-bar .tab-bar-inner { border: 1px solid rgba(255,255,255,0.06); }
    .tab-btn.active { background: var(--system-gray5); }
}

@media (prefers-color-scheme: dark) {
    .nav-action-btn { border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
}

</style>