<template>
  <v-container class="register-page">
    <v-form ref="form">
      <v-text-field
        v-model="fingerprint"
        label="Relay Fingerprint"
        placeholder="AABBCCDDEEFF11223344556677889900AABBCCDD"
        :loading="loading"
        :rules="[rules.required, rules.length40, rules.hexchars]"
        counter="40"
      />
      <v-btn
        @click="register"
        class="primary-background"
        :loading="loading"
      >Register</v-btn>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VForm } from 'vuetify/components'
import _ from 'lodash'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Register' })

const form = ref<VForm>()
const fingerprint = ref<string>('')
const loading = ref<boolean>(false)

const INVALID_FINGERPRINT =
  'Invalid fingerprint (must be 40 chars, upper-case, hexidecimal)'
const UPPER_HEX_CHARS = '0123456789ABCDEF'
const rules = {
  required: (value: any) => !!value || 'Required',
  length40: (value: any) => value.length === 40 || INVALID_FINGERPRINT,
  hexchars: (value: any) => typeof value === 'string'
    && value.split('').every(c => UPPER_HEX_CHARS.includes(c))
    || INVALID_FINGERPRINT
}

const register = _.debounce(async () => {
  const { valid } = await form.value!.validate()
  const registry = await useRelayRegistry()

  if (registry && valid) {
    loading.value = true

    try {
      // const success = await new Promise<boolean>(
      //   resolve => setTimeout(() => resolve(false), 2000)
      // )
      const success = await registry.register(fingerprint.value)
      if (success) {
        navigateTo('my-relays')
      } else {
        // TODO -> fail
        console.error('Unknown error interacting with registry contract')
      }      
    } catch (error) {
      console.error(error)
    }

    loading.value = false
  }
}, 300, { leading: true, trailing: false })
</script>
