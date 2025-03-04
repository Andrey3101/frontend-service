<template>
  <div class="table">
    <table>
      <thead>
        <tr class="table__header">
          <template v-for="(column, idx) in columns">
            <th
              :key="idx"
              :style="{
                width: column?.width ? column.width + 'px' : '',
                'text-align': column.position,
              }"
              v-show="
                !column.hasOwnProperty('visible') ||
                (column.hasOwnProperty('visible') && column.visible)
              "
            >
              {{ column.label }}
            </th>
          </template>
        </tr>
      </thead>
      <tbody>
        <template v-if="tableData?.length">
          <template v-for="(chapterData, chapterIndex) in tableData">
            <tr v-if="chapterData.chapter" :key="chapterIndex">
              <td class="chapter" :colspan="colsCount">
                {{ chapterData.chapter }}
              </td>
            </tr>
            <tr
              v-for="(data, dataIndex) in chapterData.data"
              :key="dataIndex + 'chapter' + chapterIndex"
            >
              <template v-for="(column, colIndex) in columns">
                <td
                  :key="colIndex"
                  :class="{
                    'has-icon': column.prop === 'employees' && data.count > 0,
                  }"
                  :style="{
                    'text-align': column.position,
                  }"
                  v-show="
                    !column.hasOwnProperty('visible') ||
                    (column.hasOwnProperty('visible') && column.visible)
                  "
                >
                  <template>
                    <!--////////////////-->
                    <span>
                      <span
                        class="has-icon-block-names"
                        v-if="column.prop === 'employees'"
                      >
                        <span>{{ data[column.prop].value }}</span>
                        <span>{{ data[column.prop].value2 }}</span>
                        <el-popover
                          class="table-danger-popover"
                          ref="dangerPopover"
                          trigger="click"
                          v-if="allDaysRow(data)"
                        >
                          <template slot="reference">
                            <span class="has-icon-block-svg">
                              <svg class="svg-icon">
                                <use xlink:href="#i-danger"></use>
                              </svg>
                            </span>
                          </template>

                          <div class="table-danger-popover__list">
                            <div
                              v-for="(columnProp, index) in columns"
                              :key="index"
                              class="table-danger-popover__item"
                            >
                              <div
                                class="table-danger-popover__content"
                                v-if="
                                  data[columnProp.prop] !== undefined &&
                                  columnProp.prop !== 'employees' &&
                                  columnProp.prop !== 'count'
                                "
                              >
                                {{ columnProp.label }}:
                                {{ data[columnProp.prop] }}
                              </div>

                              <div
                                class="table-danger-popover__content"
                                v-if="
                                  data[columnProp.prop] !== undefined &&
                                  columnProp.prop === 'free'
                                "
                              >
                                {{ columnProp.label }}:
                              </div>
                            </div>
                          </div>
                        </el-popover>
                      </span>

                      <span
                        v-if="
                          readOnly &&
                          column.prop !== 'employees' &&
                          column.prop !== 'count' &&
                          column.prop !== 'free'
                        "
                      >
                        {{
                          zeroShow && !data[column.prop] ? 0 : data[column.prop]
                        }}
                      </span>

                      <span v-if="column.prop === 'count'">
                        {{
                          zeroShow && !data[column.prop] ? 0 : data[column.prop]
                        }}
                      </span>

                      <span v-if="column.prop === 'free'">
                        {{ getFreeDays(data) }}
                      </span>

                      <span
                        v-if="
                          !readOnly &&
                          column.prop !== 'employees' &&
                          column.prop !== 'count' &&
                          column.prop !== 'free'
                        "
                      >
                        <ElInput
                          :disabled="
                            !maxValueRow(column.prop, data) ||
                            disabledEmployee(column.prop, data)
                          "
                          class="inputs__number"
                          v-model="data[column.prop]"
                          placeholder="0"
                          :maxValue="maxValueRow(column.prop, data)"
                          :minValue="0"
                          error=""
                          type="number"
                          @change="changeColumn(column.prop, data)"
                      /></span>
                    </span>
                  </template>
                </td>
              </template>
            </tr>
          </template>
        </template>
        <tr v-else>
          <td class="table__empty" :colspan="colsCount">Нет данных</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { Popover } from "element-ui";
import ElInput from "@/components/ui/ElInput";

export default {
  components: {
    // eslint-disable-next-line vue/no-unused-components
    "el-popover": Popover,
    // eslint-disable-next-line vue/no-unused-components
    ElInput,
  },
  props: {
    columns: {
      type: Array,
    },
    columnsData: {
      type: Array,
      default: () => [],
    },
    readOnly: {
      type: Boolean,
      default: true,
    },
    viewAll: {
      type: Boolean,
      default: true,
    },
    workDays: {
      type: Number,
      default: 5,
    },
    zeroShow: {
      type: Boolean,
      default: false,
    },
    fixedHeader: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      tableData: [],
    };
  },
  watch: {
    columnsData: {
      handler(newValue) {
        this.processTableData(newValue);
      },
      immediate: true,
      deep: true,
    },
  },
  computed: {
    colsCount() {
      return this.columns.length;
    },
  },
  created() {
    this.processTableData(this.columnsData);
  },
  mounted() {
    if (this.fixedHeader) {
      this.initFixedTableHeader();
    }
  },
  beforeDestroy() {
    if (this.fixedHeader) {
      window.removeEventListener("scroll", this.fixedTableHeader);
      window.removeEventListener("resize", this.fixedTableHeader);
    }
  },
  methods: {
    initFixedTableHeader() {
      this.fixedTableHeader();
      window.addEventListener("scroll", this.fixedTableHeader);
      window.addEventListener("resize", this.fixedTableHeader);
    },
    fixedTableHeader() {
      if (!this.tableData?.length) return;
      const stickyElement = document.getElementsByClassName("table__header");
      const table = document.getElementsByClassName("table");
      const header = document.getElementsByClassName("page__head");
      const headerHeight = header[0].offsetHeight;
      const rect = table[0].getBoundingClientRect();
      const elementToTop = rect.top + window.scrollY;
      const top = rect.top;
      const scrollTop = window.scrollY || window.pageYOffset;
      if (top - headerHeight > 0) {
        stickyElement[0].style.top = "0";
        return;
      }
      stickyElement[0].style.top = `${
        scrollTop - elementToTop + headerHeight - 1
      }px`;
    },
    processTableData(data) {
      this.tableData = JSON.parse(JSON.stringify(data));
    },
    allDaysRow(row, returnDayCount = false) {
      let sum;
      const exclude = ["count", "employees", "free"];
      sum = Object.entries(row)
        .filter(([key]) => !exclude.includes(key))
        .reduce((sum, [, value]) => sum + value, 0);
      if (returnDayCount) return sum;
      return sum > this.workDays;
    },
    getFreeDays(row) {
      const allDays = this.allDaysRow(row, true);
      const employeePlusMinusDays = row["count"] ? row["count"] : 0;
      let allPossibleDays = this.workDays + employeePlusMinusDays;
      const freeDays = allPossibleDays - allDays;
      return freeDays < 0 ? 0 : freeDays;
    },
    maxValueRow(prop, row) {
      const totalDays = this.workDays;
      let usedDays = 0;
      const employeePlusMinusDays = row["count"] ? row["count"] : 0;
      for (const key in row) {
        if (key !== "employees" && key !== "count") {
          usedDays += row[key];
        }
      }
      const value = row[prop] ? row[prop] : 0;
      let remainingDays = totalDays - usedDays + value + employeePlusMinusDays;
      return remainingDays ? remainingDays : 0;
    },
    disabledEmployee(prop, row) {
      const project = row?.employees.projectIds.find((pi) => pi == prop);
      return !project;
    },
    changeColumn(prop, row) {
      const data = {
        projectId: prop,
        employeeId: row.employees.id,
        daysNeed: row[prop],
      };
      this.$emit("changeColumn", data);
      this.$emit("newTableData", this.tableData);
    },
  },
};
</script>

<style scoped lang="scss">
.table {
  border: 1px solid #e4e4e4;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

.table__header {
  position: relative;
  z-index: 1;
}

.table__empty {
  text-align: center;
  padding: 24px;
}

thead {
  th,
  td {
    border-bottom: 1px solid #e4e4e4;
    padding: 16px;
    text-align: center;

    &:not(:first-child) {
      border-left: 1px solid #e4e4e4;
    }
  }

  th {
    position: relative;
    min-width: 92px;
    font-weight: 700;
    font-size: 15px;
    line-height: 22px;
    color: #465260;
    background-color: #f2f2f2;
  }
}

tbody {
  th,
  td {
    border-top: 1px solid #e4e4e4;
    padding: 16px;
    text-align: left;

    &:not(:first-child) {
      border-left: 1px solid #e4e4e4;
    }
  }

  td {
    min-width: 92px;
    font-weight: 700;
    font-size: 16px;
    line-height: 18px;
    text-align: center;
    color: #465260;

    & span {
      &:not(:first-child) {
        font-weight: 400;
        font-size: 12px;
        line-height: 18px;
        color: #56616d;
      }
    }
  }
}

.chapter {
  background-color: #ffffff;
  text-align: left;
  padding: 10.5px 16px;
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  color: #e84d0f;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

.has-icon-block {
  display: flex;
  align-items: center;
  min-width: max-content;
}

.has-icon-block-names {
  position: relative;
  display: flex;
  flex-direction: column;
  padding-right: 40px;
}

.table-danger-popover {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  margin: auto;
}

.has-icon.border-none {
  border-left: 0;
}

.has-icon-block-svg {
  display: flex;
  width: 28px;
  height: 28px;
  cursor: pointer;

  svg {
    color: #465260;
  }
}

.table-danger-popover__list {
  display: flex;
  flex-direction: column;
}

.table-danger-popover__item:last-of-type {
  .table-danger-popover__content {
    margin-bottom: 0;
  }
}

.table-danger-popover__content {
  margin-bottom: 8px;
  font-family: "Gilroy";
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 22px;
  color: #35404b;
}
</style>
