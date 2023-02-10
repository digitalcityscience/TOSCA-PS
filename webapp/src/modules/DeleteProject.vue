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

const submit = async () => {
  if (!selectedMasterplan.value?._id) {
    return;
  }

  try {
    await db.deleteMasterplan(selectedMasterplan.value._id);

    pushAlert(`Masterplan "${selectedMasterplan.value.title}" was deleted successfully.`, 'success');
    exitModule();
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
};
</script>

<template>
  <ModuleStep v-if="activeModuleStep === 0">
    <h1>Deleting a DMP</h1>
    <p>Please select from the dropdown menu the DMP you would like to delete.</p>
    <fieldset class="mb-3">
      <label for="newPublicReviewMasterplan">DMP title:</label>
      <select id="newPublicReviewMasterplan" v-model="selectedMasterplan" class="form-select">
        <option v-for="masterplan in masterplans" :key="masterplan._id" :value="masterplan">
          {{ masterplan.title }} ({{ masterplan.molgId }})
        </option>
      </select>
    </fieldset>
    <div v-if="selectedMasterplan">
      <p>Are you sure you want to delete this DMP?</p>
      <p>If it is a published DMP, all objections linked to this DMP will be deleted and cannot be recovered.</p>
    </div>
    <template #actions v-if="selectedMasterplan">
      <ModuleButton class="danger" @click="submit()">Delete</ModuleButton>
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
