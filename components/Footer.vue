<template>
  <v-footer app border>
    <v-row>
      <v-col cols="2">
        <v-btn
          color="primary"
          target="_blank"
          href="https://ator.io"
          variant="plain"
          size="small"
        >ATOR</v-btn>
        <v-btn
          color="primary"
          target="_blank"
          href="https://github.com/ATOR-Development"
          variant="plain"
          size="small"
        >GitHub</v-btn>
      </v-col>
      <v-col cols="2">
        <v-btn color="primary" variant="plain" size="small">
          <!-- {{ appTheme.global.name.value }} -->
          Theme
          <v-menu activator="parent" offset-y>
            <v-list>
              <v-list-item
                v-for="theme in themes"
                :key="theme"
                class="theme-menu-list-item"
                @click="changeTheme(theme)"
              >
                <div class="theme-menu-list-item-container">
                  <v-list-item-title class="text-uppercase text-caption">
                    {{ theme }}
                  </v-list-item-title>
                </div>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn>
        <v-btn
          color="primary"
          variant="plain"
          size="small"
          @click="toggleLogs"
        >
          Logs
          <v-menu
            activator="parent"
            offset-y
            :close-on-content-click="false"
          >
            <v-card flat tile elevation="0">
              <v-card-text class="logs-container text-primary">
                <v-container>
                  <v-row v-for="log in logs.logs" :key="log.timestamp">
                    <v-col cols="2">
                      <code :class="logColorClass(log.type)">
                        {{ new Date(log.timestamp).toUTCString() }}
                      </code>
                    </v-col>
                    <v-col cols="10">
                      <code :class="logColorClass(log.type)">
                        {{ log.message }}
                      </code>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-btn>
      </v-col>
      <v-spacer></v-spacer>
      <v-col cols="6">
        <v-btn
          v-for="{ label, address, url } in blockchainExplorerLinks"
          :key="address"
          color="primary"
          variant="plain"
          size="small"
        >
          {{ label }}
          <v-menu activator="parent" offset-y :close-on-content-click="false">
            <v-list>
              <v-list-item>
                <code>          
                  <a class="basic-text" target="_blank" :href="url">
                    {{ address }}
                  </a>
                </code>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn>
      </v-col>
    </v-row>
  </v-footer>
</template>

<style scoped>
.logs-container {
  max-height: 200px;
}
</style>

<script setup lang="ts">
import { useTheme } from 'vuetify'
import { useEventlogStore } from '~/stores/eventlog'

const sonarUrlBase = 'https://sonar.warp.cc/#/app/contract'
const etherscanUrlBase = 'https://goerli.etherscan.io/address'
const {
  public: {
    relayRegistryAddress,
    distributionContract,
    facilitatorContract,
    goerliAtorTokenContract
  }
} = useRuntimeConfig()

const blockchainExplorerLinks = [
  {
    label: 'Relay Registry',
    address: `ar://${relayRegistryAddress}`,
    url: `${sonarUrlBase}/${relayRegistryAddress}`
  },
  {
    label: 'Distribution',
    address: `ar://${distributionContract}`,
    url: `${sonarUrlBase}/${distributionContract}`
  },
  {
    label: 'Facilitator',
    address: `ethereum:${facilitatorContract}`,
    url: `${etherscanUrlBase}/${facilitatorContract}`
  },
  {
    label: 'Token',
    address: `ethereum:${goerliAtorTokenContract}`,
    url: `${etherscanUrlBase}/${goerliAtorTokenContract}`
  }
]

const appTheme = useTheme()

const themes = Object.keys(appTheme.themes.value)

const changeTheme = (theme: string) => {
  appTheme.global.name.value = theme
  if (localStorage) {
    localStorage.setItem('theme', theme)
  }
}

const logs = useEventlogStore()
const isLogsOpen = ref(false)
const toggleLogs = debounce(() => {
  isLogsOpen.value = !isLogsOpen.value
})
const logColorClass = (type: 'info' | 'error') => {
  return type === 'info' ? 'text-primary' : 'text-error'
}
</script>
