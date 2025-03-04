<template>
  <div
    class="popup-filter"
    :class="{ 'read-only': allReadOnly }"
    v-loading="loading"
  >
    <div class="popup-filter__header">
      <p class="popup-filter__name">Фильтр</p>
      <div class="popup-filter__close" @click="$emit('cancel')">
      </div>
    </div>
    <div class="popup-filter__projects-block">
      <div class="popup-filter__projects-block-wrap">
        <b class="popup-filter__projects-block-title">Задачи</b>
        <div class="popup-filter__projects-block-edit">
          <p
            class="popup-filter__projects-block-all"
            @click="projectSelectAll"
            v-if="!allReadOnly"
          >
            Выбрать все
          </p>
          <p
            class="popup-filter__projects-block-reset"
            @click="projectReset"
            v-if="!allReadOnly"
          >
            Сбросить
          </p>
        </div>
      </div>
      <ul class="popup-filter__projects-block-list">
        <li
          class="popup-filter__projects-block-item"
          :class="{ 'item-active': item.active }"
          v-for="item in filterData.projects"
          :key="item.id"
          @click="toggleSelectedProjects(item.id)"
        >
          <p>{{ item.name }}</p>
          <div class="popup-filter__projects-block-item-icon">
            <svg class="svg-icon" v-if="!item.active">
              <use xlink:href="#i-x-button"></use>
            </svg>
            <svg class="svg-icon" v-else>
              <use xlink:href="#i-plus"></use>
            </svg>
          </div>
        </li>
      </ul>
      <div class="popup-filter__projects-block-separator"></div>
    </div>
    <div class="popup-filter__employees-block">
      <b class="popup-filter__employees-block-title">Акты</b>
      <ElSelect
        class="inputs__select"
        v-model="filterData.selectedEmployees"
        :options="filterData.employees"
        :multiple="true"
        placeholder="Выберите"
        clearable
      />
    </div>
    <div class="popup-filter__button-list">
      <button
        class="popup-filter__button-cancel btn-el btn-el--border"
        @click="$emit('cancel')"
      >
        Отмена
      </button>
      <button
        class="popup-filter__button-send btn-el btn-el--orange"
        @click="applyFilter"
      >
        Применить
      </button>
    </div>
  </div>
</template>

<script>
import date from "@/mixins/date.js";

import ElSelect from "@/components/ui/ElSelect";

const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);

export default {
  name: "PopupFilter",
  props: {
    projects: {
      type: Array,
      default: () => [],
    },
    employees: {
      type: Array,
      default: () => [],
    },
    employeeIds: {
      type: Array,
      default: () => [],
    },
  },
  components: {
    ElSelect,
  },
  mixins: [date],
  data() {
    return {
      loading: false,
      allReadOnly: false,
      filterData: {
        projects: [],
        employees: [],
        selectedEmployees: [],
      },
    };
  },
  created() {
    this.filterData.projects = JSON.parse(JSON.stringify(this.projects));
    this.filterData.projects = this.filterData.projects.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const employees = JSON.parse(JSON.stringify(this.employees));
    this.filterData.employees = employees
      .map((e) => {
        return {
          id: e.id,
          name: e.fullName,
          value: e.position,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    this.filterData.selectedEmployees = this.employeeIds;
  },
  methods: {
    applyFilter() {
      const activeProjects = this.filterData.projects.filter((p) => p.active);
      const filter = {
        activeProjects,
        projects: this.filterData.projects,
        employeeIds: this.filterData.selectedEmployees,
      };
      this.$emit("applyFilter", filter);
    },
    toggleSelectedProjects(id) {
      this.filterData.projects.forEach((p) => {
        if (p.id === id) {
          p.active = !p.active;
        }
      });
    },
    projectSelectAll() {
      this.filterData.projects.forEach((e) => {
        e.active = true;
      });
    },
    projectReset() {
      this.filterData.projects.forEach((e) => {
        e.active = false;
      });
    },
  },
};
</script>
