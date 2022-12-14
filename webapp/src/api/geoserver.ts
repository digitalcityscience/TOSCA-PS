import { useGlobalStore } from '@/stores/global';

export const geoserver = {
  baseUrl() {
    return `${useGlobalStore().geoserverUrl}rest/`;
  },

  fetchWithCredentials: (url: string) => {
    return fetch(url, { headers: new Headers({
      'Authorization': `Basic ${useGlobalStore().geoserverBasicAuth}`
    }) });
  },

  GetFeatureTypes: async (workspaceName: string) => {
    const response = await geoserver.fetchWithCredentials(
      `${geoserver.baseUrl()}workspaces/${workspaceName}/featuretypes.json`
    );
    const data: GS.FeatureTypes = await response.json();
    return data.featureTypes?.featureType || [];
  },

  GetFeatureType: async (workspaceName: string, featureTypeName: string) => {
    const response = await geoserver.fetchWithCredentials(
      `${geoserver.baseUrl()}workspaces/${workspaceName}/featuretypes/${featureTypeName}.json`
    );
    const data: GS.FeatureType = await response.json();
    return data.featureType;
  },

  GetWmsLayers: async (workspaceName: string) => {
    const response = await geoserver.fetchWithCredentials(
      `${geoserver.baseUrl()}workspaces/${workspaceName}/wmslayers.json`
    );
    const data: GS.WMSLayers = await response.json();
    return data.wmsLayers?.wmsLayer || [];
  },

  GetWmsLayer: async (workspaceName: string, wmslayerName: string) => {
    const response = await geoserver.fetchWithCredentials(
      `${geoserver.baseUrl()}workspaces/${workspaceName}/wmslayers/${wmslayerName}.json`
    );
    const data: GS.WMSLayer = await response.json();
    return data.wmsLayer;
  },
};
