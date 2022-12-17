import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-groupedlayercontrol';
import '@/leaflet-plugins/leaflet.legend';
import '@/leaflet-plugins/leaflet.getfeatureinfo';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { geoserver } from '@/api/geoserver';
import { useGlobalStore } from './global';

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
const hot = L.tileLayer('https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors; Humanitarian map style by <a href="https://www.hotosm.org/">HOT</a>'
});

const geoserverWorkspaces = ['boundary', 'agri-forestry', 'infrastructure', 'UMP'];

export const useMapStore = defineStore('map', () => {
  const { geoserverUrl, geoserverDMPWorkspace } = useGlobalStore();

  const map = ref<L.Map>();
  const drawings = ref<L.FeatureGroup>();
  const legend = ref<L.Control.Legend>();
  const baseLayers = ref<Record<string, L.Layer>>({
    'OSM Standard style': osm,
    'OSM Humanitarian style': hot
  });
  const overlayMaps = ref<Record<string, L.Layer>>({});
  const dmps = ref<L.LayerGroup>();

  const initializeMap = (containerId: string, options: L.MapOptions) => {
    map.value = new L.Map(containerId, options);

    /* Map legend */
    legend.value = L.control.legend({ position: 'bottomleft' });
    legend.value.addTo(map.value);

    map.value.on('overlayadd', (event: L.LayerEvent & { name: string }) => {
      legend.value?.toggleLegendForLayer(event.layer as L.TileLayer.WMS, true, event.name);
    });

    map.value.on('overlayremove', (event: L.LayerEvent & { name: string }) => {
      legend.value?.toggleLegendForLayer(event.layer as L.TileLayer.WMS, false);
    });

    // /* Drawing tool */
    // drawings.value = L.featureGroup().addTo(map.value);

    // map.value.addControl(new L.Control.Draw({
    //   edit: {
    //     featureGroup: drawings.value
    //   },
    //   draw: {
    //     polygon: {
    //       showArea: true
    //     },
    //     polyline: false,
    //     rectangle: false,
    //     circle: false,
    //     marker: false
    //   }
    // }));

    // map.value.on(L.Draw.Event.CREATED, event => {
    //   drawings.value?.addLayer(event.layer);
    // });

    /* Scale bar */
    L.control.scale({ maxWidth: 300, position: 'bottomright' }).addTo(map.value);

    hot.addTo(map.value);
  };

  const initializeLayers = async () => {
    if (!map.value) {
      console.error('Failed to initialize map layers: map is not defined');
      return;
    }

    const layerControl = L.control.groupedLayers(baseLayers.value, {}, { position: 'topright', collapsed: false }).addTo(map.value);

    for (const workspace of geoserverWorkspaces) {
      const layerInfos = [];

      for (const layer of await geoserver.GetWmsLayers(workspace)) {
        layerInfos.push(await geoserver.GetWmsLayer(workspace, layer.name));
      }

      for (const layer of await geoserver.GetFeatureTypes(workspace)) {
        layerInfos.push(await geoserver.GetFeatureType(workspace, layer.name));
      }

      for (const layerInfo of layerInfos) {
        if (!layerInfo.enabled) {
          continue;
        }

        const wms = wmsToLayer(workspace, layerInfo);
        overlayMaps.value[layerInfo.name] = wms;

        layerControl.addOverlay(wms, layerInfo.title, workspace);
      }
    }

    dmps.value = L.layerGroup();
  }

  const addDMP = async (layerName: string) => {
    const layerInfo = await geoserver.GetFeatureType(geoserverDMPWorkspace, layerName);
    const layer = wmsToLayer(geoserverDMPWorkspace, layerInfo);

    dmps.value?.addLayer(layer);

    return layer;
  };

  const clearDMPs = () => {
    dmps.value?.clearLayers();
  };

  const wmsToLayer = (workspace: string, layerInfo: GS.WMSLayerInfo | GS.FeatureTypeInfo) => {
    return L.tileLayer.wms(
      getWmsBaseUrl(workspace),
      {
        layers: layerInfo.name,
        format: 'image/png',
        transparent: true
      }
    );
  };

  const getWmsBaseUrl = (workspace: string) => {
    return `${geoserverUrl}${workspace}/wms`;
  };

  return {
    map,
    baseLayers,
    overlayMaps,
    dmps,
    drawings,
    initializeMap,
    initializeLayers,
    addDMP,
    clearDMPs
  };
})
