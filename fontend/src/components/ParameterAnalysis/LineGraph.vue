<script setup>
import * as d3 from "d3";
import {downloadSVG, Legend} from "../functions.js";
import {ref, watch, computed, onMounted} from 'vue'

const svg = ref(null);

const props = defineProps({
  x_sequence: Array,
  y_sequences: Array,
  x_label: String,
  y_label: String,
  color_sequence: Array,
  options: Object,
  dot: Array, //dot is a color_sequence_idx and a x_sequence_idx
  base_width: Number,
  base_height: Number,
  legend_x: Number,
  legend_y: Number,
})


watch(
    () => props,
    () => {
      d3.select(svg.value).selectAll("*").remove();
      draw_graph(d3.select(svg.value), props.base_width, props.base_height)
    },
    {deep: true}
)

defineExpose({download, download_raw})
function decimals(value, decimals = rounding_decimals) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

const dragging = ref(false)
const zoom = ref(1);
const x = ref(0)
const y = ref(0)

const width = computed(() => {
  return zoom.value * props.base_width
})
const height = computed(() => {
  return zoom.value * props.base_height
})


const padding = ref({
  left: 100,
  top: 20,
  right: 30,
  bottom: 50
});


function draw_graph(svg_, width, height, font_size=20) {
  const xScaleIdx = d3.scaleLinear([0, props.x_sequence.length], [d3.min(props.x_sequence), d3.max(props.x_sequence)])
  const xScale = d3.scaleLinear([d3.min(props.x_sequence), d3.max(props.x_sequence)], [padding.value.left, width - padding.value.right])
  const yScale = d3.scaleLinear([d3.min(props.y_sequences.flat(Infinity)), d3.max(props.y_sequences.flat(Infinity))], [height - padding.value.bottom, padding.value.top])

  const line = d3.line()
      .x(function (d, i) {
        return xScale(xScaleIdx(i));
      })  // Set the x value for each data point
      .y(function (d) {
        return yScale(d);
      })

  const color = d3.scaleSequential([0, props.color_sequence.length], d3.interpolateTurbo);

  props.y_sequences.forEach((dataset, index) => {
    svg_.append('path')
        .datum(dataset) // Bind the data to the path
        .attr('fill', 'none')
        .attr('stroke', () => color(index))
        .attr('stroke-width', 1.5)
        .attr('d', line); // Use the line generator to create the "d" attribute
  });

  if (props.dot) {
    svg_.append("circle")
        .attr('fill', color(props.dot[0]))
        .attr('stroke', "white")
        .attr('stroke-width', 2)
        .attr("cx", xScale(xScaleIdx(props.dot[1])))
        .attr("cy", yScale(props.y_sequences[props.dot[0]][props.dot[1]]))
        .attr("r", 5)
  }

  svg_.append('g')
      .attr('transform', 'translate(' + 0 + ',' + 190 + ') scale(' + 1.7 + ') rotate(-90)')
      .append("text").text(props.y_label)
  svg_.append('g')
      .attr('transform', 'translate(' + (width - padding.value.right - 155) + ',' + (height - padding.value.bottom + 45) + ') scale(' + 1.8 + ')')
      .append("text").text(props.x_label)


  // Add the X Axis
  svg_.append('g')
      .attr('transform', 'translate(' + 0 + ',' + (height - padding.value.bottom) + ')') // Position at the bottom of the svg
      .call(d3.axisBottom(xScale).tickFormat((e, i) => {
        if(i%2) return d3.format("d")(e)
        else return " "
      })).selectAll("text").attr("font-size", font_size + "px");

  // Add the Y Axis
  svg_.append('g')
      .attr('transform', 'translate(' + padding.value.left + ',0)') // Position at the left of the svg
      .call(d3.axisLeft(yScale)).selectAll("text").attr("font-size", font_size + "px");

  // Add legend
  if(props.y_sequences.length > 8){
    let legend_width = width / 3.5
    let g = Legend(d3.scaleSequential([0, props.color_sequence[props.color_sequence.length - 1]], d3.interpolateTurbo), {
      title: "α",
      width: legend_width,
      titleMarginLeft: legend_width / 2 + "px",
      titleSize: "25px",
      tickFontSize: font_size,
      tickValues: d3.range(0, Math.PI / 2 + Math.PI / (2 * 8), Math.PI / (2 * 7))
    })

    svg_.append("g")
        .attr("transform", `translate(${(props.legend_x * (width + padding.value.left + padding.value.right)) / 100} ${(props.legend_y * (height + padding.value.top + padding.value.bottom)) / 100})`)
        .html(g.node().innerHTML);
  }
  else {
    // create a list of keys
    var keys = props.color_sequence

// Add one dot in the legend for each name.
    let x_bias = 150
    let y_bias = 55
    let split = true;
    let split_size = 140;
    svg_.selectAll("mydots")
        .data(keys)
        .enter()
        .append("circle")
        .attr("cx", function(d,i){
          if(i>3 && split) return x_bias + split_size
          return x_bias
        })
        .attr("cy", function(d,i){
          if(i>3 && split)return y_bias + (i-4)*25 - 6
          return y_bias + i*25 - 6
        }) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("r", 8)
        .style("fill", function(d,i){ return color(i)})

// Add one dot in the legend for each name.
    svg_.selectAll("mylabels")
        .data(keys)
        .enter()
        .append("text")
        .attr("x", function(d,i){
          if(i>3 && split) return x_bias + 20 + split_size
          return x_bias + 15
        })
        .attr("y", function(d,i){
          if(i>3 && split)return y_bias + (i-4)*25
          return y_bias + i*25
        }) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function(d,i){ return color(i)})
        .text(function(d){ return "α = " + decimals(d,2)})
        .attr("text-anchor", "left")
        .attr("font-size", 22)

  }

}

function download(download_size, font_size, filename) {
  const svg_ = d3.create("svg")
      .attr("width", download_size.width)
      .attr("height", download_size.height)
      .attr("viewBox", '0 0 ' + download_size.width + ' ' + download_size.height);

  draw_graph(svg_, download_size.width, download_size.height, font_size);
  downloadSVG(svg_, filename)
}

function download_raw(filename){
  downloadSVG(d3.select(svg.value), filename)
}

onMounted(() => {
  draw_graph(d3.select(svg.value), props.base_width, props.base_height);
})

function drag(e) {
  if (dragging.value) {
    x.value -= zoom.value * e.movementX
    y.value -= zoom.value * e.movementY
  }
}

function wheel(event) {
  event.preventDefault();
  if (event.wheelDelta > 0) zoom.value /= 1.1
  if (event.wheelDelta < 0) zoom.value *= 1.1
}

</script>

<template>
  <svg ref="svg" class="bg-white"
       :width="base_width"
       :height="base_height"
       @wheel="wheel"
       @mousedown="dragging = true"
       @mouseup="dragging = false"
       @mouseout="dragging = false"
       @mousemove="drag"
       :viewBox="x + ' ' + y + ' '+ width + ' ' + height"></svg>
</template>