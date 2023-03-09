<script setup lang="ts">
import { useGlobalStore } from '@/stores/global';
import CitizenSubmission from '@/modules/CitizenSubmission.vue';
import DeleteProject from '@/modules/DeleteProject.vue';
import ExportForms from '@/modules/ExportForms.vue';
import SetupProject from '@/modules/SetupProject.vue';
import SetupPublicReview from '@/modules/SetupPublicReview.vue';

const { setActiveModule } = useGlobalStore();

const launch = (module: Module) => {
  setActiveModule(module, 0);
};
</script>

<template>
  <nav class="navbar navbar-expand navbar-light">
    <div class="navbar-brand fw-bold">TOSCA</div>
    <ul class="navbar-nav flex-grow-1 justify-content-space-evenly">
      <li class="nav-item d-flex align-items-center">
        <button class="btn btn-success btn-lg me-2" @click="launch(CitizenSubmission)">Start submission</button>
      </li>
      <li class="nav-item flex-grow-1"></li>
      <li class="nav-item d-flex align-items-center">
        <div class=" dropdown">
          <a class="btn btn-light btn-lg dropdown-toggle" id="settings-menu" role="button" data-bs-toggle="dropdown">Setup</a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="settings-menu">
            <li>
              <a class="btn dropdown-item" @click="launch(SetupProject)">Set up a DMP</a>
            </li>
            <li>
              <a class="btn dropdown-item" @click="launch(SetupPublicReview)">Publish a DMP for review</a>
            </li>
            <li>
              <a class="btn dropdown-item" @click="launch(DeleteProject)">Delete a DMP</a>
            </li>
            <li>
              <a class="btn dropdown-item" @click="launch(ExportForms)">Export objection forms</a>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.navbar {
  padding: .5rem 1rem;
}

.navbar .navbar-brand {
  font-size: 1.3rem;
}

.navbar .navbar-nav > li {
  margin-left: 24px;
}

.navbar .dropdown-menu {
  z-index: 1001;
}

.navbar .btn-lg,
.navbar .custom-select-lg {
  font-size: inherit;
}
</style>
