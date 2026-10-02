<template>
  <template v-if="state">
    <v-tooltip v-if="props.compact" :text="tooltip" location="top">
      <template #activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          :icon="state.icon"
          :color="state.color"
          size="small"
          :aria-label="state.text"
          role="img"
          :class="{ 'cursor-pointer': state.to }"
          @click.stop="onIconClick"
        />
      </template>
    </v-tooltip>
    <v-chip
      v-else
      :color="state.color"
      :prepend-icon="state.icon"
      :to="state.to"
      variant="tonal"
      size="small"
      label
      @click.stop
    >
      {{ state.text }}
    </v-chip>
  </template>
</template>

<script setup>
/**
 * Состояние выгрузки дохода по оплаченному документу в «Финансы» (API.md, 12.1).
 *  - оплачен и income_synced → «Доход учтён» (зелёный, ссылка на /finance);
 *  - оплачен, есть дата оплаты и сумма > 0, но не синхронизирован → «Доход не синхронизирован,
 *    повтор автоматически» (оранжевый; documents-service повторяет раз в 5 минут);
 *  - оплачен без даты оплаты (документ до v2.1) → «Доход не учтён — укажите дату оплаты».
 * Для неоплаченных документов ничего не показывает.
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { formatDate } from '@/utils/format.js';

const props = defineProps({
  /** @type {import('vue').PropType<import('@/api/types.js').Document>} */
  doc: { type: Object, required: true },
  /** Иконка с подсказкой (для таблицы) вместо чипа. */
  compact: { type: Boolean, default: false },
});

const router = useRouter();

const state = computed(() => {
  const doc = props.doc;
  if (!doc || doc.status !== 'paid' || !(Number(doc.total) > 0)) return null;
  if (doc.income_synced) {
    return { text: 'Доход учтён', color: 'success', icon: 'mdi-cash-check', to: '/finance' };
  }
  if (!doc.paid_at) {
    return { text: 'Доход не учтён — укажите дату оплаты', color: 'warning', icon: 'mdi-calendar-alert', to: null };
  }
  return {
    text: 'Доход не синхронизирован, повтор автоматически',
    color: 'warning',
    icon: 'mdi-sync-alert',
    to: null,
  };
});

const tooltip = computed(() => {
  if (!state.value) return '';
  const paid = props.doc.paid_at ? `Оплачен ${formatDate(props.doc.paid_at)}. ` : '';
  return `${paid}${state.value.text}`;
});

function onIconClick() {
  if (state.value?.to) router.push(state.value.to);
}
</script>
