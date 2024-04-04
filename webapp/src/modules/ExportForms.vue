<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { db } from '@/api/db';
import { useAlertsStore } from '@/stores/alerts';
import { useGlobalStore } from '@/stores/global';
import ModuleButton from './shared/ModuleButton.vue';
import ModuleStep from './shared/ModuleStep.vue';

const globalStore = useGlobalStore();
const { exitModule } = globalStore;
const { activeModuleStep } = storeToRefs(globalStore);
const { pushAlert } = useAlertsStore();

const masterplans = ref<Masterplan[]>([]);

const selectedMasterplan = ref<Masterplan>();

onMounted(async () => {
  try {
    const response = await db.getMasterplans();
    masterplans.value = await response.json();
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
});

const onMasterplanChange = async () => {
  if (!selectedMasterplan.value?._id) {
    return;
  }

  const response = await db.getMasterplan(selectedMasterplan.value._id);
  Object.assign(selectedMasterplan.value, await response.json());
};

const submit = async () => {
  if (!selectedMasterplan.value?._id) {
    return;
  }

  try {
    const response = await db.getMasterplanExport(selectedMasterplan.value._id);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `TOSCA-export-${selectedMasterplan.value._id}.zip`);
    link.click();
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
};
</script>

<template>
  <ModuleStep v-if="activeModuleStep === 0">
    <h1>Export objection forms</h1>
    <p>Please select from the dropdown menu the DMP from which you want to export the forms.</p>
    <fieldset class="mb-3">
      <label for="newPublicReviewMasterplan">DMP title:</label>
      <select id="newPublicReviewMasterplan" v-model="selectedMasterplan" class="form-select"
        @change="onMasterplanChange()">
        <option v-for="masterplan in masterplans" :key="masterplan._id" :value="masterplan">
          {{ masterplan.title }} ({{ masterplan.molgId }})
        </option>
      </select>
    </fieldset>
    <div v-if="selectedMasterplan">
      <p>A total of {{ selectedMasterplan.objectionsCount }} form(s) have been collected. Please click below to export
        the documents. These will be downloaded to your computer.</p>
    </div>
    <template #actions v-if="selectedMasterplan">
      <ModuleButton class="primary" @click="submit()">Export</ModuleButton>
      <ModuleButton class="secondary" @click="exitModule()">Cancel</ModuleButton>
    </template>
  </ModuleStep>
</template>

<style scoped>
select {
  max-width: 100%;
}

.error {
  font-size: 0.8rem;
  color: darkred;
}
</style>
