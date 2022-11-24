<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { db } from '@/api/db';
import { useAlertsStore } from '@/stores/alerts';
import { useGlobalStore } from '@/stores/global';
import ModuleButton from './shared/ModuleButton.vue';
import ModuleStep from './shared/ModuleStep.vue';

const globalStore = useGlobalStore();
const { exitModule } = globalStore;
const { activeModuleStep } = storeToRefs(globalStore);

const { pushAlert } = useAlertsStore();

const newProject = ref<Masterplan>({
  title: '',
  layerName: ''
});

const errors = ref<Partial<Record<keyof Masterplan, string>>>({});

const validate = () => {
  errors.value = {
    title: '',
    layerName: ''
  };

  if (!newProject.value.title) {
    errors.value.title = 'Title cannot be empty.';
  }

  if (!newProject.value.layerName) {
    errors.value.layerName = 'Layer must be specified.';
  }

  // TODO: validate layer through GeoServer API

  return !Object.values(errors.value).some(error => !!error);
};

const submit = async () => {
  if (!validate()) {
    return;
  }

  try {
    await db.postMasterplan(newProject.value);
    activeModuleStep.value++;
  } catch (err) {
    pushAlert((err as Error).message);
  }
};
</script>

<template>
  <ModuleStep v-if="activeModuleStep === 0">
    <p>Fill in the data about the new detailed master plan.</p>
    <fieldset>
      <label for="newProjectTitle">Project title:</label>
      <input type="text" id="newProjectTitle" v-model="newProject.title" />
      <div v-if="errors.title" class="error">{{ errors.title }}</div>
      <label for="newProjectLayerName">Map layer name:</label>
      <input type="text" id="newProjectLayerName" v-model="newProject.layerName" />
      <div v-if="errors.layerName" class="error">{{ errors.layerName }}</div>
    </fieldset>
    <template #actions>
      <ModuleButton class="primary" @click="submit()">Submit</ModuleButton>
      <ModuleButton class="secondary" @click="exitModule()">Cancel</ModuleButton>
    </template>
  </ModuleStep>

  <ModuleStep v-if="activeModuleStep === 1">
    Project was created successfully.
  </ModuleStep>
</template>

<style scoped>
.error {
  font-size: 0.8rem;
  color: darkred;
}
</style>
