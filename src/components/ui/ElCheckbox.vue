<template>
  <div class="el-checkbox-wrap" :class="{ 'has-error': error }">
    <el-checkbox
      v-model="checked"
      v-bind="binds"
      v-on="$listeners"
      :disabled="disabled"
      v-bind:value="value"
      v-on:change="$emit('input', checked)"
      >{{ text }}</el-checkbox
    >
  </div>
</template>

<script>
import { Checkbox } from "element-ui";
export default {
  components: {
    "el-checkbox": Checkbox,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      checked: this.value,
    };
  },
  computed: {
    binds() {
      return {
        ...this.$attrs,
        ...this.$props,
      };
    },
  },
};
</script>
