<script setup>
import * as d3 from "d3";
import {ref, reactive, computed, onMounted} from 'vue'
import {tick_format} from "../functions.js"
import data from "../data_state.js";

const svg = ref(null);

const props = defineProps({
  x_sequence: Array,
  y_sequences: Array,
})

const width = ref(1000);
const height = ref(200);
const padding = ref({
  left: 30,
  top: 50,
  right: 50,
  bottom: 40
});


const xScaleIdx = d3.scaleLinear([0, props.x_sequence.length], [d3.min(props.x_sequence), d3.max(props.x_sequence)])
const xScale = d3.scaleLog([d3.min(props.x_sequence), d3.max(props.x_sequence)], [width.value/padding.value.left, width.value-width.value/padding.value.right])
const yScale = d3.scaleLog([d3.min(props.y_sequences.flat(Infinity)), d3.max(props.y_sequences.flat(Infinity))], [height.value - height.value/padding.value.bottom,height.value/padding.value.top])

const line = d3.line()
    .x(function (d, i) {
      return xScale(xScaleIdx(i));
    })  // Set the x value for each data point
    .y(function (d) {
      return yScale(d);
    })
// .curve(d3.curveBundle.beta(.5));// Set the y value for each data point


const color = d3.scaleSequential([0, data.stable_sigma.sequences.find(e => e.name === 'alpha').sequence.length],d3.interpolateTurbo);

onMounted(() => {
  props.y_sequences.forEach((dataset, index) => {
    d3.select(svg.value)
        .append('path')
        .datum(dataset) // Bind the data to the path
        .attr('fill', 'none')
        .attr('stroke', () => color(index))
        .attr('stroke-width', 1.5)
        .attr('d', line); // Use the line generator to create the "d" attribute
  });
// Add the X Axis
  d3.select(svg.value).append('g')
      .attr('transform', 'translate('+ 0 + ',' + (height.value-height.value/padding.value.bottom) + ')') // Position at the bottom of the svg
      .call(d3.axisBottom(xScale).tickFormat(tick_format));

// Add the Y Axis
  d3.select(svg.value).append('g')
      .attr('transform', 'translate(' + height.value/padding.value.left + ',0)') // Position at the left of the svg
      .call(d3.axisLeft(yScale).tickFormat(tick_format));

})

</script>

<template>
  <svg ref="svg" class="bg-white" :viewBox="'0 0 '+ width + ' ' + height"></svg>
</template>

<style scoped>

</style>