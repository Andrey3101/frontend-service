<template>
  <div class="el-autocomplete" :class="{ 'has-error': error }">
    <div v-if="title" class="el-autocomplete__title">
      {{ title }}<span v-if="required">*</span>
    </div>

    <template v-if="!readOnly">
      <div
        class="el-input__autocomplete"
        :class="{ 'input-active': inputActive }"
      >
        <el-autocomplete
          popper-class="el-autocomplete__popper"
          v-bind="binds"
          v-on="$listeners"
          :fetch-suggestions="querySearch"
          :placeholder="placeholder"
          :disabled="disabled"
          slot="reference"
          @input="openPopover"
          @click.native="openPopover"
        >
          <i
            v-if="iconOn"
            class="el-icon-edit el-input__icon"
            slot="suffix"
            @click="handleIconClick"
          >
          </i>
          <template slot-scope="{ item }" v-if="item && !customSearch">
            <div class="names">{{ item.name }}</div>
            <span class="value" v-if="item.value">{{ item.value }}</span>
          </template>
        </el-autocomplete>

        <el-popover
          ref="myPopover"
          trigger="manual"
          :disabled="!customSearch || (customSearch && !$slots.default)"
        >
          <slot @projectEditEmit="closePopover()"> </slot>
        </el-popover>

        <div v-if="error" class="el-input__mess">{{ error }}</div>
      </div>
    </template>

    <div v-else class="input-el__read-only">
      {{ value ? value : "Нет данных" }}
    </div>
  </div>
</template>

<script>
import { Autocomplete } from "element-ui";
import "element-ui/lib/theme-chalk/autocomplete.css";
import { Popover } from "element-ui";
export default {
  name: "ElAutocomplete",
  props: {
    value: {
      type: [String, Number],
      default: "",
    },
    options: {
      type: Array,
      default: () => [],
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
    iconOn: {
      type: Boolean,
      default: true,
    },
    customSearch: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    "el-autocomplete": Autocomplete,
    "el-popover": Popover,
  },
  data() {
    return {
      autocomplete: "",
      links: [],
      positionBorderTop: true,
      inputActive: false,
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
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    openPopover() {
      this.$refs.myPopover.doShow();
      this.inputActive = true;
    },
    closePopover() {
      this.$refs.myPopover.doClose();
      this.inputActive = false;
    },
    handleClickOutside(event) {
      const popoverElem = this.$refs.myPopover.$el;
      if (
        !popoverElem.contains(event.target) &&
        !event.target.closest(".el-autocomplete")
      ) {
        this.closePopover();
      }
    },
    querySearch(queryString, cb) {
      var links = this.options;
      var results = queryString
        ? links.filter(this.createFilter(queryString))
        : links;
      cb(results);
    },
    createFilter(queryString) {
      return (link) => {
        return (
          link.name.toLowerCase().indexOf(queryString.toLowerCase()) !== -1
        );
      };
    },
    handleIconClick() {
      ///
    },
  },
};
</script>
