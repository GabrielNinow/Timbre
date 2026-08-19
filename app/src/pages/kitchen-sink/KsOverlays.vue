<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDialog from '@/components/base/BaseDialog.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BasePopover from '@/components/base/BasePopover.vue'
import { useToast } from '@/composables/useToast'
import KsRow from '@/pages/kitchen-sink/KsRow.vue'
import KsSection from '@/pages/kitchen-sink/KsSection.vue'

const { t } = useI18n()
const { show } = useToast()

const dialogOpen = ref(false)
const fullDialogOpen = ref(false)
const cep = ref('89010-000')

function showInfo(): void {
  show({
    title: t('kitchenSink.toast.title'),
    description: t('kitchenSink.toast.description'),
    actionLabel: t('kitchenSink.toast.action'),
    testid: 'add-to-cart-toast',
    variant: 'success',
  })
}

function showError(): void {
  show({
    title: t('kitchenSink.toast.errorTitle'),
    description: t('kitchenSink.toast.errorDescription'),
    variant: 'error',
    testid: 'ks-toast-error',
  })
}
</script>

<template>
  <KsSection id="dialog" :title="t('kitchenSink.sections.dialog')">
    <KsRow :label="t('kitchenSink.dialog.description')">
      <BaseButton testid="ks-dialog-trigger" variant="outline" @click="dialogOpen = true">
        {{ t('kitchenSink.dialog.trigger') }}
      </BaseButton>
      <BaseButton testid="ks-dialog-full-trigger" variant="quiet" @click="fullDialogOpen = true">
        {{ t('kitchenSink.dialog.triggerFull') }}
      </BaseButton>
    </KsRow>

    <BaseDialog
      v-model:open="dialogOpen"
      testid="ks-dialog"
      :title="t('kitchenSink.dialog.title')"
      :description="t('kitchenSink.dialog.description')"
    >
      <div class="w-full max-w-80">
        <BaseInput v-model="cep" name="dialog-cep" :label="t('kitchenSink.input.label')" />
      </div>

      <template #footer>
        <BaseButton testid="ks-dialog-cancel" variant="quiet" @click="dialogOpen = false">
          {{ t('common.cancel') }}
        </BaseButton>
        <BaseButton testid="ks-dialog-confirm" @click="dialogOpen = false">
          {{ t('kitchenSink.dialog.confirm') }}
        </BaseButton>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model:open="fullDialogOpen"
      testid="ks-dialog-full"
      size="full"
      :title="t('kitchenSink.dialog.title')"
    >
      <p class="text-body text-muted">{{ t('kitchenSink.dialog.description') }}</p>

      <template #footer>
        <BaseButton testid="ks-dialog-full-close" block @click="fullDialogOpen = false">
          {{ t('kitchenSink.dialog.confirm') }}
        </BaseButton>
      </template>
    </BaseDialog>
  </KsSection>

  <KsSection id="popover" :title="t('kitchenSink.sections.popover')">
    <KsRow :label="t('kitchenSink.popover.description')">
      <BasePopover
        testid="cep-selector"
        :title="t('kitchenSink.popover.title')"
        :description="t('kitchenSink.popover.description')"
      >
        <template #trigger>
          <BaseButton testid="cep-selector" variant="outline">
            {{ t('kitchenSink.popover.trigger') }}
          </BaseButton>
        </template>

        <BaseInput v-model="cep" name="popover-cep" :label="t('kitchenSink.input.label')" size="sm" />
      </BasePopover>
    </KsRow>
  </KsSection>

  <KsSection id="toast" :title="t('kitchenSink.sections.toast')">
    <KsRow :label="t('kitchenSink.states.default')">
      <BaseButton testid="ks-toast-trigger" variant="outline" @click="showInfo">
        {{ t('kitchenSink.toast.trigger') }}
      </BaseButton>
      <BaseButton testid="ks-toast-error-trigger" variant="danger" @click="showError">
        {{ t('kitchenSink.toast.triggerError') }}
      </BaseButton>
    </KsRow>
  </KsSection>
</template>
