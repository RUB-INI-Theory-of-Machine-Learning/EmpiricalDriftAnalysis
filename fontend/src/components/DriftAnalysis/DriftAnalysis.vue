<script setup>
import {ref, onMounted, onUnmounted, computed} from 'vue'
import * as _ from 'lodash'
import katex from 'katex';
import {TvIcon} from '@heroicons/vue/24/outline';

import data from "../data_state.js";
import {stable_sigma, stable_kappa} from "../functions.js";

import ParameterGraph from "./ParameterGraph.vue";
import HeatMap from "./HeatMap.vue";
import LineGraph from "../ParameterAnalysis/LineGraph.vue";
import ColorLegend from "./ColorLegend.vue";

const potential_vector = ref([[true, 1], [true, 0.52], [true, 0.21]])

const alpha_idx = ref(0);
const kappa_idx = ref(0);
const sigma_idx = ref(0);

/* Leftover variables */
const min_max = ref([0, 0]);
const potential_idx = ref(0);


function change_potential_vector(i) {
  potential_vector.value[i][0] = !potential_vector.value[i][0];
}

let rounding_decimals = 4;

function decimals(value, decimals = rounding_decimals) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

function keydown(e) {
  switch (e.key) {
    case "PageUp":
      alpha_idx.value = (alpha_idx.value + data.alpha_sequence.length + 1) % data.alpha_sequence.length;
      e.preventDefault()
      break;
    case "PageDown":
      alpha_idx.value = (alpha_idx.value + data.alpha_sequence.length - 1) % data.alpha_sequence.length;
      e.preventDefault()
      break;
    case "ArrowUp":
      if (sigma_idx.value < data.sigma_sequence.length - 1) sigma_idx.value += 1;
      e.preventDefault()
      break;
    case "ArrowDown":
      if (sigma_idx.value > 0) sigma_idx.value -= 1;
      e.preventDefault()
      break;
    case "ArrowLeft":
      if (kappa_idx.value > 0) kappa_idx.value -= 1;
      e.preventDefault()
      break;
    case "ArrowRight":
      if (kappa_idx.value < data.kappa_sequence.length - 1) kappa_idx.value += 1;
      e.preventDefault()
      break;
    default:
      // Handle other keys
      break;
  }
}

/* */
onMounted(() => document.addEventListener('keydown', keydown))
onUnmounted(() => document.removeEventListener('keydown', keydown));

const tabs = [
  {name: 'Navigation', code: 'navigation'},

  {name: 'Potential Function', code: 'potential_function'},

  {name: 'Data', code: 'data'},
]

const current_tab = ref("data")

const calculating = ref(false)

function recalc() {
  calculating.value = true
  setTimeout(() => {
    data.calc_data_map(potential_vector.value)
    calculating.value = false;
  }, 100);

}

function potential_vector_changed() {
  return !_.isEqual(potential_vector.value, data.potential_vector.value)
}

data.asymptotic_trend(0, "kappa", 1, 10)

const state = ref("state") // [state, follow_up_success, follow_up_no_success]

const side_graph = ref("state_graph") // [state_graph, kappa_graph, sigma_graph]

// a computed ref
const cur_state = computed(() => {
  if (state.value === "state") {
    return [
      data.alpha_sequence[alpha_idx.value],
      data.kappa_sequence[kappa_idx.value],
      data.sigma_sequence[sigma_idx.value]
    ]
  }
  if (state.value === "success") {
    return [
      data.raw_data.success_mean[alpha_idx.value][kappa_idx.value][sigma_idx.value][0],
      data.raw_data.success_mean[alpha_idx.value][kappa_idx.value][sigma_idx.value][1],
      data.raw_data.success_mean[alpha_idx.value][kappa_idx.value][sigma_idx.value][2]
    ]
  }
  if (state.value === "no_success") {
    return [
      data.raw_data.no_success_mean[alpha_idx.value][kappa_idx.value][sigma_idx.value][0],
      data.raw_data.no_success_mean[alpha_idx.value][kappa_idx.value][sigma_idx.value][1],
      data.raw_data.no_success_mean[alpha_idx.value][kappa_idx.value][sigma_idx.value][2]
    ]
  }
})


const download_size = ref({
  width: 800,
  height: 600
})
const heatmap = ref(null)

const options = ref({
  labels: true,
  fontsize: 20,
  ticklabels: true,
  ticks: true
})



function download_heatmap() {
  heatmap.value.download(
      download_size.value,
      options.value,
      data.data_mode.value + (data.data_mode.value === "influence" ? "=" + (data.potential_term_idx.value + 1) : "") + "-"
      + data.scale_mode.value + "-"
      + "terms=" + data.potential_vector.value.reduce((s, e, i) => {
        if (e[0]) s += i + 1;
        return s;
      }, "") + "-"
      + "alpha=" + alpha_idx.value
      + ".svg"
  )
}

</script>

<template>
  <div class="flex gap-x-8 px-10 py-5">
    <div class="w-full space-y-5">
      <!-- Main area -->
      <div class="flex flex-col h-full">
        <HeatMap ref="heatmap"
                 :potential_vector="potential_vector"
                 :alpha_idx="alpha_idx"
                 :kappa_idx="kappa_idx"
                 :sigma_idx="sigma_idx"
                 @update:position="kappa_idx=$event[0];sigma_idx=$event[1]"
                 class="h-full"/>
<!--                <ColorLegend class="w-full" :drift_scale="data.scales.drift" :no_drift_scale="data.scales.no_drift"/>-->
      </div>

    </div>
    <aside style="width: 560px" class="">
      <div style="height: 550px; width:500px">
        <div class="flex justify-between">
          <div>
            <span v-html="katex.renderToString('\\kappa^*')"/> =
            <span>{{ decimals(stable_kappa(data, cur_state[0], cur_state[2])) }}</span>
          </div>
          <div>
            <span v-html="katex.renderToString('\\sigma^*')"/> =
            <span>{{ decimals(stable_sigma(data, cur_state[0], cur_state[1])) }}</span>
          </div>
        </div>
        <ParameterGraph v-if="side_graph === 'state_graph'" class="border border-gray-500"
                        :base_width="500"
                        :base_height="400"
                        :alpha_arc="cur_state[0]"
                        :kappa="cur_state[1]"
                        :sigma="cur_state[2]"
        />
        <div v-if="side_graph === 'kappa_graph'" class="">
          <LineGraph
              ref="kappa_graph"
              :base_width="500"
              :base_height="400"
              :x_sequence="data.kappa_sequence"
              :y_sequences="data.kappa_slice(sigma_idx)"
              :color_sequence="data.alpha_sequence"
              :options="{x_tick_offset: 7,y_tick_offset: 7}"

              x_label="κ"
              y_label="Drift"
          />
<!--          :dot="[alpha_idx, kappa_idx]"-->
          <button @click="$refs.kappa_graph.download_raw('kappa_graph-' + sigma_idx)">Download</button>
        </div>
        <div v-if="side_graph === 'sigma_graph'" class="">
          <LineGraph ref="sigma_graph"
                     :base_width="500"
                     :base_height="400"
                     :x_sequence="data.sigma_sequence"
                     :y_sequences="data.sigma_slice(kappa_idx)"
                     :color_sequence="data.alpha_sequence"
                     :options="{x_tick_offset: 7,y_tick_offset: 7}"
                     x_label="σ"
                     y_label="Drift"
          />
          <!--                     :dot="[alpha_idx, sigma_idx]"-->
          <button @click="$refs.sigma_graph.download_raw('sigma_graph-' + kappa_idx)">Download</button>
        </div>
        <div class="flex justify-center mt-3">
          <div class="flex flex-col">
            <div class="">
            <span class="" v-for="(drift_el, i) in data.raw_data.drift[alpha_idx][kappa_idx][sigma_idx]">
              <span v-if="i > 0">+</span>
              <span :class="['px-3', potential_vector[i][0] ? '' :'text-gray-400']">
              <span class="font-semibold" :title="potential_vector[i][1] * drift_el">{{
                  decimals(potential_vector[i][1] * drift_el, 3)
                }}</span>
                <span class="ml-1">({{
                    Math.round(Math.abs(data.data_map.influence[alpha_idx][kappa_idx][sigma_idx][i]) * 100)
                  }}%)</span>
              </span>
            </span>
            </div>
            <div class="flex justify-center mt-5 font-semibold text-lg">
              <span :title="data.map(alpha_idx, kappa_idx, sigma_idx)">{{
                  decimals(data.map(alpha_idx, kappa_idx, sigma_idx))
                }}</span>
              <span v-if="'precision' in data.raw_data"
                    :title="data.raw_data.precision[alpha_idx][kappa_idx][sigma_idx].reduce((a, c) => a + c, 0)"
                    class="text-sm  ml-2 leading-6 text-gray-700 sm:mt-0">
                  (+{{ decimals(data.raw_data.precision[alpha_idx][kappa_idx][sigma_idx].reduce((a, c) => a + c, 0)) }})
                </span>
            </div>
          </div>
        </div>
        <hr class="w-full bg-gray-300 border-gray-300 border mt-5 mb-5">
      </div>

      <div style="height: calc(100vh - 700px)" class="flex flex-col overflow-auto">
        <div class="py-5 px-2">
          <div v-if="current_tab === 'data'" class="overflow-auto flex flex-col">
            <dl class="divide-y divide-gray-300">
              <div class="px-4 py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-0" @click="state='state'">
                <dt class="flex font-medium leading-6 text-gray-900">
                  <TvIcon v-if="state==='state'" class="w-6 h-6 text-indigo-600 my-auto mr-3"/>
                  <div class="mt-1 mr-5">State</div>
                  <span class="text-xl"
                        v-html="katex.renderToString('(\\alpha \\:  \\kappa \\: \\sigma)')"></span>
                </dt>
                <dd class="flex mt-1 leading-6 text-xl text-gray-700 space-x-3 sm:mt-0">
                  (
                  <div>{{ decimals(data.alpha_sequence[alpha_idx]) }}</div>
                  <div>{{ decimals(data.kappa_sequence[kappa_idx]) }}</div>
                  <div>{{ decimals(data.sigma_sequence[sigma_idx]) }}</div>
                  )
                </dd>
              </div>
              <div class="flex px-4 py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-0" @click="state='success'">
                <dt class="flex text-sm font-medium leading-6 text-gray-900">
                  <TvIcon v-if="state==='success'" class="w-6 h-6 text-indigo-600 my-auto mr-3"/>
                  <span>Ø Success follow-up-state</span>
                </dt>
                <dd class="flex mt-1 leading-6 text-xl text-gray-700 space-x-3 sm:mt-0">
                  (
                  <div>{{ decimals(data.raw_data.success_mean[alpha_idx][kappa_idx][sigma_idx][0]) }}</div>
                  <div>{{ decimals(data.raw_data.success_mean[alpha_idx][kappa_idx][sigma_idx][1]) }}</div>
                  <div>{{ decimals(data.raw_data.success_mean[alpha_idx][kappa_idx][sigma_idx][2]) }}</div>
                  )
                </dd>
              </div>
              <div class="flex px-4 py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-0" @click="state='success'">
                <dt class="flex text-sm font-medium leading-6 text-gray-900">
                  <span>Ø Success follow-up-state (std)</span>
                </dt>
                <dd class="flex mt-1 leading-6 text-xl text-gray-700 space-x-3 sm:mt-0">
                  (
                  <div>{{ decimals(data.raw_data.success_std[alpha_idx][kappa_idx][sigma_idx][0]) }}</div>
                  <div>{{ decimals(data.raw_data.success_std[alpha_idx][kappa_idx][sigma_idx][1]) }}</div>
                  <div>{{ decimals(data.raw_data.success_std[alpha_idx][kappa_idx][sigma_idx][2]) }}</div>
                  )
                </dd>
              </div>
              <div class="flex px-4 py-6 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-0" @click="state='no_success'">

                <dt class="flex text-sm font-medium leading-6 text-gray-900">
                  <TvIcon v-if="state==='no_success'" class="w-6 h-6 text-indigo-600 my-auto mr-3"/>
                  <span>Ø No success follow-up-state</span>
                </dt>
                <dd class="flex mt-1 leading-6 text-xl text-gray-700 space-x-3 sm:mt-0">
                  (
                  <div>{{ decimals(data.raw_data.no_success_mean[alpha_idx][kappa_idx][sigma_idx][0]) }}</div>
                  <div>{{ decimals(data.raw_data.no_success_mean[alpha_idx][kappa_idx][sigma_idx][1]) }}</div>
                  <div>{{ decimals(data.raw_data.no_success_mean[alpha_idx][kappa_idx][sigma_idx][2]) }}</div>
                  )
                </dd>
              </div>
              <div v-if="'success' in data.raw_data" class="px-4 py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-0">
                <dt class="text-sm font-medium leading-6 text-gray-900">Success Rate (total)</dt>
                <dd class="mt-1 text-xl text-gray-700 space-x-3 leading-6 sm:mt-0">
                  {{ data.raw_data.success[alpha_idx][kappa_idx][sigma_idx] / data.raw_data.batch_size }}
                  ({{ data.raw_data.success[alpha_idx][kappa_idx][sigma_idx] }})
                </dd>
              </div>
            </dl>
          </div>
          <div v-if="current_tab === 'navigation'" class="overflow-auto">
            <div class="">
              <div class="space-x-5 flex justify-between mb-8">
                <button @click="side_graph = 'state_graph'"
                        class="border border-blue-600 w-full">
                  State Graph
                </button>
                <button @click="side_graph = 'kappa_graph'"
                        class="border border-blue-600 w-full">
                  Kappa Graph
                </button>
                <button @click="side_graph = 'sigma_graph'"
                        class="border border-blue-600 w-full">
                  Sigma Graph
                </button>
              </div>
            </div>
            <div class="space-x-5 flex justify-between mb-8">
              <button
                  @click="alpha_idx = (alpha_idx + data.alpha_sequence.length - 1) % data.alpha_sequence.length"
                  class="border border-indigo-600 hover:bg-indigo-300 w-1/2">Previous Angle
              </button>
              <button @click="alpha_idx = (alpha_idx + 1) % data.alpha_sequence.length;"
                      class="border border-indigo-600 hover:bg-indigo-300 w-1/2">
                Next Angle
              </button>
            </div>
            <div class="space-x-5 flex justify-between mb-8">
              <button
                  @click="data.set_data_mode('drift')"
                  :class="[ data.data_mode.value === 'drift' ? 'bg-indigo-600 text-white font-semibold' : '' ,'border border-indigo-600 w-1/2']">
                Drift
              </button>
              <button @click="data.set_data_mode('influence')"
                      :class="[ data.data_mode.value === 'influence' ? 'bg-indigo-600 text-white font-semibold' : '' ,'border border-indigo-600 w-1/2']">
                Influence
              </button>
            </div>
            <div class="space-x-5 flex justify-between mb-8">
              <button
                  @click="data.set_scale_mode('values')"
                  :class="[ data.scale_mode.value === 'values' ? 'bg-indigo-600 text-white font-semibold' : '' ,'border border-indigo-600 w-1/2']">
                Values
              </button>
              <button @click="data.set_scale_mode('quantiles')"
                      :class="[ data.scale_mode.value === 'quantiles' ? 'bg-indigo-600 text-white font-semibold' : '' ,'border border-indigo-600 w-1/2']">
                Quantiles
              </button>
            </div>

            <div class="flex flex-col space-y-5">
              <div class="flex justify-between">
                <div class="no_capture relative">
                  <input v-model="download_size.width" class=" w-20 border rounded pl-2 pr-3 h-9" type="number">
                  <div class="absolute -inset-y-2 -right-1 flex items-center pr-3 pointer-events-none">
                    <span class="text-gray-500 sm:text-sm ">px</span>
                  </div>
                </div>
                <div class=" no_capture relative">
                  <input v-model="download_size.height" class=" w-20 border rounded pl-2 pr-3 h-9" type="number">
                  <div class="absolute -inset-y-2 -right-1 flex items-center pr-3 pointer-events-none">
                    <span class="text-gray-500 sm:text-sm ">px</span>
                  </div>
                </div>
                <div class=" no_capture relative">
                  <input v-model="options.fontsize" class=" w-14 border rounded pl-2 pr-3 h-9" type="number">
                  <div class="absolute -inset-y-2 -right-1 flex items-center pr-3 pointer-events-none">
                    <span class="text-gray-500 sm:text-sm ">px</span>
                  </div>
                </div>
                <button
                    :class="[ options.labels ? 'text-white bg-indigo-600': 'text-indigo-600', 'border-2 border-indigo-600 rounded px-2']"
                    @click="options.labels = !options.labels">L
                </button>
                <button
                    :class="[ options.ticklabels ? 'text-white bg-indigo-600': 'text-indigo-600', 'border-2 border-indigo-600 rounded px-2']"
                    @click="options.ticklabels = !options.ticklabels">TL
                </button>
                <button
                    :class="[ options.ticks ? 'text-white bg-indigo-600': 'text-indigo-600', 'border-2 border-indigo-600 rounded px-2']"
                    @click="options.ticks = !options.ticks">T
                </button>
                <button class="bg-indigo-600 rounded px-5 ml-5 text-white py-1" @click="download_heatmap()">Download
                </button>
              </div>
              <div class="flex justify-end">
              </div>
            </div>


          </div>
          <div v-if="current_tab === 'potential_function'">
            <div class="flex flex-col space-y-1">
              <div v-for="(potential_function, i) in data.raw_data.potential_function">
                <div class="relative flex items-start">
                  <div class="flex flex-col space-y-2 py-1 items-center">
                    <input v-model="potential_vector[i][0]" type="checkbox" :disabled="data.potential_term_flag"
                           class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"/>
                    <input v-if="data.potential_term_flag && potential_vector[i][0]" type="radio"
                           :checked="data.potential_term_idx.value === i"
                           @click="data.set_potential_term_idx(i)"
                           class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
                  </div>
                  <div class="ml-3 text-sm leading-6 w-full">
                    <label class="text-lg w-full text-gray-900 flex justify-between">
                      <span v-html="katex.renderToString(potential_function[0])"></span>
                      <input v-model="potential_vector[i][1]"
                             class="block rounded-md border-0 py-1 px-2 text-gray-900 shadow-sm ring-1 ring-inset
                           ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-300
                           sm:text-sm sm:leading-6 w-20"
                             type="number">
                    </label>
                    <pre class="w-full text-gray-500 text-wrap">{{ potential_function[1] }}</pre>
                  </div>
                </div>
                <button :class="[i === potential_idx ? 'bg-blue-100' : '', 'text-left']"/>
              </div>
            </div>

            <div class="flex justify-end">
              <button v-if="potential_vector_changed()"
                      class="h-12 py-2 border border-indigo-600  w-1/2 text-center bg-indigo-600 text-white font-semibold"
                      @click="recalc();">
                <span v-if="calculating" class="my-auto ">Recalculating...</span>
                <span v-else class="my-auto">Recalculate</span>
                <span v-if="calculating" class="loader ml-2 -mb-1"></span>
              </button>
            </div>
          </div>
        </div>
        <div v-if="false" class="">
          <div class="space-x-5 flex justify-between mb-8">
            <button @click="jump_to_global('max');"
                    class="border border-blue-600 w-full">Global minimal drift
            </button>
            <button @click="jump_to_local('max');"
                    class="border border-blue-600 w-full">
              Local minimal drift
            </button>
          </div>
          <div class="space-x-5 flex justify-between mb-8">
            <button @click="jump_to_global('min');"
                    class="border border-blue-600 w-full">Global maximal drift
            </button>
            <button @click="jump_to_local('min');"
                    class="border border-blue-600 w-full">
              Local maximal drift
            </button>
          </div>
        </div>
      </div>
      <div>
        <div class="border-b border-gray-200">
          <hr class="w-full bg-gray-300 border-gray-300 border mb-2">
          <nav class="-mb-px flex w-full" aria-label="Tabs">
            <a v-for="tab in tabs" @click="current_tab===tab.code ? current_tab = 'data' : current_tab=tab.code"
               :class="[tab.code === current_tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700', 'cursor-pointer w-full border-b-2 py-2 px-1 text-center text-sm font-medium']"
            >{{ tab.name }}</a>
          </nav>
        </div>
      </div>
    </aside>
  </div>
</template>

<style>
pre {
  white-space: pre-wrap; /* Since CSS 2.1 */
  white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
  word-wrap: break-word; /* Internet Explorer 5.5+ */
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}

.loader {
  width: 18px;
  height: 14px;
  margin-top: 10px;
  display: inline-block;
  position: relative;
  background: #FFF;
  border-radius: 15% 15% 35% 35%;
}

.loader::after {
  content: '';
  box-sizing: border-box;
  position: absolute;
  left: 17px;
  top: 2px;
  border: 2px solid #FFF;
  width: 8px;
  height: 8px;
  border-radius: 0 2px 2px 0;
}

.loader::before {
  content: '';
  position: absolute;
  width: 1px;
  height: 5px;
  color: #FFF;
  top: -7px;
  left: 5px;
  box-sizing: border-box;
  animation: animloader 1s ease infinite;
}

@keyframes animloader {
  0% {
    box-shadow: 1px 0 rgba(255, 255, 255, 0), 4px 0 rgba(255, 255, 255, 0.3), 8px 0 rgba(255, 255, 255, 0);
  }
  50% {
    box-shadow: 1px -2px rgba(255, 255, 255, 0.5), 4px -1px rgba(255, 255, 255, 0.5), 8px -1px rgba(255, 255, 255, 0.6);
  }
  100% {
    box-shadow: 1px -4px rgba(255, 255, 255, 0), 4px -2px rgba(255, 255, 255, 0), 8px -2px rgba(255, 255, 255, 0);
  }
}
</style>