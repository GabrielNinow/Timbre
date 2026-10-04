<script setup lang="ts">
import { sortSchema, type Sort } from '@timbre/contracts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseSelect from '@/components/base/BaseSelect.vue'

interface Props {
  modelValue: Sort
}
defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: Sort] }>()

const { t } = useI18n()
const options = computed(() =>
  sortSchema.options.map((value) => ({ value, label: t(`listing.sort.${value}`) })),
)

function onChange(value: string): void {
  const parsed = sortSchema.safeParse(value)
  if (parsed.success) emit('update:modelValue', parsed.data)
}
</script>

<template>
  <BaseSelect
    name="sort"
    testid="sort-select"
    :label="t('listing.sortLabel')"
    :model-value="modelValue"
    :options="options"
    hide-label
    class="w-52"
    @update:model-value="onChange"
  />
</template>
