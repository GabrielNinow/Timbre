<script setup lang="ts">
import { couponBodySchema, type AppliedCoupon } from '@timbre/contracts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/api/client'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useCartStore } from '@/stores/cart'

interface Props {
  coupon: AppliedCoupon | null
}
defineProps<Props>()
const { t, te } = useI18n()
const cart = useCartStore()

const code = ref('')
const error = ref<string | null>(null)

function messageFor(errorCode: string): string {
  const key = `coupon.errors.${errorCode}`
  return te(key) ? t(key) : t('coupon.errors.fallback')
}

async function apply(): Promise<void> {
  const parsed = couponBodySchema.safeParse({ code: code.value })
  if (!parsed.success) {
    error.value = 'VALIDATION_ERROR'
    return
  }
  error.value = null
  try {
    await cart.applyCoupon(parsed.data.code)
    code.value = ''
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.code : 'NETWORK_ERROR'
  }
}

async function remove(): Promise<void> {
  error.value = null
  try {
    await cart.removeCoupon()
  } catch (caught) {
    error.value = caught instanceof ApiError ? caught.code : 'NETWORK_ERROR'
  }
}
</script>

<template>
  <div data-testid="coupon-form" class="flex flex-col gap-2">
    <p v-if="coupon" data-testid="coupon-applied" :data-code="coupon.code" class="flex items-center justify-between gap-2 text-body text-gain">
      {{ t('coupon.applied', { code: coupon.code }) }}
      <BaseButton testid="coupon-remove" variant="quiet" size="sm" :loading="cart.pending?.kind === 'coupon-remove'" @click="remove">
        {{ t('coupon.remove') }}
      </BaseButton>
    </p>
    <form v-else class="flex items-start gap-2" novalidate @submit.prevent="apply">
      <BaseInput
        v-model="code"
        class="flex-1"
        name="coupon"
        testid="coupon-input"
        autocomplete="off"
        :maxlength="40"
        :label="t('coupon.label')"
      />
      <BaseButton testid="coupon-apply" type="submit" variant="outline" class="mt-5" :loading="cart.pending?.kind === 'coupon'">
        {{ t('coupon.apply') }}
      </BaseButton>
    </form>
    <p v-if="error" data-testid="coupon-error" :data-error-code="error" role="alert" class="text-body-sm text-fault">
      {{ messageFor(error) }}
    </p>
    <p v-if="cart.droppedCoupon" data-testid="coupon-dropped-notice" :data-code="cart.droppedCoupon" role="status" class="text-body-sm text-ink">
      {{ t('coupon.dropped', { code: cart.droppedCoupon }) }}
    </p>
  </div>
</template>
