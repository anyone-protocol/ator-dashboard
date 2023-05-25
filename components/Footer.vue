<template>
  <v-footer app border>
    <v-row>
      <v-col cols="3">
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
      <v-col cols="3">
        <v-btn color="primary" variant="plain" size="small">
          {{appTheme.global.name.value}}
          <v-menu activator="parent" offset-y>
          <v-list>
            <v-list-item class="theme-menu-list-item" v-for="theme in themes" :key="theme" @click="changeTheme(theme)">
              <div class="theme-menu-list-item-container"><v-list-item-title>{{ theme }}</v-list-item-title></div>
            </v-list-item>
          </v-list>
        </v-menu>
        </v-btn>
      </v-col>
      <v-col cols="6" class="">
        Relay Registry:
        <code>          
          <a
            class="basic-text"
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
import { useTheme } from 'vuetify'

const { contracts } = useAppConfig()

const sonarUrlBase = 'https://sonar.warp.cc/#/app/contract'
const relayRegistrySonarUrl = `${sonarUrlBase}/${contracts.relayRegistry}`

const appTheme = useTheme()

const themes = Object.keys(appTheme.themes.value)

const changeTheme = (theme: string) => appTheme.global.name.value = theme
</script>
