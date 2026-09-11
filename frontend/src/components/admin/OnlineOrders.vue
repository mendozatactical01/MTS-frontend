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
            <table class="tac-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th class="text-center">Estado</th>
                  <th class="text-center">Total</th>
                  <th class="text-center">Venta asociada</th>
                  <th class="text-center" style="width:70px">Ver</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.id">
                  <td class="fw-bold">{{ order.customerName }}</td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td class="text-center">
                    <span class="badge" :class="statusBadge(order.status)">{{ statusLabel(order.status) }}</span>
                  </td>
                  <td class="text-center">${{ formatMoney(order.total) }}</td>
                  <td class="text-center">
                    <router-link v-if="order.saleId" to="/admin/sales" class="badge badge-green" style="text-decoration:none">
                      Venta #{{ order.saleId }}
                    </router-link>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-secondary btn-icon" @click="openDetailModal(order)">↗</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal detalle -->
      <div v-if="detailModal.show" class="tac-modal-overlay" @click.self="closeDetailModal">
        <div class="tac-modal">
          <div class="tac-modal-header">
            <h4>Pedido #{{ detailModal.order?.id }}</h4>
            <button class="btn-close" @click="closeDetailModal">✕</button>
          </div>
          <div class="tac-modal-body">
            <div class="row g-2 mb-3" style="font-size:.88rem">
              <div class="col-6"><span style="color:var(--text-muted)">Cliente:</span> <strong>{{ detailModal.order?.customerName }}</strong></div>
              <div class="col-6"><span style="color:var(--text-muted)">Estado:</span> <span class="badge" :class="statusBadge(detailModal.order?.status)">{{ statusLabel(detailModal.order?.status) }}</span></div>
              <div class="col-6"><span style="color:var(--text-muted)">Email:</span> {{ detailModal.order?.customerEmail }}</div>
              <div class="col-6"><span style="color:var(--text-muted)">Teléfono:</span> {{ detailModal.order?.customerPhone }}</div>
              <div class="col-12"><span style="color:var(--text-muted)">Dirección:</span> {{ detailModal.order?.shippingStreet }} {{ detailModal.order?.shippingNumber }}, {{ detailModal.order?.shippingCity }} (CP {{ detailModal.order?.shippingPostalCode }})</div>
            </div>
            <table class="tac-table">
              <thead><tr><th>Ítem</th><th class="text-center">Cant.</th><th class="text-center">Subtotal</th></tr></thead>
              <tbody>
                <tr v-for="(item, idx) in detailModal.order?.items" :key="idx">
                  <td>{{ item.productNameSnapshot }}</td>
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
          <div class="tac-modal-footer">
            <button class="btn btn-secondary" @click="closeDetailModal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../BaseLayout.vue'
import { getAllOrders } from '../../services/onlineOrderService'

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
    return { orders: [], isLoading: true, detailModal: { show: false, order: null } }
  },
  async mounted() {
    this.isLoading = true
    try { this.orders = (await getAllOrders()).data }
    finally { this.isLoading = false }
  },
  methods: {
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    formatDate(d) { return d ? new Date(d).toLocaleString('es-AR') : '' },
    statusLabel(s) { return STATUS_LABEL[s] || s },
    statusBadge(s) { return STATUS_BADGE[s] || 'badge-neutral' },
    openDetailModal(order) { this.detailModal = { show: true, order } },
    closeDetailModal() { this.detailModal = { show: false, order: null } }
  }
}
</script>
