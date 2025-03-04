<template>
  <div class="el-input" :class="{ 'has-error': error }">
    <div v-if="title" class="el-input__title">
      {{ title }}<span v-if="required">*</span>
    </div>

    <template v-if="!readOnly">
      <div class="el-input__inp" :class="{ 'input-number-border': border }">
        <el-number
          v-if="type === 'number'"
          v-bind="binds"
          v-on="$listeners"
          :placeholder="placeholder"
          :disabled="disabled"
          type="number"
          controls-position="right"
          :min="minValue"
          :max="maxValue"
        >
        </el-number>

        <el-input
          v-if="type === 'text'"
          v-bind="binds"
          v-on="$listeners"
          :placeholder="placeholder"
          :disabled="disabled"
          type="text"
        >
        </el-input>

        <div v-if="error" class="el-input__mess">{{ error }}</div>
      </div>
    </template>

    <div v-else class="input-el__read-only">
      {{ value || value == 0 ? value : "Нет данных" }}
    </div>
  </div>
</template>

<script>
import { InputNumber, Input } from "element-ui";
import "element-ui/packages/theme-chalk/lib/index.css";
export default {
  name: "ElInput",
  props: {
    value: {
      type: [String, Number],
      default: "",
    },
    title: {
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
    placeholder: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "text",
    },
    minValue: {
      type: Number,
      default: 0,
    },
    maxValue: {
      type: Number,
      default: 2147483647,
    },
    border: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    "el-number": InputNumber,
    "el-input": Input,
  },
  data() {
    return {
      data: "",
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
