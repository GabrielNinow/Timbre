<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KsRow from '@/pages/kitchen-sink/KsRow.vue'
import KsSection from '@/pages/kitchen-sink/KsSection.vue'

const swatches = [
  { name: 'band', swatch: 'bg-band', ink: 'text-on-band' },
  { name: 'band-hover', swatch: 'bg-band-hover', ink: 'text-on-band' },
  { name: 'band-sub', swatch: 'bg-band-sub', ink: 'text-on-band' },
  { name: 'action', swatch: 'bg-action', ink: 'text-on-action' },
  { name: 'action-hover', swatch: 'bg-action-hover', ink: 'text-on-action' },
  { name: 'action-quiet', swatch: 'bg-action-quiet', ink: 'text-ink' },
  { name: 'gain', swatch: 'bg-gain', ink: 'text-surface' },
  { name: 'gain-quiet', swatch: 'bg-gain-quiet', ink: 'text-gain' },
  { name: 'fault', swatch: 'bg-fault', ink: 'text-surface' },
  { name: 'fault-quiet', swatch: 'bg-fault-quiet', ink: 'text-fault' },
  { name: 'field', swatch: 'bg-field', ink: 'text-ink' },
  { name: 'surface', swatch: 'bg-surface', ink: 'text-ink' },
  { name: 'sunken', swatch: 'bg-sunken', ink: 'text-ink' },
  { name: 'ink', swatch: 'bg-ink', ink: 'text-surface' },
  { name: 'muted', swatch: 'bg-muted', ink: 'text-surface' },
  { name: 'faint', swatch: 'bg-faint', ink: 'text-ink' },
  { name: 'line', swatch: 'bg-line', ink: 'text-ink' },
  { name: 'line-heavy', swatch: 'bg-line-heavy', ink: 'text-ink' },
  { name: 'star', swatch: 'bg-star', ink: 'text-ink' },
] as const
const scale = [
  { name: 'display-lg', className: 'text-display-lg font-wide' },
  { name: 'display', className: 'text-display font-wide' },
  { name: 'heading', className: 'text-heading' },
  { name: 'body', className: 'text-body' },
  { name: 'body-sm', className: 'text-body-sm' },
  { name: 'label', className: 'text-label uppercase' },
  { name: 'mono', className: 'font-mono text-mono uppercase' },
] as const
const { t } = useI18n()
</script>

<template>
  <KsSection id="tokens" :title="t('kitchenSink.sections.tokens')">
    <KsRow :label="t('kitchenSink.tokens.colors')">
      <div
        v-for="swatch in swatches"
        :key="swatch.name"
        :data-token="swatch.name"
        data-testid="ks-swatch"
        class="flex h-12 w-32 items-end rounded-control border border-line p-1"
        :class="swatch.swatch"
      >
        <span class="font-mono text-mono" :class="swatch.ink">{{ swatch.name }}</span>
      </div>
    </KsRow>
    <KsRow :label="t('kitchenSink.tokens.type')" stacked>
      <p v-for="style in scale" :key="style.name" class="flex items-baseline gap-3">
        <span class="w-28 shrink-0 font-mono text-mono text-muted">{{ style.name }}</span>
        <span :class="style.className">{{ t('kitchenSink.tokens.sample') }}</span>
      </p>
    </KsRow>
  </KsSection>
</template>