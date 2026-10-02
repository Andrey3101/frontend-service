<template>
  <div>
    <v-card class="mb-4">
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="onCheck">
          <v-row dense align="start">
            <v-col cols="12" sm="8" md="6">
              <v-text-field
                v-model.trim="inn"
                label="ИНН организации или ИП"
                inputmode="numeric"
                prepend-inner-icon="mdi-magnify"
                :maxlength="12"
                counter="12"
                :rules="innRules"
                hint="10 цифр — организация, 12 цифр — ИП"
                persistent-hint
                autofocus
              />
            </v-col>
            <v-col cols="12" sm="4" md="3">
              <v-btn type="submit" color="primary" size="large" block :loading="loading" prepend-icon="mdi-shield-search">
                Проверить
              </v-btn>
            </v-col>
          </v-row>
        </v-form>

        <div v-if="history.length" class="d-flex align-center flex-wrap ga-2 mt-4">
          <span class="text-caption text-medium-emphasis">Недавние проверки:</span>
          <v-chip
            v-for="entry in history"
            :key="entry.inn"
            size="small"
            variant="outlined"
            :disabled="loading"
            @click="recheck(entry.inn)"
          >
            {{ entry.name || entry.inn }}
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <v-alert v-if="notConfigured" type="warning" variant="tonal" class="mb-4" prominent>
      Проверка контрагентов не настроена (нужен ключ DaData). Обратитесь к администратору сервиса.
    </v-alert>
    <v-alert v-else-if="notFound" type="info" variant="tonal" class="mb-4">
      Не найдено: организация или ИП с ИНН {{ lastInn }} отсутствуют в реестре.
    </v-alert>
    <v-alert v-else-if="errorText" type="error" variant="tonal" class="mb-4">{{ errorText }}</v-alert>

    <v-card v-if="result" :loading="loading">
      <v-card-title class="d-flex align-start flex-wrap ga-2">
        <div class="mr-2">
          <div class="text-h6 text-wrap">{{ result.name || 'Без названия' }}</div>
          <div class="text-body-2 text-medium-emphasis">
            ИНН {{ result.inn || lastInn }}<template v-if="result.kpp"> · КПП {{ result.kpp }}</template>
          </div>
        </div>
        <v-spacer />
        <v-chip v-if="result.status" :color="statusColor" variant="flat" :prepend-icon="statusIcon">
          {{ result.status }}
        </v-chip>
      </v-card-title>

      <v-card-text>
        <div class="d-flex flex-wrap ga-2 mb-4">
          <template v-if="result.risk_flags.length">
            <v-chip
              v-for="(flag, i) in result.risk_flags"
              :key="i"
              :color="flagColor(flag)"
              variant="tonal"
              prepend-icon="mdi-alert-outline"
              class="risk-chip"
            >
              {{ flag }}
            </v-chip>
          </template>
          <v-chip v-else color="success" variant="tonal" prepend-icon="mdi-check-decagram-outline">
            Признаков риска не выявлено
          </v-chip>
        </div>

        <v-table density="compact">
          <tbody>
            <tr>
              <td class="text-medium-emphasis label-cell">ОГРН / ОГРНИП</td>
              <td>{{ result.ogrn || '—' }}</td>
            </tr>
            <tr>
              <td class="text-medium-emphasis label-cell">Дата регистрации</td>
              <td>{{ formatDate(result.registration_date) }}</td>
            </tr>
            <tr>
              <td class="text-medium-emphasis label-cell">Адрес</td>
              <td>{{ result.address || '—' }}</td>
            </tr>
            <tr>
              <td class="text-medium-emphasis label-cell">Руководитель</td>
              <td>
                <template v-if="result.management?.name">
                  {{ result.management.name }}
                  <span v-if="result.management.post" class="text-medium-emphasis">— {{ result.management.post }}</span>
                </template>
                <template v-else>—</template>
              </td>
            </tr>
            <tr>
              <td class="text-medium-emphasis label-cell">Основной ОКВЭД</td>
              <td>{{ result.okved || '—' }}</td>
            </tr>
          </tbody>
        </v-table>

        <div class="text-caption text-medium-emphasis mt-3">
          Данные ЕГРЮЛ/ЕГРИП предоставлены сервисом DaData. Автоматически проверяются статус и дата регистрации — это
          не заменяет полную проверку благонадёжности контрагента.
        </div>
      </v-card-text>
    </v-card>

    <v-card v-else-if="!loading && !errorText && !notFound && !notConfigured" variant="tonal" color="primary">
      <v-card-text class="d-flex align-center ga-3">
        <v-icon icon="mdi-information-outline" />
        <span class="text-body-2">
          Введите ИНН, чтобы узнать статус, адрес, руководителя и основной вид деятельности контрагента и увидеть
          признаки риска (ликвидация, банкротство, недавняя регистрация).
        </span>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { checkContractor, errorMessage } from '@/api';
import { formatDate } from '@/utils/format';

const HISTORY_SIZE = 8;

/** Контрольная сумма ИНН по алгоритму ФНС (как на сервере). */
function innChecksumOk(value) {
  const d = value.split('').map(Number);
  const check = (weights, len) => (weights.reduce((sum, w, i) => sum + w * d[i], 0) % 11) % 10 === d[len];
  if (d.every((x) => x === 0)) return false;
  if (d.length === 10) return check([2, 4, 10, 3, 5, 9, 4, 6, 8], 9);
  if (d.length === 12) {
    return check([7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 10) && check([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8], 11);
  }
  return false;
}

const innRules = [
  (v) => !!v || 'Введите ИНН',
  (v) => /^\d+$/.test(v || '') || 'Только цифры',
  (v) => [10, 12].includes((v || '').length) || 'ИНН — 10 цифр (организация) или 12 цифр (ИП)',
  (v) => innChecksumOk(v || '') || 'Неверная контрольная сумма ИНН',
];

const formRef = ref(null);
const inn = ref('');
const lastInn = ref('');
const loading = ref(false);
const result = ref(null);
const errorText = ref('');
const notFound = ref(false);
const notConfigured = ref(false);
/** Последние проверки — только в памяти страницы (на сервере история не хранится). */
const history = ref([]);

const isActive = computed(() => result.value?.status === 'Действующая');
const statusColor = computed(() => (isActive.value ? 'success' : 'error'));
const statusIcon = computed(() => (isActive.value ? 'mdi-check-circle' : 'mdi-close-octagon'));

/** Не действует (ликвидация, банкротство…) — красный; прочие признаки (недавняя регистрация) — оранжевый. */
function flagColor(flag) {
  return /не действует|ликвид|банкрот|реорганиз/i.test(flag) ? 'error' : 'warning';
}

async function runCheck(value) {
  loading.value = true;
  errorText.value = '';
  notFound.value = false;
  notConfigured.value = false;
  lastInn.value = value;
  try {
    const data = await checkContractor({ inn: value });
    result.value = { ...data, risk_flags: data.risk_flags || [] };
    history.value = [{ inn: value, name: data.name }, ...history.value.filter((h) => h.inn !== value)].slice(
      0,
      HISTORY_SIZE,
    );
  } catch (err) {
    result.value = null;
    const status = err?.response?.status;
    if (status === 503) notConfigured.value = true;
    else if (status === 404) notFound.value = true;
    else errorText.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function onCheck() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  await runCheck(inn.value);
}

function recheck(value) {
  inn.value = value;
  runCheck(value);
}
</script>

<style scoped>
.label-cell {
  width: 220px;
  white-space: nowrap;
}
.risk-chip {
  height: auto !important;
  min-height: 32px;
  white-space: normal;
}
</style>
