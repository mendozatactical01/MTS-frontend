import { reactive } from 'vue'

// Estado del diálogo de confirmación (uno solo para toda la app, lo muestra ConfirmDialog.vue en App.vue)
export const confirmState = reactive({
  show: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  danger: false,
  resolve: null
})

/**
 * Reemplazo de window.confirm: devuelve una promesa que resuelve true (confirmar) o false (cancelar).
 * Uso: if (!(await confirmar({ title: 'Eliminar venta', message: '...', confirmText: 'Eliminar', danger: true }))) return
 */
export function confirmar({ title = '¿Confirmar?', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = {}) {
  if (confirmState.resolve) confirmState.resolve(false)
  return new Promise(resolve => {
    Object.assign(confirmState, { show: true, title, message, confirmText, cancelText, danger, resolve })
  })
}

export function closeConfirm(result) {
  const resolve = confirmState.resolve
  confirmState.show = false
  confirmState.resolve = null
  if (resolve) resolve(result)
}
