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

const newPublicReview = ref<PublicReview>({
  masterplanId: '',
  startDate: ''
});

const errors = ref<Partial<Record<keyof PublicReview, string>>>({});

onMounted(async () => {
  try {
    const response = await db.getMasterplans();
    masterplans.value = await response.json();
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
});

const validate = () => {
  errors.value = {
    masterplanId: '',
    startDate: ''
  };

  if (!newPublicReview.value.masterplanId) {
    errors.value.masterplanId = 'Master plan must be specified.';
  }

  if (!newPublicReview.value.startDate) {
    errors.value.startDate = 'Start date must be specified.';
  } else if (isNaN(Date.parse(newPublicReview.value.startDate))) {
    errors.value.startDate = 'Invalid date.';
  }

  return !Object.values(errors.value).some(error => !!error);
};

const submit = async () => {
  if (!validate()) {
    return;
  }

  try {
    await db.postPublicReview(newPublicReview.value);

    pushAlert('Public review was created successfully.', 'success');
    exitModule();
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
};
</script>

<template>
  <ModuleStep v-if="activeModuleStep === 0">
    <p>Fill in the form to set up a public review.</p>
    <fieldset>
      <div>
        <label for="newPublicReviewMasterplan">Master plan:</label>
        <select id="newPublicReviewMasterplan" v-model="newPublicReview.masterplanId" class="form-select">
          <option v-for="masterplan in masterplans" :key="masterplan._id" :value="masterplan._id">
            {{ masterplan.title }} ({{ masterplan.molgId }})
          </option>
        </select>
        <div v-if="errors.masterplanId" class="error">{{ errors.masterplanId }}</div>
      </div>
      <div>
        <label for="newPublicReviewStartDate">Start date:</label>
        <input type="date" id="newPublicReviewStartDate" v-model="newPublicReview.startDate" class="form-control" />
        <div v-if="errors.startDate" class="error">{{ errors.startDate }}</div>
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
