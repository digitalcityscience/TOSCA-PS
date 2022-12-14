<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { db } from '@/api/db';
import { useAlertsStore } from '@/stores/alerts';
import { useGlobalStore } from '@/stores/global';
import { useMapStore } from '@/stores/map';
import ModuleButton from './shared/ModuleButton.vue';
import ModuleStep from './shared/ModuleStep.vue';

const globalStore = useGlobalStore();
const { exitModule } = globalStore;
const { activeModuleStep } = storeToRefs(globalStore);
const { pushAlert } = useAlertsStore();
const mapStore = useMapStore();
const { map, overlayMaps } = storeToRefs(mapStore);

const publicReviews = ref<PublicReview[]>([]);
const selectedPublicReview = ref<PublicReview>();

onMounted(async () => {
  try {
    const response = await db.getPublicReviews();
    publicReviews.value = await response.json();

    for (const review of publicReviews.value) {
      const layerName = review.masterplan?.[0].layerName;
      if (!layerName) {
        continue;
      }

      const layer = overlayMaps.value[layerName] as L.TileLayer.WMS;
      layer.bringToFront();

      map.value?.on('click', async event => {
        const url = layer.getFeatureInfoUrl(event.latlng);
        if (url) {
          const response = await fetch(url, {
            headers: new Headers({
              'Authorization': `Basic ${globalStore.geoserverBasicAuth}`
            })
          });
          const data = await response.json();

          if (data.features.length > 0) {
            selectedPublicReview.value = review;
            errors.value.publicReviewId = '';
          } else {
            selectedPublicReview.value = undefined;
          }
        }
      }, layer);
    }
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
});

const objection = ref<Objection>({
  person: {}
});

const errors = ref<Partial<Record<keyof Objection, string>>>({});

const personErrors = ref<Partial<Record<keyof Person, string>>>({});

const submit = async (step: number) => {
  errors.value = {};
  personErrors.value = {};

  if (step === 0 && !selectedPublicReview.value) {
    errors.value.publicReviewId = 'Nothing selected.';
  }
  if (step === 1 && !objection.value.comment) {
    errors.value.comment = 'This field is mandatory.';
  }
  if (step === 3) {
    if (!objection.value.person?.name) {
      personErrors.value.name = 'This field is mandatory.'
    }
    // etc.
  }

  if (Object.values(errors.value).some(error => !!error) ||
    Object.values(personErrors.value).some(error => !!error)) {
    return;
  }

  if (step < 3) {
    activeModuleStep.value++;
    return;
  }

  try {
    if (!selectedPublicReview.value?._id) {
      throw new Error('selectedPublicReview is undefined');
    }

    await db.postObjection(objection.value, selectedPublicReview.value._id);

    pushAlert('Comment was submitted successfully.', 'success');
    exitModule();
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
};
</script>

<template>
  <ModuleStep v-if="activeModuleStep === 0">
    <p>Find on the map the DMP for which you would like to submit a comment. You can do this by zooming and/or panning to move around the area.</p>
    <p>Click on an outlined area of a DMP where you would like to locate your comment.</p>
    <p>Once you have clicked over a DMP polygon shape, please click the “Next“ button below to continue.</p>
    <div v-if="errors.publicReviewId" class="error">{{ errors.publicReviewId }}</div>
    <template #actions>
      <ModuleButton class="primary" @click="submit(0)">Next</ModuleButton>
      <ModuleButton class="secondary" @click="exitModule()">Cancel</ModuleButton>
    </template>
  </ModuleStep>
  <ModuleStep v-if="activeModuleStep === 1">
    <p>Please fill out the following information:</p>
    <fieldset>
      <h1>Describe your comment</h1>
      <textarea v-model="objection.comment"></textarea>
      <div v-if="errors.comment" class="error">{{ errors.comment }}</div>
    </fieldset>
    <template #actions>
      <ModuleButton class="primary" @click="submit(1)">Next</ModuleButton>
      <ModuleButton class="secondary" @click="exitModule()">Cancel</ModuleButton>
    </template>
  </ModuleStep>
  <ModuleStep v-if="activeModuleStep === 2">
    <p>Please fill out the following information:</p>
    <fieldset>
      <h1>Category of your comment</h1>
      <select v-model="objection.category">
        <option>Suggest a new land use category</option>
        <option>Suggest a new street</option>
        <option>Project cancellation</option>
        <option>Reduce width of a street</option>
        <option>Modify route of a street</option>
        <option>Modify route of a street & reduce its width</option>
        <option>Distribute surrender area due to street widening equally on both street sides</option>
        <option>Widen a street</option>
        <option>Request for organizing a new street</option>
        <option>Merge an adjacent area into the Detailed Master Plan</option>
        <option>Other</option>
      </select>
    </fieldset>
    <template #actions>
      <ModuleButton class="primary" @click="submit(2)">Next</ModuleButton>
      <ModuleButton class="secondary" @click="exitModule()">Cancel</ModuleButton>
    </template>
  </ModuleStep>
  <ModuleStep v-if="activeModuleStep === 3 && objection.person">
    <p>Please fill out the following information:</p>
    <fieldset>
      <h1>Complete your personal information</h1>
      <div>
        <label for="name">Name of the objecting person</label>
        <input type="text" id="name" v-model="objection.person.name" />
        <div v-if="personErrors.name" class="error">{{ personErrors.name }}</div>
      </div>
      <div>
        <label for="lot">Lot number</label>
        <input type="text" id="lot" v-model="objection.person.lot" />
        <div v-if="personErrors.lot" class="error">{{ personErrors.lot }}</div>
      </div>
      <div>
        <label for="neighborhood">Neighborhood number</label>
        <input type="text" id="neighborhood" v-model="objection.person.neighborhood" />
        <div v-if="personErrors.neighborhood" class="error">{{ personErrors.neighborhood }}</div>
      </div>
      <div>
        <label for="block">Block number</label>
        <input type="text" id="block" v-model="objection.person.block" />
        <div v-if="personErrors.block" class="error">{{ personErrors.block }}</div>
      </div>
      <div>
        <label for="street">Street number</label>
        <input type="text" id="street" v-model="objection.person.street" />
        <div v-if="personErrors.street" class="error">{{ personErrors.street }}</div>
      </div>
      <div>
        <label for="phone">Phone number</label>
        <input type="tel" id="phone" v-model="objection.person.phone" />
        <div v-if="personErrors.phone" class="error">{{ personErrors.phone }}</div>
      </div>
      <div>
        <label for="id">ID number</label>
        <input type="text" id="id" v-model="objection.person.id" />
        <div v-if="personErrors.id" class="error">{{ personErrors.id }}</div>
      </div>
    </fieldset>
    <p>To complete the submission of your form, please on the “finish submission“ button below.</p>
    <template #actions>
      <ModuleButton class="primary" @click="submit(3)">Finish submission</ModuleButton>
      <ModuleButton class="secondary" @click="exitModule()">Cancel</ModuleButton>
    </template>
  </ModuleStep>
  <ModuleStep v-if="activeModuleStep === 4">
    <p>Thank you for your participation!</p>
    <template #actions>
      <ModuleButton class="secondary" @click="exitModule()">Close form</ModuleButton>
    </template>
  </ModuleStep>
</template>

<style scoped>
select {
  max-width: 100%;
}

h1 {
  font-size: 110%;
  font-weight: bold;
}

.error {
  font-size: 0.8rem;
  color: darkred;
}
</style>
