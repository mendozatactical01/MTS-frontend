<template>
  <div v-if="state.show" class="tac-modal-overlay confirm-overlay" @click.self="close(false)">
    <div class="tac-modal confirm-modal" role="alertdialog" aria-modal="true"
      aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
      <div class="tac-modal-header" :class="{ 'confirm-danger': state.danger }">
        <h4 id="confirm-dialog-title">{{ state.title }}</h4>
      </div>
      <div v-if="state.message" id="confirm-dialog-message" class="tac-modal-body confirm-message">{{ state.message }}</div>
      <div class="tac-modal-footer">
        <button type="button" class="btn btn-secondary" @click="close(false)">{{ state.cancelText }}</button>
        <button ref="confirmBtn" type="button" class="btn" :class="state.danger ? 'btn-danger' : 'btn-primary'" @click="close(true)">
          {{ state.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { confirmState, closeConfirm } from '@/services/confirmDialog'

export default {
  name: 'ConfirmDialog',
  data() {
    return { state: confirmState }
  },
  watch: {
    'state.show'(open) {
      if (open) {
        this._prevFocus = document.activeElement
        this.$nextTick(() => this.$refs.confirmBtn?.focus())
      } else {
        this._prevFocus?.focus?.()
      }
    }
  },
  mounted() {
    // En fase de captura para que Escape no llegue también al modal que está debajo
    this._onKey = e => {
      if (!this.state.show || e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      this.close(false)
    }
    window.addEventListener('keydown', this._onKey, true)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this._onKey, true)
  },
  methods: {
    close(result) { closeConfirm(result) }
  }
}
</script>

<style scoped>
.confirm-overlay { z-index: 1100; }
.confirm-modal { max-width: 400px; }
.confirm-danger { border-left: 3px solid var(--red); }
.confirm-danger h4 { color: var(--red-light); }
.confirm-message { white-space: pre-line; color: var(--text-secondary); }
</style>
