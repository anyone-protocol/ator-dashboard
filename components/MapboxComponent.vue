<template>
  <div id="map" style="width: 100%; height: 1100px"></div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import { useTheme } from 'vuetify';
import { watch, ref, onBeforeUnmount } from 'vue';

export default {
  name: "MapboxComponent",
  props: {
    locations: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const appTheme = useTheme();
    const map = ref(null);

    const ipData = ref({
      type: "FeatureCollection",
      features: props.locations.map(location => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(location.lon), Number(location.lat)],
        },
        properties: {
          latitude: Number(location.lat)
        },
      })),
    });

    const initializeMap = () => {
      mapboxgl.accessToken = "pk.eyJ1IjoibWlkY29vbGVyIiwiYSI6ImNsbHljb3lzejB2eXYzbHA2bDF2aWU3YngifQ.RW55-cCEjahqZ2YLfJK_8w";

      const mapStyle = appTheme.global.current.value.dark
        ? "mapbox://styles/mapbox/dark-v10"
        : "mapbox://styles/mapbox/light-v10";

      map.value = new mapboxgl.Map({
        container: "map",
        style: mapStyle,
        center: [0, 30],
        zoom: 2.5,
      });

      map.value.on("load", onMapLoad);
    };

    const onMapLoad = () => {
      map.value.addSource("ipData", {
        type: "geojson",
        data: ipData.value,
      });

      map.value.addLayer({
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

      const layers = map.value.getStyle().layers;
      const layersToHide = ["state-label", "settlement-label", "poi-label"];

      for (let layer of layers) {
        if (layersToHide.includes(layer.id)) {
          map.value.setLayoutProperty(layer.id, "visibility", "none");
        }

        if (layer.type === "line") {
          map.value.setPaintProperty(layer.id, "line-color", "#007cbf");
        }
      }
    };

    watch(() => appTheme.global.current.value.dark, (newValue) => {
      const mapStyle = newValue 
        ? "mapbox://styles/mapbox/dark-v10"
        : "mapbox://styles/mapbox/light-v10";

      if (map.value && map.value.isStyleLoaded()) { 
          map.value.setStyle(mapStyle);
          map.value.once("style.load", () => {
          onMapLoad();
        });
      }
    }, { immediate: true });

    onBeforeUnmount(() => {
      if (map.value) {
          map.value.remove();
      }
    });

    return {
      appTheme,
      map,
      initializeMap,
      onMapLoad
    };
  },

  mounted() {
    this.$nextTick(function () {
      this.initializeMap();
      console.log(this.locations);
    })
  },

  beforeDestroy() {
    if (this.map) {
      this.map.remove();
    }
  },
};
</script>
