<template>
  <v-col cols="12" sm="6" md="4" ref="dragRef" :style="style" v-bind="listeners">
    <slot />
  </v-col>
</template>

<script>
import { useDraggable } from '@dnd-kit/core';

export default {
  props: {
    id: {
      type: [String, Number],
      required: true,
    },
  },
  setup(props) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: props.id,
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : {};

    return {
      dragRef: setNodeRef,
      listeners: { ...listeners, ...attributes },
      style,
    };
  },
};
</script>