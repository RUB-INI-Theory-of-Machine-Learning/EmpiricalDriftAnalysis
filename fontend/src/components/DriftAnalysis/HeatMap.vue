<script setup>
import * as d3 from "d3";
import {tick_format, downloadSVG} from "../functions.js"
import {onMounted, watch, ref} from "vue";
import data from "../data_state.js";


const props = defineProps({
  alpha_idx: Number,
  kappa_idx: Number,
  sigma_idx: Number,
})

const emit = defineEmits(['update:position']);

const canvas = ref(null);
const outer = ref(null);
const svg_ref = ref(null);

const xlabel = ref(null)
const ylabel = ref(null)

const width = ref(0);
const height = ref(0);
const padding = ref({
  left: 60,
  top: 10,
  right: 30,
  bottom: 50
});

let r_width, r_height;
let kappa_scale, kappa_idx_scale, kappa_inv_scale
let sigma_scale, sigma_idx_scale, sigma_inv_scale;


/* resizing stuff */
onMounted(() => {
  // Initial resize and draw
  resizeCanvas();

  // Wrap the resizeCanvas function with debounce
  // const debouncedResizeCanvas = debounce(resizeCanvas, 50);

  // Listen for resize events and use the debounced function
  window.addEventListener('resize', resizeCanvas);
})


function resizeCanvas() {
  canvas.value.width = outer.value.clientWidth // canvas.value.parentElement.offsetWidth;
  canvas.value.height = outer.value.clientHeight // canvas.value.parentElement.offsetHeight;

  width.value = outer.value.clientWidth;
  height.value = outer.value.clientHeight;

  setScales(width.value, height.value)

  draw();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}


/* drawing stuff */
watch(() => props.alpha_idx, () => draw());
watch(data.data_mode, () => draw());
watch(data.scale_mode, () => draw());
watch(data.potential_term_idx, () => draw());
watch(data.potential_vector, () => draw());

function setScales(width, height) {
  r_width = Math.ceil((width) / (data.kappa_sequence.length - 1));
  r_height = Math.ceil((height) / (data.sigma_sequence.length - 1));


  kappa_scale = d3.scaleLog([data.kappa_sequence[0], data.kappa_sequence[data.kappa_sequence.length - 1]], [0, width])
  kappa_idx_scale = d3.scaleLinear([0, data.kappa_sequence.length - 1], [0, width])
  kappa_inv_scale = d3.scaleLinear([0, width], [0, data.kappa_sequence.length - 1])

  sigma_scale = d3.scaleLog([data.sigma_sequence[0], data.sigma_sequence[data.sigma_sequence.length - 1]], [height, 0])
  sigma_idx_scale = d3.scaleLinear([0, data.sigma_sequence.length - 1], [height, 0])
  sigma_inv_scale = d3.scaleLinear([height, 0], [0, data.sigma_sequence.length - 1])
}

function draw(svg = false, ctx = null, el_height = null, options = {ticks: true, ticklabels: true, fontsize: 20}) {

  let line_bias = 0
  let el_height_ = el_height ? el_height : height.value

  let svg_ = svg ? svg : d3.select(svg_ref.value);
  let xaxis = svg_.select('g.xaxis')
      .attr('transform', `translate(${padding.value.left},${el_height_ + padding.value.top + line_bias})`)
  let yaxis = svg_.select('g.yaxis')
      .attr('transform', `translate(${padding.value.left - line_bias},${padding.value.top})`)

  if (options.ticks) {
    xaxis.call(d3.axisBottom(kappa_scale).tickFormat(options.ticklabels ? tick_format() : "").tickPadding(6))
        .selectAll("text").attr("font-size", el_height ? options.fontsize + "px" : "1vh");

    yaxis.call(d3.axisLeft(sigma_scale).tickFormat(options.ticklabels ? tick_format() : "").tickPadding(6))
        .selectAll("text").attr("font-size", el_height ? options.fontsize + "px" : "1vh");

  }

  svg_.selectAll(".domain, .tick line") // Selecting the axis line and tick lines
      .style("stroke-width", "1"); // Making the lines thicker

  for (let kappa_i = 0; kappa_i < data.kappa_sequence.length; kappa_i++) {
    for (let sigma_i = 0; sigma_i < data.sigma_sequence.length; sigma_i++) {
      draw_single_rect(kappa_i, sigma_i, false, ctx)
    }
  }
}


function draw_single_rect(kappa_i, sigma_i, mark = false, ctx = false) {
  const context = ctx ? ctx : canvas.value.getContext('2d');

  context.beginPath();
  let r_width_ = r_width
  let r_height_ = r_height

  let kappa_bias = -.5
  let sigma_bias = +.5

  if (kappa_i === 0) {
    kappa_bias = 0;
    r_width_ /= 2;
  }
  if (kappa_i === data.kappa_sequence.length - 1) {
    r_width_ /= 2;
  }
  if (sigma_i === 0) {
    sigma_bias = .5
    r_height_ /= 2;
  }
  if (sigma_i === data.sigma_sequence.length - 1) {
    sigma_bias = 0
    r_height_ /= 2;
  }


  if (mark) {
    context.fillStyle = "black";
  } else {
    context.fillStyle = data.color(props.alpha_idx, kappa_i, sigma_i)
  }

  context.fillRect(
      Math.ceil(kappa_idx_scale(kappa_i + kappa_bias)),
      Math.ceil(sigma_idx_scale(sigma_i + sigma_bias)),
      Math.ceil(r_width_),
      Math.ceil(r_height_)
  );

  // context.fillText(kappa_sequence.value[Math.floor(i)].toPrecision(2), x - bias, height.value - 5);

  context.fill();
}

/* Canvas marker */
let prev_click = [null, null]

function click(e) {
  emit('update:position', [Math.ceil(kappa_inv_scale(e.offsetX - 0.5 * r_width)), Math.ceil(sigma_inv_scale(e.offsetY + 0.5 * r_height))]);
}

watch(() => props.kappa_idx, () => {
  move_marker(props.kappa_idx, props.sigma_idx)
});
watch(() => props.sigma_idx, () => {
  move_marker(props.kappa_idx, props.sigma_idx)
});

function move_marker(x, y) {
  if (prev_click[0] !== null) {
    draw_single_rect(prev_click[0], prev_click[1])
  }
  prev_click[0] = x
  prev_click[1] = y
  draw_single_rect(x, y, true)
}

defineExpose({download})

function download(download_size, options, filename) {
  const canvas_width = download_size.width - padding.value.left - padding.value.right
  const canvas_height = download_size.height - padding.value.bottom - padding.value.top

  // create the canvas
  const os_canvas = document.createElement('canvas');
  os_canvas.width = canvas_width;
  os_canvas.height = canvas_height;
  const ctx = os_canvas.getContext('2d');
  const svg = d3.create("svg")
      .attr("width", download_size.width)
      .attr("height", download_size.height)
      .attr("viewBox", '0 0 ' + download_size.width + ' ' + download_size.height);

  let image = svg.append('image')
      .attr('width', os_canvas.width)
      .attr('height', os_canvas.height)
      .attr('x', padding.value.left)
      .attr('y', padding.value.top);

  svg.append('g')
      .attr('transform', 'translate(' + 0 + ',' + 60 + ') scale(' + 4 + ')')
      .append("text").text("σ")
  svg.append('g')
      .attr('transform', 'translate(' + (canvas_width + padding.value.left - 65) + ',' + (canvas_height + padding.value.top + 50) + ') scale(' + 4 + ')')
      .append("text").text("κ")

  svg.append('g').attr('class', 'xaxis')
  svg.append('g').attr('class', 'yaxis')

  setScales(canvas_width, canvas_height)
  draw(svg, ctx, canvas_height, options)
  const dataURL = os_canvas.toDataURL();
  image.style('margin', 0) // Remove default margin for consistency
      .style('padding', 0)
      .attr('xlink:href', dataURL)
      .attr('width', os_canvas.width)
      .attr('height', os_canvas.height);

  // make sure everything stays normal in the
  downloadSVG(svg, filename)
  setScales(width.value, height.value)
}


</script>

<template>
  <div class="" style="height:calc(100vh - 8rem)" ref="outer">
      <svg ref="svg_ref" class="w-full h-full"
           :viewBox="'0 0 ' + (width + padding.left + padding.right) + ' ' + (height+ padding.bottom + padding.top) ">
        <foreignObject :x="padding.left" :y="padding.top" width=100% height=100%>
          <body xmlns="http://www.w3.org/1999/xhtml">
          <canvas ref="canvas" class="bg-white" @click="click"
                  @keydown="handleKeydown"></canvas>
          </body>
        </foreignObject>
        <g class="xaxis"></g>
        <g class="yaxis"></g>
        <g :transform="'translate(' + 0 +',' + 60 + ') scale(' + 4 + ')'">
          <text  ref="xlabel" x="0" y="0">σ</text>
        </g>
        <g :transform="'translate(' + (width + padding.left - 65) +',' + (height + padding.top + 50) + ') scale(' + 4 + ')'">
          <text  ref="ylabel" x="0" y="0">κ</text>
        </g>
      </svg>
  </div>
</template>

<style scoped>

</style>