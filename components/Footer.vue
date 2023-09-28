<template>
  <v-footer app border>
    <v-row>
      <v-col cols="4">
        <a
          class="basic-text"
          target="_blank"
          href="https://ator.io"
        >ATOR</a>
        |
        <a
          class="basic-text"
          target="_blank"
          href="https://github.com/ATOR-Development"
        >GitHub</a>
      </v-col>
      <v-col cols="2">
        <v-btn color="primary" variant="plain" size="small">
          {{ appTheme.global.name.value }}
          <v-menu activator="parent" offset-y>
            <v-list>
              <v-list-item
                v-for="theme in themes"  
                :key="theme"
                class="theme-menu-list-item"
                @click="changeTheme(theme)"
              >
                <div class="theme-menu-list-item-container">
                  <v-list-item-title>{{ theme }}</v-list-item-title>
                </div>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-btn>
      </v-col>
      <v-col cols="6" style="text-align:end">
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

<script setup lang="ts">
import { useTheme } from 'vuetify'

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
</script>
