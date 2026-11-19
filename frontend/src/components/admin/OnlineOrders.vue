<template>
  <BaseLayout>
    <div class="fade-in">
      <div class="page-header">
        <h2 class="page-title"><span class="page-title-icon">⛁</span> Pedidos Online</h2>
        <span class="badge badge-neutral">{{ orders.length }} pedido(s)</span>
      </div>

      <div v-if="isLoading" class="empty-state">
        <div class="spinner" style="margin: 0 auto 1rem;"></div>
        <p>Cargando pedidos...</p>
      </div>

      <div v-else class="tac-card">
        <div class="tac-card-body" style="padding:0">
          <div v-if="orders.length === 0" class="empty-state">
            <div class="empty-state-icon">⛁</div>
            <p>Todavía no hay pedidos online</p>
          </div>
          <div v-else class="table-responsive">
            <table class="tac-table tac-stack">
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Fecha</th>
                  <th scope="col" class="text-center">Estado</th>
                  <th scope="col" class="text-center">Total</th>
                  <th scope="col" class="text-center">Venta asociada</th>
                  <th scope="col" class="text-center">Correo</th>
                  <th scope="col" class="text-center" style="width:70px">Ver</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.id">
                  <td class="fw-bold stack-title">{{ order.customerName }}</td>
                  <td data-label="Fecha">{{ formatDate(order.createdAt) }}</td>
                  <td class="text-center" data-label="Estado">
                    <span class="badge" :class="statusBadge(order.status)">{{ statusLabel(order.status) }}</span>
                  </td>
                  <td class="text-center" data-label="Total">${{ formatMoney(order.total) }}</td>
                  <td class="text-center" data-label="Venta asociada">
                    <router-link v-if="order.saleId" to="/admin/sales" class="badge badge-green" style="text-decoration:none">
                      Venta #{{ order.saleId }}
                    </router-link>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-center" data-label="Correo">
                    <span v-if="order.correoImportedAt" class="badge badge-green">Cargado</span>
                    <span v-else-if="order.status === 'PAID' && order.shippingDeliveryType" class="badge badge-amber">Por cargar</span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-secondary btn-icon" @click="openDetailModal(order)" :aria-label="`Ver pedido de ${order.customerName}`">↗</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal detalle -->
      <div v-if="detailModal.show" class="tac-modal-overlay" @click.self="closeDetailModal">
        <div class="tac-modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
          <div class="tac-modal-header">
            <h4 id="order-modal-title">Pedido #{{ detailModal.order?.id }}</h4>
            <button class="btn-close" @click="closeDetailModal" aria-label="Cerrar">✕</button>
          </div>
          <div class="tac-modal-body">
            <div class="row g-2 mb-3" style="font-size:.88rem">
              <div class="col-6"><span style="color:var(--text-muted)">Cliente:</span> <strong>{{ detailModal.order?.customerName }}</strong></div>
              <div class="col-6"><span style="color:var(--text-muted)">Estado:</span> <span class="badge" :class="statusBadge(detailModal.order?.status)">{{ statusLabel(detailModal.order?.status) }}</span></div>
              <div class="col-6"><span style="color:var(--text-muted)">Email:</span> {{ detailModal.order?.customerEmail }}</div>
              <div class="col-6"><span style="color:var(--text-muted)">Teléfono:</span> {{ detailModal.order?.customerPhone }}</div>
              <div class="col-12"><span style="color:var(--text-muted)">Dirección:</span> {{ detailModal.order?.shippingStreet }} {{ detailModal.order?.shippingNumber }}<template v-if="detailModal.order?.shippingFloor"> piso {{ detailModal.order.shippingFloor }}</template><template v-if="detailModal.order?.shippingApartment"> depto {{ detailModal.order.shippingApartment }}</template>, {{ detailModal.order?.shippingCity }}<template v-if="detailModal.order?.shippingProvinceName">, {{ detailModal.order.shippingProvinceName }}</template> (CP {{ detailModal.order?.shippingPostalCode }})</div>
              <div v-if="detailModal.order?.shippingMethod" class="col-12"><span style="color:var(--text-muted)">Envío:</span> {{ detailModal.order.shippingMethod }}<template v-if="detailModal.order.shippingAgencyAddress"> — {{ detailModal.order.shippingAgencyAddress }}</template></div>
              <div v-if="detailModal.order?.packageWeightG" class="col-12"><span style="color:var(--text-muted)">Bulto cotizado:</span> {{ detailModal.order.packageLengthCm }}×{{ detailModal.order.packageWidthCm }}×{{ detailModal.order.packageHeightCm }} cm, {{ formatWeight(detailModal.order.packageWeightG) }}</div>
            </div>
            <div class="table-responsive">
            <table class="tac-table">
              <thead><tr><th scope="col">Ítem</th><th scope="col" class="text-center">Cant.</th><th scope="col" class="text-center">Subtotal</th></tr></thead>
              <tbody>
                <tr v-for="(item, idx) in detailModal.order?.items" :key="idx">
                  <td>{{ item.productNameSnapshot }}<small v-for="(sel, sIdx) in item.selections" :key="sIdx" class="order-choice">{{ sel.quantity }}× {{ sel.label ? sel.label + ': ' : '' }}{{ sel.productNameSnapshot }}<template v-if="sel.sizeNameSnapshot"> — talle {{ sel.sizeNameSnapshot }}</template></small></td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-center">${{ formatMoney(item.unitPrice * item.quantity) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td colspan="2" class="fw-bold">Envío</td><td class="text-center">${{ formatMoney(detailModal.order?.shippingCost) }}</td></tr>
                <tr><td colspan="2" class="fw-bold">Total</td><td class="text-center fw-bold">${{ formatMoney(detailModal.order?.total) }}</td></tr>
              </tfoot>
            </table>
            </div>
          </div>
          <div class="tac-modal-footer">
            <span v-if="detailModal.order?.correoImportedAt" class="text-muted" style="font-size:.85rem; margin-right:auto">Cargado en MiCorreo el {{ formatDate(detailModal.order.correoImportedAt) }}</span>
            <button v-else-if="detailModal.order?.status === 'PAID' && detailModal.order?.shippingDeliveryType"
              class="btn btn-primary" style="margin-right:auto" :disabled="importing" @click="handleImportToCorreo">
              <span v-if="importing" class="spinner spinner-sm" aria-hidden="true"></span>
              {{ importing ? 'Cargando…' : 'Cargar envío en MiCorreo' }}
            </button>
            <button class="btn btn-secondary" @click="closeDetailModal">Cerrar</button>
          </div>
        </div>
      </div>

      <transition name="toast">
        <div v-if="toast.show" class="tac-toast" :class="`tac-toast-${toast.type}`" role="status" aria-live="polite">{{ toast.message }}</div>
      </transition>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../BaseLayout.vue'
import { getAllOrders, importOrderToCorreo } from '../../services/onlineOrderService'
import { confirmar } from '@/services/confirmDialog'

const STATUS_LABEL = {
  PENDING_PAYMENT: 'Esperando pago',
  PAID: 'Pagado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado'
}
const STATUS_BADGE = {
  PENDING_PAYMENT: 'badge-amber',
  PAID: 'badge-green',
  REJECTED: 'badge-red',
  CANCELLED: 'badge-neutral',
  EXPIRED: 'badge-neutral'
}

export default {
  name: 'OnlineOrders',
  components: { BaseLayout },
  data() {
    return {
      orders: [], isLoading: true, importing: false,
      detailModal: { show: false, order: null },
      toast: { show: false, type: 'success', message: '' }
    }
  },
  async mounted() {
    this.isLoading = true
    try { this.orders = (await getAllOrders()).data }
    finally { this.isLoading = false }
    document.addEventListener('keydown', this.handleEsc)
  },
  unmounted() {
    document.removeEventListener('keydown', this.handleEsc)
  },
  methods: {
    handleEsc(e) { if (e.key === 'Escape' && this.detailModal.show) this.closeDetailModal() },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    formatDate(d) { return d ? new Date(d).toLocaleString('es-AR') : '' },
    statusLabel(s) { return STATUS_LABEL[s] || s },
    statusBadge(s) { return STATUS_BADGE[s] || 'badge-neutral' },
    formatWeight(g) { return g >= 1000 ? `${(g / 1000).toLocaleString('es-AR')} kg` : `${g} g` },
    openDetailModal(order) { this.detailModal = { show: true, order } },
    closeDetailModal() {
      if (this.importing) return
      this.detailModal = { show: false, order: null }
    },
    async handleImportToCorreo() {
      const order = this.detailModal.order
      const ok = await confirmar({
        title: 'Cargar envío en MiCorreo',
        message: `Se va a crear el envío del pedido #${order.id} en la cuenta de MiCorreo. Después hay que pagarlo e imprimir el rótulo desde MiCorreo. ¿Continuar?`,
        confirmText: 'Cargar envío'
      })
      if (!ok) return
      this.importing = true
      try {
        const res = await importOrderToCorreo(order.id)
        const idx = this.orders.findIndex(o => o.id === order.id)
        if (idx !== -1) this.orders.splice(idx, 1, res.data)
        this.detailModal.order = res.data
        this.showToast('success', 'Envío cargado en MiCorreo')
      } catch (e) {
        this.showToast('error', e.response?.data?.message || 'No se pudo cargar el envío en MiCorreo')
      } finally {
        this.importing = false
      }
    },
    showToast(type, message) {
      this.toast = { show: true, type, message }
      setTimeout(() => { this.toast.show = false }, 4000)
    }
  }
}
</script>

<style scoped>
.order-choice { display: block; font-size: 0.78rem; color: var(--text-secondary); }
</style>
