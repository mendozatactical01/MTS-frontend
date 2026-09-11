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

        <!-- Desglose visual por medio de pago -->
        <div v-if="data.paymentBreakdown" class="tac-card mb-4">
          <div class="tac-card-header">
            <h5>◑ Medios de Pago</h5>
            <span class="badge badge-neutral">{{ periodLabel }}</span>
          </div>
          <div class="tac-card-body">
            <!-- Fila de totales individuales -->
            <div class="pb-totals-row">
              <div class="pb-total-block pb-block-cash">
                <div class="pb-block-icon">💵</div>
                <div class="pb-block-body">
                  <div class="pb-block-label">Efectivo / Transferencia</div>
                  <div class="pb-block-amount">${{ formatMoney(data.paymentBreakdown.cash) }}</div>
                  <div class="pb-block-pct">{{ cashPct.toFixed(1) }}% del total</div>
                </div>
              </div>
              <div class="pb-plus-sign">+</div>
              <div class="pb-total-block pb-block-card">
                <div class="pb-block-icon">💳</div>
                <div class="pb-block-body">
                  <div class="pb-block-label">Tarjeta</div>
                  <div class="pb-block-amount">${{ formatMoney(data.paymentBreakdown.card) }}</div>
                  <div class="pb-block-pct">{{ cardPct.toFixed(1) }}% del total</div>
                </div>
              </div>
              <div class="pb-plus-sign">=</div>
              <div class="pb-total-block pb-block-total">
                <div class="pb-block-icon">∑</div>
                <div class="pb-block-body">
                  <div class="pb-block-label">Total General</div>
                  <div class="pb-block-amount pb-block-amount-total">${{ formatMoney(data.paymentBreakdown.combined) }}</div>
                  <div class="pb-block-pct">100%</div>
                </div>
              </div>
            </div>

            <!-- Barra apilada proporcional -->
            <div class="pb-bar-section" v-if="data.paymentBreakdown.combined > 0">
              <div class="payment-stacked-bar">
                <div
                  class="psb-seg psb-cash"
                  :style="{ width: cashPct + '%' }"
                  :title="`Efectivo: ${cashPct.toFixed(1)}%`"
                >
                  <span v-if="cashPct >= 10">{{ cashPct.toFixed(0) }}%</span>
                </div>
                <div
                  class="psb-seg psb-card"
                  :style="{ width: cardPct + '%' }"
                  :title="`Tarjeta: ${cardPct.toFixed(1)}%`"
                >
                  <span v-if="cardPct >= 10">{{ cardPct.toFixed(0) }}%</span>
                </div>
              </div>
              <div class="psb-legend">
                <span class="psb-legend-dot psb-dot-cash"></span> Efectivo / Transf.
                <span class="psb-legend-dot psb-dot-card" style="margin-left:1rem"></span> Tarjeta
                <span style="margin-left:auto;font-family:var(--font-display);font-size:.75rem;color:var(--text-muted)">
                  Predomina: <strong style="color:var(--text-primary)">{{ cashPct >= cardPct ? '💵 Efectivo' : '💳 Tarjeta' }}</strong>
                </span>
              </div>
            </div>
            <div v-else class="psb-empty">Sin transacciones en el período</div>
          </div>
        </div>

        <div class="stats-grid-2">
          <!-- Top productos más vendidos -->
          <div class="tac-card" v-if="data.topProducts && data.topProducts.length">
            <div class="tac-card-header">
              <h5>▲ Más Vendidos</h5>
              <span class="badge badge-neutral">{{ periodLabel }}</span>
            </div>
            <div class="tac-card-body top-products-body">
              <div v-for="(p, i) in data.topProducts" :key="i" class="top-product-item">
                <!-- Encabezado: rank + nombre + cantidad -->
                <div class="tpi-header">
                  <span class="tpi-rank" :class="i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : 'rank-plain'">
                    {{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}` }}
                  </span>
                  <span class="tpi-name">{{ p.name }}</span>
                  <span class="tpi-qty">{{ p.qty }} uds</span>
                </div>
                <!-- Barra horizontal prominente -->
                <div class="tpi-bar-outer">
                  <div class="tpi-bar-inner" :style="{ width: barWidth(p.qty, data.topProducts) + '%' }">
                  </div>
                  <span class="tpi-bar-label">{{ barWidth(p.qty, data.topProducts).toFixed(0) }}%</span>
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
    },
    cashPct() {
      const cash = this.data?.paymentBreakdown?.cash || 0
      const card = this.data?.paymentBreakdown?.card || 0
      const total = cash + card
      return total > 0 ? (cash / total) * 100 : 0
    },
    cardPct() {
      return 100 - this.cashPct
    },
    periodLabel() {
      if (this.period === 'today')  return 'Hoy'
      if (this.period === 'month')  return 'Este mes'
      if (this.period === 'year')   return 'Este año'
      if (this.period === 'range' && this.rangeFrom && this.rangeTo) return `${this.rangeFrom} → ${this.rangeTo}`
      return 'Rango'
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
.top-products-body { padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

.top-product-item { display: flex; flex-direction: column; gap: 0.3rem; }

.tpi-header { display: flex; align-items: center; gap: 0.6rem; }
.tpi-rank { font-size: 1rem; flex-shrink: 0; width: 28px; text-align: center; }
.rank-plain { font-family: var(--font-display); font-weight: 800; color: var(--text-muted); font-size: 0.85rem; }
.tpi-name { flex: 1; font-size: 0.88rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tpi-qty { font-family: var(--font-display); font-weight: 700; font-size: 0.82rem; color: var(--crimson-light); flex-shrink: 0; }

.tpi-bar-outer {
  position: relative;
  height: 22px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-left: 34px;
}
.tpi-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, var(--crimson-dark), var(--crimson-light));
  border-radius: var(--radius-sm);
  transition: width 0.6s ease;
  min-width: 4px;
}
.tpi-bar-label {
  position: absolute;
  right: 0.4rem; top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-primary);
  mix-blend-mode: difference;
}

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
.pb-totals-row {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.pb-plus-sign {
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 800; font-size: 1.4rem;
  color: var(--text-muted); flex-shrink: 0; padding: 0 0.15rem;
}
.pb-total-block {
  flex: 1; min-width: 140px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 0.9rem 1rem;
  display: flex; align-items: center; gap: 0.75rem;
}
.pb-block-cash  { border-top: 3px solid #22c55e; }
.pb-block-card  { border-top: 3px solid var(--crimson-light); }
.pb-block-total { border-top: 3px solid var(--amber); background: var(--bg-card); }
.pb-block-icon { font-size: 1.5rem; flex-shrink: 0; }
.pb-block-body { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.pb-block-label {
  font-family: var(--font-display); font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted);
}
.pb-block-amount {
  font-family: var(--font-display); font-weight: 800; font-size: 1.35rem;
  color: var(--text-primary); line-height: 1.1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pb-block-amount-total { color: var(--amber-light); font-size: 1.5rem; }
.pb-block-pct { font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-display); }

/* Barra apilada */
.pb-bar-section { margin-top: 0.25rem; }
.payment-stacked-bar {
  display: flex; height: 36px; border-radius: var(--radius);
  overflow: hidden; border: 1px solid var(--border);
}
.psb-seg {
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 0.82rem;
  color: rgba(255,255,255,0.92); transition: width 0.6s ease; min-width: 0;
  white-space: nowrap; overflow: hidden;
}
.psb-cash { background: #22c55e; }
.psb-card { background: var(--crimson-light); }
.psb-empty { color: var(--text-muted); font-size: 0.82rem; padding: 0.5rem 0; }
.psb-legend {
  margin-top: 0.5rem; font-size: 0.75rem;
  font-family: var(--font-display); color: var(--text-secondary);
  display: flex; align-items: center;
}
.psb-legend-dot {
  display: inline-block; width: 8px; height: 8px;
  border-radius: 2px; margin-right: 0.3rem;
}
.psb-dot-cash { background: #22c55e; }
.psb-dot-card { background: var(--crimson-light); }

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .stats-grid-2 { grid-template-columns: 1fr; }
  .payment-visual-grid { grid-template-columns: 1fr; }
}
@media (max-width: 500px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .top-name { width: 100px; }
}
</style>
