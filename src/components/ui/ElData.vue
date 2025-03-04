<template>
  <div class="el-date" :class="{ 'has-error': error }">
    <div v-if="title" class="el-date__title">
      {{ title }}<span v-if="required">*</span>
    </div>

    <template v-if="!readOnly">
      <div class="el-date__field">
        <el-date
          v-model="date"
          :disabled="disabled"
          format="dd.MM.yyyy"
          value-type="yyyy-MM-ddT00:00:00.000"
          v-bind:value="value"
          v-on="$listeners"
          type="date"
          :disabled-date="pickerOptions"
        >
        </el-date>

        <div v-if="error" class="el-input__mess">{{ error }}</div>
      </div>
    </template>

    <div v-else class="input-el__read-only">
      {{ date ? getDateMini(date) : "Нет данных" }}
    </div>
  </div>
</template>

<script>
import { DatePicker } from "element-ui";
import lang from "element-ui/lib/locale/lang/ru-RU";
import locale from "element-ui/lib/locale";
import "element-ui/lib/theme-chalk/index.css";
import date from "@/mixins/date.js";

// configure language
locale.use(lang);

export default {
  name: "ElDate",
  props: {
    value: {
      type: [String, Number, Array, Date],
      default: "",
    },
    pickerOptions: {
      type: Function,
    },
    title: {
      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "",
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    filterable: {
      type: Boolean,
      default: false,
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
  components: {
    "el-date": DatePicker,
  },
  mixins: [date],
  data() {
    return {
      date: "",
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
  watch: {
    value(val) {
      this.date = val;
    },
  },
  created() {
    this.date = this.value;
  },
};
</script>
