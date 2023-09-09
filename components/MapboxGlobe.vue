<template>
  <div id="map" style="width: 100%; height: 1100px"></div>
</template>

<script>
import mapboxgl from 'mapbox-gl';

export default {
  name: "MapboxGlobe",
  data() {
    return {
      map: null,
      ipData: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-118.2437, 34.0522], // Los Angeles, CA
            },
            properties: {
              latitude: 34.0522,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-73.935242, 40.73061], // New York City, NY
            },
            properties: {
              latitude: 40.73061,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-0.127758, 51.507351], // London, UK
            },
            properties: {
              latitude: 51.507351,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [77.209021, 28.613939], // New Delhi, India
            },
            properties: {
              latitude: 28.613939,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [100.493087, 13.756331], // Bangkok, Thailand
            },
            properties: {
              latitude: 13.756331,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [2.352222, 48.856614], // Paris, France
            },
            properties: {
              latitude: 48.856614,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [12.496366, 41.902783], // Rome, Italy
            },
            properties: {
              latitude: 41.902783,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [37.6173, 55.755826], // Moscow, Russia
            },
            properties: {
              latitude: 55.755826,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-46.633308, -23.55052], // Sao Paulo, Brazil
            },
            properties: {
              latitude: -23.55052,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [139.691706, 35.689487], // Tokyo, Japan
            },
            properties: {
              latitude: 35.689487,
            },
          },
        ],
      },
    };
  },
  mounted() {
    this.initializeMap();
  },
  methods: {
    initializeMap() {
      // TODO: Change token to env (hidden for now)
      mapboxgl.accessToken = "";

      this.map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/dark-v10",
        center: [0, 30],
        zoom: 2.5,
      });

      this.map.on("load", this.onMapLoad);
    },
    onMapLoad() {
      this.map.addSource("ipData", {
        type: "geojson",
        data: this.ipData,
      });

      this.map.addLayer({
        id: "points",
        type: "circle",
        source: "ipData",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "latitude"],
            0,
            "#007cbf",
            90,
            "#ffffff",
          ],
        },
      });

      const layers = this.map.getStyle().layers;
      const layersToHide = ["state-label", "settlement-label", "poi-label"];

      for (let layer of layers) {
        if (layersToHide.includes(layer.id)) {
          this.map.setLayoutProperty(layer.id, "visibility", "none");
        }

        if (layer.type === "line") {
          this.map.setPaintProperty(layer.id, "line-color", "#007cbf");
        }
      }
    },
  },
  beforeDestroy() {
    // This is needed to ensure that map resources are released when the component is destroyed
    if (this.map) {
      this.map.remove();
    }
  },
};
</script>

<style scoped>
</style>