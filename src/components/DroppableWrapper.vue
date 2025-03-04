<template>
  <div ref="dropRef">
    <slot />
  </div>
</template>

<script>
import { useDroppable } from '@dnd-kit/core';

export default {
  props: {
    droppableId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { setNodeRef } = useDroppable({
      id: props.droppableId,
    });

    return {
      dropRef: setNodeRef,
    };
  },
};
</script>