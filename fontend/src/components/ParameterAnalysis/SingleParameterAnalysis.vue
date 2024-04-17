<script setup>
import {ref, onMounted} from 'vue'
import LineGraph from "./LineGraph.vue";

const props = defineProps({
  x_sequence: Array,
  y_sequences: Array,
  x_label: String,
  y_label: String,
  color_sequence: Array,
  name: String
})

const sigma_graph = ref(null)
const container = ref(null)
const width = ref(800)
const height = ref(600)

onMounted(() => {
  width.value=container.value.clientWidth
  height.value=container.value.clientHeight

  window.addEventListener('resize', () => {
    width.value=container.value.clientWidth
    height.value=container.value.clientHeight
  });
})

const legend = ref({
  x: 50,
  y: 50
})

const font_size=ref(20)

const download_size = ref({
  width: 800,
  height: 600
})

function download() {
  sigma_graph.value.download(download_size.value, font_size.value, props.name);
}


</script>

<template>
  <div class="flex flex-col space-y-3 h-full">
    <div class="flex justify-end">
      <div class="flex space-x-2">
        <input v-model="font_size" class=" w-16 border rounded pl-2 pr-3 h-9" type="number">
        <input v-model="legend.x" class=" w-20 border rounded pl-2 pr-3 h-9" type="number">
        <input v-model="legend.y" class=" w-20 border rounded pl-2 pr-3 h-9" type="number">
        <button class="bg-indigo-600 rounded px-5 text-white py-1" @click="download">Download</button>
      </div>
    </div>
    <div ref="container" class="w-full h-full">
      <LineGraph ref="sigma_graph"
                 :x_sequence="x_sequence"
                 :y_sequences="y_sequences"
                 :color_sequence="color_sequence"
                 :base_width="width"
                 :base_height="height"
                 :legend_x="legend.x"
                 :legend_y="legend.y"
                 :x_label="props.x_label"
                 :y_label="props.y_label"
      />
    </div>
  </div>
</template>