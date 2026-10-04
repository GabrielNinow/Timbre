<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'

interface Props {
  activeCount: number
}
defineProps<Props>()
defineSlots<{ default: () => unknown }>()

const { t } = useI18n()
const open = ref(false)
</script>

<template>
  <BaseButton
    testid="filter-open"
    variant="outline"
    size="sm"
    :aria-expanded="open"
    @click="open = true"
  >
    {{ activeCount > 0 ? t('listing.openFiltersCount', { count: activeCount }) : t('listing.openFilters') }}
  </BaseButton>
  <BaseDialog
    v-model:open="open"
    testid="filter-dialog"
    size="full"
    :title="t('listing.filtersHeading')"
  >
    <slot />
    <template #footer>
      <BaseButton testid="filter-dialog-done" block @click="open = false">
        {{ t('listing.showResults') }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>
