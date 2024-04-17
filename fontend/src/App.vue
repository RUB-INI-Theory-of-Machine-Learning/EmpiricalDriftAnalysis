<script setup>
import {ref} from 'vue'
import DriftAnalysis from './components/DriftAnalysis/DriftAnalysis.vue';
import ParameterAnalysis from "./components/ParameterAnalysis/ParameterAnalysis.vue";

const state = ref("stable"); // drift, stable


</script>


<template>
  <div class="flex flex-col bg-stone-50 h-screen">
    <div class="flex w-full h-full items-start px-4 py-5 sm:px-6 lg:px-8 ">
      <main class="flex flex-col bg-stone-200 w-full h-full">
        <!-- Main area -->
        <DriftAnalysis v-if="state === 'drift'"/>
        <ParameterAnalysis v-if="state === 'stable'" />
      </main>

    </div>
    <div class="flex flex-col h-12 justify-center">
      <div class="flex space-x-5 px-10 ">
        <button @click="state = 'drift'">Drift Analysis</button>
        <button @click="state = 'stable'">Parameter Analysis</button>
      </div>
    </div>
  </div>
</template>

