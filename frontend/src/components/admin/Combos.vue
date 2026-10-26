<template>
  <BaseLayout>
    <div class="fade-in">
      <div class="page-header">
        <h2 class="page-title"><span class="page-title-icon">▣</span> Combos</h2>
        <button class="btn btn-primary" @click="openCreateModal">+ Nuevo combo</button>
      </div>

      <div v-if="isLoading" class="empty-state">
        <div class="spinner" style="margin: 0 auto 1rem;"></div>
        <p>Cargando combos...</p>
      </div>

      <div v-else class="tac-card">
        <div class="tac-card-body" style="padding:0">
          <div v-if="combos.length === 0" class="empty-state">
            <div class="empty-state-icon">▣</div>
            <p>Sin combos cargados</p>
          </div>
          <div v-else class="table-responsive">
            <table class="tac-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Componentes</th>
                  <th scope="col" class="text-center">Tarjeta</th>
                  <th scope="col" class="text-center">Efectivo / transf.</th>
                  <th scope="col" class="text-center">Publicado</th>
                  <th scope="col" class="text-center" style="width:110px">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="combo in combos" :key="combo.id">
                  <td class="fw-bold">{{ combo.name }}</td>
                  <td style="font-size:0.82rem;color:var(--text-secondary)">
                    {{ combo.items.map(i => `${i.quantity}× ${i.productName}`).join(', ') }}
                  </td>
                  <td class="text-center">${{ formatMoney(combo.price) }}</td>
                  <td class="text-center">{{ combo.priceCash != null ? '$' + formatMoney(combo.priceCash) : '—' }}</td>
                  <td class="text-center">
                    <span class="badge" :class="combo.published ? 'badge-green' : 'badge-neutral'">
                      {{ combo.published ? 'Sí' : 'No' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-secondary btn-icon" @click="openEditModal(combo)" :aria-label="`Editar combo ${combo.name}`">✎</button>
                    <button class="btn btn-sm btn-danger btn-icon" @click="handleDelete(combo)" :aria-label="`Eliminar combo ${combo.name}`">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal crear/editar -->
      <div v-if="modal.show" class="tac-modal-overlay" @click.self="closeModal">
        <div class="tac-modal" role="dialog" aria-modal="true" aria-labelledby="combo-modal-title">
          <div class="tac-modal-header">
            <h4 id="combo-modal-title">{{ modal.editing ? '✎ Editar combo' : '+ Nuevo combo' }}</h4>
            <button class="btn-close" @click="closeModal" :disabled="isProcessing" aria-label="Cerrar">✕</button>
          </div>
          <form @submit.prevent="handleSave">
            <div class="tac-modal-body">
              <div class="form-group mb-2">
                <label for="combo-name">Nombre *</label>
                <input id="combo-name" v-model.trim="form.name" class="form-control" required :disabled="isProcessing" />
              </div>
              <div class="form-group mb-2">
                <label for="combo-description">Descripción</label>
                <textarea id="combo-description" v-model.trim="form.description" class="form-control" rows="2" :disabled="isProcessing"></textarea>
              </div>
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <div class="form-group">
                    <label for="combo-price">Precio tarjeta *</label>
                    <input id="combo-price" v-model.number="form.price" type="number" min="0" step="0.01" class="form-control" required :disabled="isProcessing" />
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-group">
                    <label for="combo-price-cash">Precio efectivo / transf. *</label>
                    <input id="combo-price-cash" v-model.number="form.priceCash" type="number" min="0" step="0.01" class="form-control" required :disabled="isProcessing" />
                  </div>
                </div>
              </div>
              <div class="form-group mb-2">
                <label for="combo-image">Foto</label>
                <div class="combo-image-row">
                  <img v-if="form.imageUrl" :src="form.imageUrl" alt="Foto del combo" class="combo-image-preview" />
                  <div class="combo-image-actions">
                    <input id="combo-image" type="file" accept="image/*" class="form-control form-control-sm" :disabled="isProcessing || isUploadingImage" @change="handleImageUpload" />
                    <span v-if="isUploadingImage" class="combo-image-status"><span class="spinner spinner-sm"></span> Subiendo...</span>
                    <button v-else-if="form.imageUrl" type="button" class="btn btn-sm btn-secondary" @click="form.imageUrl = ''" :disabled="isProcessing">Quitar foto</button>
                  </div>
                </div>
              </div>
              <div class="form-check mb-3">
                <input v-model="form.published" type="checkbox" id="combo-published" class="form-check-input" :disabled="isProcessing" />
                <label for="combo-published" class="form-check-label">Publicado en la tienda</label>
              </div>

              <label id="combo-items-label" for="combo-product-search">Componentes *</label>
              <div class="combo-search">
                <input id="combo-product-search" v-model="productSearch" class="form-control form-control-sm" placeholder="Buscar producto para agregar..." autocomplete="off" :disabled="isProcessing" @keydown.enter.prevent="searchResults.length && addComponent(searchResults[0])" />
                <ul v-if="productSearch.trim()" class="combo-search-results" role="listbox" aria-label="Resultados de búsqueda">
                  <li v-if="searchResults.length === 0" class="combo-search-empty">Sin resultados</li>
                  <li v-for="p in searchResults" :key="p.id">
                    <button type="button" class="combo-search-option" @click="addComponent(p)">{{ p.name }}</button>
                  </li>
                </ul>
              </div>
              <div v-for="(item, idx) in form.items" :key="item.productId" class="combo-item-row" role="group" aria-labelledby="combo-items-label">
                <span class="combo-item-name">{{ item.productName }}</span>
                <input v-model.number="item.quantity" type="number" min="1" class="form-control form-control-sm" style="max-width:70px" :aria-label="`Cantidad de ${item.productName}`" :disabled="isProcessing" />
                <button type="button" class="btn btn-sm btn-danger btn-icon" @click="form.items.splice(idx, 1)" :disabled="isProcessing" :aria-label="`Quitar ${item.productName}`">✕</button>
              </div>
              <span v-if="errors.items" class="invalid-feedback d-block mt-1">{{ errors.items }}</span>
            </div>
            <div class="tac-modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="isProcessing">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="!canSave || isProcessing">
                <span v-if="isProcessing" class="spinner spinner-sm"></span>
                <span v-else>Guardar</span>
              </button>
            </div>
          </form>
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
import { getAllCombos, addCombo, editCombo, deleteCombo } from '../../services/comboService'
import { getAllProducts, uploadImage } from '../../services/productService'

export default {
  name: 'Combos',
  components: { BaseLayout },
  data() {
    return {
      combos: [], products: [],
      isLoading: true, isProcessing: false, isUploadingImage: false,
      productSearch: '',
      modal: { show: false, editing: false, id: null },
      form: { name: '', description: '', price: '', priceCash: '', imageUrl: '', published: true, items: [] },
      errors: {},
      toast: { show: false, type: 'success', message: '' }
    }
  },
  computed: {
    canSave() {
      return this.form.name && this.form.price !== '' && this.form.price >= 0 &&
        this.form.priceCash !== '' && this.form.priceCash >= 0 && this.form.items.length > 0 &&
        this.form.items.every(i => i.productId && i.quantity >= 1) && !this.isUploadingImage
    },
    searchResults() {
      const q = this.productSearch.trim().toLowerCase()
      if (!q) return []
      return this.products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8)
    }
  },
  async mounted() {
    this.isLoading = true
    try {
      const [combosRes, productsRes] = await Promise.all([getAllCombos(), getAllProducts()])
      this.combos = combosRes.data
      this.products = productsRes.data
    } catch {
      this.showToast('error', 'Error al cargar datos')
    } finally {
      this.isLoading = false
    }
    document.addEventListener('keydown', this.handleEsc)
  },
  unmounted() {
    document.removeEventListener('keydown', this.handleEsc)
  },
  methods: {
    handleEsc(e) { if (e.key === 'Escape' && this.modal.show) this.closeModal() },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    addComponent(product) {
      const existing = this.form.items.find(i => i.productId === product.id)
      if (existing) existing.quantity++
      else this.form.items.push({ productId: product.id, productName: product.name, quantity: 1 })
      this.productSearch = ''
      this.errors.items = ''
    },
    async handleImageUpload(event) {
      const file = event.target.files?.[0]
      if (!file) return
      this.isUploadingImage = true
      try {
        const res = await uploadImage(file, 'combos')
        this.form.imageUrl = res.data.url
      } catch (e) {
        this.showToast('error', e.response?.data?.message || 'Error al subir la imagen')
      } finally {
        this.isUploadingImage = false
        event.target.value = ''
      }
    },
    openCreateModal() {
      this.productSearch = ''
      this.form = { name: '', description: '', price: '', priceCash: '', imageUrl: '', published: true, items: [] }
      this.modal = { show: true, editing: false, id: null }
    },
    openEditModal(combo) {
      this.productSearch = ''
      this.form = { name: combo.name, description: combo.description, price: combo.price, priceCash: combo.priceCash ?? '', imageUrl: combo.imageUrl, published: combo.published, items: combo.items.map(i => ({ ...i })) }
      this.modal = { show: true, editing: true, id: combo.id }
    },
    closeModal() { if (!this.isProcessing) this.modal.show = false },
    async handleSave() {
      this.errors = {}
      if (this.form.items.length === 0) { this.errors.items = 'Agregá al menos un componente'; return }
      this.isProcessing = true
      try {
        const payload = { ...this.form, id: this.modal.id }
        if (this.modal.editing) {
          await editCombo(payload)
          this.showToast('success', 'Combo actualizado')
        } else {
          await addCombo(payload)
          this.showToast('success', 'Combo creado')
        }
        this.combos = (await getAllCombos()).data
        this.modal.show = false
      } catch (e) {
        this.showToast('error', e.response?.data?.message || 'Error al guardar')
      } finally {
        this.isProcessing = false
      }
    },
    async handleDelete(combo) {
      if (!confirm(`¿Eliminar el combo "${combo.name}"?`)) return
      try {
        await deleteCombo(combo.id)
        this.combos = this.combos.filter(c => c.id !== combo.id)
        this.showToast('success', 'Combo eliminado')
      } catch {
        this.showToast('error', 'Error al eliminar')
      }
    },
    showToast(type, message) {
      this.toast = { show: true, type, message }
      setTimeout(() => { this.toast.show = false }, 3000)
    }
  }
}
</script>

<style scoped>
.combo-item-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; flex-wrap: wrap; }
.combo-item-name { flex: 1; min-width: 140px; font-size: .88rem; }
.combo-search { position: relative; margin-bottom: .75rem; }
.combo-search-results {
  list-style: none; margin: .25rem 0 0; padding: .25rem 0;
  max-height: 260px; overflow-y: auto;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius);
}
.combo-search-option {
  display: block; width: 100%;
  padding: .45rem .75rem; background: none; border: 0; color: inherit; text-align: left; font-size: .85rem;
}
.combo-search-option:hover, .combo-search-option:focus-visible { background: var(--bg-hover); outline: none; }
.combo-search-empty { padding: .45rem .75rem; color: var(--text-muted); font-size: .85rem; }
.combo-image-row { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }
.combo-image-preview { width: 72px; height: 72px; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--border); }
.combo-image-actions { display: flex; flex-direction: column; gap: .4rem; flex: 1; min-width: 180px; }
.combo-image-status { font-size: .78rem; color: var(--text-muted); display: inline-flex; gap: .4rem; align-items: center; }

@media (max-width: 480px) {
  .tac-toast { left: 1rem; right: 1rem; bottom: 1rem; text-align: center; }
}

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
