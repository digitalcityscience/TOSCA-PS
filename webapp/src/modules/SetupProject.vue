<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { db } from '@/api/db';
import { geoserver } from '@/api/geoserver';
import { useAlertsStore } from '@/stores/alerts';
import { useGlobalStore } from '@/stores/global';
import ModuleButton from './shared/ModuleButton.vue';
import ModuleStep from './shared/ModuleStep.vue';

const globalStore = useGlobalStore();
const { geoserverDMPWorkspace, exitModule } = globalStore;
const { activeModuleStep } = storeToRefs(globalStore);
const { pushAlert } = useAlertsStore();

const availableDMPs = ref<GS.Reference[]>([]);

onMounted(async () => {
  availableDMPs.value = await geoserver.GetFeatureTypes(geoserverDMPWorkspace);
});

const newProject = ref<Masterplan>({
  title: '',
  molgId: '',
  layerName: ''
});

const errors = ref<Partial<Record<keyof Masterplan, string>>>({});

const validate = () => {
  errors.value = {
    title: '',
    molgId: '',
    layerName: ''
  };

  if (!newProject.value.title) {
    errors.value.title = 'Title cannot be empty.';
  }

  if (!newProject.value.molgId) {
    errors.value.molgId = 'MoLG ID cannot be empty.';
  }

  if (!newProject.value.layerName) {
    errors.value.layerName = 'Layer must be specified.';
  }

  return !Object.values(errors.value).some(error => !!error);
};

const submit = async () => {
  if (!validate()) {
    return;
  }

  try {
    await db.postMasterplan(newProject.value);

    pushAlert('Project was created successfully.', 'success');
    exitModule();
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
};
</script>

<template>
  <ModuleStep v-if="activeModuleStep === 0">
    <p>Fill in the data about the new detailed master plan.</p>
    <fieldset>
      <div>
        <label for="newProjectTitle">Project title:</label>
        <input type="text" id="newProjectTitle" v-model="newProject.title" />
        <div v-if="errors.title" class="error">{{ errors.title }}</div>
      </div>
      <div>
        <label for="newProjectMolgId">MoLG ID:</label>
        <input type="text" id="newProjectMolgId" v-model="newProject.molgId" />
        <div v-if="errors.molgId" class="error">{{ errors.molgId }}</div>
      </div>
      <div>
        <label for="newProjectLayerName">Map layer:</label>
        <div>
          <select id="newProjectLayerName" v-model="newProject.layerName">
            <option v-for="layer in availableDMPs" :key="layer.name" :value="layer.name">
              {{ layer.name }}
            </option>
          </select>
        </div>
        <div v-if="errors.layerName" class="error">{{ errors.layerName }}</div>
      </div>
    </fieldset>
    <template #actions>
      <ModuleButton class="primary" @click="submit()">Submit</ModuleButton>
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
