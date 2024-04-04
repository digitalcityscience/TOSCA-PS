<script setup lang="ts">
import L from 'leaflet';
import { onMounted } from 'vue';
import { useMapStore } from '@/stores/map';

const initialLatitude = import.meta.env.VITE_LATITUDE;
const initialLongitude = import.meta.env.VITE_LONGITUDE;

const { initializeMap, initializeLayers } = useMapStore();

onMounted(() => {
  initializeMap('map', {
    center: new L.LatLng(initialLatitude, initialLongitude),
    zoom: 13,
    minZoom: 7,
    touchZoom: true,
    zoomControl: true, zoomAnimation: false, fadeAnimation: true, markerZoomAnimation: true
  });
  initializeLayers();
});
</script>

<template>
  <div id="map"></div>
</template>

<style lang="scss">
#map {
  height: 100%;
  font-size: 0.9rem;

  .leaflet-control-container .leaflet-top.leaflet-right {
    height: 100%;
  }

  .leaflet-bottom {
    z-index: 999;
  }

  .leaflet-bar {

    a,
    a:hover {
      width: 40px !important;
      height: 40px !important;
      line-height: 40px !important;
      font-weight: normal !important;
    }
  }

  .leaflet-control-layers {
    width: 280px;
    max-height: calc(100% - 100px);
    overflow: auto;
  }

  .leaflet-control-layers-group-name {
    font-weight: bold;
  }

  #leaflet-legend-title {
    font-weight: bold;
  }

  #leaflet-legend-container {
    background-color: white;
    padding: 10px;
    border-radius: 5px;
  }

  #leaflet-legend-content {
    max-width: 50vw;
    max-height: 30vh;
    display: flex;
    flex-wrap: wrap;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .leaflet-legend-item {
    padding: 10px 10px
  }

  .getfeatureinfo-popup {
    td {
      padding: 4px;
    }

    td:first-of-type {
      padding-right: 10px;
    }
  }
}
</style>
