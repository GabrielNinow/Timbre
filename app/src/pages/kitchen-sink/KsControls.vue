<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseRadioGroup from '@/components/base/BaseRadioGroup.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import QuantityStepper from '@/components/base/QuantityStepper.vue'
import KsRow from '@/pages/kitchen-sink/KsRow.vue'
import KsSection from '@/pages/kitchen-sink/KsSection.vue'

const { t } = useI18n()

const variants = ['action', 'outline', 'quiet', 'danger'] as const

const cep = ref('89010')
const sort = ref('relevance')
const freeShipping = ref(true)
const condition = ref('like-new')
const quantity = ref(3)
const lastUnit = ref(1)

const sortOptions = [
  { value: 'relevance', label: t('kitchenSink.select.options.relevance') },
  { value: 'price-asc', label: t('kitchenSink.select.options.price-asc') },
  { value: 'price-desc', label: t('kitchenSink.select.options.price-desc') },
  { value: 'newest', label: t('kitchenSink.select.options.newest') },
]

const conditionOptions = [
  { value: 'new', label: t('condition.new') },
  { value: 'like-new', label: t('condition.like-new') },
  { value: 'used', label: t('condition.used') },
]
</script>

<template>
  <KsSection
    id="button"
    :title="t('kitchenSink.sections.button')"
    :description="`${t('kitchenSink.hint.hover')} ${t('kitchenSink.hint.focus')}`"
  >
    <KsRow v-for="variant in variants" :key="variant" :label="variant">
      <BaseButton :testid="`ks-button-${variant}`" :variant="variant">
        {{ t('kitchenSink.states.default') }}
      </BaseButton>
      <BaseButton :testid="`ks-button-${variant}-hover`" :variant="variant" data-force-state="hover">
        {{ t('kitchenSink.states.hover') }}
      </BaseButton>
      <BaseButton :testid="`ks-button-${variant}-focus`" :variant="variant" data-force-state="focus">
        {{ t('kitchenSink.states.focus') }}
      </BaseButton>
      <BaseButton :testid="`ks-button-${variant}-loading`" :variant="variant" loading>
        {{ t('kitchenSink.states.loading') }}
      </BaseButton>
      <BaseButton :testid="`ks-button-${variant}-disabled`" :variant="variant" disabled>
        {{ t('kitchenSink.states.disabled') }}
      </BaseButton>
    </KsRow>

    <KsRow :label="t('kitchenSink.button.sizes')">
      <BaseButton testid="ks-button-sm" size="sm">{{ t('kitchenSink.button.quiet') }}</BaseButton>
      <BaseButton testid="ks-button-md" size="md">{{ t('kitchenSink.button.action') }}</BaseButton>
      <BaseButton testid="ks-button-lg" size="lg">{{ t('kitchenSink.button.outline') }}</BaseButton>
    </KsRow>
  </KsSection>

  <KsSection id="input" :title="t('kitchenSink.sections.input')">
    <KsRow :label="t('kitchenSink.states.default')">
      <div class="w-64">
        <BaseInput
          v-model="cep"
          name="cep"
          :label="t('kitchenSink.input.label')"
          :placeholder="t('kitchenSink.input.placeholder')"
          inputmode="numeric"
          required
        />
      </div>
      <div class="w-64">
        <BaseInput
          v-model="cep"
          name="cep-hint"
          :label="t('kitchenSink.input.label')"
          :hint="t('kitchenSink.input.hint')"
        />
      </div>
    </KsRow>

    <KsRow :label="`${t('kitchenSink.states.error')} · ${t('kitchenSink.states.disabled')}`">
      <div class="w-64">
        <BaseInput
          v-model="cep"
          name="cep-error"
          :label="t('kitchenSink.input.label')"
          :error="t('kitchenSink.input.error')"
          error-code="CEP_NOT_FOUND"
        />
      </div>
      <div class="w-64">
        <BaseInput v-model="cep" name="cep-disabled" :label="t('kitchenSink.input.label')" disabled />
      </div>
    </KsRow>
  </KsSection>

  <KsSection id="select" :title="t('kitchenSink.sections.select')">
    <KsRow :label="`${t('kitchenSink.states.default')} · ${t('kitchenSink.states.error')} · ${t('kitchenSink.states.disabled')}`">
      <div class="w-64">
        <BaseSelect
          v-model="sort"
          name="sort"
          testid="sort-select"
          :label="t('kitchenSink.select.label')"
          :options="sortOptions"
        />
      </div>
      <div class="w-64">
        <BaseSelect
          v-model="sort"
          name="sort-error"
          :label="t('kitchenSink.select.label')"
          :options="sortOptions"
          :error="t('kitchenSink.checkbox.error')"
          error-code="VALIDATION_ERROR"
        />
      </div>
      <div class="w-64">
        <BaseSelect
          v-model="sort"
          name="sort-disabled"
          :label="t('kitchenSink.select.label')"
          :options="sortOptions"
          disabled
        />
      </div>
    </KsRow>
  </KsSection>

  <KsSection id="checkbox" :title="t('kitchenSink.sections.checkbox')">
    <KsRow :label="t('kitchenSink.states.default')" stacked>
      <div class="flex w-72 flex-col gap-3">
        <BaseCheckbox v-model="freeShipping" name="frete" :label="t('kitchenSink.checkbox.label')">
          <template #trailing>
            <span class="font-mono text-mono text-muted">19</span>
          </template>
        </BaseCheckbox>
        <BaseCheckbox v-model="freeShipping" name="frete-indeterminate" :label="t('kitchenSink.checkbox.label')" indeterminate />
        <BaseCheckbox v-model="freeShipping" name="frete-disabled" :label="t('kitchenSink.checkbox.label')" disabled />
        <BaseCheckbox
          v-model="freeShipping"
          name="frete-error"
          :label="t('kitchenSink.checkbox.label')"
          :error="t('kitchenSink.checkbox.error')"
          error-code="VALIDATION_ERROR"
        />
      </div>
    </KsRow>
  </KsSection>

  <KsSection id="radio" :title="t('kitchenSink.sections.radio')">
    <KsRow :label="`${t('kitchenSink.states.default')} · ${t('kitchenSink.states.error')}`">
      <BaseRadioGroup
        v-model="condition"
        class="w-56"
        name="condicao"
        :label="t('kitchenSink.radio.label')"
        :options="conditionOptions"
      />
      <BaseRadioGroup
        v-model="condition"
        class="w-full max-w-md"
        name="condicao-horizontal"
        orientation="horizontal"
        :label="t('kitchenSink.radio.label')"
        :options="conditionOptions"
        :error="t('kitchenSink.radio.error')"
        error-code="VALIDATION_ERROR"
      />
      <BaseRadioGroup
        v-model="condition"
        class="w-56"
        name="condicao-disabled"
        :label="t('kitchenSink.radio.label')"
        :options="conditionOptions"
        disabled
      />
    </KsRow>
  </KsSection>

  <KsSection id="quantity" :title="t('kitchenSink.sections.quantity')">
    <KsRow :label="t('kitchenSink.quantity.plenty')">
      <QuantityStepper v-model="quantity" testid="qty" :max="8" />
    </KsRow>
    <KsRow :label="t('kitchenSink.quantity.lastUnit')">
      <QuantityStepper v-model="lastUnit" testid="qty-last" :max="1" notice-testid="stock-limit-notice" />
    </KsRow>
    <KsRow :label="t('kitchenSink.quantity.soldOut')">
      <QuantityStepper :model-value="0" testid="qty-sold-out" :max="0" />
    </KsRow>
  </KsSection>
</template>
