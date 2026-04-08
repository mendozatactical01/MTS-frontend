<template>
  <BaseLayout>
    <div class="fade-in">
      <div class="page-header">
        <h2 class="page-title"><span class="page-title-icon">◎</span> Estadísticas</h2>
        <div class="d-flex gap-2 align-items-center">
          <button class="btn btn-secondary btn-sm" @click="loadAll" :disabled="isLoading">
            <span v-if="isLoading" class="spinner spinner-sm"></span>
            <span v-else>↻ Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Selector de período -->
      <div class="period-tabs mb-4">
        <button class="period-tab" :class="{ active: period === 'today' }"   @click="setPeriod('today')">Hoy</button>
        <button class="period-tab" :class="{ active: period === 'month' }"   @click="setPeriod('month')">Este Mes</button>
        <button class="period-tab" :class="{ active: period === 'year' }"    @click="setPeriod('year')">Este Año</button>
        <button class="period-tab" :class="{ active: period === 'range' }"   @click="setPeriod('range')">Rango</button>
      </div>

      <!-- Selector de rango -->
      <div v-if="period === 'range'" class="section-form d-flex gap-2 align-items-end mb-4">
        <div class="form-group">
          <label>Desde</label>
          <input type="date" v-model="rangeFrom" class="form-control" />
        </div>
        <div class="form-group">
          <label>Hasta</label>
          <input type="date" v-model="rangeTo" class="form-control" />
        </div>
        <button class="btn btn-primary" @click="loadRange" :disabled="!rangeFrom || !rangeTo || isLoading">Consultar</button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="empty-state">
        <div class="spinner" style="margin: 0 auto 1rem;"></div>
        <p>Cargando datos...</p>
      </div>

      <div v-else-if="data">
        <!-- KPI Cards -->
        <div class="kpi-grid mb-4">
          <div class="kpi-card kpi-main">
            <div class="kpi-label">Total Ventas</div>
            <div class="kpi-value">${{ formatMoney(data.totalSales) }}</div>
            <div class="kpi-sub">{{ data.period }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Transacciones</div>
            <div class="kpi-value">{{ data.totalTransactions || 0 }}</div>
            <div class="kpi-sub">ventas realizadas</div>
          </div>
          <div class="kpi-card" v-if="data.totalProductsSold !== undefined">
            <div class="kpi-label">Productos Vendidos</div>
            <div class="kpi-value">{{ data.totalProductsSold }}</div>
            <div class="kpi-sub">unidades</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ticket Promedio</div>
            <div class="kpi-value">${{ formatMoney(data.averageTicket) }}</div>
            <div class="kpi-sub">por venta</div>
          </div>
        </div>

        <!-- Desglose por medio de pago -->
        <div v-if="data.paymentBreakdown" class="payment-breakdown mb-4">
          <div class="pb-card pb-cash">
            <div class="pb-label">💵 Efectivo / Transf.</div>
            <div class="pb-value">${{ formatMoney(data.paymentBreakdown.cash) }}</div>
          </div>
          <div class="pb-plus">+</div>
          <div class="pb-card pb-card">
            <div class="pb-label">💳 Tarjeta</div>
            <div class="pb-value">${{ formatMoney(data.paymentBreakdown.card) }}</div>
          </div>
          <div class="pb-plus">=</div>
          <div class="pb-card pb-total">
            <div class="pb-label">Total Combinado</div>
            <div class="pb-value">${{ formatMoney(data.paymentBreakdown.combined) }}</div>
          </div>
        </div>

        <div class="stats-grid-2">
          <!-- Top productos -->
          <div class="tac-card" v-if="data.topProducts && data.topProducts.length">
            <div class="tac-card-header"><h5>Top Productos</h5></div>
            <div class="tac-card-body" style="padding:0">
              <div v-for="(p, i) in data.topProducts" :key="i" class="top-product-row">
                <div class="top-rank">#{{ i + 1 }}</div>
                <div class="top-name">{{ p.name }}</div>
                <div class="top-qty">
                  <span class="badge badge-crimson">{{ p.qty }} uds</span>
                </div>
                <div class="top-bar-wrap">
                  <div class="top-bar" :style="{ width: barWidth(p.qty, data.topProducts) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ventas por día (gráfico de barras simple) -->
          <div class="tac-card" v-if="data.salesByDay && data.salesByDay.length">
            <div class="tac-card-header"><h5>Ventas por Día</h5></div>
            <div class="tac-card-body">
              <div class="bar-chart">
                <div v-for="d in data.salesByDay" :key="d.day" class="bar-col">
                  <div class="bar-label-top">${{ formatMoneyShort(d.total) }}</div>
                  <div class="bar-outer">
                    <div class="bar-inner" :style="{ height: barHeightDay(d.total, data.salesByDay) + '%' }"></div>
                  </div>
                  <div class="bar-label-bot">{{ d.day }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ventas por mes (año) -->
          <div class="tac-card" v-if="data.salesByMonth && data.salesByMonth.length">
            <div class="tac-card-header"><h5>Ventas por Mes</h5></div>
            <div class="tac-card-body">
              <div class="bar-chart">
                <div v-for="m in data.salesByMonth" :key="m.month" class="bar-col">
                  <div class="bar-label-top">${{ formatMoneyShort(m.total) }}</div>
                  <div class="bar-outer">
                    <div class="bar-inner" :style="{ height: barHeightDay(m.total, data.salesByMonth) + '%' }"></div>
                  </div>
                  <div class="bar-label-bot">{{ monthName(m.month) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ventas por categoría -->
          <div class="tac-card" v-if="data.salesByCategory && data.salesByCategory.length">
            <div class="tac-card-header"><h5>Por Categoría</h5></div>
            <div class="tac-card-body" style="padding:0">
              <div v-for="(cat, i) in data.salesByCategory" :key="i" class="top-product-row">
                <div class="top-name">{{ cat.category }}</div>
                <div class="top-qty">
                  <span class="badge badge-neutral">{{ cat.qty }} uds</span>
                </div>
                <div style="flex:1;font-family:var(--font-display);font-weight:700;text-align:right;color:var(--crimson-light)">
                  ${{ formatMoney(cat.total) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabla ventas por mes (año) -->
        <div class="tac-card mt-3" v-if="data.salesByMonth && data.salesByMonth.length">
          <div class="tac-card-header"><h5>Detalle Mensual</h5></div>
          <div class="tac-card-body" style="padding:0">
            <table class="tac-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th class="text-end">Total</th>
                  <th class="text-center">Transacciones</th>
                  <th class="text-end">Ticket Prom.</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in data.salesByMonth" :key="m.month">
                  <td class="fw-bold">{{ monthName(m.month) }}</td>
                  <td class="text-end text-success fw-bold">${{ formatMoney(m.total) }}</td>
                  <td class="text-center">{{ m.transactions }}</td>
                  <td class="text-end">${{ formatMoney(m.transactions > 0 ? m.total / m.transactions : 0) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td class="fw-bold">Total año</td>
                  <td class="text-end fw-bold text-success">${{ formatMoney(yearTotal) }}</td>
                  <td class="text-center fw-bold">{{ yearTransactions }}</td>
                  <td class="text-end fw-bold">${{ formatMoney(yearTransactions > 0 ? yearTotal / yearTransactions : 0) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-state-icon">◎</div>
        <p>Sin datos para el período seleccionado</p>
      </div>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from './BaseLayout.vue'
import { getStatisticsToday, getStatisticsMonth, getStatisticsYear, getStatisticsByRange } from '../services/statisticsService'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default {
  name: 'Statistics',
  components: { BaseLayout },
  data() {
    return {
      period: 'today',
      data: null,
      rangeFrom: '',
      rangeTo: '',
      isLoading: false
    }
  },
  computed: {
    yearTotal() {
      if (!this.data?.salesByMonth) return 0
      return this.data.salesByMonth.reduce((s, m) => s + m.total, 0)
    },
    yearTransactions() {
      if (!this.data?.salesByMonth) return 0
      return this.data.salesByMonth.reduce((s, m) => s + m.transactions, 0)
    }
  },
  mounted() { this.loadAll() },
  methods: {
    setPeriod(p) { this.period = p; if (p !== 'range') this.loadAll() },
    async loadAll() {
      this.isLoading = true; this.data = null
      try {
        let res
        if (this.period === 'today')  res = await getStatisticsToday()
        else if (this.period === 'month') res = await getStatisticsMonth()
        else if (this.period === 'year')  res = await getStatisticsYear()
        this.data = res?.data || null
      } catch { this.data = null }
      finally { this.isLoading = false }
    },
    async loadRange() {
      if (!this.rangeFrom || !this.rangeTo) return
      this.isLoading = true; this.data = null
      try {
        const res = await getStatisticsByRange(this.rangeFrom, this.rangeTo)
        this.data = res?.data || null
      } catch { this.data = null }
      finally { this.isLoading = false }
    },
    formatMoney(v) {
      return Number(v || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    },
    formatMoneyShort(v) {
      const n = Number(v || 0)
      if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
      if (n >= 1000)    return (n/1000).toFixed(0) + 'k'
      return n.toFixed(0)
    },
    monthName(n) { return MONTHS[(n - 1)] || n },
    barWidth(qty, list) {
      const max = Math.max(...list.map(p => p.qty))
      return max > 0 ? (qty / max) * 100 : 0
    },
    barHeightDay(total, list) {
      const max = Math.max(...list.map(d => d.total || d.total))
      return max > 0 ? Math.max((total / max) * 100, 4) : 4
    }
  }
}
</script>

<style scoped>
/* Period tabs */
.period-tabs {
  display: flex; gap: 2px;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 3px;
  width: fit-content;
}
.period-tab {
  padding: 0.45rem 1.25rem; background: transparent; border: none;
  border-radius: calc(var(--radius) - 2px);
  font-family: var(--font-display); font-weight: 700; font-size: 0.8rem;
  letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--text-secondary); cursor: pointer; transition: var(--transition);
}
.period-tab:hover { color: var(--text-primary); background: var(--bg-hover); }
.period-tab.active { background: var(--crimson); color: #fff; box-shadow: var(--shadow-sm); }

/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 1rem;
}
.kpi-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1.25rem;
  position: relative; overflow: hidden;
}
.kpi-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; background: var(--border);
}
.kpi-main::before { background: var(--crimson); }

.kpi-label {
  font-family: var(--font-display); font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted);
  margin-bottom: 0.4rem;
}
.kpi-value {
  font-family: var(--font-display); font-size: 2rem; font-weight: 800;
  color: var(--text-primary); line-height: 1;
}
.kpi-main .kpi-value { font-size: 2.5rem; color: var(--crimson-light); }
.kpi-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem; }

/* Stats 2-col grid */
.stats-grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
}

/* Top products */
.top-product-row {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.65rem 1.25rem; border-bottom: 1px solid var(--border);
  transition: background 0.12s;
}
.top-product-row:last-child { border-bottom: none; }
.top-product-row:hover { background: var(--bg-hover); }
.top-rank { font-family: var(--font-display); font-weight: 800; font-size: 1rem; color: var(--crimson); width: 28px; flex-shrink: 0; }
.top-name { flex: 1; font-weight: 500; font-size: 0.88rem; }
.top-qty { flex-shrink: 0; }
.top-bar-wrap { width: 80px; flex-shrink: 0; }
.top-bar { height: 4px; background: var(--crimson); border-radius: 2px; transition: width 0.5s ease; }

/* Bar chart */
.bar-chart {
  display: flex; align-items: flex-end; gap: 4px;
  height: 160px; overflow-x: auto; padding-bottom: 0.25rem;
}
.bar-col {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; flex: 1; min-width: 28px;
}
.bar-label-top { font-size: 0.6rem; color: var(--text-muted); font-family: var(--font-display); white-space: nowrap; }
.bar-outer { flex: 1; width: 100%; display: flex; align-items: flex-end; background: var(--bg-surface); border-radius: 3px 3px 0 0; overflow: hidden; min-height: 80px; }
.bar-inner { width: 100%; background: var(--crimson); border-radius: 3px 3px 0 0; transition: height 0.5s ease; min-height: 4px; }
.bar-label-bot { font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-display); font-weight: 700; }

/* Payment breakdown */
.payment-breakdown {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
}
.pb-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1rem 1.5rem; flex: 1; min-width: 160px;
}
.pb-cash { border-top: 2px solid #22c55e; }
.pb-total { border-top: 2px solid var(--crimson); }
.pb-label {
  font-family: var(--font-display); font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.3rem;
}
.pb-value {
  font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--text-primary);
}
.pb-total .pb-value { color: var(--crimson-light); }
.pb-plus {
  font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;
  color: var(--text-muted); flex-shrink: 0;
}

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .stats-grid-2 { grid-template-columns: 1fr; }
}
@media (max-width: 500px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .payment-breakdown { flex-direction: column; }
  .pb-plus { display: none; }
}
</style>
