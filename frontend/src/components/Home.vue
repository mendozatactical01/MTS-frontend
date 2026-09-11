<template>
  <BaseLayout>
    <div class="fade-in">
      <!-- Header -->
      <div class="home-header">
        <div class="home-header-left">
          <div class="welcome-badge">Sistema Activo</div>
          <h1 class="home-title">Tactical<br>Management</h1>
          <p class="home-subtitle">Sistema de gestión para tienda de indumentaria policial</p>
        </div>
        <div class="home-header-right">
          <div class="date-display">
            <div class="date-day">{{ today.day }}</div>
            <div class="date-info">
              <span>{{ today.month }}</span>
              <span>{{ today.year }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div v-if="stats" class="stats-grid mb-4">
        <div class="stat-card">
          <div class="stat-card-label">Ventas Hoy</div>
          <div class="stat-card-value">${{ formatMoney(stats.totalSalesToday) }}</div>
          <div class="stat-card-meta">{{ stats.totalTransactions }} transacciones</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Productos Vendidos</div>
          <div class="stat-card-value">{{ stats.totalProductsSold }}</div>
          <div class="stat-card-meta">unidades hoy</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Ticket Promedio</div>
          <div class="stat-card-value">${{ formatMoney(stats.averageTicket) }}</div>
          <div class="stat-card-meta">por venta</div>
        </div>
      </div>

      <!-- Entregas pendientes -->
      <div v-if="pendingSales.length > 0" class="pending-card mb-4">
        <div class="pending-card-header">
          <div class="d-flex align-items-center gap-2">
            <span class="pending-icon">⏳</span>
            <span class="pending-title">Entregas Pendientes</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="pending-badge">{{ pendingSales.length }} venta(s) · {{ pendingItemsTotal }} ítem(s)</span>
            <router-link to="/admin/sales" class="pending-link">Ver en Ventas →</router-link>
          </div>
        </div>
        <div class="pending-list">
          <div v-for="sale in pendingSales" :key="sale.id" class="pending-row">
            <div class="pending-row-left">
              <span class="pending-customer">{{ sale.customerName }}</span>
              <span class="pending-date">{{ formatDate(sale.saleDate) }}</span>
            </div>
            <div class="pending-row-right">
              <span class="pending-items-count">{{ pendingCount(sale) }} ítem(s) pendiente(s)</span>
              <span class="pending-total">${{ formatMoney(sale.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Nav cards -->
      <div class="nav-cards">
        <router-link to="/admin/panel" class="nav-card">
          <div class="nav-card-icon">◈</div>
          <div class="nav-card-body">
            <h3>Administración</h3>
            <p>Categorías, productos y talles</p>
          </div>
          <div class="nav-card-arrow">→</div>
        </router-link>

        <router-link to="/admin/stock" class="nav-card">
          <div class="nav-card-icon">▦</div>
          <div class="nav-card-body">
            <h3>Stock</h3>
            <p>Control de inventario</p>
          </div>
          <div class="nav-card-arrow">→</div>
        </router-link>

        <router-link to="/admin/sales" class="nav-card nav-card-highlight">
          <div class="nav-card-icon">◉</div>
          <div class="nav-card-body">
            <h3>Ventas</h3>
            <p>Registrar y consultar ventas</p>
          </div>
          <div class="nav-card-arrow">→</div>
        </router-link>
      </div>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from './BaseLayout.vue'
import axios from 'axios'
import { getPendingSales } from '../services/saleService'

export default {
  name: 'Home',
  components: { BaseLayout },
  data() {
    return {
      stats: null,
      pendingSales: [],
      today: { day: '', month: '', year: '' }
    }
  },
  computed: {
    pendingItemsTotal() {
      return this.pendingSales.reduce((sum, s) => sum + s.items.filter(i => i.deliveryStatus === 'PENDIENTE').length, 0)
    }
  },
  mounted() {
    this.setDate()
    this.loadStats()
    this.loadPendingSales()
  },
  methods: {
    setDate() {
      const now = new Date()
      this.today = {
        day: now.getDate(),
        month: now.toLocaleDateString('es-AR', { month: 'long' }),
        year: now.getFullYear()
      }
    },
    async loadStats() {
      try {
        const res = await axios.get(import.meta.env.VITE_API_URL + '/api/statistics/today')
        this.stats = res.data
      } catch {}
    },
    async loadPendingSales() {
      try {
        const res = await getPendingSales()
        this.pendingSales = res.data || []
      } catch {}
    },
    pendingCount(sale) {
      return sale.items?.filter(i => i.deliveryStatus === 'PENDIENTE').length || 0
    },
    formatDate(d) {
      if (!d) return '—'
      return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
    formatMoney(val) {
      return Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    }
  }
}
</script>

<style scoped>
/* Header */
.home-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(139, 26, 26,0.15);
  border: 1px solid var(--crimson-dark);
  border-radius: 50px;
  padding: 0.2rem 0.75rem;
  font-size: 0.72rem;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--crimson-light);
  margin-bottom: 0.75rem;
}

.welcome-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--crimson-light);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.home-title {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.05;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.home-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 340px;
  line-height: 1.5;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
}

.date-day {
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--crimson-light);
  line-height: 1;
}

.date-info {
  display: flex;
  flex-direction: column;
}

.date-info span:first-child {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: capitalize;
  color: var(--text-primary);
}

.date-info span:last-child {
  font-size: 0.78rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* Nav cards */
.nav-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.nav-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: var(--border);
  transition: background 0.2s;
}

.nav-card:hover { background: var(--bg-hover); border-color: var(--crimson-dark); }
.nav-card:hover::after { background: var(--crimson); }

.nav-card-highlight { border-color: var(--crimson-dark); }
.nav-card-highlight::after { background: var(--crimson); }

.nav-card-icon {
  font-size: 1.75rem;
  color: var(--crimson-light);
  flex-shrink: 0;
  line-height: 1;
}

.nav-card-body { flex: 1; }
.nav-card-body h3 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.2rem; }
.nav-card-body p  { font-size: 0.78rem; color: var(--text-muted); }

.nav-card-arrow {
  color: var(--text-muted);
  font-size: 1.1rem;
  transition: transform 0.2s, color 0.2s;
}

.nav-card:hover .nav-card-arrow { transform: translateX(4px); color: var(--crimson-light); }

@media (max-width: 900px) {
  .stats-grid, .nav-cards { grid-template-columns: 1fr; }
  .home-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .home-title { font-size: 2rem; }
}

/* Pending deliveries card */
.pending-card {
  background: var(--bg-card);
  border: 1px solid rgba(201, 125, 44, 0.4);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.pending-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: rgba(201, 125, 44, 0.08);
  border-bottom: 1px solid rgba(201, 125, 44, 0.2);
}
.pending-icon { font-size: 1rem; }
.pending-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--amber-light);
}
.pending-badge {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
.pending-link {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--amber-light);
  text-decoration: none;
  transition: color 0.15s;
}
.pending-link:hover { color: #fff; }
.pending-list { display: flex; flex-direction: column; }
.pending-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1.25rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.pending-row:last-child { border-bottom: none; }
.pending-row:hover { background: var(--bg-hover); }
.pending-row-left { display: flex; align-items: center; gap: 0.75rem; }
.pending-customer { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
.pending-date { font-size: 0.75rem; color: var(--text-muted); }
.pending-row-right { display: flex; align-items: center; gap: 1rem; }
.pending-items-count {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--amber-light);
  letter-spacing: 0.03em;
}
.pending-total {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-primary);
}
</style>
