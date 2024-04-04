<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted, ref, Ref, toRaw } from 'vue';
import { db } from '@/api/db';
import { geoserver } from '@/api/geoserver';
import { useAlertsStore } from '@/stores/alerts';
import { useGlobalStore } from '@/stores/global';
import { useMapStore } from '@/stores/map';
import ModuleButton from './shared/ModuleButton.vue';
import ModuleStep from './shared/ModuleStep.vue';

// Because of leaflet error in vue3 we added toRaw function as wrapper to leaflet map
//https://stackoverflow.com/a/66693709/11573437

const globalStore = useGlobalStore();
const { activeModuleStep } = storeToRefs(globalStore);
const { exitModule } = globalStore;
const { pushAlert } = useAlertsStore();
const mapStore = useMapStore();
const { map, dmpLayerGroup } = storeToRefs(mapStore);
const { addDMP, clearDMPs } = mapStore;

const publicReviews = ref<PublicReview[]>([]);
const selectedPublicReview = ref<PublicReview>();

const latLon = ref<LatLon>();

// // State
// const reviews = ref([]); // Değerlerin bir dizisi olarak değerleri saklayan bir referans

// // Seçilen incelemenin kimliğini saklayan bir referans
// const selectedReview = ref<string | null>(null);


// onMounted(async () => {
//   try {
//     const response = await db.getPublicReviews();
//     publicReviews.value = await response.json();

//     // const response_all = await db.getPublicReviewsAll()
//     // console.log("all_projects", all_projects.json());


//     if (publicReviews.value.length === 0) {
//       pushAlert('No submissions are possible a the moment, as no DMPs are currently open for review.');
//     }
//     console.log("publicReviews", publicReviews.value);
//     for (const review of publicReviews.value) {
//       // burada tum db yi tarayip en son yayinlanini layername olarak atiyor.
//       // bu publicreiwe bir dropdown a atayim
//       const layerName = review.masterplan?.[0]?.layerName;
//       if (!layerName) {
//         continue;
//       }
//       console.log("COUNT1", review.objectionsCount)
//       try {
//         const { layer } = await addDMP(layerName, `${review.objectionsCount}`);

//         toRaw(map.value?.addLayer(layer));
//         layer.bringToFront();

//         toRaw(map.value?.on('click', async event => {
//           // request GetFeatureInfo to check if a feature of this layer was clicked
//           const url = layer.getFeatureInfoUrl(event.latlng);
//           console.log("url", url);
//           if (url) {
//             const response = await geoserver.fetchWithCredentials(url);
//             const data = await response.json();

//             if (data.features.length > 0) {
//               selectedPublicReview.value = review;
//               latLon.value = {
//                 lat: event.latlng.lat,
//                 lng: event.latlng.lng,
//               };

//               // console.log("mounten", latLon);
//               errors.value.publicReviewId = '';
//             } else {
//               selectedPublicReview.value = undefined;
//             }
//           }
//         }, layer));
//       } catch (err) {
//         pushAlert(`Layer "${layerName}" not found.`);
//       }
//     }

//     if (!map.value) {
//       return;
//     }
//     dmpLayerGroup.value?.addTo(toRaw(map.value as L.Map));
//   } catch (err) {
//     pushAlert((err as Error).message, 'danger');
//   }
// });

//{
// Future geojson input creation
// interface PointGeometry {
//   type: "Point";
//   coordinates: [number, number];
// }

// interface GeoJSONFeature {
//   type: "Feature";
//   geometry: PointGeometry;
// }

// // Veriyi kaydederken kullanmak için bir fonksiyon
// function createGeoJSONPoint(latitude: number, longitude: number): GeoJSONFeature {
//   const pointGeometry: PointGeometry = {
//     type: "Point",
//     coordinates: [longitude, latitude],
//   };

//   const geoJSONFeature: GeoJSONFeature = {
//     type: "Feature",
//     geometry: pointGeometry,
//   };

//   return geoJSONFeature;
// }

// // Örnek kullanım
// const latitude = 52.46385;
// const longitude = 13.38272;

// const geoJSONFeature = createGeoJSONPoint(latitude, longitude);
// console.log(geoJSONFeature);
//}



const activeLayer = ref<{ layer: L.Layer; popup: L.Popup } | null>(null);

async function addLayerFromReview(review) {
  const layerName = review.masterplan?.[0]?.layerName;
  // Katman adının varlığını kontrol edin
  if (layerName) {
    try {
      const { layer, popup } = await addDMP(layerName, `${review.objectionsCount}`);
      toRaw(map.value?.addLayer(layer));
      layer.bringToFront();
      activeLayer.value = { layer, popup };
      dmpLayerGroup.value?.addTo(toRaw(map.value as L.Map));
      toRaw(map.value?.on('click', async event => {
        const url = layer.getFeatureInfoUrl(event.latlng);
        if (url) {
          const response = await geoserver.fetchWithCredentials(url);
          const data = await response.json();
          // Gelen verilerin uzunluğunu kontrol edin
          if (data.features.length > 0) {
            selectedPublicReview.value = review;
            latLon.value = {
              lat: event.latlng.lat,
              lng: event.latlng.lng,
            };
            errors.value.publicReviewId = '';
          } else {
            selectedPublicReview.value = undefined;
          }
        }
        if (!map.value) {
          return;
        }

      }, layer));
    } catch (err) {
      pushAlert(`Layer "${layerName}" not found.`);
    }
  }
}

const selectedReview: Ref<any> = ref(null);
const selectedLayer: Ref<string | null> = ref(null);

onMounted(async () => {
  try {
    const response = await db.getPublicReviews();
    const data = await response.json();
    publicReviews.value = data;

    if (publicReviews.value.length === 0) {
      pushAlert('No submissions are possible at the moment, as no DMPs are currently open for review.');
    }

    // Check if there are any public reviews available
    if (publicReviews.value.length > 0) {
      // Get the last review from the list
      selectedReview.value = publicReviews.value[publicReviews.value.length - 1];
      addLayerFromReview(selectedReview.value);
    }
  }
  catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
});

const removeDMP = (dmp: { layer: L.Layer, popup: L.Popup }) => {
  clearDMPs()
  map.value?.removeLayer(dmp.layer);
};

async function handleDropdownChange() {
  // clearDMPs();
  if (activeLayer.value) {
    removeDMP(activeLayer.value);
  }
  if (selectedReview.value) {
    await addLayerFromReview(selectedReview.value);
  }
}

onBeforeUnmount(() => {
  clearDMPs();
});

const objection = ref<Objection>({
  // Define the structure of the Objection object here
  // latlon come from user click. When user click the map, it will be set to the latlon of the click
  person: {},
  location: latLon
});

const errors = ref<Partial<Record<keyof Objection, string>>>({});
const attachmentError = ref<string>('');
const personErrors = ref<Partial<Record<keyof Person, string>>>({});

const fileData = ref<FormData>();

const onFileInputChange = (event: Event) => {
  const fieldName = (event.target as HTMLInputElement).name;
  const fileList = (event.target as HTMLInputElement).files;

  attachmentError.value = '';

  if (!fileList?.length) {
    fileData.value?.delete(fieldName);
    return;
  }

  fileData.value?.forEach((file) => {
    if ((file as File).name === fileList[0].name) {
      attachmentError.value = 'Cannot upload multiple files with the same name';
    }
  });

  if (attachmentError.value) {
    return;
  }

  if (!fileData.value) {
    fileData.value = new FormData();
  }
  fileData.value.append(fieldName, fileList[0]);
}

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
    Object.values(personErrors.value).some(error => !!error) ||
    attachmentError.value) {
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
    const response = await db.postObjection(objection.value, selectedPublicReview.value._id);
    const objectionId = (await response.json()).insertedId;

    // upload attachments
    if (fileData.value) {
      for (const i of '12345') {
        const file = fileData.value.get('attachment' + i);
        if (file) {
          fileData.value.append('attachment', file);
          fileData.value.delete('attachment' + i);
        }
      }

      try {
        await db.postAttachment(fileData.value, objectionId);
      } catch (err) {
        throw new Error('Failed to upload file');
      }
    }

    pushAlert('Comment was submitted successfully.', 'success');
    exitModule();
  } catch (err) {
    pushAlert((err as Error).message, 'danger');
  }
};
</script>

<template>
  <ModuleStep v-if="activeModuleStep === 0">
    <p>Find on the map the target area for which you would like to submit a comment. You can do this by zooming and/or
      panning
      to move around the area.</p>
    <p>From the dropdown menu labeled <b>"Select Campaign"</b> choose the project you'd like to leave a comment on.</p>
    <p>Once you've selected a project, click on the specific <b><em>point or polygon</em></b> you wish to comment on.
    </p>
    <p>After selecting your target object, click the <b>"Next"</b> button to continue adding your comment</p>
    <div>

      <label for="reviewDropdown">Select Campaign:&nbsp;&nbsp; </label>
      <select id="reviewDropdown" @change="handleDropdownChange" v-model="selectedReview">
        <option v-for="(review, index) in publicReviews" :key="index" :value="review">
          {{ review.masterplan?.[0]?.title }}
        </option>
      </select>

    </div>

    <div v-if="selectedPublicReview">
      <br>
      <strong>You have chosen Campaign <mark> "{{
    selectedPublicReview.masterplan?.[0].title
  }}". </mark></strong>
    </div>

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
      <div class="mb-3">
        <textarea v-model="objection.comment" rows="8" class="form-control"></textarea>
        <div v-if="errors.comment" class="error">{{ errors.comment }}</div>
      </div>
      <div>
        <input type="file" name="attachment1" class="form-control mb-3" @change="onFileInputChange($event)" />
        <input type="file" name="attachment2" class="form-control mb-3" @change="onFileInputChange($event)" />
        <input type="file" name="attachment3" class="form-control mb-3" @change="onFileInputChange($event)" />
        <input type="file" name="attachment4" class="form-control mb-3" @change="onFileInputChange($event)" />
        <input type="file" name="attachment5" class="form-control mb-3" @change="onFileInputChange($event)" />
        <div v-if="attachmentError" class="error">{{ attachmentError }}</div>
      </div>
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
      <select v-model="objection.category" class="form-select">
        <option>Report a flood risk area</option>
        <option>Suggest a potential area for measures in public space</option>
        <option>Reduce width of a street</option>
        <option>Suggest a potential area for measures in private areas</option>
        <option>Report about planned development</option>
        <option>Any other</option>
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
      <div class="mb-3">
        <label for="name">Name of the objecting person</label>
        <input type="text" id="name" v-model="objection.person.name" class="form-control" />
        <div v-if="personErrors.name" class="error">{{ personErrors.name }}</div>
      </div>
      <div class="mb-3">
        <label for="institution">Institution</label>
        <input type="text" id="institution" v-model="objection.person.institution" class="form-control" />
        <div v-if="personErrors.institution" class="error">{{ personErrors.institution }}</div>
      </div>
      <div class="mb-3">
        <label for="department">Department</label>
        <input type="text" id="department" v-model="objection.person.department" class="form-control" />
        <div v-if="personErrors.department" class="error">{{ personErrors.department }}</div>
      </div>
      <div class="mb-3">
        <label for="phone">Contact phone</label>
        <input type="text" id="phone" v-model="objection.person.phone" class="form-control" />
        <div v-if="personErrors.phone" class="error">{{ personErrors.phone }}</div>
      </div>
      <div class="mb-3">
        <label for="email">Contact e-mail</label>
        <input type="text" id="email" v-model="objection.person.email" class="form-control" />
        <div v-if="personErrors.email" class="error">{{ personErrors.email }}</div>
      </div>
      <!-- <div class="mb-3">
        <label for="phone">Phone number</label>
        <input type="tel" id="phone" v-model="objection.person.phone" class="form-control" />
        <div v-if="personErrors.phone" class="error">{{ personErrors.phone }}</div>
      </div>
      <div class="mb-3">
        <label for="id">ID number</label>
        <input type="text" id="id" v-model="objection.person.id" class="form-control" />
        <div v-if="personErrors.id" class="error">{{ personErrors.id }}</div>
      </div> -->
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
