<template>
  <v-container class="my-relays-page">
    <v-row>
      <v-col cols="12">
        <v-table>
          <thead>
            <tr>
              <th class="font-weight-black">Relay Fingerprint</th>
              <th class="font-weight-black">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="claim">
              <td>{{ claim.fingerprint }}</td>
              <td>{{ 'Pending Verification' }}</td>
            </tr>
            <tr v-for="relay in myRelays" :key="relay.fingerprint">
              <td>{{ relay.fingerprint }}</td>
              <td>{{ 'Verified' }}</td>
            </tr>
            <tr v-if="!claim && myRelays.length === 0">
              No pending claims or verified relays!
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { Claim } from '~/composables/relayRegistry'

// const registry = useRelayRegistry()
// const signer = await useSigner()
const claim = ref<Claim | null>(null)
const myRelays = ref<Claim[]>([])

// if (signer) {
//   try {
//     claim.value = await registry.claims(signer.address)
//     const relays = await registry.verified()
//     myRelays.value = relays.filter(claim => claim.claimedBy === signer.address)
//   } catch (error) {
//     console.log('error reading relay registry contract', error)
//   }
// }
</script>
