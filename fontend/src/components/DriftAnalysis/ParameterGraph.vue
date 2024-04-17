<template>
  <svg class="bg-white" ref="svg"
       @wheel="wheel"
       @mousedown="dragging = true"
       @mouseup="dragging = false"
       @mouseout="dragging = false"
       @mousemove="drag"
       :width="base_width"
       :height="base_height"
       :viewBox="x + ' ' + y + ' ' + width + ' ' + height"
  >
    <!--  Background lines  -->
    <line :x1="width/3" :y1="y" :x2="width/3" :y2="y + height" stroke="rgb(211,211,211)"
          :stroke-width="height / 600"></line>
    <line :y1="height/2" :x1="x" :y2="height/2" :x2="x + width" stroke="rgb(211,211,211)"
          :stroke-width="height / 600"></line>

    <!--  Sphere circle  -->
    <circle :cx='width/3' :cy='height/2' r='200' stroke="black" :stroke-width="height / 600"
            fill="none"></circle>
    <!--  0,0 point  -->
    <circle :cx='width/3' :cy='height/2' r='1' stroke="black" :stroke-width="height / 600"></circle>

    <!--  Connection line between 0,0 and the distribution center  -->
    <line
        :y1="height/2"
        :x1="width/3"
        :y2="height/2 - Math.sin(alpha_arc) * 200"
        :x2="width/3 + Math.cos(alpha_arc) * 200"
        stroke="#ea580c"
        :stroke-width="height / 600"
    />

    <!--  Center of the distribution  -->
    <circle
        :cx='width/3 + Math.cos(alpha_arc) * 200'
        :cy='height/2 - Math.sin(alpha_arc) * 200'
        r='1'
        fill="#ea580c"
        stroke="#ea580c"
        :stroke-width="5 * (height / 600)"
    />

    <ellipse
        :cx="width/3 + Math.cos(alpha_arc) * 200"
        :cy="height/2 - Math.sin(alpha_arc) * 200"
        :rx="sigma * Math.sqrt(kappa) * 200"
        :ry="sigma * 1/Math.sqrt(kappa) * 200"
        fill="none"
        stroke="#ea580c"
        :stroke-width="1.3 * height / 600"
    />

    <!--  stable kappa (blue line)    -->
    <ellipse
        :cx="width/3 + Math.cos(alpha_arc) * 200"
        :cy="height/2 - Math.sin(alpha_arc) * 200"
        :rx="stable_sigma * Math.sqrt(kappa) * 200"
        :ry="stable_sigma * 1/Math.sqrt(kappa) * 200"
        fill="none"
        stroke="#60a5fa"
        :stroke-width="1.5 * (height / 600)"
        stroke-dasharray="5,5"
    />

    <!--  stable sigma (green line)    -->
    <ellipse
        :cx="width/3 + Math.cos(alpha_arc) * 200"
        :cy="height/2 - Math.sin(alpha_arc) * 200"
        :rx="Math.sqrt(stable_kappa) * sigma * 200"
        :ry="1/Math.sqrt(stable_kappa) * sigma * 200"
        fill="none"
        stroke="#22c55e"
        :stroke-width="1.5 * (height / 600)"
        stroke-dasharray="10,10"
    />

  </svg>

</template>

<script>
import data from "../data_state.js";
import {stable_sigma, stable_kappa} from "../functions.js";
import katex from 'katex';
export default {
  name: "ParameterGraph",
  props: ["alpha_arc", "kappa", "sigma", "base_width", "base_height"],
  data() {
    return {
      x: 0,
      y: 0,
      zoom: 1,
      dragging: false,
    }
  },
  computed: {
    height() {
      return this.zoom * this.base_height
    },
    width() {
      return this.zoom * this.base_width
    },
    stable_sigma(){
      return stable_sigma(data, this.alpha_arc, this.kappa)
    },
    stable_kappa(){
      return stable_kappa(data, this.alpha_arc, this.sigma)
    }
  },
  methods: {
    drag(e) {
      if (this.dragging) {
        this.x -= this.zoom * e.movementX
        this.y -= this.zoom * e.movementY
      }
    },
    wheel: function (event) {
      event.preventDefault();
      if (event.wheelDelta > 0) this.zoom /= 1.1
      if (event.wheelDelta < 0) this.zoom *= 1.1
    },
  }
}
</script>

<style scoped>

</style>