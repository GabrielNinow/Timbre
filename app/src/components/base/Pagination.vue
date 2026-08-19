<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

interface Props {
  page: number
  pageCount: number
  testid?: string
  siblingCount?: number
  disabled?: boolean
  to?: (page: number) => RouteLocationRaw
}
const props = withDefaults(defineProps<Props>(), {
  testid: 'pagination',
  siblingCount: 1,
  disabled: false,
  to: undefined,
})
const emit = defineEmits<{
  'update:page': [page: number]
}>()

const { t } = useI18n()
type Slot =
  | { kind: 'page'; key: string; page: number }
  | { kind: 'ellipsis'; key: string; side: 'start' | 'end' }

function toInt(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : fallback
}

function windowOf(page: number, pageCount: number, siblingCount: number): Slot[] {
  const total = Math.max(toInt(pageCount, 0), 0)
  if (total < 2) return []
  const siblings = Math.max(toInt(siblingCount, 1), 0)
  const current = Math.min(Math.max(toInt(page, 1), 1), total)
  if (total <= Math.max(siblings * 2 + 5, 7)) {
    return Array.from({ length: total }, (_unused, index) => ({
      kind: 'page' as const,
      key: `page-${index + 1}`,
      page: index + 1,
    }))
  }
  let start = current - siblings
  let end = current + siblings
  if (start < 2) {
    end += 2 - start
    start = 2
  }
  if (end > total - 1) {
    start -= end - (total - 1)
    end = total - 1
  }
  start = Math.max(start, 2)
  end = Math.min(end, total - 1)
  const slots: Slot[] = [{ kind: 'page', key: 'page-1', page: 1 }]
  if (start > 2) slots.push({ kind: 'ellipsis', key: 'ellipsis-start', side: 'start' })
  for (let n = start; n <= end; n += 1) slots.push({ kind: 'page', key: `page-${n}`, page: n })
  if (end < total - 1) slots.push({ kind: 'ellipsis', key: 'ellipsis-end', side: 'end' })
  slots.push({ kind: 'page', key: `page-${total}`, page: total })
  return slots
}

const total = computed(() => Math.max(toInt(props.pageCount, 0), 0))
const current = computed(() => Math.min(Math.max(toInt(props.page, 1), 1), Math.max(total.value, 1)))
const slots = computed(() => windowOf(props.page, props.pageCount, props.siblingCount))
const links = computed(() => props.to !== undefined && !props.disabled)
const atStart = computed(() => current.value <= 1)
const atEnd = computed(() => current.value >= total.value)

const pageTag = computed(() => (links.value ? RouterLink : 'button'))
const prevTag = computed(() => (links.value && !atStart.value ? RouterLink : 'button'))
const nextTag = computed(() => (links.value && !atEnd.value ? RouterLink : 'button'))
function routeFor(target: number, enabled = true): RouteLocationRaw | undefined {
  return enabled && links.value && props.to !== undefined ? props.to(target) : undefined
}
function select(target: number): void {
  if (props.disabled || links.value) return
  if (target < 1 || target > total.value || target === current.value) return
  emit('update:page', target)
}
const cell = 'btn size-10 text-body'
const quiet = 'text-ink hover:bg-sunken'
</script>
<template>
  <nav
    v-if="slots.length > 0"
    :data-testid="testid"
    :data-page-count="total"
    :data-current-page="current"
    :data-disabled="disabled ? 'true' : undefined"
    :aria-label="t('pagination.label')"
  >
    <p class="sr-only">{{ t('pagination.summary', { page: current, pages: total }) }}</p>
    <ul class="flex flex-wrap items-center gap-1">
      <li>
        <component
          :is="prevTag"
          :data-testid="`${testid}-prev`"
          :aria-label="t('pagination.previous')"
          :to="routeFor(current - 1, !atStart)"
          :type="prevTag === 'button' ? 'button' : undefined"
          :disabled="atStart || disabled || undefined"
          :class="[cell, quiet]"
          @click="select(current - 1)"
        >
          <svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <path d="M10 3 5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </component>
      </li>
      <li v-for="slot in slots" :key="slot.key">
        <span
          v-if="slot.kind === 'ellipsis'"
          :data-testid="`${testid}-ellipsis`"
          :data-side="slot.side"
          aria-hidden="true"
          class="flex size-10 items-center justify-center text-body text-faint"
        >&hellip;</span>
        <component
          :is="pageTag"
          v-else
          :data-testid="`${testid}-page`"
          :data-page="slot.page"
          :data-current="slot.page === current ? 'true' : undefined"
          :aria-current="slot.page === current ? 'page' : undefined"
          :aria-label="
            slot.page === current
              ? t('pagination.currentPage', { page: slot.page })
              : t('pagination.goToPage', { page: slot.page })
          "
          :to="routeFor(slot.page)"
          :type="pageTag === 'button' ? 'button' : undefined"
          :disabled="disabled || undefined"
          :class="[cell, slot.page === current ? 'bg-band text-on-band' : quiet]"
          @click="select(slot.page)"
        >
          {{ slot.page }}
        </component>
      </li>
      <li>
        <component
          :is="nextTag"
          :data-testid="`${testid}-next`"
          :aria-label="t('pagination.next')"
          :to="routeFor(current + 1, !atEnd)"
          :type="nextTag === 'button' ? 'button' : undefined"
          :disabled="atEnd || disabled || undefined"
          :class="[cell, quiet]"
          @click="select(current + 1)"
        >
          <svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <path d="m6 3 5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </component>
      </li>
    </ul>
  </nav>
</template>