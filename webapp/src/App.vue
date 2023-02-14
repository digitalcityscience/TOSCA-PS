<script setup lang="ts">
import TheMap from '@/components/TheMap.vue';
import TheNavbar from '@/components/TheNavbar.vue';
import TheSidebar from '@/components/TheSidebar.vue';
import AlertContainer from '@/components/AlertContainer.vue';
</script>

<template>
  <div class="d-flex flex-column h-100">
    <header class="card box-shadow">
      <TheNavbar />
    </header>
    <main class="d-flex flex-grow-1 main">
      <div id="sidebar" class="d-flex flex-column sidebar">
        <TheSidebar />
      </div>
      <div id="map-container" class="col card box-shadow">
        <TheMap />
      </div>
    </main>
    <AlertContainer />
  </div>
</template>

<style>
h1 {
  font-size: 120%;
  font-weight: bold;
}

.sidebar {
  width: 30%;
  min-width: 450px;
}

#map-container {
  padding: 0;
  position: relative;
  overflow-y: hidden;
}

#alert-anchor {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 2000;
}

.alert {
  margin: 10px;
}

.alert .close {
  margin-left: 16px;
}
</style>
