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
      <p>Welcome to our online platform for the flood protection measures in Jordan (Greater Municipality of Amman,
        PDTRA). Through your comments we want to assess risk areas through flood and identify potential locations for
        rainwater management measures.</p>
      <p>As a member of any institution or even citizen, you can use this online platform, with the assistance of a
        local authority, to submit your questions, comments or objections, during the period of the flood protection
        assessment.</p>
      <p>To begin, please click on the “start submission“ button at the top bar of the screen.</p>
    </div>
  </div>
  <div className="card flex-row justify-content-center">
    <div className="d-block">
      <img alt="GIZ logo" id="dcs-logo" src="@/assets/images/dcs.png" />
      <img alt="HCU logo" id="hh-wasser-logo" src="@/assets/images/hhwasser.png" />
    </div>
  </div>
</template>

<style scoped>
#dcs-logo {
  height: 50px;
  margin: 4px 12px 4px 0;
}

#hh-wasser-logo {
  height: 50px;
  padding-top: 5px;
  margin: 4px 0 12px;
}
</style>
