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

const publicReview = ref<PublicReview>({
  masterplan: '',
  startDate: ''
});

const errors = ref<Partial<Record<keyof PublicReview, string>>>({});

onMounted(async () => {
  try {
    const response = await db.getMasterplans();
    masterplans.value = await response.json();
    console.log(masterplans.value);
  } catch (err) {
    pushAlert((err as Error).message);
  }

  const response = await db.getPublicReviews();
  console.log(await response.json());
});

const validate = () => {
  errors.value = {
    masterplan: '',
    startDate: ''
  };

  if (!publicReview.value.masterplan) {
    errors.value.masterplan = 'Master plan must be specified.';
  }

  if (!publicReview.value.startDate) {
    errors.value.startDate = 'Start date must be specified.';
  } else if (isNaN(Date.parse(publicReview.value.startDate))) {
    errors.value.startDate = 'Invalid date.';
  }

  return !Object.values(errors.value).some(error => !!error);
};

const submit = async () => {
  if (!validate()) {
    return;
  }

  try {
    await db.postPublicReview(publicReview.value);
    activeModuleStep.value++;
  } catch (err) {
    pushAlert((err as Error).message);
  }
};
</script>

<template>
  <ModuleStep v-if="activeModuleStep === 0">
    <p>Fill in the form to set up a public review.</p>
    <fieldset>
      <label for="publicReviewMasterplan">Master plan:</label>
      <div>
        <select id="publicReviewMasterplan" v-model="publicReview.masterplan">
          <option v-for="masterplan in masterplans" :key="masterplan._id" :value="masterplan._id">
            {{ masterplan.title }})
          </option>
        </select>
      </div>
      <div v-if="errors.masterplan" class="error">{{ errors.masterplan }}</div>
      <label for="publicReviewStartDate">Start date:</label>
      <input type="text" id="publicReviewStartDate" v-model="publicReview.startDate" placeholder="YYYY-MM-DD" />
      <div v-if="errors.startDate" class="error">{{ errors.startDate }}</div>
    </fieldset>
    <template #actions>
      <ModuleButton class="primary" @click="submit()">Submit</ModuleButton>
      <ModuleButton class="secondary" @click="exitModule()">Cancel</ModuleButton>
    </template>
  </ModuleStep>

  <ModuleStep v-if="activeModuleStep === 1">
    Public review was created successfully.
  </ModuleStep>
</template>

<style scoped>
.error {
  font-size: 0.8rem;
  color: darkred;
}
</style>
