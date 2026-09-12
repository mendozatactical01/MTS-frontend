<template>
  <BaseLayout>
    <div class="fade-in">
      <div class="page-header">
        <h2 class="page-title"><span class="page-title-icon">▦</span> Stock</h2>
        <button class="btn btn-secondary" @click="initializeData" :disabled="isLoading">
          <span v-if="isLoading" class="spinner spinner-sm"></span>
          <span v-else>↻ Actualizar</span>
        </button>
      </div>

      <!-- Buscadores -->
      <div class="row g-2 mb-3">
        <div class="col-md-6">
          <div class="search-wrapper">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input v-model="filters.productSearch" class="form-control search-input" placeholder="Buscar producto o categoría..." aria-label="Buscar producto o categoría" />
            <button v-if="filters.productSearch" class="search-clear" @click="filters.productSearch = ''" aria-label="Limpiar búsqueda de producto">✕</button>
          </div>
        </div>
        <div class="col-md-6">
          <div class="search-wrapper">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input v-model="filters.sizeSearch" class="form-control search-input" placeholder="Filtrar talle (ej: S, M, 40...)" aria-label="Filtrar por talle" />
            <button v-if="filters.sizeSearch" class="search-clear" @click="filters.sizeSearch = ''" aria-label="Limpiar filtro de talle">✕</button>
          </div>
        </div>
      </div>

      <!-- Formulario de ajuste -->
      <div class="tac-card mb-3">
        <div class="tac-card-header"><h5>Ajustar Stock</h5></div>
        <div class="tac-card-body">
          <form @submit.prevent="handleAdjustStock" class="row g-2 align-items-end">
            <div class="col-md-3">
              <div class="form-group">
                <label for="adjust-product">Producto *</label>
                <select id="adjust-product" v-model.number="adjustForm.productId" class="form-select"
                  :class="{ 'is-invalid': errors.product }" :disabled="isProcessing">
                  <option value="" disabled>Seleccionar</option>
                  <option v-for="p in filteredProducts" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <span v-if="errors.product" class="invalid-feedback">{{ errors.product }}</span>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label for="adjust-size">Talle</label>
                <select id="adjust-size" v-model.number="adjustForm.sizeId" class="form-select" :disabled="isProcessing">
                  <option value="">Sin talle</option>
                  <option v-for="s in filteredSizes" :key="s.id" :value="s.id">{{ s.name }}</option>
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
                  placeholder="1" :disabled="!adjustForm.productId || isProcessing" />
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
          <!-- Quick -->
          <div class="d-flex gap-2 mt-2 align-items-center flex-wrap">
            <span style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-display);letter-spacing:.06em;text-transform:uppercase">Rápido:</span>
            <button type="button" class="btn btn-sm btn-primary"  @click="handleQuickInc" :disabled="!adjustForm.productId || isProcessing" aria-label="Sumar 1 unidad">+1</button>
            <button type="button" class="btn btn-sm btn-danger"   @click="handleQuickDec" :disabled="!adjustForm.productId || currentStock <= 0 || isProcessing" aria-label="Restar 1 unidad">-1</button>
            <button type="button" class="btn btn-sm btn-secondary" @click="handleSetStock" :disabled="!adjustForm.productId || isProcessing">Establecer</button>
          </div>
        </div>
      </div>

      <!-- Carga múltiple -->
      <div class="tac-card mb-3">
        <button type="button" class="tac-card-header bulk-header" :aria-expanded="bulkLoad.show" aria-controls="bulk-load-panel" @click="bulkLoad.show = !bulkLoad.show">
          <div class="d-flex align-items-center gap-2">
            <span class="category-chevron" :class="{ collapsed: !bulkLoad.show }" aria-hidden="true">▼</span>
            <h5 style="margin:0">⊞ Carga Múltiple de Stock</h5>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span v-if="bulkLoad.rows.length" class="badge badge-neutral">{{ bulkLoad.rows.length }} fila(s)</span>
            <span class="badge badge-neutral">{{ bulkLoad.show ? 'Ocultar' : 'Expandir' }}</span>
          </div>
        </button>

        <div v-show="bulkLoad.show" id="bulk-load-panel">
          <div class="tac-card-body" style="padding-bottom:.5rem">
            <!-- Tabla de filas -->
            <div v-if="bulkLoad.rows.length" class="table-responsive mb-2">
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
                      <select v-model.number="row.productId" class="form-select form-select-sm" aria-label="Producto" :disabled="isBulkProcessing">
                        <option value="" disabled>Seleccionar producto</option>
                        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                      </select>
                    </td>
                    <td>
                      <select v-model.number="row.sizeId" class="form-select form-select-sm" aria-label="Talle" :disabled="isBulkProcessing">
                        <option value="">Sin talle</option>
                        <option v-for="s in sizes" :key="s.id" :value="s.id">{{ s.name }}</option>
                      </select>
                    </td>
                    <td>
                      <input v-model.number="row.quantity" type="number" min="1" class="form-control form-control-sm"
                        aria-label="Cantidad" :disabled="isBulkProcessing" placeholder="1" />
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

            <div v-else class="bulk-empty">
              Agregá filas para cargar stock en varios productos a la vez.
            </div>

            <!-- Acciones -->
            <div class="bulk-actions">
              <button class="btn btn-secondary btn-sm" @click="addBulkRow" :disabled="isBulkProcessing">
                + Agregar fila
              </button>
              <div class="d-flex gap-2 align-items-center">
                <span v-if="bulkSummary" class="bulk-summary-text" :class="bulkSummary.err ? 'bulk-summary-err' : 'bulk-summary-ok'">
                  {{ bulkSummary.text }}
                </span>
                <button class="btn btn-secondary btn-sm" @click="clearBulkLoad"
                  :disabled="isBulkProcessing || !bulkLoad.rows.length">Limpiar</button>
                <button class="btn btn-primary" @click="applyBulkLoad"
                  :disabled="!canApplyBulk || isBulkProcessing">
                  <span v-if="isBulkProcessing" class="spinner spinner-sm"></span>
                  <span v-else>✓ Aplicar todo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla por categoría -->
      <div class="tac-card">
        <div class="tac-card-header">
          <h5>Inventario por Categoría</h5>
          <div class="d-flex gap-2 align-items-center">
            <span style="font-size:.75rem;color:var(--text-muted);font-family:var(--font-display)">
              {{ Object.keys(stockByCategory).length }} categorías
            </span>
            <button class="btn btn-sm btn-secondary" @click="expandAll" title="Expandir todo"><span aria-hidden="true">↕</span> Expandir</button>
            <button class="btn btn-sm btn-secondary" @click="collapseAll" title="Colapsar todo"><span aria-hidden="true">↕</span> Colapsar</button>
          </div>
        </div>
        <div class="tac-card-body" style="padding:0">
          <div v-if="isLoading" class="empty-state">
            <div class="spinner" style="margin:0 auto 1rem"></div>
            <p>Cargando inventario...</p>
          </div>
          <div v-else-if="Object.keys(stockByCategory).length === 0" class="empty-state">
            <div class="empty-state-icon">▦</div>
            <p>Sin datos de stock</p>
          </div>
          <div v-else>
            <div v-for="(prods, category) in stockByCategory" :key="category" class="category-block">
              <button type="button" class="category-header category-header-clickable" :aria-expanded="!collapsedCategories[category]" :aria-controls="`category-panel-${category}`" @click="toggleCategory(category)">
                <div class="d-flex align-items-center gap-2">
                  <span class="category-chevron" :class="{ collapsed: collapsedCategories[category] }" aria-hidden="true">▼</span>
                  <span class="category-name">{{ category }}</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge badge-neutral">{{ prods.length }} producto(s)</span>
                  <span class="badge" :class="categoryStockStatus(prods)">
                    {{ categoryStockLabel(prods) }}
                  </span>
                </div>
              </button>
              <div v-show="!collapsedCategories[category]" :id="`category-panel-${category}`" class="table-responsive">
                <table class="tac-table">
                  <thead>
                    <tr>
                      <th scope="col" style="min-width:180px">Producto</th>
                      <th scope="col" v-for="size in filteredSizes" :key="size.id" class="text-center">{{ size.name }}</th>
                      <th scope="col" class="text-center" style="width:80px">Total</th>
                      <th scope="col" class="text-center" style="width:70px">Ver</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="prod in prods" :key="prod.id">
                      <td>
                        <div class="fw-bold">{{ prod.name }}</div>
                        <div style="font-size:.78rem;color:var(--text-muted)">${{ prod.price?.toFixed(2) }}</div>
                      </td>
                      <td v-for="size in filteredSizes" :key="size.id" class="text-center">
                        <span class="badge" :class="stockBadgeClass(prod.id, size.id)">
                          {{ getStockQty(prod.id, size.id) }}
                        </span>
                        <div class="d-flex justify-content-center gap-1 mt-1">
                          <button class="btn btn-sm btn-primary btn-icon"  @click="handleCellInc(prod.id, size.id)" :disabled="isProcessing" style="padding:.15rem .4rem;font-size:.7rem" :aria-label="`Sumar stock de ${prod.name} talle ${size.name}`">+</button>
                          <button class="btn btn-sm btn-danger btn-icon"   @click="handleCellDec(prod.id, size.id)" :disabled="getStockQty(prod.id,size.id)<=0||isProcessing" style="padding:.15rem .4rem;font-size:.7rem" :aria-label="`Restar stock de ${prod.name} talle ${size.name}`">-</button>
                        </div>
                      </td>
                      <td class="text-center fw-bold">{{ productTotal(prod.id) }}</td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-secondary" @click="openDetailModal(prod)" :disabled="isProcessing" :aria-label="`Ver detalle de ${prod.name}`">↗</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
                <div class="col-6"><span style="color:var(--text-muted)">Producto:</span> <strong>{{ cellModal.product?.name }}</strong></div>
                <div class="col-6"><span style="color:var(--text-muted)">Talle:</span> <span class="badge badge-neutral ms-1">{{ cellModal.size?.name || 'Sin talle' }}</span></div>
              </div>
              <div class="tac-alert tac-alert-info mb-3">
                Stock actual: <strong>{{ cellEditorCurrentStock }}</strong>
              </div>
              <div class="form-group mb-2">
                <label for="cell-new-quantity">Nueva cantidad *</label>
                <input id="cell-new-quantity" v-model.number="cellModal.newQuantity" type="number" min="0" class="form-control"
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
            <h4 id="detail-modal-title">▦ {{ detailModal.product?.name }}</h4>
            <button class="btn-close" @click="closeDetailModal" aria-label="Cerrar">✕</button>
          </div>
          <div class="tac-modal-body">
            <div class="row g-2 mb-3" style="font-size:.88rem">
              <div class="col-6"><span style="color:var(--text-muted)">Categoría:</span> <strong>{{ detailModal.product?.category?.name || '—' }}</strong></div>
              <div class="col-6"><span style="color:var(--text-muted)">Precio:</span> <strong>${{ detailModal.product?.price?.toFixed(2) }}</strong></div>
            </div>
            <div class="table-responsive">
            <table class="tac-table">
              <thead>
                <tr><th scope="col">Talle</th><th scope="col" class="text-center">Cantidad</th><th scope="col" class="text-center">Estado</th><th scope="col" class="text-center">Editar</th></tr>
              </thead>
              <tbody>
                <tr v-for="size in sizes" :key="size.id">
                  <td>{{ size.name }}</td>
                  <td class="text-center">
                    <span class="badge" :class="stockBadgeClass(detailModal.product?.id, size.id)">{{ getStockQty(detailModal.product?.id, size.id) }}</span>
                  </td>
                  <td class="text-center" :class="stockStatusClass(detailModal.product?.id, size.id)">{{ stockStatusText(detailModal.product?.id, size.id) }}</td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-secondary btn-icon" @click="openCellModal(detailModal.product, size); closeDetailModal()" :aria-label="`Editar stock de ${detailModal.product?.name} talle ${size.name}`">✎</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="1" class="fw-bold">Total</td>
                  <td class="text-center fw-bold" colspan="3">{{ productTotal(detailModal.product?.id) }} uds</td>
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
import { getAllStock, addStock, discountStock } from '../services/stockService'
import { getAllProducts } from '../services/productService'
import { getAllSizes } from '../services/sizeService'

export default {
  name: 'Stock',
  components: { BaseLayout },
  data() {
    return {
      stock: [], products: [], sizes: [],
      filters: { productSearch: '', sizeSearch: '' },
      collapsedCategories: {},
      adjustForm: { productId: '', sizeId: '', quantity: 1, action: 'add' },
      bulkLoad: { show: false, rows: [] },
      isBulkProcessing: false,
      cellModal: { show: false, product: null, size: null, newQuantity: 0 },
      detailModal: { show: false, product: null },
      isLoading: false, isProcessing: false,
      errors: {},
      toast: { show: false, type: 'success', message: '' }
    }
  },
  computed: {
    filteredProducts() {
      const s = this.filters.productSearch.toLowerCase()
      return this.products.filter(p => p.name.toLowerCase().includes(s))
    },
    filteredSizes() {
      const s = this.filters.sizeSearch.toLowerCase()
      return this.sizes.filter(sz => sz.name.toLowerCase().includes(s))
    },
    stockByCategory() {
      const g = {}
      this.filteredProducts.forEach(p => {
        const cat = p.category?.name || 'Sin categoría'
        if (!g[cat]) g[cat] = []
        g[cat].push(p)
      })
      return g
    },
    currentStock() {
      if (!this.adjustForm.productId) return '-'
      return this.getStockQty(this.adjustForm.productId, this.adjustForm.sizeId || null)
    },
    canSubmitAdjustment() {
      return this.adjustForm.productId && this.adjustForm.quantity > 0 &&
        (this.adjustForm.action === 'add' || (typeof this.currentStock === 'number' && this.currentStock >= this.adjustForm.quantity))
    },
    cellEditorCurrentStock() {
      if (!this.cellModal.product) return 0
      return this.getStockQty(this.cellModal.product.id, this.cellModal.size?.id || null)
    },
    cellDiff() { return this.cellModal.newQuantity - this.cellEditorCurrentStock },
    canSaveCellEdit() { return this.cellModal.newQuantity >= 0 && this.cellDiff !== 0 },
    canApplyBulk() {
      return this.bulkLoad.rows.length > 0 &&
        this.bulkLoad.rows.every(r => r.productId && r.quantity >= 1)
    },
    bulkSummary() {
      const processed = this.bulkLoad.rows.filter(r => r.status !== null)
      if (!processed.length) return null
      const ok  = processed.filter(r => r.status === 'ok').length
      const err = processed.filter(r => r.status === 'error').length
      return { ok, err, text: err ? `${ok} OK · ${err} con error` : `${ok} filas aplicadas` }
    }
  },
  mounted() {
    this.initializeData()
    document.addEventListener('keydown', this.handleEsc)
  },
  unmounted() {
    document.removeEventListener('keydown', this.handleEsc)
  },
  methods: {
    handleEsc(e) {
      if (e.key !== 'Escape') return
      if (this.cellModal.show) this.closeCellModal()
      else if (this.detailModal.show) this.closeDetailModal()
    },
    async initializeData() {
      this.isLoading = true
      try { await Promise.all([this.fetchStock(), this.fetchProducts(), this.fetchSizes()]) }
      catch { this.showToast('error', 'Error al cargar datos') }
      finally { this.isLoading = false }
    },
    async fetchStock()    { this.stock    = (await getAllStock()).data    || [] },
    async fetchProducts() { this.products = (await getAllProducts()).data || [] },
    async fetchSizes()    { this.sizes    = (await getAllSizes()).data    || [] },

    getStockQty(productId, sizeId) {
      const item = this.stock.find(s => s.product?.id === productId &&
        ((sizeId == null && !s.size) || s.size?.id === sizeId))
      return item ? item.quantity : 0
    },
    productTotal(productId) {
      return this.sizes.reduce((sum, sz) => sum + this.getStockQty(productId, sz.id), 0)
    },
    stockBadgeClass(productId, sizeId) {
      const q = this.getStockQty(productId, sizeId)
      if (q < 3)  return 'badge-red'
      if (q <= 6) return 'badge-amber'
      return 'badge-green'
    },
    stockLevelClass(val) {
      if (val === '-') return ''
      if (val < 3)    return 'stock-zero'
      if (val <= 6)   return 'stock-low'
      return 'stock-ok'
    },
    stockStatusClass(productId, sizeId) {
      const q = this.getStockQty(productId, sizeId)
      if (q < 3)  return 'text-danger'
      if (q <= 6) return 'text-warning'
      return 'text-success'
    },
    stockStatusText(productId, sizeId) {
      const q = this.getStockQty(productId, sizeId)
      if (q === 0) return '⚠ Sin stock'
      if (q < 3)   return '⚠ Crítico'
      if (q <= 6)  return '⚡ Bajo'
      return '✓ OK'
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
        if (action === 'add') await addStock(productId, sizeId || null, quantity)
        else                  await discountStock(productId, sizeId || null, quantity)
        this.adjustForm.quantity = 1
        await this.fetchStock()
        this.showToast('success', action === 'add' ? `+${quantity} uds` : `-${quantity} uds`)
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al ajustar stock') }
      finally { this.isProcessing = false }
    },

    async handleQuickInc() {
      if (!this.adjustForm.productId) return
      this.isProcessing = true
      try { await addStock(this.adjustForm.productId, this.adjustForm.sizeId || null, 1); await this.fetchStock(); this.showToast('success', '+1') }
      catch { this.showToast('error', 'Error') }
      finally { this.isProcessing = false }
    },
    async handleQuickDec() {
      if (!this.adjustForm.productId || this.currentStock <= 0) return
      this.isProcessing = true
      try { await discountStock(this.adjustForm.productId, this.adjustForm.sizeId || null, 1); await this.fetchStock(); this.showToast('success', '-1') }
      catch { this.showToast('error', 'Error') }
      finally { this.isProcessing = false }
    },
    handleSetStock() {
      const product = this.products.find(p => p.id === this.adjustForm.productId)
      const size = this.adjustForm.sizeId ? this.sizes.find(s => s.id === this.adjustForm.sizeId) : null
      if (product) this.openCellModal(product, size)
    },

    async handleCellInc(productId, sizeId) {
      this.isProcessing = true
      try { await addStock(productId, sizeId, 1); await this.fetchStock() }
      catch { this.showToast('error', 'Error') }
      finally { this.isProcessing = false }
    },
    async handleCellDec(productId, sizeId) {
      this.isProcessing = true
      try { await discountStock(productId, sizeId, 1); await this.fetchStock() }
      catch { this.showToast('error', 'Error') }
      finally { this.isProcessing = false }
    },

    openCellModal(product, size) {
      this.cellModal = { show: true, product, size, newQuantity: this.getStockQty(product.id, size?.id || null) }
      this.$nextTick(() => this.$refs.cellInput?.focus())
    },
    closeCellModal() { if (!this.isProcessing) { this.cellModal = { show: false, product: null, size: null, newQuantity: 0 }; this.errors = {} } },

    async handleSaveCellEdit() {
      const { product, size, newQuantity } = this.cellModal
      if (newQuantity < 0) { this.errors.cellEditor = 'No puede ser negativo'; return }
      const diff = newQuantity - this.getStockQty(product.id, size?.id || null)
      if (diff === 0) { this.closeCellModal(); return }
      this.isProcessing = true
      try {
        if (diff > 0) await addStock(product.id, size?.id || null, diff)
        else          await discountStock(product.id, size?.id || null, Math.abs(diff))
        await this.fetchStock()
        this.showToast('success', 'Stock actualizado')
        this.closeCellModal()
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error') }
      finally { this.isProcessing = false }
    },

    toggleCategory(cat) {
      this.collapsedCategories = { ...this.collapsedCategories, [cat]: !this.collapsedCategories[cat] }
    },
    expandAll() {
      this.collapsedCategories = {}
    },
    collapseAll() {
      const collapsed = {}
      Object.keys(this.stockByCategory).forEach(cat => { collapsed[cat] = true })
      this.collapsedCategories = collapsed
    },
    categoryStockStatus(prods) {
      const totals = prods.map(p => this.productTotal(p.id))
      if (totals.some(t => t < 3))          return 'badge-red'
      if (totals.some(t => t <= 6))         return 'badge-amber'
      return 'badge-green'
    },
    categoryStockLabel(prods) {
      const totals = prods.map(p => this.productTotal(p.id))
      const total = totals.reduce((a, b) => a + b, 0)
      if (totals.some(t => t < 3))  return `⚠ ${total} uds`
      if (totals.some(t => t <= 6)) return `⚡ ${total} uds`
      return `✓ ${total} uds`
    },
    addBulkRow() {
      this.bulkLoad.rows.push({ productId: '', sizeId: '', quantity: 1, status: null, error: '' })
    },
    removeBulkRow(i) {
      this.bulkLoad.rows.splice(i, 1)
    },
    clearBulkLoad() {
      this.bulkLoad.rows = []
    },
    async applyBulkLoad() {
      this.isBulkProcessing = true
      this.bulkLoad.rows.forEach(r => { r.status = null; r.error = '' })
      await Promise.all(
        this.bulkLoad.rows.map(async (row, i) => {
          try {
            await addStock(row.productId, row.sizeId || null, row.quantity)
            this.bulkLoad.rows[i] = { ...this.bulkLoad.rows[i], status: 'ok' }
          } catch (e) {
            this.bulkLoad.rows[i] = { ...this.bulkLoad.rows[i], status: 'error', error: e.response?.data?.message || 'Error' }
          }
        })
      )
      await this.fetchStock()
      const ok  = this.bulkLoad.rows.filter(r => r.status === 'ok').length
      const err = this.bulkLoad.rows.filter(r => r.status === 'error').length
      this.showToast(err === 0 ? 'success' : 'error', err === 0 ? `${ok} productos actualizados` : `${ok} OK, ${err} fallaron`)
      this.isBulkProcessing = false
    },

    openDetailModal(product) { this.detailModal = { show: true, product } },
    closeDetailModal() { this.detailModal = { show: false, product: null } },

    showToast(type, message) {
      this.toast = { show: true, type, message }
      setTimeout(() => { this.toast.show = false }, 3000)
    }
  }
}
</script>

<style scoped>
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

@media (max-width: 700px) {
  .category-header, .bulk-header { flex-wrap: wrap; }
  .bulk-actions { flex-direction: column; align-items: stretch; gap: 0.5rem; }
  .bulk-actions > .d-flex { flex-wrap: wrap; }
}

@media (max-width: 480px) {
  .tac-toast { left: 1rem; right: 1rem; bottom: 1rem; text-align: center; }
}
</style>
