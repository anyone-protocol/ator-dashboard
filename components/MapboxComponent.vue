<template>
  <div id="map" style="width: 100%; height: 1100px"></div>
</template>

<script>
import mapboxgl from 'mapbox-gl';

export default {
  name: "MapboxComponent",
  props: {
    locations: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      map: null
    };
  },
  computed: {
    ipData() {
      return {
        type: "FeatureCollection",
        features: this.locations.map(location => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [Number(location.lon), Number(location.lat)],
          },
          properties: {
            latitude: Number(location.lat)
          },
        })),
      };
    }
  },
  mounted() {
    this.initializeMap();
    console.log(this.locations)
  },
  methods: {
    initializeMap() {
      mapboxgl.accessToken = "pk.eyJ1IjoibWlkY29vbGVyIiwiYSI6ImNsbHljb3lzejB2eXYzbHA2bDF2aWU3YngifQ.RW55-cCEjahqZ2YLfJK_8w";

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
          "circle-radius": 4,
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "latitude"],
            0,
            "#0fc0b0",
            150,
            "#71d0fb",
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
