<template>
  <div ref="context_menu">
    <PopoverPanel
        @contextmenu.prevent
        @click.capture="close_context"
        :style="'top:' + offset.top + ';left:' + offset.left + ';'"
        class="absolute z-10 flex cursor-default"
    >
      <slot></slot>
    </PopoverPanel>
  </div>
</template>

<script>
import { PopoverPanel } from "@headlessui/vue";

export default {
  name: "ContextMenu",
  inject: ["close_context", "offset"],
  components: {
    PopoverPanel,
  },
};
</script>