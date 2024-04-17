<script setup>
import {ref, reactive, computed, onMounted} from 'vue'
import LineGraph from "./LineGraph.vue";
import data from "../data_state.js";
import SingleParameterAnalysis from "./SingleParameterAnalysis.vue";

let alpha_sequence = data.stable_kappa.sequences.find(e => e.name === 'alpha').sequence

let kappa_sequence = data.stable_sigma.sequences.find(e => e.name === 'kappa').sequence
const stable_sigmas = data.stable_sigma.values

const sigma_sequence = data.stable_kappa.sequences.find(e => e.name === 'sigma').sequence
let stable_kappas = data.stable_kappa.values


</script>

<template>
  <div class="flex w-full h-full items-start gap-x-8 px-4 py-10 sm:px-6 lg:px-8">
    <main class="flex w-full bg-stone-200 space-x-5 h-full">
      <!-- Main area -->
      <div class="flex flex-col space-y-2 w-1/2 h-full">
        <SingleParameterAnalysis
            :x_sequence="kappa_sequence"
            :y_sequences="stable_sigmas"
            :color_sequence="alpha_sequence"
            name="stable_sigma_graph"
            x_label="κ"
            y_label="σ*"
        />
      </div>
      <div class="flex flex-col space-y-2 w-1/2 h-full">
        <SingleParameterAnalysis
            :x_sequence="sigma_sequence"
            :y_sequences="stable_kappas"
            :color_sequence="alpha_sequence"
            name="stable_kappa_graph"
            x_label="σ"
            y_label="κ*"
        />
      </div>
    </main>
  </div>
</template>