<template>
  <StoreLayout>
    <div class="section narrow">
      <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>

      <div v-else-if="!order" class="empty-state">
        <div class="empty-state-icon">◇</div>
        <p>Pedido no encontrado</p>
        <router-link to="/tienda" class="btn btn-primary mt-3">Ir al catálogo</router-link>
      </div>

      <div v-else>
        <div class="status-banner" :class="statusClass" role="status">
          <span class="status-icon" aria-hidden="true">{{ statusIcon }}</span>
          <div>
            <h1>{{ statusLabel }}</h1>
            <p>Pedido #{{ order.id }} · {{ formatDate(order.createdAt) }}</p>
          </div>
        </div>

        <div class="tac-card mb-3">
          <div class="tac-card-header"><h5>Ítems</h5></div>
          <div class="tac-card-body">
            <div v-for="(item, idx) in order.items" :key="idx" class="order-item-row">
              <span>{{ item.quantity }}× {{ item.productNameSnapshot }}</span>
              <span>${{ formatMoney(item.unitPrice * item.quantity) }}</span>
            </div>
            <div class="order-item-row"><span>Subtotal</span><span>${{ formatMoney(order.subtotal) }}</span></div>
            <div class="order-item-row"><span>Envío</span><span>{{ order.shippingCost ? '$' + formatMoney(order.shippingCost) : 'Gratis' }}</span></div>
            <div class="order-item-row order-total"><span>Total</span><span>${{ formatMoney(order.total) }}</span></div>
          </div>
        </div>

        <div class="tac-card">
          <div class="tac-card-header"><h5>Envío a</h5></div>
          <div class="tac-card-body">
            <p>{{ order.customerName }}</p>
            <p class="text-muted">{{ order.shippingStreet }} {{ order.shippingNumber }}, {{ order.shippingCity }} (CP {{ order.shippingPostalCode }})</p>
            <p class="text-muted">{{ order.customerEmail }} · {{ order.customerPhone }}</p>
          </div>
        </div>

        <router-link to="/tienda" class="btn btn-secondary w-100 mt-3">Volver a la tienda</router-link>
      </div>
    </div>
  </StoreLayout>
</template>

<script>
import StoreLayout from './StoreLayout.vue'
import { getOrderByAccessToken } from '../../services/checkoutService'

const STATUS = {
  PENDING_PAYMENT: { label: 'Esperando confirmación de pago', icon: '⏳', cls: 'status-pending' },
  PAID:            { label: 'Pago confirmado', icon: '✓', cls: 'status-paid' },
  REJECTED:        { label: 'Pago rechazado', icon: '✕', cls: 'status-rejected' },
  CANCELLED:       { label: 'Pedido cancelado', icon: '✕', cls: 'status-rejected' },
  EXPIRED:         { label: 'Pedido expirado', icon: '⏱', cls: 'status-rejected' }
}

export default {
  name: 'OrderStatus',
  components: { StoreLayout },
  data() {
    return { order: null, loading: true }
  },
  computed: {
    statusLabel() { return STATUS[this.order?.status]?.label || this.order?.status },
    statusIcon() { return STATUS[this.order?.status]?.icon || '•' },
    statusClass() { return STATUS[this.order?.status]?.cls || '' }
  },
  async mounted() {
    try {
      const res = await getOrderByAccessToken(this.$route.params.accessToken)
      this.order = res.data
    } catch {
      this.order = null
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    formatDate(d) { return d ? new Date(d).toLocaleString('es-AR') : '' }
  }
}
</script>

<style scoped>
.narrow { max-width: 700px; }

.status-banner {
  display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem;
  border-radius: var(--radius-lg); border: 1px solid var(--border); margin-bottom: 1.5rem;
}
.status-banner h1 { font-size: 1.3rem; margin-bottom: 0.15rem; }
.status-banner p { color: var(--text-muted); font-size: 0.85rem; }
.status-icon { font-size: 1.8rem; }
.status-pending { background: rgba(201,125,44,0.1); border-color: var(--amber); }
.status-paid { background: rgba(139,26,26,0.1); border-color: var(--crimson); }
.status-rejected { background: rgba(181,50,50,0.1); border-color: var(--red); }

.order-item-row { display: flex; justify-content: space-between; padding: 0.4rem 0; border-top: 1px solid var(--border); font-size: 0.92rem; gap: 1rem; }
.order-item-row:first-child { border-top: none; }
.order-total { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; border-top: 2px solid var(--border); }

@media (max-width: 480px) {
  .status-banner { padding: 1rem; gap: 0.75rem; }
  .status-icon { font-size: 1.4rem; }
}
</style>
