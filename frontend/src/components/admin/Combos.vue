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
                    {{ combo.items.map(slotSummary).join(', ') }}
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
                <label for="combo-images">Fotos</label>
                <ImageListEditor v-model="form.images" folder="combos" input-id="combo-images" :disabled="isProcessing"
                  @uploading="isUploadingImage = $event" @error="showToast('error', $event)" />
              </div>
              <div class="form-check mb-3">
                <input v-model="form.published" type="checkbox" id="combo-published" class="form-check-input" :disabled="isProcessing" />
                <label for="combo-published" class="form-check-label">Publicado en la tienda</label>
              </div>

              <!-- Productos fijos: van siempre en el combo -->
              <div class="combo-section" role="group" aria-labelledby="combo-fixed-label">
                <label id="combo-fixed-label">Productos fijos</label>
                <p class="combo-help">Van siempre en el combo (ej. la caña).</p>
                <div v-for="slot in fixedSlots" :key="slot.key" class="combo-fixed-row">
                  <span class="combo-fixed-name">{{ slot.options[0]?.productName }}</span>
                  <input v-model.number="slot.quantity" type="number" min="1" class="form-control form-control-sm combo-slot-qty" :aria-label="`Cantidad de ${slot.options[0]?.productName}`" title="Unidades por combo" :disabled="isProcessing" />
                  <button type="button" class="btn btn-sm btn-danger btn-icon" @click="removeSlot(slot)" :disabled="isProcessing" :aria-label="`Quitar ${slot.options[0]?.productName}`">✕</button>
                </div>
                <div class="combo-search">
                  <input v-model="fixedSearch" class="form-control form-control-sm" placeholder="Buscar producto para agregar como fijo..." autocomplete="off" aria-label="Buscar producto fijo" :disabled="isProcessing"
                    @keydown.enter.prevent="fixedResults.length && addFixed(fixedResults[0])" />
                  <ul v-if="fixedSearch.trim()" class="combo-search-results" role="listbox" aria-label="Resultados de búsqueda">
                    <li v-if="fixedResults.length === 0" class="combo-search-empty">Sin resultados</li>
                    <li v-for="p in fixedResults" :key="p.id">
                      <button type="button" class="combo-search-option" @click="addFixed(p)">{{ p.name }}</button>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Para elegir: el cliente elige una opción de cada grupo -->
              <div class="combo-section" role="group" aria-labelledby="combo-choice-label">
                <label id="combo-choice-label">Para elegir</label>
                <p class="combo-help">El cliente elige una opción de cada grupo en la tienda (ej. grupo "Reel" con los colores). Si el producto tiene talles, también elige el talle. El precio del combo no cambia.</p>
                <div v-for="(slot, idx) in choiceSlots" :key="slot.key" class="combo-slot" role="group" :aria-label="`Grupo para elegir ${idx + 1}`">
                  <div class="combo-slot-head">
                    <input v-model.trim="slot.label" class="form-control form-control-sm" placeholder="Nombre del grupo (ej. Reel) *" :aria-label="`Nombre del grupo ${idx + 1}`" :disabled="isProcessing" />
                    <input v-model.number="slot.quantity" type="number" min="1" class="form-control form-control-sm combo-slot-qty" :aria-label="`Cantidad del grupo ${idx + 1}`" title="Unidades por combo" :disabled="isProcessing" />
                    <button type="button" class="btn btn-sm btn-danger btn-icon" @click="removeSlot(slot)" :disabled="isProcessing" :aria-label="`Quitar grupo ${idx + 1}`">✕</button>
                  </div>
                  <div v-if="slot.options.length" class="combo-options">
                    <span v-for="(opt, oIdx) in slot.options" :key="opt.productId" class="combo-chip">
                      {{ opt.productName }}
                      <button type="button" class="combo-chip-fix" @click="moveToFixed(slot, oIdx)" :disabled="isProcessing" :aria-label="`Pasar ${opt.productName} a productos fijos`" title="Pasar a productos fijos">Pasar a fijos</button>
                      <button type="button" @click="slot.options.splice(oIdx, 1)" :disabled="isProcessing" :aria-label="`Quitar ${opt.productName}`">✕</button>
                    </span>
                  </div>
                  <div class="combo-search">
                    <input v-model="slot.search" class="form-control form-control-sm" :placeholder="slot.options.length ? 'Agregar otra opción...' : 'Buscar producto...'" autocomplete="off" :aria-label="`Buscar opción para el grupo ${idx + 1}`" :disabled="isProcessing" @keydown.enter.prevent="searchResults(slot).length && addOption(slot, searchResults(slot)[0])" />
                    <ul v-if="slot.search && slot.search.trim()" class="combo-search-results" role="listbox" aria-label="Resultados de búsqueda">
                      <li v-if="searchResults(slot).length === 0" class="combo-search-empty">Sin resultados</li>
                      <li v-for="p in searchResults(slot)" :key="p.id">
                        <button type="button" class="combo-search-option" @click="addOption(slot, p)">{{ p.name }}</button>
                      </li>
                    </ul>
                  </div>
                  <span class="combo-slot-hint">{{ slot.options.length >= 2 ? `El cliente elige 1 de ${slot.options.length}` : slot.options.length === 1 ? 'Con una sola opción, al guardar pasa a fijos' : 'Sin opciones: se descarta al guardar' }}</span>
                </div>
                <button type="button" class="btn btn-sm btn-secondary mt-1" @click="addChoiceSlot" :disabled="isProcessing">+ Agregar grupo para elegir</button>
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
import { getAllProducts } from '../../services/productService'
import ImageListEditor from './ImageListEditor.vue'

export default {
  name: 'Combos',
  components: { BaseLayout, ImageListEditor },
  data() {
    return {
      combos: [], products: [],
      isLoading: true, isProcessing: false, isUploadingImage: false,
      modal: { show: false, editing: false, id: null },
      form: { name: '', description: '', price: '', priceCash: '', images: [], published: true, items: [] },
      fixedSearch: '',
      errors: {},
      toast: { show: false, type: 'success', message: '' }
    }
  },
  computed: {
    fixedSlots() { return this.form.items.filter(s => s.kind === 'fixed') },
    choiceSlots() { return this.form.items.filter(s => s.kind === 'choice') },
    fixedResults() {
      const q = this.fixedSearch.trim().toLowerCase()
      if (!q) return []
      const used = new Set(this.fixedSlots.map(s => s.options[0]?.productId))
      return this.products.filter(p => p.name.toLowerCase().includes(q) && !used.has(p.id)).slice(0, 8)
    },
    // Lo que falta se explica al tocar Guardar (handleSave), en vez de deshabilitar el botón sin aviso.
    canSave() {
      return !this.isUploadingImage
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
    slotSummary(slot) {
      const name = slot.label || slot.options[0]?.productName || '—'
      return `${slot.quantity}× ${name}${slot.options.length > 1 ? ` (${slot.options.length} opciones)` : ''}`
    },
    // kind es solo de esta pantalla: 'fixed' = un producto que va siempre, 'choice' = grupo donde el cliente elige.
    // Para el backend los dos son componentes del combo (uno fijo es un componente con una sola opción).
    newSlot(data = {}) {
      return { key: Math.random().toString(36).slice(2), id: null, kind: 'choice', label: '', quantity: 1, options: [], search: '', ...data }
    },
    addChoiceSlot() {
      this.form.items.push(this.newSlot())
    },
    addFixed(product) {
      this.form.items.push(this.newSlot({ kind: 'fixed', options: [{ productId: product.id, productName: product.name }] }))
      this.fixedSearch = ''
      this.errors.items = ''
    },
    moveToFixed(slot, optionIdx) {
      const [opt] = slot.options.splice(optionIdx, 1)
      if (!this.fixedSlots.some(s => s.options[0]?.productId === opt.productId)) {
        this.form.items.push(this.newSlot({ kind: 'fixed', quantity: slot.quantity, options: [opt] }))
      }
    },
    removeSlot(slot) {
      this.form.items = this.form.items.filter(s => s.key !== slot.key)
    },
    searchResults(slot) {
      const q = (slot.search || '').trim().toLowerCase()
      if (!q) return []
      return this.products
        .filter(p => p.name.toLowerCase().includes(q) && !slot.options.some(o => o.productId === p.id))
        .slice(0, 8)
    },
    addOption(slot, product) {
      slot.options.push({ productId: product.id, productName: product.name })
      slot.search = ''
      this.errors.items = ''
    },
    openCreateModal() {
      this.form = { name: '', description: '', price: '', priceCash: '', images: [], published: true, items: [] }
      this.fixedSearch = ''
      this.errors = {}
      this.modal = { show: true, editing: false, id: null }
    },
    openEditModal(combo) {
      this.form = {
        name: combo.name, description: combo.description, price: combo.price, priceCash: combo.priceCash ?? '',
        images: combo.images?.length ? [...combo.images] : (combo.imageUrl ? [combo.imageUrl] : []), published: combo.published,
        items: combo.items.map(slot => this.newSlot({
          id: slot.id, kind: slot.options.length > 1 ? 'choice' : 'fixed', label: slot.label || '', quantity: slot.quantity,
          options: slot.options.map(o => ({ productId: o.productId, productName: o.productName }))
        }))
      }
      this.fixedSearch = ''
      this.errors = {}
      this.modal = { show: true, editing: true, id: combo.id }
    },
    closeModal() { if (!this.isProcessing) this.modal.show = false },
    async handleSave() {
      this.errors = {}
      // Grupos para elegir: si quedó vacío se descarta; si tiene una sola opción, pasa a fijo.
      this.form.items = this.form.items
        .filter(s => !(s.kind === 'choice' && s.options.length === 0))
        .map(s => (s.kind === 'choice' && s.options.length === 1 ? { ...s, kind: 'fixed', label: '' } : s))
      if (!this.form.name) { this.errors.items = 'Falta el nombre del combo'; return }
      if (this.form.price === '' || this.form.price < 0 || this.form.priceCash === '' || this.form.priceCash < 0) {
        this.errors.items = 'Faltan los precios del combo (tarjeta y efectivo)'; return
      }
      if (this.form.items.length === 0) { this.errors.items = 'Agregá al menos un producto fijo o un grupo para elegir'; return }
      if (this.form.items.some(s => !(s.quantity >= 1))) { this.errors.items = 'Las cantidades tienen que ser 1 o más'; return }
      if (this.choiceSlots.some(s => !s.label)) { this.errors.items = 'Poné un nombre a cada grupo para elegir (ej. Reel)'; return }
      this.isProcessing = true
      try {
        const payload = {
          ...this.form,
          id: this.modal.id,
          // Primero los fijos y después los grupos, así se muestran en ese orden en la tienda.
          items: [...this.fixedSlots, ...this.choiceSlots].map(s => ({
            id: s.id, label: s.label || null, quantity: s.quantity,
            options: s.options.map(o => ({ productId: o.productId }))
          }))
        }
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
.combo-section { margin-bottom: 1rem; }
.combo-section > label { display: block; }
.combo-fixed-row {
  display: flex; gap: .5rem; align-items: center; padding: .4rem .5rem; margin-bottom: .4rem;
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-surface);
}
.combo-fixed-name { flex: 1; min-width: 0; font-size: .88rem; }
.combo-chip button.combo-chip-fix { font-size: .7rem; text-decoration: underline; }
.combo-chip button.combo-chip-fix:hover { color: var(--text-primary); }
.combo-help { font-size: .78rem; color: var(--text-muted); margin-bottom: .6rem; }
.combo-slot { border: 1px solid var(--border); border-radius: var(--radius); padding: .65rem; margin-bottom: .6rem; background: var(--bg-surface); }
.combo-slot-head { display: flex; gap: .5rem; align-items: center; }
.combo-slot-head .form-control:first-child { flex: 1; min-width: 0; }
.combo-slot-qty { max-width: 70px; }
.combo-options { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .5rem; }
.combo-chip {
  display: inline-flex; align-items: center; gap: .35rem; padding: .2rem .25rem .2rem .55rem;
  background: var(--bg-hover); border: 1px solid var(--border); border-radius: 999px; font-size: .8rem;
}
.combo-chip button { background: none; border: 0; color: var(--text-muted); padding: 0 .3rem; line-height: 1; cursor: pointer; }
.combo-chip button:hover { color: var(--red); }
.combo-slot-hint { display: block; margin-top: .35rem; font-size: .74rem; color: var(--text-muted); }
.combo-search { position: relative; margin-top: .5rem; }
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
