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
                  <th>Nombre</th>
                  <th>Componentes</th>
                  <th class="text-center">Precio</th>
                  <th class="text-center">Publicado</th>
                  <th class="text-center" style="width:110px">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="combo in combos" :key="combo.id">
                  <td class="fw-bold">{{ combo.name }}</td>
                  <td style="font-size:0.82rem;color:var(--text-secondary)">
                    {{ combo.items.map(i => `${i.quantity}× ${i.productName}`).join(', ') }}
                  </td>
                  <td class="text-center">${{ formatMoney(combo.price) }}</td>
                  <td class="text-center">
                    <span class="badge" :class="combo.published ? 'badge-green' : 'badge-neutral'">
                      {{ combo.published ? 'Sí' : 'No' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-secondary btn-icon" @click="openEditModal(combo)">✎</button>
                    <button class="btn btn-sm btn-danger btn-icon" @click="handleDelete(combo)">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal crear/editar -->
      <div v-if="modal.show" class="tac-modal-overlay" @click.self="closeModal">
        <div class="tac-modal">
          <div class="tac-modal-header">
            <h4>{{ modal.editing ? '✎ Editar combo' : '+ Nuevo combo' }}</h4>
            <button class="btn-close" @click="closeModal" :disabled="isProcessing">✕</button>
          </div>
          <form @submit.prevent="handleSave">
            <div class="tac-modal-body">
              <div class="form-group mb-2">
                <label>Nombre *</label>
                <input v-model.trim="form.name" class="form-control" required :disabled="isProcessing" />
              </div>
              <div class="form-group mb-2">
                <label>Descripción</label>
                <textarea v-model.trim="form.description" class="form-control" rows="2" :disabled="isProcessing"></textarea>
              </div>
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <div class="form-group">
                    <label>Precio *</label>
                    <input v-model.number="form.price" type="number" min="0" class="form-control" required :disabled="isProcessing" />
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-group">
                    <label>URL de imagen</label>
                    <input v-model.trim="form.imageUrl" class="form-control" placeholder="https://..." :disabled="isProcessing" />
                  </div>
                </div>
              </div>
              <div class="form-check mb-3">
                <input v-model="form.published" type="checkbox" id="combo-published" class="form-check-input" :disabled="isProcessing" />
                <label for="combo-published" class="form-check-label">Publicado en la tienda</label>
              </div>

              <label>Componentes *</label>
              <div v-for="(item, idx) in form.items" :key="idx" class="combo-item-row">
                <select v-model.number="item.productId" class="form-select form-select-sm" :disabled="isProcessing" @change="item.productName = productName(item.productId)">
                  <option value="" disabled>Producto</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <input v-model.number="item.quantity" type="number" min="1" class="form-control form-control-sm" style="max-width:70px" :disabled="isProcessing" />
                <button type="button" class="btn btn-sm btn-danger btn-icon" @click="form.items.splice(idx, 1)" :disabled="isProcessing">✕</button>
              </div>
              <button type="button" class="btn btn-sm btn-secondary mt-1" @click="form.items.push({ productId: '', productName: '', quantity: 1 })" :disabled="isProcessing">
                + Agregar componente
              </button>
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
        <div v-if="toast.show" class="tac-toast" :class="`tac-toast-${toast.type}`">{{ toast.message }}</div>
      </transition>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from '../BaseLayout.vue'
import { getAllCombos, addCombo, editCombo, deleteCombo } from '../../services/comboService'
import { getAllProducts } from '../../services/productService'

export default {
  name: 'Combos',
  components: { BaseLayout },
  data() {
    return {
      combos: [], products: [],
      isLoading: true, isProcessing: false,
      modal: { show: false, editing: false, id: null },
      form: { name: '', description: '', price: '', imageUrl: '', published: true, items: [] },
      errors: {},
      toast: { show: false, type: 'success', message: '' }
    }
  },
  computed: {
    canSave() {
      return this.form.name && this.form.price >= 0 && this.form.items.length > 0 &&
        this.form.items.every(i => i.productId && i.quantity >= 1)
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
  },
  methods: {
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    productName(id) { return this.products.find(p => p.id === id)?.name || '' },
    openCreateModal() {
      this.form = { name: '', description: '', price: '', imageUrl: '', published: true, items: [] }
      this.modal = { show: true, editing: false, id: null }
    },
    openEditModal(combo) {
      this.form = { name: combo.name, description: combo.description, price: combo.price, imageUrl: combo.imageUrl, published: combo.published, items: combo.items.map(i => ({ ...i })) }
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
.combo-item-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
.combo-item-row .form-select { flex: 1; }

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
