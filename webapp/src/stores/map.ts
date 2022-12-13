import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-groupedlayercontrol';
import '@/leaflet-plugins/leaflet.legend';
import '@/leaflet-plugins/leaflet.getfeatureinfo';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { geoserverREST } from '@/api/geoserver';
import { useGlobalStore } from './global';

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const hot = L.tileLayer('https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors; Humanitarian map style by <a href="https://www.hotosm.org/">HOT</a>'
});

const geoserverWorkspaces = ['boundary', 'agri-forestry', 'infrastructure', 'UMP'];

export const useMapStore = defineStore('map', () => {
  const globalStore = useGlobalStore();

  const map = ref<L.Map>();
  const drawings = ref<L.FeatureGroup>();
  const legend = ref<L.Control.Legend>();
  const baseLayers = ref<Record<string, L.Layer>>({
    'OSM Standard style': osm,
    'OSM Humanitarian style': hot
  });
  const overlayMaps = ref<Record<string, L.LayerGroup>>({});

  const initializeMap = (containerId: string, options: L.MapOptions) => {
    map.value = new L.Map(containerId, options);

    /* Map legend */
    legend.value = L.control.legend({ position: 'bottomleft' });
    legend.value.addTo(map.value);

    map.value.on('overlayadd', (event: any) => {
      if (event.layer._layers) {
        const layer = Object.values(event.layer._layers)[0];
        legend.value?.toggleLegendForLayer(layer as L.TileLayer.WMS, true, event.name);
      }
    });

    map.value.on('overlayremove', (event: any) => {
      if (event.layer._layers) {
        const layer = Object.values(event.layer._layers)[0];
        legend.value?.toggleLegendForLayer(layer as L.TileLayer.WMS, false);
      }
    });

    /* Drawing tool */
    drawings.value = L.featureGroup().addTo(map.value);

    map.value.addControl(new L.Control.Draw({
      edit: {
        featureGroup: drawings.value
      },
      draw: {
        polygon: {
          showArea: true
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false
      }
    }));

    map.value.on(L.Draw.Event.CREATED, event => {
      drawings.value?.addLayer(event.layer);
    });

    /* Scale bar */
    L.control.scale({ maxWidth: 300, position: 'bottomright' }).addTo(map.value);

    hot.addTo(map.value);
  };

  const initializeLayers = async () => {
    if (!map.value) {
      console.error('Failed to initialize map layers: map is not defined');
      return;
    }

    const groupedOverlays: { [workspace: string]: { [layerName: string]: L.LayerGroup } } = {};

    for (const workspace of geoserverWorkspaces) {
      groupedOverlays[workspace] = {};

      // Raster layers
      const wmsLayers = await geoserverREST.GetWmsLayers(workspace);

      for (const wmsLayer of wmsLayers) {
        const wmsLayerInfo = await geoserverREST.GetWmsLayer(workspace, wmsLayer.name);

        if (!wmsLayerInfo.enabled) {
          continue;
        }

        const wms = L.tileLayer.wms(
          getWmsBaseUrl(workspace),
          {
            layers: wmsLayerInfo.name,
            format: 'image/png',
            transparent: true
          }
        );
        overlayMaps.value[wmsLayerInfo.name] = L.layerGroup([wms]);
        groupedOverlays[workspace][wmsLayerInfo.title] = L.layerGroup([wms]);
      }

      // Vector layers
      const featureTypes = await geoserverREST.GetFeatureTypes(workspace);

      for (const featureType of featureTypes) {
        const featureTypeInfo = await geoserverREST.GetFeatureType(workspace, featureType.name);

        if (!featureTypeInfo.enabled) {
          continue;
        }

        const wms = L.tileLayer.wms(
          getWmsBaseUrl(workspace),
          {
            layers: featureTypeInfo.name,
            format: 'image/png',
            transparent: true
          }
        );
        overlayMaps.value[featureTypeInfo.name] = L.layerGroup([wms]);
        groupedOverlays[workspace][featureTypeInfo.title] = L.layerGroup([wms]);
      }
    }

    L.control.groupedLayers(baseLayers.value, groupedOverlays, { position: 'topright', collapsed: false }).addTo(map.value);
  };

  const getWmsBaseUrl = (workspace: string) => {
    return `${globalStore.geoserverUrl}${workspace}/wms`;
  }

  return {
    map,
    baseLayers,
    overlayMaps,
    drawings,
    initializeMap,
    initializeLayers
  };
})
