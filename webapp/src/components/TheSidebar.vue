<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGlobalStore } from '@/stores/global';

const globalStore = useGlobalStore();
const { activeModule } = storeToRefs(globalStore);
</script>

<template>
  <div id="dialog" className="flex-grow-1 card card-border box-shadow">
    <component v-if="activeModule" :is="activeModule"></component>
    <div v-else>
      <p>Welcome to our online platform for the collection of citizens' comments on proposed Detailed Master Plans (DMP) for the Palestinian Regions.</p>
      <p>As a citizen, you can use this online platform, with the assistance of a local authority, to submit your questions, comments or objections, during the 30-day objection period of proposed DMPs.</p>
      <p>To begin, please click on the “start submission“ button at the top bar of the screen.</p>
    </div>
  </div>
  <div className="card flex-row justify-content-center">
    <div className="d-block">
      <img alt="GIZ logo" id="giz-logo" src="@/assets/images/giz-logo.gif" />
      <img alt="HCU logo" id="hcu-logo" src="@/assets/images/hcu-logo.png" />
    </div>
  </div>
</template>

<style scoped>
#giz-logo {
  height: 40px;
  margin: 4px 12px 4px 0;
}

#hcu-logo {
  height: 32px;
  margin: 4px 0 12px;
}
</style>
