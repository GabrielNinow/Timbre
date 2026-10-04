<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageLanguage } from '@/composables/usePageLanguage'
import { localizePath } from '@/lib/language'
import { useCheckoutStore } from '@/stores/checkout'

type Step = 'shipping' | 'payment' | 'review'
interface Props {
  current: Step
}
const props = defineProps<Props>()
const { t } = useI18n()
const language = usePageLanguage()
const checkout = useCheckoutStore()
const ORDER: Step[] = ['shipping', 'payment', 'review']

const steps = computed(() =>
  ORDER.map((step, index) => {
    const currentIndex = ORDER.indexOf(props.current)
    const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo'
    const reachable =
      step === 'shipping' || (step === 'payment' && checkout.draft.shippingDone) || (step === 'review' && checkout.draft.paymentDone)
    return { step, index, state, link: state === 'done' && reachable ? localizePath(`/checkout/${step}`, language.value) : null }
  }),
)
</script>

<template>
  <nav data-testid="checkout-stepper" :data-current="current" :aria-label="t('checkout.stepsLabel')">
    <ol class="flex flex-wrap items-center gap-2">
      <li
        v-for="item in steps"
        :key="item.step"
        data-testid="checkout-step"
        :data-step="item.step"
        :data-state="item.state"
        class="flex items-center gap-2"
      >
        <span
          aria-hidden="true"
          class="inline-flex size-7 items-center justify-center rounded-full border text-body-sm font-semibold"
          :class="item.state === 'todo' ? 'border-line-heavy bg-surface text-ink' : 'border-band bg-band text-on-band'"
        >{{ item.index + 1 }}</span>
        <RouterLink v-if="item.link" :to="item.link" class="text-body font-semibold text-band underline">{{ t(`checkout.steps.${item.step}`) }}</RouterLink>
        <span v-else :aria-current="item.state === 'current' ? 'step' : undefined" class="text-body" :class="item.state === 'current' ? 'font-semibold text-ink' : 'text-ink'">
          {{ t(`checkout.steps.${item.step}`) }}
        </span>
        <span class="sr-only">({{ t(`checkout.stepState.${item.state}`) }})</span>
        <span v-if="item.index < 2" aria-hidden="true" class="mx-1 h-px w-6 bg-line-heavy" />
      </li>
    </ol>
  </nav>
</template>
