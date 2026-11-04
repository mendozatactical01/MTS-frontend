<template>
  <BaseLayout>
    <div class="fade-in">
      <div class="page-header">
        <h2 class="page-title"><span class="page-title-icon">▦</span> Stock</h2>
        <button class="btn btn-secondary" @click="refreshAll" :disabled="isLoading">
          <span v-if="isLoading" class="spinner spinner-sm"></span>
          <span v-else>↻ Actualizar</span>
        </button>
      </div>

      <!-- Resumen de stock -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card kpi-main">
          <div class="kpi-label">Unidades en Stock</div>
          <div class="kpi-value">{{ summary.totalUnits }}</div>
          <div class="kpi-sub">en {{ summary.categories }} categoría(s)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Críticos</div>
          <div class="kpi-value" style="color:var(--red-light)">{{ summary.critical }}</div>
          <div class="kpi-sub">&lt; 3 unidades</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Stock Bajo</div>
          <div class="kpi-value" style="color:var(--amber-light)">{{ summary.low }}</div>
          <div class="kpi-sub">3 a 6 unidades</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Productos</div>
          <div class="kpi-value">{{ page.totalElements }}</div>
          <div class="kpi-sub">{{ hasFilters ? 'con los filtros elegidos' : 'activos' }}</div>
        </div>
      </div>

      <!-- Filtros y acciones -->
      <div class="stock-toolbar mb-3">
        <div class="search-wrapper stock-toolbar-search">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input v-model="filters.search" class="form-control search-input" placeholder="Buscar producto o categoría..." aria-label="Buscar producto o categoría" />
          <button v-if="filters.search" class="search-clear" @click="filters.search = ''" aria-label="Limpiar búsqueda">✕</button>
        </div>
        <select v-model="filters.categoryId" class="form-select stock-toolbar-category" aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          <template v-for="g in categoryTree" :key="g.id">
            <option :value="g.id">{{ g.children.length ? `${g.name} (todo)` : g.name }}</option>
            <option v-for="c in g.children" :key="c.id" :value="c.id">&nbsp;&nbsp;&nbsp;{{ c.name }}</option>
          </template>
        </select>
        <button type="button" class="btn" :class="filters.onlyLow ? 'btn-warning-soft' : 'btn-secondary'"
          @click="filters.onlyLow = !filters.onlyLow" :aria-pressed="filters.onlyLow">
          ⚠ {{ filters.onlyLow ? 'Solo bajo/crítico' : 'Ver bajo/crítico' }}
        </button>
        <div class="stock-toolbar-actions">
          <button type="button" class="btn" :class="panel === 'adjust' ? 'btn-primary' : 'btn-secondary'" @click="togglePanel('adjust')" :aria-expanded="panel === 'adjust'">± Ajustar</button>
          <button type="button" class="btn" :class="panel === 'bulk' ? 'btn-primary' : 'btn-secondary'" @click="togglePanel('bulk')" :aria-expanded="panel === 'bulk'">⊞ Carga múltiple</button>
        </div>
      </div>

      <!-- Panel: Ajustar stock -->
      <div v-if="panel === 'adjust'" class="tac-card mb-3 slide-up">
        <div class="tac-card-header"><h5>Ajustar Stock</h5></div>
        <div class="tac-card-body">
          <form @submit.prevent="handleAdjustStock" class="row g-2 align-items-end">
            <div class="col-md-3">
              <div class="form-group">
                <label for="adjust-product">Producto *</label>
                <ProductPicker input-id="adjust-product" v-model="adjustForm.productId" :products="products"
                  :invalid="!!errors.product" :disabled="isProcessing" />
                <span v-if="errors.product" class="invalid-feedback">{{ errors.product }}</span>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label for="adjust-size">Talle</label>
                <select id="adjust-size" v-model.number="adjustForm.sizeId" class="form-select" :disabled="isProcessing">
                  <option v-if="adjustAllowsNoSize" value="">Sin talle</option>
                  <option v-for="c in adjustSizeCells" :key="c.sizeId" :value="c.sizeId">{{ c.sizeName }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label id="adjust-current-stock-label">Stock actual</label>
                <div class="current-stock-display" :class="stockLevelClass(currentStock)" role="status" aria-labelledby="adjust-current-stock-label">
                  {{ currentStock === '-' ? '—' : currentStock }}
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label for="adjust-quantity">Cantidad *</label>
                <input id="adjust-quantity" v-model.number="adjustForm.quantity" type="number" min="1" class="form-control"
                  :class="{ 'is-invalid': errors.quantity }"
                  :max="adjustForm.action === 'discount' ? (typeof currentStock === 'number' ? currentStock : undefined) : undefined"
                  placeholder="1" :disabled="!adjustForm.productId || isProcessing" @focus="$event.target.select()" />
                <span v-if="errors.quantity" class="invalid-feedback">{{ errors.quantity }}</span>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label for="adjust-action">Acción</label>
                <select id="adjust-action" v-model="adjustForm.action" class="form-select" :disabled="isProcessing">
                  <option value="add">＋ Agregar</option>
                  <option value="discount">－ Descontar</option>
                </select>
              </div>
            </div>
            <div class="col-md-1">
              <button type="submit" class="btn btn-primary w-100" :disabled="!canSubmitAdjustment || isProcessing" title="Aplicar" aria-label="Aplicar ajuste de stock">
                <span v-if="isProcessing" class="spinner spinner-sm"></span>
                <span v-else aria-hidden="true">✓</span>
              </button>
            </div>
          </form>
          <div class="d-flex gap-2 mt-2 align-items-center flex-wrap">
            <span class="quick-label">Rápido:</span>
            <button type="button" class="btn btn-sm btn-primary"  @click="quickAdjust(1)" :disabled="!adjustForm.productId || isProcessing" aria-label="Sumar 1 unidad">+1</button>
            <button type="button" class="btn btn-sm btn-danger"   @click="quickAdjust(-1)" :disabled="!adjustForm.productId || currentStock <= 0 || isProcessing" aria-label="Restar 1 unidad">-1</button>
            <button type="button" class="btn btn-sm btn-secondary" @click="handleSetStock" :disabled="!adjustForm.productId || isProcessing">Establecer</button>
          </div>
        </div>
      </div>

      <!-- Panel: Carga múltiple -->
      <div v-if="panel === 'bulk'" class="tac-card mb-3 slide-up">
        <div class="tac-card-header">
          <h5>⊞ Carga Múltiple de Stock</h5>
          <span v-if="bulkLoad.rows.length" class="badge badge-neutral">{{ bulkLoad.rows.length }} fila(s)</span>
        </div>
        <div class="tac-card-body" style="padding-bottom:.5rem">
          <div v-if="bulkLoad.rows.length" class="table-responsive bulk-table-wrap mb-2">
            <table class="tac-table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col" style="width:150px">Talle</th>
                  <th scope="col" style="width:110px">Cantidad</th>
                  <th scope="col" class="text-center" style="width:64px">Estado</th>
                  <th scope="col" style="width:40px" aria-label="Eliminar fila"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in bulkLoad.rows" :key="i" :class="row.status === 'ok' ? 'bulk-row-ok' : row.status === 'error' ? 'bulk-row-error' : ''">
                  <td>
                    <ProductPicker :model-value="row.productId" @update:model-value="setBulkProduct(row, $event)"
                      :products="products" small :disabled="isBulkProcessing" />
                  </td>
                  <td>
                    <select v-model.number="row.sizeId" class="form-select form-select-sm" aria-label="Talle" :disabled="isBulkProcessing">
                      <option v-if="!sizesForProduct(row.productId).length" value="">Sin talle</option>
                      <option v-for="s in sizesForProduct(row.productId)" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                  </td>
                  <td>
                    <input v-model.number="row.quantity" type="number" min="1" class="form-control form-control-sm"
                      aria-label="Cantidad" :disabled="isBulkProcessing" placeholder="1" @focus="$event.target.select()" />
                  </td>
                  <td class="text-center">
                    <span v-if="row.status === null" style="color:var(--text-muted)">—</span>
                    <span v-else-if="row.status === 'ok'" class="bulk-status-ok" title="OK" aria-label="OK">✓</span>
                    <span v-else class="bulk-status-error" :title="row.error" :aria-label="row.error || 'Error'">✕</span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-danger btn-icon" @click="removeBulkRow(i)" :disabled="isBulkProcessing" aria-label="Eliminar fila">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="bulk-empty">Agregá filas para cargar stock en varios productos a la vez.</div>

          <div class="bulk-actions">
            <button class="btn btn-secondary btn-sm" @click="addBulkRow" :disabled="isBulkProcessing">+ Agregar fila</button>
            <div class="d-flex gap-2 align-items-center">
              <span v-if="bulkSummary" class="bulk-summary-text" :class="bulkSummary.err ? 'bulk-summary-err' : 'bulk-summary-ok'">{{ bulkSummary.text }}</span>
              <button class="btn btn-secondary btn-sm" @click="clearBulkLoad" :disabled="isBulkProcessing || !bulkLoad.rows.length">Limpiar</button>
              <button class="btn btn-primary" @click="applyBulkLoad" :disabled="!canApplyBulk || isBulkProcessing">
                <span v-if="isBulkProcessing" class="spinner spinner-sm"></span>
                <span v-else>✓ Aplicar todo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Inventario (de a 20 productos) -->
      <div class="tac-card">
        <div class="tac-card-header">
          <h5>Inventario</h5>
          <span class="pagination-info">{{ rangeLabel }}</span>
        </div>
        <div class="tac-card-body" style="padding:0">
          <div v-if="isLoading && !page.content.length" class="empty-state">
            <div class="spinner" style="margin:0 auto 1rem"></div>
            <p>Cargando inventario...</p>
          </div>
          <div v-else-if="!page.content.length" class="empty-state">
            <div class="empty-state-icon">▦</div>
            <p v-if="filters.onlyLow">Ningún producto con stock bajo o crítico 🎉</p>
            <p v-else-if="hasFilters">Sin resultados para estos filtros</p>
            <p v-else>Sin productos</p>
          </div>
          <div v-else :class="{ 'is-refreshing': isLoading }">
            <div v-for="group in pageGroups" :key="group.label" class="category-block">
              <div class="category-header">
                <span class="category-name">{{ group.label }}</span>
                <span class="badge badge-neutral">{{ group.rows.length }} producto(s)</span>
              </div>
              <div class="table-responsive">
                <table class="tac-table">
                  <thead>
                    <tr>
                      <th scope="col" style="min-width:180px">Producto</th>
                      <th scope="col" v-for="col in group.columns" :key="col.key" class="text-center">{{ col.name }}</th>
                      <th scope="col" class="text-center" style="width:80px">Total</th>
                      <th scope="col" class="text-center" style="width:70px">Ver</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in group.rows" :key="row.productId">
                      <td>
                        <div class="fw-bold">{{ row.name }}</div>
                        <div style="font-size:.78rem;color:var(--text-muted)">${{ formatMoney(row.priceCash ?? row.price) }}</div>
                      </td>
                      <td v-for="col in group.columns" :key="col.key" class="text-center">
                        <template v-if="cellOf(row, col.sizeId)">
                          <button type="button" class="badge stock-cell" :class="badgeClass(cellOf(row, col.sizeId).quantity)"
                            @click="openCellModal(row, cellOf(row, col.sizeId))" :disabled="isProcessing"
                            :aria-label="`Editar stock de ${row.name} talle ${col.name}: ${cellOf(row, col.sizeId).quantity}`">
                            {{ cellOf(row, col.sizeId).quantity }}
                          </button>
                          <div class="d-flex justify-content-center gap-1 mt-1">
                            <button class="btn btn-sm btn-primary btn-icon cell-btn" @click="changeCell(row, col.sizeId, 1)" :disabled="isProcessing" :aria-label="`Sumar stock de ${row.name} talle ${col.name}`">+</button>
                            <button class="btn btn-sm btn-danger btn-icon cell-btn" @click="changeCell(row, col.sizeId, -1)" :disabled="cellOf(row, col.sizeId).quantity <= 0 || isProcessing" :aria-label="`Restar stock de ${row.name} talle ${col.name}`">-</button>
                          </div>
                        </template>
                        <span v-else class="text-muted" aria-hidden="true">·</span>
                      </td>
                      <td class="text-center fw-bold">
                        <span :class="levelTextClass(row.level)">{{ row.total }}</span>
                      </td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-secondary" @click="openDetailModal(row)" :disabled="isProcessing" :aria-label="`Ver detalle de ${row.name}`">↗</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <nav v-if="page.totalPages > 1" class="pagination-bar" aria-label="Paginación del inventario">
            <span class="pagination-info">Página {{ page.page + 1 }} de {{ page.totalPages }}</span>
            <div class="pagination-controls">
              <button class="btn btn-sm btn-secondary" @click="goToPage(0)" :disabled="page.page <= 0 || isLoading" aria-label="Primera página">«</button>
              <button class="btn btn-sm btn-secondary" @click="goToPage(page.page - 1)" :disabled="page.page <= 0 || isLoading" aria-label="Página anterior">‹</button>
              <span class="pagination-pages">
                <button v-for="n in pageNumbers" :key="n" class="btn btn-sm" :class="n === page.page ? 'btn-primary' : 'btn-secondary'"
                  :aria-current="n === page.page ? 'page' : null" :aria-label="`Página ${n + 1}`" @click="goToPage(n)" :disabled="isLoading">{{ n + 1 }}</button>
              </span>
              <button class="btn btn-sm btn-secondary" @click="goToPage(page.page + 1)" :disabled="page.page >= page.totalPages - 1 || isLoading" aria-label="Página siguiente">›</button>
              <button class="btn btn-sm btn-secondary" @click="goToPage(page.totalPages - 1)" :disabled="page.page >= page.totalPages - 1 || isLoading" aria-label="Última página">»</button>
            </div>
          </nav>
        </div>
      </div>

      <!-- Modal: Editar stock puntual -->
      <div v-if="cellModal.show" class="tac-modal-overlay" @click.self="closeCellModal">
        <div class="tac-modal" role="dialog" aria-modal="true" aria-labelledby="cell-modal-title">
          <div class="tac-modal-header">
            <h4 id="cell-modal-title">✎ Editar Stock</h4>
            <button class="btn-close" @click="closeCellModal" :disabled="isProcessing" aria-label="Cerrar">✕</button>
          </div>
          <form @submit.prevent="handleSaveCellEdit">
            <div class="tac-modal-body">
              <div class="row g-2 mb-3" style="font-size:.88rem">
                <div class="col-6"><span style="color:var(--text-muted)">Producto:</span> <strong>{{ cellModal.productName }}</strong></div>
                <div class="col-6"><span style="color:var(--text-muted)">Talle:</span> <span class="badge badge-neutral ms-1">{{ cellModal.sizeName || 'Sin talle' }}</span></div>
              </div>
              <div class="tac-alert tac-alert-info mb-3">Stock actual: <strong>{{ cellModal.current }}</strong></div>
              <div class="form-group mb-2">
                <label for="cell-new-quantity">Nueva cantidad *</label>
                <input id="cell-new-quantity" v-model.number="cellModal.newQuantity" type="number" min="0" class="form-control" placeholder="0"
                  :class="{ 'is-invalid': errors.cellEditor }" :aria-describedby="errors.cellEditor ? 'cell-editor-error' : null" required :disabled="isProcessing" ref="cellInput" />
                <span v-if="errors.cellEditor" id="cell-editor-error" class="invalid-feedback">{{ errors.cellEditor }}</span>
                <div style="font-size:.78rem;color:var(--text-muted);margin-top:.25rem">Ingresá la cantidad final deseada</div>
              </div>
              <div v-if="cellDiff !== 0" class="tac-alert" :class="cellDiff > 0 ? 'tac-alert-success' : 'tac-alert-warning'">
                Cambio: <strong>{{ cellDiff > 0 ? '+' : '' }}{{ cellDiff }} uds</strong>
              </div>
            </div>
            <div class="tac-modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeCellModal" :disabled="isProcessing">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="!canSaveCellEdit || isProcessing">
                <span v-if="isProcessing" class="spinner spinner-sm"></span>
                <span v-else>Guardar</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal: Detalle de producto -->
      <div v-if="detailModal.show" class="tac-modal-overlay" @click.self="closeDetailModal">
        <div class="tac-modal" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
          <div class="tac-modal-header">
            <h4 id="detail-modal-title">▦ {{ detailModal.row?.name }}</h4>
            <button class="btn-close" @click="closeDetailModal" aria-label="Cerrar">✕</button>
          </div>
          <div class="tac-modal-body">
            <div class="row g-2 mb-3" style="font-size:.88rem">
              <div class="col-6"><span style="color:var(--text-muted)">Categoría:</span> <strong>{{ detailModal.row?.categoryLabel }}</strong></div>
              <div class="col-6"><span style="color:var(--text-muted)">Precio:</span> <strong>${{ formatMoney(detailModal.row?.priceCash ?? detailModal.row?.price) }}</strong></div>
            </div>
            <div class="table-responsive">
            <table class="tac-table">
              <thead>
                <tr><th scope="col">Talle</th><th scope="col" class="text-center">Cantidad</th><th scope="col" class="text-center">Estado</th><th scope="col" class="text-center">Editar</th></tr>
              </thead>
              <tbody>
                <tr v-for="cell in detailModal.row?.cells || []" :key="cell.sizeId ?? 'none'">
                  <td>{{ cell.sizeName }}</td>
                  <td class="text-center"><span class="badge" :class="badgeClass(cell.quantity)">{{ cell.quantity }}</span></td>
                  <td class="text-center" :class="statusClass(cell.quantity)">{{ statusText(cell.quantity) }}</td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-secondary btn-icon" @click="openCellModal(detailModal.row, cell); closeDetailModal()" :aria-label="`Editar stock de ${detailModal.row?.name} talle ${cell.sizeName}`">✎</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td class="fw-bold">Total</td>
                  <td class="text-center fw-bold" colspan="3">{{ detailModal.row?.total }} uds</td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
          <div class="tac-modal-footer">
            <button class="btn btn-secondary" @click="closeDetailModal">Cerrar</button>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <transition name="toast">
        <div v-if="toast.show" class="tac-toast" :class="`tac-toast-${toast.type}`" role="status" aria-live="polite">{{ toast.message }}</div>
      </transition>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from './BaseLayout.vue'
import ProductPicker from './ProductPicker.vue'
import { addStock, discountStock } from '../services/stockService'
import { getStockPage, getProductStock, getStockSummary } from '../services/stockPageService'
import { getAllProducts } from '../services/productService'
import { getAllSizes, getSizesByCategory } from '../services/sizeService'
import { getAllCategories } from '../services/categoryService'
import { groupCategories } from '../utils/categoryTree'

const PAGE_SIZE = 20

export default {
  name: 'Stock',
  components: { BaseLayout, ProductPicker },
  data() {
    return {
      page: { content: [], page: 0, totalPages: 1, totalElements: 0 },
      summary: { totalUnits: 0, critical: 0, low: 0, categories: 0 },
      products: [], categories: [], sizes: [], sizesByCategory: {},
      filters: { search: '', categoryId: '', onlyLow: false },
      panel: null,
      adjustForm: { productId: '', sizeId: '', quantity: 1, action: 'add' },
      adjustRow: null,
      bulkLoad: { rows: [] },
      isBulkProcessing: false,
      cellModal: { show: false, productId: null, productName: '', sizeId: null, sizeName: '', current: 0, newQuantity: 0 },
      detailModal: { show: false, row: null },
      isLoading: false, isProcessing: false,
      errors: {},
      toast: { show: false, type: 'success', message: '' }
    }
  },
  computed: {
    hasFilters() { return !!(this.filters.search.trim() || this.filters.categoryId || this.filters.onlyLow) },
    rangeLabel() {
      const { page, totalElements, content } = this.page
      if (!totalElements) return '0 productos'
      const from = page * PAGE_SIZE + 1
      return `${from}–${from + content.length - 1} de ${totalElements} productos`
    },
    pageNumbers() {
      const { page, totalPages } = this.page
      const pages = []
      for (let i = Math.max(0, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) pages.push(i)
      return pages
    },
    // Los productos de la página agrupados por categoría (ya vienen ordenados), con las columnas de talle de cada grupo
    pageGroups() {
      const groups = []
      this.page.content.forEach(row => {
        let g = groups[groups.length - 1]
        if (!g || g.label !== row.categoryLabel) { g = { label: row.categoryLabel, rows: [], columns: [] }; groups.push(g) }
        g.rows.push(row)
        row.cells.forEach(c => {
          const key = c.sizeId ?? 'none'
          if (!g.columns.some(col => col.key === key)) g.columns.push({ key, sizeId: c.sizeId, name: c.sizeName })
        })
      })
      return groups
    },
    categoryTree() { return groupCategories(this.categories) },
    adjustSizeCells() { return (this.adjustRow?.cells || []).filter(c => c.sizeId != null) },
    // "Sin talle" solo se ofrece si el producto no usa talles o ya tiene stock cargado sin talle
    adjustAllowsNoSize() {
      return !this.adjustSizeCells.length || (this.adjustRow?.cells || []).some(c => c.sizeId == null)
    },
    currentStock() {
      if (!this.adjustForm.productId || !this.adjustRow) return '-'
      return this.cellOf(this.adjustRow, this.adjustForm.sizeId || null)?.quantity ?? 0
    },
    canSubmitAdjustment() {
      return this.adjustForm.productId && this.adjustForm.quantity > 0 &&
        (this.adjustForm.action === 'add' || (typeof this.currentStock === 'number' && this.currentStock >= this.adjustForm.quantity))
    },
    cellDiff() { return this.cellModal.newQuantity === '' ? 0 : this.cellModal.newQuantity - this.cellModal.current },
    canSaveCellEdit() { return this.cellModal.newQuantity !== '' && this.cellModal.newQuantity >= 0 && this.cellDiff !== 0 },
    canApplyBulk() { return this.bulkLoad.rows.length > 0 && this.bulkLoad.rows.every(r => r.productId && r.quantity >= 1) },
    bulkSummary() {
      const processed = this.bulkLoad.rows.filter(r => r.status !== null)
      if (!processed.length) return null
      const ok  = processed.filter(r => r.status === 'ok').length
      const err = processed.filter(r => r.status === 'error').length
      return { ok, err, text: err ? `${ok} OK · ${err} con error` : `${ok} filas aplicadas` }
    }
  },
  watch: {
    'filters.search'() {
      clearTimeout(this._searchTimeout)
      this._searchTimeout = setTimeout(() => this.fetchPage(0), 350)
    },
    'filters.categoryId'() { this.fetchPage(0) },
    'filters.onlyLow'() { this.fetchPage(0) },
    'adjustForm.productId'(id) {
      this.adjustForm.sizeId = ''
      this.adjustRow = null
      if (id) this.fetchAdjustRow(true)
    }
  },
  mounted() {
    this.initializeData()
    document.addEventListener('keydown', this.handleEsc)
  },
  unmounted() {
    document.removeEventListener('keydown', this.handleEsc)
    clearTimeout(this._searchTimeout)
  },
  methods: {
    handleEsc(e) {
      if (e.key !== 'Escape') return
      if (this.cellModal.show) this.closeCellModal()
      else if (this.detailModal.show) this.closeDetailModal()
    },
    async initializeData() {
      this.isLoading = true
      try {
        const [products, categories, sizes, byCategory] = await Promise.all([
          getAllProducts(), getAllCategories(), getAllSizes(), getSizesByCategory()
        ])
        this.products = (products.data || []).slice().sort((a, b) => a.name.localeCompare(b.name))
        this.categories = categories.data || []
        this.sizes = sizes.data || []
        this.sizesByCategory = byCategory.data || {}
        await Promise.all([this.fetchPage(0), this.fetchSummary()])
      } catch { this.showToast('error', 'Error al cargar datos') }
      finally { this.isLoading = false }
    },
    async refreshAll() {
      this.isLoading = true
      try { await Promise.all([this.fetchPage(this.page.page), this.fetchSummary()]) }
      catch { this.showToast('error', 'Error al actualizar') }
      finally { this.isLoading = false }
    },
    async fetchPage(n) {
      const seq = (this._pageSeq = (this._pageSeq || 0) + 1)
      this.isLoading = true
      try {
        const { data } = await getStockPage({
          page: n, size: PAGE_SIZE, search: this.filters.search.trim(),
          categoryId: this.filters.categoryId || null, onlyLow: this.filters.onlyLow
        })
        if (seq === this._pageSeq) this.page = data
      } catch { this.showToast('error', 'Error al cargar el inventario') }
      finally { if (seq === this._pageSeq) this.isLoading = false }
    },
    async fetchSummary() { this.summary = (await getStockSummary()).data || this.summary },
    async fetchAdjustRow(pickFirstSize = false) {
      const id = this.adjustForm.productId
      try {
        const { data } = await getProductStock(id)
        if (this.adjustForm.productId !== id) return
        this.adjustRow = data
        // Al elegir producto arranca en el primer talle de su lista
        if (pickFirstSize) this.adjustForm.sizeId = this.adjustSizeCells[0]?.sizeId ?? ''
      } catch { this.adjustRow = null }
    },
    goToPage(n) {
      if (n < 0 || n >= this.page.totalPages) return
      this.fetchPage(n)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    // Después de cualquier cambio: refresca la página actual, los números y el producto del ajuste
    async afterChange(productId) {
      await Promise.all([
        this.fetchPage(this.page.page),
        this.fetchSummary(),
        productId && productId === this.adjustForm.productId ? this.fetchAdjustRow() : null
      ])
    },
    togglePanel(name) { this.panel = this.panel === name ? null : name },

    cellOf(row, sizeId) { return row.cells.find(c => (c.sizeId ?? null) === (sizeId ?? null)) },
    // Talles para la carga múltiple: los de la categoría del producto
    sizesForProduct(productId) {
      const product = this.products.find(p => p.id === productId)
      if (!product) return []
      return this.sizesByCategory[product.category?.id] || this.sizes
    },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 }) },
    badgeClass(q) { return q < 3 ? 'badge-red' : q <= 6 ? 'badge-amber' : 'badge-green' },
    statusClass(q) { return q < 3 ? 'text-danger' : q <= 6 ? 'text-warning' : 'text-success' },
    statusText(q) { return q === 0 ? '⚠ Sin stock' : q < 3 ? '⚠ Crítico' : q <= 6 ? '⚡ Bajo' : '✓ OK' },
    levelTextClass(level) { return level === 'CRITICO' ? 'text-danger' : level === 'BAJO' ? 'text-warning' : 'text-success' },
    stockLevelClass(val) {
      if (val === '-') return ''
      return val < 3 ? 'stock-zero' : val <= 6 ? 'stock-low' : 'stock-ok'
    },

    async applyChange(productId, sizeId, diff) {
      if (diff > 0) await addStock(productId, sizeId ?? null, diff)
      else          await discountStock(productId, sizeId ?? null, Math.abs(diff))
    },
    async changeCell(row, sizeId, diff) {
      this.isProcessing = true
      try { await this.applyChange(row.productId, sizeId, diff); await this.afterChange(row.productId) }
      catch (e) { this.showToast('error', e.response?.data?.message || 'Error') }
      finally { this.isProcessing = false }
    },

    async handleAdjustStock() {
      this.errors = {}
      if (!this.adjustForm.productId) { this.errors.product = 'Requerido'; return }
      if (!this.adjustForm.quantity || this.adjustForm.quantity <= 0) { this.errors.quantity = 'Inválido'; return }
      if (this.adjustForm.action === 'discount' && this.currentStock < this.adjustForm.quantity) {
        this.errors.quantity = `Disponible: ${this.currentStock}`; return
      }
      this.isProcessing = true
      try {
        const { productId, sizeId, quantity, action } = this.adjustForm
        await this.applyChange(productId, sizeId || null, action === 'add' ? quantity : -quantity)
        this.adjustForm.quantity = 1
        await this.afterChange(productId)
        this.showToast('success', action === 'add' ? `+${quantity} uds` : `-${quantity} uds`)
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al ajustar stock') }
      finally { this.isProcessing = false }
    },
    async quickAdjust(diff) {
      if (!this.adjustForm.productId || (diff < 0 && this.currentStock <= 0)) return
      this.isProcessing = true
      try {
        await this.applyChange(this.adjustForm.productId, this.adjustForm.sizeId || null, diff)
        await this.afterChange(this.adjustForm.productId)
        this.showToast('success', diff > 0 ? '+1' : '-1')
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error') }
      finally { this.isProcessing = false }
    },
    handleSetStock() {
      if (!this.adjustRow) return
      const cell = this.cellOf(this.adjustRow, this.adjustForm.sizeId || null)
        || { sizeId: this.adjustForm.sizeId || null, sizeName: 'Sin talle', quantity: 0 }
      this.openCellModal(this.adjustRow, cell)
    },

    openCellModal(row, cell) {
      this.cellModal = {
        show: true, productId: row.productId, productName: row.name,
        sizeId: cell.sizeId ?? null, sizeName: cell.sizeName, current: cell.quantity, newQuantity: cell.quantity || ''
      }
      this.$nextTick(() => this.$refs.cellInput?.select())
    },
    closeCellModal() {
      if (this.isProcessing) return
      this.cellModal = { show: false, productId: null, productName: '', sizeId: null, sizeName: '', current: 0, newQuantity: 0 }
      this.errors = {}
    },
    async handleSaveCellEdit() {
      const { productId, sizeId, newQuantity } = this.cellModal
      if (newQuantity === '') { this.errors.cellEditor = 'Ingresá una cantidad'; return }
      if (newQuantity < 0) { this.errors.cellEditor = 'No puede ser negativo'; return }
      if (this.cellDiff === 0) { this.closeCellModal(); return }
      this.isProcessing = true
      try {
        await this.applyChange(productId, sizeId, this.cellDiff)
        await this.afterChange(productId)
        this.showToast('success', 'Stock actualizado')
        this.isProcessing = false
        this.closeCellModal()
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error') }
      finally { this.isProcessing = false }
    },

    setBulkProduct(row, productId) {
      row.productId = productId
      row.sizeId = this.sizesForProduct(productId)[0]?.id ?? ''
    },
    addBulkRow() { this.bulkLoad.rows.push({ productId: '', sizeId: '', quantity: 1, status: null, error: '' }) },
    removeBulkRow(i) { this.bulkLoad.rows.splice(i, 1) },
    clearBulkLoad() { this.bulkLoad.rows = [] },
    async applyBulkLoad() {
      this.isBulkProcessing = true
      this.bulkLoad.rows.forEach(r => { r.status = null; r.error = '' })
      // De a una fila: varias sumas al mismo producto y talle a la vez se pisarían
      for (let i = 0; i < this.bulkLoad.rows.length; i++) {
        const row = this.bulkLoad.rows[i]
        try {
          await addStock(row.productId, row.sizeId || null, row.quantity)
          this.bulkLoad.rows[i] = { ...row, status: 'ok' }
        } catch (e) {
          this.bulkLoad.rows[i] = { ...row, status: 'error', error: e.response?.data?.message || 'Error' }
        }
      }
      await this.afterChange(null)
      const ok  = this.bulkLoad.rows.filter(r => r.status === 'ok').length
      const err = this.bulkLoad.rows.filter(r => r.status === 'error').length
      this.showToast(err === 0 ? 'success' : 'error', err === 0 ? `${ok} filas aplicadas` : `${ok} OK, ${err} fallaron`)
      this.isBulkProcessing = false
    },

    openDetailModal(row) { this.detailModal = { show: true, row } },
    closeDetailModal() { this.detailModal = { show: false, row: null } },

    showToast(type, message) {
      this.toast = { show: true, type, message }
      setTimeout(() => { this.toast.show = false }, 3000)
    }
  }
}
</script>

<style scoped>
/* Barra de filtros */
.stock-toolbar { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.stock-toolbar-search { flex: 1 1 260px; }
.stock-toolbar-category { flex: 0 1 240px; width: auto; }
.stock-toolbar-actions { display: flex; gap: 0.5rem; margin-left: auto; }
.quick-label { font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-display); letter-spacing: .06em; text-transform: uppercase; }

/* Celdas de la grilla */
.stock-cell { cursor: pointer; border: none; font: inherit; font-weight: 700; min-width: 2rem; }
.stock-cell:hover { filter: brightness(1.25); }
.cell-btn { padding: .15rem .4rem; font-size: .7rem; }
.is-refreshing { opacity: 0.6; transition: opacity 0.15s; }

/* Paginación */
.pagination-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1rem; border-top: 1px solid var(--border); background: var(--bg-surface);
}
.pagination-info { font-family: var(--font-display); font-size: 0.78rem; letter-spacing: 0.04em; color: var(--text-muted); }
.pagination-controls { display: flex; align-items: center; gap: 0.25rem; }
.pagination-pages { display: flex; gap: 0.25rem; }

@media (max-width: 700px) {
  .stock-toolbar-category, .stock-toolbar-search { flex: 1 1 100%; }
  .stock-toolbar-actions { margin-left: 0; width: 100%; }
  .stock-toolbar-actions .btn { flex: 1; }
  .pagination-bar { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .pagination-controls { flex-wrap: wrap; }
}

/* Search */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 0.55rem;
  color: var(--text-muted);
  font-size: 1rem;
  pointer-events: none;
  line-height: 1;
}
.bulk-table-wrap { overflow: visible; }
.search-input { padding-left: 1.75rem !important; padding-right: 1.75rem !important; }
.search-clear {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0;
  line-height: 1;
}
.search-clear:hover { color: var(--text-primary); }

/* Category collapsibles */
.category-block { border-bottom: 1px solid var(--border); }
.category-block:last-child { border-bottom: none; }

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
}
.category-header-clickable {
  width: 100%;
  border: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.category-header-clickable:hover { background: var(--bg-hover); }

.category-chevron {
  font-size: 0.7rem;
  color: var(--crimson-light);
  transition: transform 0.2s ease;
  display: inline-block;
}
.category-chevron.collapsed { transform: rotate(-90deg); }

.category-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--crimson-light);
}

.current-stock-display {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.75rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
}

.stock-zero { color: var(--red-light); border-color: var(--red); }
.stock-low  { color: var(--amber-light); border-color: var(--amber); }
.stock-ok   { color: var(--crimson-light); border-color: var(--crimson); }

.tac-toast {
  position: fixed; bottom: 1.5rem; right: 1.5rem;
  padding: .75rem 1.25rem; border-radius: var(--radius);
  font-family: var(--font-display); font-weight: 600; font-size: .85rem;
  letter-spacing: .04em; z-index: 9999; box-shadow: var(--shadow-lg);
}
.tac-toast-success { background: var(--crimson); color: var(--text-primary); }
.tac-toast-error   { background: var(--red);   color: #fff; }

.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

/* Badge verde para stock OK */
.badge-green {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

/* Carga múltiple */
.bulk-header {
  width: 100%;
  border: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.bulk-header:hover { background: var(--bg-hover); }

.bulk-empty {
  text-align: center;
  padding: 1rem;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-family: var(--font-display);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  margin-bottom: 0.75rem;
}

.bulk-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-top: 1px solid var(--border);
  margin-top: 0.5rem;
}

.bulk-row-ok  { background: rgba(34, 197, 94, 0.05); }
.bulk-row-error { background: rgba(181, 50, 50, 0.08); }

.bulk-status-ok    { color: #22c55e; font-weight: 700; font-size: 1rem; }
.bulk-status-error { color: var(--red-light); font-weight: 700; font-size: 1rem; cursor: help; }

.bulk-summary-text {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.bulk-summary-ok  { color: #22c55e; }
.bulk-summary-err { color: var(--amber-light); }

/* Stock level OK ahora en verde */
.stock-ok { color: #22c55e; border-color: rgba(34, 197, 94, 0.4); }

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

.btn-warning-soft {
  background: rgba(201, 125, 44, 0.12);
  color: var(--amber-light);
  border: 1px solid rgba(201, 125, 44, 0.3);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}
.btn-warning-soft:hover { background: rgba(201, 125, 44, 0.22); color: var(--amber-light); }

@media (max-width: 700px) {
  .category-header, .bulk-header { flex-wrap: wrap; }
  .bulk-actions { flex-direction: column; align-items: stretch; gap: 0.5rem; }
  .bulk-actions > .d-flex { flex-wrap: wrap; }
  .kpi-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .tac-toast { left: 1rem; right: 1rem; bottom: 1rem; text-align: center; }
}
</style>
