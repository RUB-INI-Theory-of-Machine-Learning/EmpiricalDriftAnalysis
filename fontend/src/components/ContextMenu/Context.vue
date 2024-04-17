<template>
  <div class="relative w-full" ref="context_root">
    <Popover class="w-full rounded-t-lg h-full" ref="context_root" v-on:[event]="open_context">
      <PopoverButton ref="context_button" class="hidden"></PopoverButton>
      <slot></slot>
    </Popover>
  </div>
</template>

<script>
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";
import { computed } from "vue";

export default {
  name: "Context",
  props: {
    event: {type: String, default: "contextmenu"},
    close: { type: Boolean, default: true },
  },
  components: {
    Popover,
    PopoverPanel,
    PopoverButton,
  },
  data() {
    return {
      offset: {
        left: "0px",
        top: "0px",
      },
    };
  },
  provide() {
    return {
      close_context: this.close_context,
      offset: computed(() => {
        return { left: this.offset.left, top: this.offset.top };
      }),
    };
  },
  methods: {
    open_context(event) {
      event.preventDefault();

      const clickEvent = new Event("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      this.$refs.context_button.$el.dispatchEvent(clickEvent);

      // Get the bounding box of the target element
      const rect = this.$refs.context_root.getBoundingClientRect();

      // Position the custom context menu where the mouse is
      this.offset.top = `${event.clientY - rect.top}px`;
      this.offset.left = `${event.clientX - rect.left}px`;
    },
    close_context(event) {
      let targetElement = event.target;

      // Function to check if an element or any of its parents have the 'no_capture' class
      const hasNoCaptureClass = (element) => {
        while (element && element !== this.$el) { // Stop when reaching the handler's element
          if (element.classList && element.classList.contains('no_capture')) {
            return true;
          }
          element = element.parentNode;
        }
        return false;
      };


      if (this.close && !hasNoCaptureClass(targetElement)) {
        const clickEvent = new Event("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });

        this.$refs.context_button.$el.dispatchEvent(clickEvent);
      }
    },
  },
};
</script>