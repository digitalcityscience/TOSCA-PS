import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';

export const useGlobalStore = defineStore('global', () => {
  let apiUrl: string = import.meta.env.VITE_API_URL || '';
  if (!apiUrl.match(/\/$/)) {
    apiUrl += '/'
  }

  let geoserverUrl: string = import.meta.env.VITE_GEOSERVER_URL || '';
  if (!geoserverUrl.match(/\/$/)) {
    geoserverUrl += '/'
  }
  const geoserverBasicAuth = btoa(`${import.meta.env.VITE_GEOSERVER_USERNAME || ''}:${import.meta.env.VITE_GEOSERVER_PASSWORD || ''}`)
  const geoserverDMPWorkspace = import.meta.env.VITE_GEOSERVER_DMP_WORKSPACE;

  const activeModule = shallowRef<Module | null>(null);
  const activeModuleStep = ref(0);

  const setActiveModule = (module: Module, step: number) => {
    activeModule.value = module;
    activeModuleStep.value = step;
  };

  const exitModule = () => {
    activeModule.value = null;
    activeModuleStep.value = 0;
  };

  return {
    apiUrl,
    geoserverUrl,
    geoserverBasicAuth,
    geoserverDMPWorkspace,
    activeModule,
    activeModuleStep,
    setActiveModule,
    exitModule
  };
});
