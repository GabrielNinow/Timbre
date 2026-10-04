<script setup lang="ts">
import type { Order } from '@timbre/contracts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import { useClock } from '@/composables/clock'
import { useFormat } from '@/composables/useFormat'
import { daysUntil } from '@/lib/format'

interface Props {
  order: Order
}
const props = defineProps<Props>()
const { t } = useI18n()
const clock = useClock()
const { formatDate } = useFormat()
const copied = ref(false)

/** The countdown reads the injected clock, so `cy.clock` and `page.clock` control it. */
const remaining = computed(() =>
  props.order.payment.boletoDueDate ? daysUntil(props.order.payment.boletoDueDate, clock.now()) : null,
)

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.order.payment.pixPayload ?? '')
  } finally {
    copied.value = true
  }
}
</script>

<template>
  <section data-testid="order-payment" :data-method="order.payment.method" aria-labelledby="order-payment-heading" class="flex flex-col gap-2">
    <h2 id="order-payment-heading" class="text-heading text-ink">{{ t('order.payment') }}</h2>
    <p v-if="order.payment.method === 'card'" class="text-body text-ink">
      {{ t('order.paidCard', { brand: t(`checkout.brands.${order.payment.cardBrand ?? 'unknown'}`), last4: order.payment.cardLast4 ?? '' }) }}
    </p>
    <div v-else-if="order.payment.method === 'pix'" class="flex flex-col gap-2">
      <p class="text-body font-semibold text-ink">{{ t('order.pixHeading') }}</p>
      <code data-testid="pix-payload" class="block break-all rounded-control bg-sunken p-3 font-mono text-mono text-ink">{{ order.payment.pixPayload }}</code>
      <BaseButton testid="pix-copy" variant="outline" size="sm" class="self-start" :data-copied="copied ? 'true' : 'false'" @click="copy">
        {{ copied ? t('order.pixCopied') : t('order.pixCopy') }}
      </BaseButton>
    </div>
    <div v-else-if="order.payment.boletoDueDate" class="flex flex-col gap-1">
      <p class="text-body font-semibold text-ink">{{ t('order.boletoHeading') }}</p>
      <p data-testid="boleto-due-date" :data-date="order.payment.boletoDueDate" :data-days-remaining="remaining" class="text-body text-ink">
        {{ t('order.boletoDue', { date: formatDate(order.payment.boletoDueDate) }) }} ·
        <span data-testid="boleto-remaining">
          {{ remaining !== null && remaining < 0 ? t('order.boletoOverdue') : t('order.boletoRemaining', { days: remaining ?? 0 }, remaining ?? 0) }}
        </span>
      </p>
      <code class="block break-all font-mono text-mono text-muted">{{ order.payment.boletoLine }}</code>
    </div>
  </section>
</template>
