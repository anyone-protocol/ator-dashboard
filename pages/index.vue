<template>
  <div class="index-page">
    <v-container>
      <v-row>
        <v-col
          v-for="{ key, label, value, icon } in topCards"
          :key="key"
          cols="3"
        >
          <v-card>
            <v-container>
              <v-row align="center">
                <v-col cols="7">
                  <div class="text-subitle-2 font-weight-bold">
                    {{ label }}
                  </div>
                  <div class="text-h6 font-weight-black">
                    {{ value }}
                  </div>
                </v-col>
                <v-col cols="5" class="text-right">
                  <v-icon :icon="icon" size="88"></v-icon>
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-card class="text-center">
            <h1>a fancy graph might go here</h1>
          </v-card>
        </v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="7">
          <v-card class="text-center" height="100%">
            <v-progress-circular size="256" color="black">
              <span class="text-h1">--%</span>
            </v-progress-circular>
            <v-card-title class="font-weight-bold">
              24h Cumulative Relay Update (%)
            </v-card-title>
          </v-card>
        </v-col>
        <v-col cols="3">
          <v-card height="100%">
            <v-card-title class="font-weight-bold text-center">$ATOR</v-card-title>
            <v-card-subtitle class="font-weight-bold">$ --</v-card-subtitle>
            <v-card-subtitle class="font-weight-bold">-- %</v-card-subtitle>
            <h5>Another fancy graph might go here</h5>
          </v-card>
        </v-col>
        <v-col cols="2">
          <v-card class="text-center" height="100%">
            <v-card-title class="font-weight-bold">PoU Pings</v-card-title>
            <v-btn v-for="ping in pouPings" :key="ping" text flat disabled>
              {{ ping }}
            </v-btn>
            <v-btn flat icon="mdi-refresh"></v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
const topCards = ref([
  {
    key: '24h-traffic',
    label: '24h Traffic',
    value: '--',
    icon: 'mdi-bus'
  },
  {
    key: 'total-users',
    label: 'Total Users',
    value: '--',
    icon: 'mdi-crowd'
  },
  {
    key: 'active-relays',
    label: 'Active Relays',
    value: '--',
    icon: 'mdi-lifebuoy'
  },
  {
    key: 'next-payout',
    label: 'Next Payout',
    value: '--',
    icon: 'mdi-ethereum'
  },
])

const pouPings = ref([
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
])
</script>
