<template>
  <div>
    <svg ref="svg" height="75px" :width="width + 'px'">
    </svg>
  </div>
</template>

<script>
import * as d3 from "d3";
import {Legend} from "../functions.js";

export default {
  name: "ColorLegend",
  props: ["drift_scale", "no_drift_scale"],
  data() {
    return {
      scale: null,
      width: 0,
      height: 0
    }
  },
  mounted() {
    this.width = 800
    this.height = this.$refs.svg.clientHeight
    this.createLegend();
  },
  methods: {
    createLegend() {
      let legend1 = Legend(this.drift_scale, {
        width: this.width / 2,
        marginTop: 0,
        ticks: 0,
        marginBottom: 15,
      })
      d3.select(this.$refs.svg).append("g").html(legend1.node().innerHTML).attr("transform", `translate(${this.width / 2}) scale(-1,1)`)

      let legend2 = Legend(this.no_drift_scale, {
        width: this.width / 2,
        marginTop: 0,
        ticks: 0,
        marginBottom: 15,
      })
      d3.select(this.$refs.svg).append("g").html(legend2.node().innerHTML).attr("transform", `translate(${this.width / 2})`)

      let ticks = d3.select(this.$refs.svg).append("g")
      ticks.append("line")
          .attr("x1", this.width/2)
          .attr("x2", this.width/2)
          .attr("y1", 0 )
          .attr("y2", 50)
          .attr("stroke", "black")

      ticks.append("text")
          .attr("x", this.width/2)
          .attr("y", 70 )
          .attr("font-size", 20)
          .attr("text-anchor", "middle")
          .text("0")

      ticks.append("line")
          .attr("x1", 0)
          .attr("x2", 0)
          .attr("y1", 0 )
          .attr("y2", 50)
          .attr("stroke", "black")

      ticks.append("text")
          .attr("x", 0)
          .attr("y", 70 )
          .attr("font-size", 20)
          .attr("text-anchor", "start")
          .text("positive drift")

      ticks.append("line")
          .attr("x1", this.width)
          .attr("x2", this.width)
          .attr("y1", 0 )
          .attr("y2", 50)
          .attr("stroke", "black")

      ticks.append("text")
          .attr("x", this.width)
          .attr("y", 70 )
          .attr("font-size", 20)
          .attr("text-anchor", "end")
          .text("negative drift")
    }
  }
}
</script>

<style scoped>

</style>