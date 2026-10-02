<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      Расчёт справочный и не является налоговой консультацией: не учитываются региональные пониженные ставки,
      НДС на УСН, особенности отдельных видов деятельности. Сверяйтесь с НК РФ, приложением «Мой налог» или бухгалтером.
    </v-alert>

    <v-row>
      <!-- Калькулятор -->
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-calculator-variant-outline" class="mr-2" />
            Калькулятор за год
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="calc.status"
              :items="STATUS_ITEMS"
              label="Статус"
              variant="outlined"
              density="compact"
              class="mb-2"
            />
            <v-text-field
              v-model.number="calc.incomeIndividuals"
              label="Доходы от физлиц, ₽"
              type="number"
              min="0"
              variant="outlined"
              density="compact"
              :rules="[rules.amount]"
              class="mb-2"
            />
            <v-text-field
              v-model.number="calc.incomeLegal"
              label="Доходы от организаций и ИП, ₽"
              type="number"
              min="0"
              variant="outlined"
              density="compact"
              :rules="[rules.amount]"
              class="mb-2"
            />
            <template v-if="calc.status !== 'self_employed'">
              <v-text-field
                v-model.number="calc.expenses"
                label="Расходы без страховых взносов, ₽"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                :rules="[rules.amount]"
                hint="Учитываются только на УСН «Доходы минус расходы»"
                persistent-hint
                class="mb-2"
              />
              <v-text-field
                v-model.number="calc.contributions"
                label="Уплаченные страховые взносы, ₽"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                :rules="[rules.amount]"
                :hint="contributionsHint"
                persistent-hint
                class="mb-2"
              />
              <v-switch
                v-if="calc.status === 'ip'"
                v-model="calc.hasEmployees"
                label="Есть наёмные работники"
                color="primary"
                density="compact"
                hide-details
                class="mb-2"
              />
            </template>
            <v-text-field
              v-if="regimes.includes('npd')"
              v-model.number="calc.npdDeductionLeft"
              label="Остаток налогового вычета НПД, ₽"
              type="number"
              min="0"
              max="10000"
              variant="outlined"
              density="compact"
              :rules="[rules.amount, (v) => num(v) <= NPD_DEDUCTION_TOTAL || 'Не больше 10 000 ₽']"
              hint="Вычет 10 000 ₽ даётся один раз; если уже частично израсходован — укажите остаток"
              persistent-hint
              class="mb-2"
            />
            <v-btn variant="text" size="small" prepend-icon="mdi-broom" class="mt-2" @click="resetCalc">Очистить</v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Результат калькулятора -->
      <v-col cols="12" md="7">
        <v-card class="h-100">
          <v-card-title>Сравнение режимов</v-card-title>
          <v-card-text>
            <v-alert v-for="w in warnings" :key="w" type="warning" variant="tonal" density="compact" class="mb-3">
              {{ w }}
            </v-alert>

            <v-table density="compact" class="mb-4">
              <thead>
                <tr>
                  <th>Режим</th>
                  <th class="text-right">Налог</th>
                  <th class="text-right">Взносы</th>
                  <th class="text-right">Итого</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in results" :key="r.key">
                  <td>
                    <div class="font-weight-medium">
                      {{ r.title }}
                      <v-chip v-if="r.key === bestKey && results.length > 1" size="x-small" color="success" class="ml-1">
                        выгоднее
                      </v-chip>
                    </div>
                    <div v-for="d in r.details" :key="d" class="text-caption text-medium-emphasis">{{ d }}</div>
                  </td>
                  <td class="text-right text-no-wrap">{{ formatMoney(r.tax) }}</td>
                  <td class="text-right text-no-wrap">{{ formatMoney(r.contributions) }}</td>
                  <td class="text-right text-no-wrap font-weight-bold">{{ formatMoney(r.tax + r.contributions) }}</td>
                </tr>
              </tbody>
            </v-table>

            <BarChart v-if="totalIncome > 0" :labels="chart.labels" :datasets="chart.datasets" :options="chartOptions" :height="260" />
            <div v-else class="text-medium-emphasis text-center py-6">Введите доходы, чтобы увидеть расчёт.</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- По моим данным (сервер) -->
      <v-col cols="12" md="7">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-database-outline" class="mr-2" />
            По моим данным
          </v-card-title>
          <v-card-subtitle class="text-wrap">
            Оценка по доходам и расходам, внесённым в раздел «Финансы»{{ companyTypeLabel ? ` · ${companyTypeLabel}` : '' }}.
          </v-card-subtitle>
          <v-card-text>
            <v-row dense>
              <v-col cols="6" sm="3">
                <v-select v-model="est.year" :items="yearItems" label="Год" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col cols="6" sm="4">
                <v-select v-model="est.quarter" :items="QUARTER_ITEMS" label="Период" variant="outlined" density="compact" hide-details />
              </v-col>
              <v-col v-if="companyType === 'ip' || companyType === 'ooo'" cols="12" sm="5">
                <v-select
                  v-model="est.regime"
                  :items="REGIME_ITEMS"
                  label="Объект УСН"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col v-if="companyType === 'self_employed'" cols="12" sm="5">
                <v-text-field
                  v-model.number="est.deductionUsed"
                  label="Вычет израсходован ранее, ₽"
                  type="number"
                  min="0"
                  max="10000"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  :rules="[rules.amount, (v) => num(v) <= NPD_DEDUCTION_TOTAL || 'Не больше 10 000 ₽']"
                />
              </v-col>
            </v-row>
            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" :loading="estLoading" @click="loadEstimate">
                Рассчитать
              </v-btn>
              <v-btn v-if="estimate" variant="text" prepend-icon="mdi-arrow-up-bold-box-outline" @click="fillCalculator">
                Подставить в калькулятор
              </v-btn>
            </div>

            <template v-if="estimate">
              <div class="text-body-2 mt-4 mb-1">{{ estimate.period }}</div>
              <div class="text-caption text-medium-emphasis mb-2">{{ estimate.rate_description }}</div>
              <v-table density="compact">
                <tbody>
                  <tr><td>Доходы</td><td class="text-right">{{ formatMoney(estimate.income) }}</td></tr>
                  <tr><td class="pl-8">от физлиц</td><td class="text-right">{{ formatMoney(estimate.income_individuals) }}</td></tr>
                  <tr><td class="pl-8">от организаций и ИП</td><td class="text-right">{{ formatMoney(estimate.income_legal) }}</td></tr>
                  <tr><td>Расходы</td><td class="text-right">{{ formatMoney(estimate.expenses) }}</td></tr>
                  <tr><td>Налоговая база</td><td class="text-right">{{ formatMoney(estimate.tax_base) }}</td></tr>
                  <tr class="font-weight-bold"><td>Налог</td><td class="text-right">{{ formatMoney(estimate.tax) }}</td></tr>
                </tbody>
              </v-table>
              <ul v-if="estimate.notes?.length" class="text-caption text-medium-emphasis mt-3 pl-4">
                <li v-for="note in estimate.notes" :key="note" class="mb-1">{{ note }}</li>
              </ul>
            </template>
            <div v-else-if="!estLoading" class="text-medium-emphasis py-4">Нажмите «Рассчитать», чтобы получить оценку.</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Налоговый календарь -->
      <v-col cols="12" md="5">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-calendar-alert" class="mr-2" />
            Ближайшие сроки
          </v-card-title>
          <v-card-text>
            <v-progress-linear v-if="calLoading" indeterminate color="primary" rounded class="mb-2" />
            <v-list v-if="upcoming.length" density="compact" class="py-0">
              <v-list-item v-for="item in upcoming" :key="`${item.date}-${item.title}`" class="px-0">
                <template #prepend>
                  <v-chip size="small" :color="daysLeft(item.date) <= 7 ? 'error' : 'primary'" variant="tonal" class="mr-3">
                    {{ formatDate(item.date) }}
                  </v-chip>
                </template>
                <v-list-item-title class="text-wrap">{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-wrap">{{ item.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else-if="!calLoading" class="text-medium-emphasis py-4">Ближайших сроков не найдено.</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { getTaxCalendar, getTaxEstimate } from '@/api';
import BarChart from '@/components/BarChart.vue';
import { useAuthStore } from '@/stores/auth.js';
import { useNotifyStore } from '@/stores/notify.js';
import { formatDate, formatMoney } from '@/utils/format.js';

// ------------------------------------------------------------ константы (НК РФ, 422-ФЗ)
const NPD_RATE_INDIVIDUAL = 0.04;
const NPD_RATE_LEGAL = 0.06;
const NPD_DEDUCTION_TOTAL = 10000;
/** Вычет снижает ставку 4% → 3% (1 п.п.) и 6% → 4% (2 п.п.) до исчерпания. */
const NPD_DEDUCTION_RATE_INDIVIDUAL = 0.01;
const NPD_DEDUCTION_RATE_LEGAL = 0.02;
const NPD_YEAR_LIMIT = 2_400_000;
const USN_INCOME_RATE = 0.06;
const USN_IE_RATE = 0.15;
const USN_MIN_TAX_RATE = 0.01;
const AMOUNT_MAX = 10_000_000_000;

const STATUS_ITEMS = [
  { title: 'Самозанятый (НПД)', value: 'self_employed' },
  { title: 'ИП', value: 'ip' },
  { title: 'ООО', value: 'ooo' },
];
const QUARTER_ITEMS = [
  { title: 'Весь год', value: 0 },
  { title: 'I квартал', value: 1 },
  { title: 'Полугодие', value: 2 },
  { title: '9 месяцев', value: 3 },
  { title: 'Год (IV кв.)', value: 4 },
];
const REGIME_ITEMS = [
  { title: 'УСН «Доходы» 6%', value: 'usn_income' },
  { title: 'УСН «Доходы минус расходы» 15%', value: 'usn_income_expense' },
];
const REGIMES_BY_STATUS = {
  self_employed: ['npd'],
  ip: ['npd', 'usn_income', 'usn_income_expense'],
  ooo: ['usn_income', 'usn_income_expense'],
};

const auth = useAuthStore();
const notify = useNotifyStore();

const companyType = computed(() => auth.companyType);
const companyTypeLabel = computed(() => STATUS_ITEMS.find((s) => s.value === companyType.value)?.title || '');

/** @param {unknown} v */
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** @param {number} v */
function round(v) {
  return Math.round(v);
}

const rules = {
  /** @param {unknown} v */
  amount: (v) => {
    if (v === '' || v === null || v === undefined) return true;
    const n = Number(v);
    if (!Number.isFinite(n)) return 'Введите число';
    if (n < 0) return 'Не может быть отрицательным';
    return n <= AMOUNT_MAX || 'Слишком большая сумма';
  },
};

// ------------------------------------------------------------ калькулятор
const defaultStatus = () => (REGIMES_BY_STATUS[companyType.value] ? companyType.value : 'self_employed');

const calc = reactive({
  status: defaultStatus(),
  incomeIndividuals: /** @type {number|string} */ (''),
  incomeLegal: /** @type {number|string} */ (''),
  expenses: /** @type {number|string} */ (''),
  contributions: /** @type {number|string} */ (''),
  hasEmployees: false,
  npdDeductionLeft: /** @type {number|string} */ (NPD_DEDUCTION_TOTAL),
});

// Сессия могла восстановиться уже после создания компонента.
watch(companyType, (type) => {
  if (REGIMES_BY_STATUS[type] && !num(calc.incomeIndividuals) && !num(calc.incomeLegal)) calc.status = type;
});

function resetCalc() {
  Object.assign(calc, {
    incomeIndividuals: '',
    incomeLegal: '',
    expenses: '',
    contributions: '',
    hasEmployees: false,
    npdDeductionLeft: NPD_DEDUCTION_TOTAL,
  });
}

const regimes = computed(() => REGIMES_BY_STATUS[calc.status] || []);
const totalIncome = computed(() => num(calc.incomeIndividuals) + num(calc.incomeLegal));

const contributionsHint = computed(() =>
  calc.status === 'ip'
    ? 'Взносы ИП «за себя» и за работников. На УСН 6% уменьшают налог, на УСН 15% входят в расходы'
    : 'Взносы за работников. На УСН 6% уменьшают налог (не более 50%), на УСН 15% входят в расходы',
);

/**
 * НПД: 4% с доходов от физлиц, 6% — от организаций и ИП; вычет снижает ставки до 3%/4%.
 * Итоговый налог не зависит от порядка поступлений: вычет = min(остаток, 1%·физлица + 2%·юрлица).
 */
function calcNpd(ind, leg, deductionLeft) {
  const gross = ind * NPD_RATE_INDIVIDUAL + leg * NPD_RATE_LEGAL;
  const capacity = ind * NPD_DEDUCTION_RATE_INDIVIDUAL + leg * NPD_DEDUCTION_RATE_LEGAL;
  const deduction = Math.min(capacity, Math.min(Math.max(deductionLeft, 0), NPD_DEDUCTION_TOTAL));
  const details = [`4% × ${formatMoney(ind)} + 6% × ${formatMoney(leg)}`];
  if (deduction > 0) details.push(`налоговый вычет −${formatMoney(deduction)} (ставки 3% / 4% до исчерпания)`);
  return { key: 'npd', title: 'НПД', tax: round(gross - deduction), contributions: 0, details };
}

/** УСН «Доходы» 6%: налог уменьшается на уплаченные взносы (ИП без работников — до 100%, иначе — до 50%). */
function calcUsnIncome(income, contributions, fullReduction) {
  const gross = income * USN_INCOME_RATE;
  const limit = fullReduction ? gross : gross * 0.5;
  const reduction = Math.min(contributions, limit);
  const details = [`6% × ${formatMoney(income)} = ${formatMoney(round(gross))}`];
  if (reduction > 0) {
    details.push(`уменьшение на взносы −${formatMoney(reduction)}${fullReduction ? '' : ' (не более 50%)'}`);
  }
  return { key: 'usn_income', title: 'УСН «Доходы» 6%', tax: round(gross - reduction), contributions, details };
}

/** УСН «Доходы минус расходы» 15%: по итогам года не меньше минимального налога 1% от доходов. */
function calcUsnIncomeExpense(income, expenses, contributions) {
  const base = Math.max(income - expenses - contributions, 0);
  const regular = base * USN_IE_RATE;
  const minTax = income * USN_MIN_TAX_RATE;
  const details = [`15% × ${formatMoney(base)} (доходы − расходы − взносы)`];
  let tax = regular;
  if (minTax > regular) {
    tax = minTax;
    details.push(`применён минимальный налог 1% от доходов: ${formatMoney(round(minTax))}`);
  }
  return { key: 'usn_income_expense', title: 'УСН «Доходы − расходы» 15%', tax: round(tax), contributions, details };
}

const results = computed(() => {
  const ind = num(calc.incomeIndividuals);
  const leg = num(calc.incomeLegal);
  const income = ind + leg;
  const expenses = num(calc.expenses);
  const contributions = calc.status === 'self_employed' ? 0 : num(calc.contributions);
  const fullReduction = calc.status === 'ip' && !calc.hasEmployees;
  return regimes.value.map((r) => {
    if (r === 'npd') return calcNpd(ind, leg, num(calc.npdDeductionLeft));
    if (r === 'usn_income') return calcUsnIncome(income, contributions, fullReduction);
    return calcUsnIncomeExpense(income, expenses, contributions);
  });
});

/** Режим с минимальной нагрузкой (налог + взносы); НПД при превышении лимита не участвует. */
const bestKey = computed(() => {
  const candidates = results.value.filter((r) => !(r.key === 'npd' && totalIncome.value > NPD_YEAR_LIMIT));
  if (!candidates.length || totalIncome.value <= 0) return null;
  return candidates.reduce((a, b) => (b.tax + b.contributions < a.tax + a.contributions ? b : a)).key;
});

const warnings = computed(() => {
  const list = [];
  if (regimes.value.includes('npd') && totalIncome.value > NPD_YEAR_LIMIT) {
    list.push('Доход превышает лимит НПД 2 400 000 ₽ в год — применять НПД нельзя, нужен другой режим.');
  }
  if (regimes.value.includes('usn_income_expense') && num(calc.expenses) + num(calc.contributions) > totalIncome.value && totalIncome.value > 0) {
    list.push('Расходы превышают доходы — на УСН 15% уплачивается минимальный налог 1% от доходов.');
  }
  return list;
});

const chart = computed(() => ({
  labels: results.value.map((r) => r.title),
  datasets: [
    { label: 'Налог', data: results.value.map((r) => r.tax), backgroundColor: '#1976D2' },
    { label: 'Страховые взносы', data: results.value.map((r) => r.contributions), backgroundColor: '#FFB300' },
  ],
}));

const chartOptions = {
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: { stacked: true, beginAtZero: true, ticks: { callback: (v) => `${Number(v).toLocaleString('ru-RU')} ₽` } },
  },
  plugins: {
    legend: { position: 'top' },
    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}` } },
  },
};

// ------------------------------------------------------------ по моим данным (сервер)
const currentYear = dayjs().year();
const yearItems = [currentYear, currentYear - 1, currentYear - 2].filter((y) => y >= 2019);

const est = reactive({
  year: currentYear,
  quarter: 0,
  regime: 'usn_income',
  deductionUsed: /** @type {number|string} */ (0),
});
/** @type {import('vue').Ref<null|{regime: string, period: string, income: number, income_individuals: number,
 *   income_legal: number, expenses: number, tax_base: number, tax: number, rate_description: string, notes: string[]}>} */
const estimate = ref(null);
const estLoading = ref(false);

async function loadEstimate() {
  const deduction = Number(est.deductionUsed);
  if (companyType.value === 'self_employed' && (!Number.isFinite(deduction) || deduction < 0 || deduction > NPD_DEDUCTION_TOTAL)) {
    notify.warning('Израсходованный вычет — от 0 до 10 000 ₽');
    return;
  }
  estLoading.value = true;
  try {
    estimate.value = await getTaxEstimate({
      year: est.year,
      quarter: est.quarter || undefined,
      regime: companyType.value === 'ip' || companyType.value === 'ooo' ? est.regime : undefined,
      deduction_used: companyType.value === 'self_employed' ? num(deduction) : undefined,
    });
  } catch (err) {
    estimate.value = null;
    notify.error(err);
  } finally {
    estLoading.value = false;
  }
}

function fillCalculator() {
  const e = estimate.value;
  if (!e) return;
  if (REGIMES_BY_STATUS[companyType.value]) calc.status = companyType.value;
  calc.incomeIndividuals = Number(e.income_individuals) || 0;
  calc.incomeLegal = Number(e.income_legal) || 0;
  calc.expenses = Number(e.expenses) || 0;
  if (calc.status === 'self_employed' || calc.status === 'ip') {
    calc.npdDeductionLeft = Math.max(0, NPD_DEDUCTION_TOTAL - num(est.deductionUsed));
  }
  notify.info('Данные подставлены в калькулятор');
}

// ------------------------------------------------------------ налоговый календарь
/** @type {import('vue').Ref<{date: string, title: string, description: string, regime: string}[]>} */
const calendar = ref([]);
const calLoading = ref(false);
const today = dayjs().format('YYYY-MM-DD');

const upcoming = computed(() =>
  calendar.value
    .filter((i) => i.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6),
);

/** @param {string} date */
function daysLeft(date) {
  return dayjs(date).diff(dayjs(today), 'day');
}

async function loadCalendar() {
  calLoading.value = true;
  try {
    // Сроки за прошлый год (декларации, налог за год) приходятся на текущий — берём оба года.
    const [prev, cur] = await Promise.all([
      getTaxCalendar({ year: currentYear - 1 }),
      getTaxCalendar({ year: currentYear }),
    ]);
    calendar.value = [...(prev.items || []), ...(cur.items || [])];
  } catch (err) {
    notify.error(err);
  } finally {
    calLoading.value = false;
  }
}

onMounted(() => {
  loadEstimate();
  loadCalendar();
});
</script>
