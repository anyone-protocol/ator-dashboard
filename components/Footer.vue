<template>
  <v-footer app border>
    <v-row>
      <v-col cols="6">
        <a
          class="text-black"
          target="_blank"
          href="https://ator.io"
        >ATOR</a>
        |
        <a
          class="text-black"
          target="_blank"
          href="https://github.com/ATOR-Development"
        >GitHub</a>
      </v-col>
      <v-col cols="6" class="">
        Relay Registry:
        <code>          
          <a
            class="text-black"
            target="_blank"
            :href="relayRegistrySonarUrl"
          >
            {{ contracts.relayRegistry }}
          </a>
        </code>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup lang="ts">
const { contracts } = useAppConfig()

const sonarUrlBase = 'https://sonar.warp.cc/#/app/contract'
const relayRegistrySonarUrl = `${sonarUrlBase}/${contracts.relayRegistry}`
</script>
