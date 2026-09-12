<template>
  <BaseLayout>
    <div class="fade-in">
      <div class="page-header">
        <h2 class="page-title"><span class="page-title-icon">➤</span> Zonas de Envío</h2>
        <button class="btn btn-primary" @click="openCreateModal">+ Nueva zona</button>
      </div>

      <div v-if="isLoading" class="empty-state">
        <div class="spinner" style="margin: 0 auto 1rem;"></div>
        <p>Cargando zonas...</p>
      </div>

      <div v-else class="tac-card">
        <div class="tac-card-body" style="padding:0">
          <div v-if="zones.length === 0" class="empty-state">
            <div class="empty-state-icon">➤</div>
            <p>Sin zonas de envío cargadas</p>
          </div>
          <div v-else class="table-responsive">
            <table class="tac-table">
              <thead>
                <tr>
                  <th scope="col">Provincia</th>
                  <th scope="col" class="text-center">Costo base</th>
                  <th scope="col" class="text-center">Costo x kg extra</th>
                  <th scope="col" class="text-center">Envío gratis desde</th>
                  <th scope="col" class="text-center">Días estimados</th>
                  <th scope="col" class="text-center">Activa</th>
                  <th scope="col" class="text-center" style="width:110px">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="zone in zones" :key="zone.id">
                  <td class="fw-bold">{{ zone.provinceName }}</td>
                  <td class="text-center">${{ formatMoney(zone.baseCost) }}</td>
                  <td class="text-center">${{ formatMoney(zone.costPerExtraKg) }}</td>
                  <td class="text-center">{{ zone.freeShippingThreshold ? '$' + formatMoney(zone.freeShippingThreshold) : '—' }}</td>
                  <td class="text-center">{{ zone.estimatedDays }} días</td>
                  <td class="text-center">
                    <span class="badge" :class="zone.active ? 'badge-green' : 'badge-neutral'">{{ zone.active ? 'Sí' : 'No' }}</span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-secondary btn-icon" @click="openEditModal(zone)" :aria-label="`Editar zona ${zone.provinceName}`">✎</button>
                    <button class="btn btn-sm btn-danger btn-icon" @click="handleDelete(zone)" :aria-label="`Eliminar zona ${zone.provinceName}`">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal crear/editar -->
      <div v-if="modal.show" class="tac-modal-overlay" @click.self="closeModal">
        <div class="tac-modal" role="dialog" aria-modal="true" aria-labelledby="zone-modal-title">
          <div class="tac-modal-header">
            <h4 id="zone-modal-title">{{ modal.editing ? '✎ Editar zona' : '+ Nueva zona' }}</h4>
            <button class="btn-close" @click="closeModal" :disabled="isProcessing" aria-label="Cerrar">✕</button>
          </div>
          <form @submit.prevent="handleSave">
            <div class="tac-modal-body">
              <div class="form-group mb-2">
                <label for="zone-province">Provincia *</label>
                <input id="zone-province" v-model.trim="form.provinceName" class="form-control" required :disabled="isProcessing" />
              </div>
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <div class="form-group">
                    <label for="zone-base-cost">Costo base *</label>
                    <input id="zone-base-cost" v-model.number="form.baseCost" type="number" min="0" class="form-control" required :disabled="isProcessing" />
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-group">
                    <label for="zone-extra-kg-cost">Costo por kg extra *</label>
                    <input id="zone-extra-kg-cost" v-model.number="form.costPerExtraKg" type="number" min="0" class="form-control" required :disabled="isProcessing" />
                  </div>
                </div>
              </div>
              <div class="row g-2 mb-2">
                <div class="col-6">
                  <div class="form-group">
                    <label for="zone-free-threshold">Envío gratis desde ($)</label>
                    <input id="zone-free-threshold" v-model.number="form.freeShippingThreshold" type="number" min="0" class="form-control" placeholder="Sin mínimo" :disabled="isProcessing" />
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-group">
                    <label for="zone-estimated-days">Días estimados *</label>
                    <input id="zone-estimated-days" v-model.trim="form.estimatedDays" class="form-control" placeholder="ej: 3-5" required :disabled="isProcessing" />
                  </div>
                </div>
              </div>
              <div class="form-check">
                <input v-model="form.active" type="checkbox" id="zone-active" class="form-check-input" :disabled="isProcessing" />
                <label for="zone-active" class="form-check-label">Zona activa</label>
              </div>
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
import { getAllZones, addZone, editZone, deleteZone } from '../../services/shippingZoneService'

export default {
  name: 'ShippingZones',
  components: { BaseLayout },
  data() {
    return {
      zones: [], isLoading: true, isProcessing: false,
      modal: { show: false, editing: false, id: null },
      form: { provinceName: '', baseCost: '', costPerExtraKg: '', freeShippingThreshold: null, estimatedDays: '', active: true },
      toast: { show: false, type: 'success', message: '' }
    }
  },
  computed: {
    canSave() {
      return this.form.provinceName && this.form.baseCost >= 0 && this.form.costPerExtraKg >= 0 && this.form.estimatedDays
    }
  },
  async mounted() {
    this.isLoading = true
    try { this.zones = (await getAllZones()).data }
    catch { this.showToast('error', 'Error al cargar zonas') }
    finally { this.isLoading = false }
    document.addEventListener('keydown', this.handleEsc)
  },
  unmounted() {
    document.removeEventListener('keydown', this.handleEsc)
  },
  methods: {
    handleEsc(e) { if (e.key === 'Escape' && this.modal.show) this.closeModal() },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    openCreateModal() {
      this.form = { provinceName: '', baseCost: '', costPerExtraKg: '', freeShippingThreshold: null, estimatedDays: '', active: true }
      this.modal = { show: true, editing: false, id: null }
    },
    openEditModal(zone) {
      this.form = { ...zone }
      this.modal = { show: true, editing: true, id: zone.id }
    },
    closeModal() { if (!this.isProcessing) this.modal.show = false },
    async handleSave() {
      this.isProcessing = true
      try {
        const payload = { ...this.form, id: this.modal.id }
        if (this.modal.editing) { await editZone(payload); this.showToast('success', 'Zona actualizada') }
        else { await addZone(payload); this.showToast('success', 'Zona creada') }
        this.zones = (await getAllZones()).data
        this.modal.show = false
      } catch (e) {
        this.showToast('error', e.response?.data?.message || 'Error al guardar')
      } finally {
        this.isProcessing = false
      }
    },
    async handleDelete(zone) {
      if (!confirm(`¿Eliminar la zona "${zone.provinceName}"?`)) return
      try {
        await deleteZone(zone.id)
        this.zones = this.zones.filter(z => z.id !== zone.id)
        this.showToast('success', 'Zona eliminada')
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

@media (max-width: 480px) {
  .tac-toast { left: 1rem; right: 1rem; bottom: 1rem; text-align: center; }
}
</style>
