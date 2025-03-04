<template>
  <div class="el-textarea" :class="{ 'has-error': error }">
    <div v-if="title" class="el-textarea__title">
      {{ title }}<span v-if="required">*</span>
    </div>

    <template v-if="!readOnly">
      <div class="el-textarea__inp" :class="{ 'input-number-border': border }">
        <textarea
          :placeholder="placeholder"
          :disabled="disabled"
          :rows="rows"
          v-bind:value="value"
          v-on:input="textAreaAdjust($event)"
          v-on:blur="$emit('blur', $event.target.value)"
          :maxlength="maxlength"
        >
        </textarea>

        <div v-if="error" class="el-textarea__mess">{{ error }}</div>
      </div>
    </template>

    <div v-else class="input-el__read-only">
      {{ value ? value : "Нет данных" }}
    </div>
  </div>
</template>

<script>
import "element-ui/packages/theme-chalk/lib/index.css";
export default {
  name: "ElTextArea",
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
    maxlength: {
      type: Number,
      default: null,
    },
    rows: {
      type: Number,
      default: 4,
    },
    border: {
      type: Boolean,
      default: false,
    },
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
  methods: {
    textAreaAdjust(e) {
      this.$emit("input", e.target.value);
      e.target.style.height = "auto";
      e.target.style.height = `${e.target.scrollHeight}px `;
    },
  },
};
</script>
