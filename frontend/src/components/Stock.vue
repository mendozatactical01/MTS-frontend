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
          <input v-model="filters.productSearch" class="form-control" placeholder="🔍 Filtrar producto..." />
        </div>
        <div class="col-md-6">
          <input v-model="filters.sizeSearch" class="form-control" placeholder="🔍 Filtrar talle..." />
        </div>
      </div>

      <!-- Formulario de ajuste -->
      <div class="tac-card mb-3">
        <div class="tac-card-header"><h5>Ajustar Stock</h5></div>
        <div class="tac-card-body">
          <form @submit.prevent="handleAdjustStock" class="row g-2 align-items-end">
            <div class="col-md-3">
              <div class="form-group">
                <label>Producto *</label>
                <select v-model.number="adjustForm.productId" class="form-select"
                  :class="{ 'is-invalid': errors.product }" :disabled="isProcessing">
                  <option value="" disabled>Seleccionar</option>
                  <option v-for="p in filteredProducts" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <span v-if="errors.product" class="invalid-feedback">{{ errors.product }}</span>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label>Talle</label>
                <select v-model.number="adjustForm.sizeId" class="form-select" :disabled="isProcessing">
                  <option value="">Sin talle</option>
                  <option v-for="s in filteredSizes" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label>Stock actual</label>
                <div class="current-stock-display" :class="stockLevelClass(currentStock)">
                  {{ currentStock === '-' ? '—' : currentStock }}
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label>Cantidad *</label>
                <input v-model.number="adjustForm.quantity" type="number" min="1" class="form-control"
                  :class="{ 'is-invalid': errors.quantity }"
                  :max="adjustForm.action === 'discount' ? (typeof currentStock === 'number' ? currentStock : undefined) : undefined"
                  placeholder="1" :disabled="!adjustForm.productId || isProcessing" />
                <span v-if="errors.quantity" class="invalid-feedback">{{ errors.quantity }}</span>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label>Acción</label>
                <select v-model="adjustForm.action" class="form-select" :disabled="isProcessing">
                  <option value="add">＋ Agregar</option>
                  <option value="discount">－ Descontar</option>
                </select>
              </div>
            </div>
            <div class="col-md-1">
              <button type="submit" class="btn btn-primary w-100" :disabled="!canSubmitAdjustment || isProcessing" title="Aplicar">
                <span v-if="isProcessing" class="spinner spinner-sm"></span>
                <span v-else>✓</span>
              </button>
            </div>
          </form>
          <!-- Quick -->
          <div class="d-flex gap-2 mt-2 align-items-center">
            <span style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-display);letter-spacing:.06em;text-transform:uppercase">Rápido:</span>
            <button type="button" class="btn btn-sm btn-primary"  @click="handleQuickInc" :disabled="!adjustForm.productId || isProcessing">+1</button>
            <button type="button" class="btn btn-sm btn-danger"   @click="handleQuickDec" :disabled="!adjustForm.productId || currentStock <= 0 || isProcessing">-1</button>
            <button type="button" class="btn btn-sm btn-secondary" @click="handleSetStock" :disabled="!adjustForm.productId || isProcessing">Establecer</button>
          </div>
        </div>
      </div>

      <!-- Tabla por categoría -->
      <div class="tac-card">
        <div class="tac-card-header"><h5>Inventario por Categoría</h5></div>
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
              <div class="category-header">
                <span class="category-name">{{ category }}</span>
                <span class="badge badge-neutral">{{ prods.length }} producto(s)</span>
              </div>
              <div class="table-responsive">
                <table class="tac-table">
                  <thead>
                    <tr>
                      <th style="min-width:180px">Producto</th>
                      <th v-for="size in filteredSizes" :key="size.id" class="text-center">{{ size.name }}</th>
                      <th class="text-center" style="width:80px">Total</th>
                      <th class="text-center" style="width:70px">Ver</th>
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
                          <button class="btn btn-sm btn-primary btn-icon"  @click="handleCellInc(prod.id, size.id)" :disabled="isProcessing" style="padding:.15rem .4rem;font-size:.7rem">+</button>
                          <button class="btn btn-sm btn-danger btn-icon"   @click="handleCellDec(prod.id, size.id)" :disabled="getStockQty(prod.id,size.id)<=0||isProcessing" style="padding:.15rem .4rem;font-size:.7rem">-</button>
                        </div>
                      </td>
                      <td class="text-center fw-bold">{{ productTotal(prod.id) }}</td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-secondary" @click="openDetailModal(prod)" :disabled="isProcessing">↗</button>
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
        <div class="tac-modal">
          <div class="tac-modal-header">
            <h4>✎ Editar Stock</h4>
            <button class="btn-close" @click="closeCellModal" :disabled="isProcessing">✕</button>
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
                <label>Nueva cantidad *</label>
                <input v-model.number="cellModal.newQuantity" type="number" min="0" class="form-control"
                  :class="{ 'is-invalid': errors.cellEditor }" required :disabled="isProcessing" ref="cellInput" />
                <span v-if="errors.cellEditor" class="invalid-feedback">{{ errors.cellEditor }}</span>
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
        <div class="tac-modal">
          <div class="tac-modal-header">
            <h4>▦ {{ detailModal.product?.name }}</h4>
            <button class="btn-close" @click="closeDetailModal">✕</button>
          </div>
          <div class="tac-modal-body">
            <div class="row g-2 mb-3" style="font-size:.88rem">
              <div class="col-6"><span style="color:var(--text-muted)">Categoría:</span> <strong>{{ detailModal.product?.category?.name || '—' }}</strong></div>
              <div class="col-6"><span style="color:var(--text-muted)">Precio:</span> <strong>${{ detailModal.product?.price?.toFixed(2) }}</strong></div>
            </div>
            <table class="tac-table">
              <thead>
                <tr><th>Talle</th><th class="text-center">Cantidad</th><th class="text-center">Estado</th><th class="text-center">Editar</th></tr>
              </thead>
              <tbody>
                <tr v-for="size in sizes" :key="size.id">
                  <td>{{ size.name }}</td>
                  <td class="text-center">
                    <span class="badge" :class="stockBadgeClass(detailModal.product?.id, size.id)">{{ getStockQty(detailModal.product?.id, size.id) }}</span>
                  </td>
                  <td class="text-center" :class="stockStatusClass(detailModal.product?.id, size.id)">{{ stockStatusText(detailModal.product?.id, size.id) }}</td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-secondary btn-icon" @click="openCellModal(detailModal.product, size); closeDetailModal()">✎</button>
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
          <div class="tac-modal-footer">
            <button class="btn btn-secondary" @click="closeDetailModal">Cerrar</button>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <transition name="toast">
        <div v-if="toast.show" class="tac-toast" :class="`tac-toast-${toast.type}`">{{ toast.message }}</div>
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
      adjustForm: { productId: '', sizeId: '', quantity: 1, action: 'add' },
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
    canSaveCellEdit() { return this.cellModal.newQuantity >= 0 && this.cellDiff !== 0 }
  },
  mounted() { this.initializeData() },
  methods: {
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
      if (q === 0)  return 'badge-red'
      if (q < 5)    return 'badge-amber'
      if (q < 10)   return 'badge-steel'
      return 'badge-crimson'
    },
    stockLevelClass(val) {
      if (val === '-') return ''
      if (val === 0)   return 'stock-zero'
      if (val < 5)     return 'stock-low'
      return 'stock-ok'
    },
    stockStatusClass(productId, sizeId) {
      const q = this.getStockQty(productId, sizeId)
      if (q === 0) return 'text-danger'
      if (q < 5)   return 'text-warning'
      return 'text-success'
    },
    stockStatusText(productId, sizeId) {
      const q = this.getStockQty(productId, sizeId)
      if (q === 0) return '⚠ Sin stock'
      if (q < 5)   return '⚠ Bajo'
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
.category-block { border-bottom: 1px solid var(--border); }
.category-block:last-child { border-bottom: none; }

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
}

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
</style>
