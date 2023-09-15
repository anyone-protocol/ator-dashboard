import { ref, Ref } from "vue";

interface FetchError {
  message: string;
  status?: number;
}

export const useTorDetails = () => {
  const data: Ref<any | null> = ref(null);
  const error: Ref<FetchError | null> = ref(null);
  const isLoading: Ref<boolean> = ref(false);

  const API_KEY = 'cc09f9516dea4a9e804f6885921f231f';


  const getLatLonFromIPs = async (ips: string[]): Promise<any[]> => {
      try {
          const response = await $fetch('https://api.ipgeolocation.io/ipgeo-bulk?apiKey=cc09f9516dea4a9e804f6885921f231f', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ ips })
          });

          if (response && Array.isArray(response)) {
              return response;
          } else {
              throw new Error(`Unexpected response structure from IP geolocation API.`);
          }
      } catch (error) {
          console.error('Error fetching IP coordinates:', error);
          return [];
      }
  }

  const fetchDetails = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const responseData: any = await $fetch(
        "https://onionoo.torproject.org/details"
      );

      const filteredRelays = responseData.relays?.filter(
        (relay: any) => relay.contact && relay.contact.includes("@ator")
      );

      const ips = filteredRelays
        .map((relay: any) => relay.or_addresses[0]?.split(":")[0])
        .filter(Boolean);

      const batchSize = 49;
      const batches = Math.ceil(ips.length / batchSize);
      let allGeoData: any[] = [];

      for (let i = 0; i < batches; i++) {
        const batch = ips.slice(i * batchSize, (i + 1) * batchSize);
        const geoDataBatch = await getLatLonFromIPs(batch);
        allGeoData = [...allGeoData, ...geoDataBatch];
      }

      console.log(allGeoData);

      if (allGeoData) {
        data.value = allGeoData;
      } else {
        error.value = {
          message: `Error fetching Tor details`,
          status: responseData?.status || 500,
        };
        console.log(error.value);
      }
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "An error occurred while fetching Tor details";
      error.value = { message: errMsg };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    data,
    error,
    isLoading,
    fetchDetails,
  };
};
