<template>
  <BaseLayout>
    <div class="fade-in">
      <div class="page-header">
        <h2 class="page-title"><span class="page-title-icon">◉</span> Ventas</h2>
        <div class="topbar-time-display">{{ currentDateTime }}</div>
      </div>

      <!-- ── TABS ──────────────────────────────────────── -->
      <div class="tac-tabs mb-3" role="tablist">
        <button class="tac-tab" role="tab" :aria-selected="activeTab === 'sales'" :class="{ active: activeTab === 'sales' }" @click="activeTab = 'sales'">
          ◉ Ventas
        </button>
        <button class="tac-tab" role="tab" :aria-selected="activeTab === 'pending'" :class="{ active: activeTab === 'pending' }" @click="switchToPending">
          ⏳ Pendientes
          <span v-if="pendingSales.length" class="tab-count tab-count-amber">{{ pendingSales.length }}</span>
        </button>
      </div>

      <!-- ── PESTAÑA: VENTAS ────────────────────────────── -->
      <div v-show="activeTab === 'sales'">

      <!-- ── FORMULARIO NUEVA VENTA ─────────────────────── -->
      <div class="tac-card mb-3">
        <div class="tac-card-header">
          <h5>Nueva Venta</h5>
          <button type="button" class="btn btn-sm btn-secondary" @click="resetSaleForm" :disabled="isProcessing"><span aria-hidden="true">✕</span> Limpiar</button>
        </div>
        <div class="tac-card-body">
          <div class="row g-2 mb-3">
            <div class="col-md-3">
              <div class="form-group">
                <label for="sale-customer-name">Cliente *</label>
                <input id="sale-customer-name" v-model.trim="saleForm.customerName" class="form-control"
                  :class="{ 'is-invalid': errors.customerName }" placeholder="Nombre del cliente"
                  :aria-describedby="errors.customerName ? 'sale-customer-name-error' : null" />
                <span v-if="errors.customerName" id="sale-customer-name-error" class="invalid-feedback">{{ errors.customerName }}</span>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label for="sale-customer-id">DNI / CUIT</label>
                <input id="sale-customer-id" v-model.trim="saleForm.customerIdentification" class="form-control" placeholder="Identificación" />
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="sale-observations">Observaciones</label>
                <input id="sale-observations" v-model.trim="saleForm.observations" class="form-control" placeholder="Notas..." />
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label for="sale-payment-method">Medio de Pago *</label>
                <select id="sale-payment-method" v-model="saleForm.paymentMethod" class="form-select">
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA">💳 Tarjeta</option>
                  <option value="TRANSFERENCIA">📲 Transferencia</option>
                </select>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label for="sale-discount">Descuento ($)</label>
                <div class="input-group">
                  <span class="input-group-text" aria-hidden="true">$</span>
                  <input id="sale-discount" v-model.number="saleForm.discount" type="number" min="0" step="0.01" class="form-control" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div class="col-md-1 d-flex align-items-end">
              <button type="button" class="btn btn-primary w-100 btn-lg" @click="handleCreateSale"
                :disabled="!canSubmitSale || isProcessing" aria-label="Registrar venta">
                <span v-if="isProcessing" class="spinner spinner-sm"></span>
                <span v-else aria-hidden="true">✓</span>
              </button>
            </div>
          </div>

          <!-- Agregar ítems -->
          <div class="section-form mb-2">
            <div class="section-form-label">Agregar ítem</div>
            <div class="row g-2 align-items-end">
              <div class="col-md-3">
                <div class="form-group">
                  <label id="item-product-label" for="item-product-search">Producto *</label>
                  <div class="autocomplete-wrap">
                    <input
                      id="item-product-search"
                      v-model="productSearch"
                      class="form-control"
                      placeholder="Buscar producto..."
                      :disabled="isProcessing"
                      autocomplete="off"
                      role="combobox"
                      aria-autocomplete="list"
                      :aria-expanded="showProductDropdown && filteredProducts.length > 0"
                      aria-controls="item-product-listbox"
                      @focus="showProductDropdown = true"
                      @blur="onProductBlur"
                      @input="showProductDropdown = true; itemForm.productId = ''"
                    />
                    <div v-if="showProductDropdown && filteredProducts.length" id="item-product-listbox" class="autocomplete-dropdown" role="listbox" aria-labelledby="item-product-label">
                      <div v-for="p in filteredProducts" :key="p.id" class="autocomplete-item" role="option" @mousedown.prevent="selectProduct(p)">
                        {{ p.name }}
                      </div>
                    </div>
                    <div v-else-if="showProductDropdown && productSearch && !filteredProducts.length" class="autocomplete-dropdown">
                      <div class="autocomplete-empty">Sin resultados</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label for="item-size">Talle</label>
                  <select id="item-size" v-model.number="itemForm.sizeId" class="form-select" :disabled="isProcessing">
                    <option value="">Sin talle</option>
                    <option v-for="s in sizes" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label for="item-quantity">Cantidad *
                    <span v-if="itemForm.deliverNow && currentStockAvailable !== null" style="color:var(--text-muted)">(Stock: {{ currentStockAvailable }})</span>
                  </label>
                  <input id="item-quantity" v-model.number="itemForm.quantity" type="number" min="1"
                    :max="itemForm.deliverNow ? (currentStockAvailable || undefined) : undefined"
                    class="form-control" placeholder="1"
                    :disabled="!itemForm.productId || isProcessing" />
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label for="item-unit-price">Precio unit. *</label>
                  <div class="input-group">
                    <span class="input-group-text" aria-hidden="true">$</span>
                    <input id="item-unit-price" v-model.number="itemForm.unitPrice" type="number" min="0" step="0.01" class="form-control" placeholder="0.00" :disabled="isProcessing" />
                  </div>
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label id="item-subtotal-label">Subtotal</label>
                  <div class="subtotal-display" role="status" aria-labelledby="item-subtotal-label">${{ itemSubtotal }}</div>
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label id="item-delivery-label">Entrega</label>
                  <button type="button"
                    class="btn w-100"
                    :class="itemForm.deliverNow ? 'btn-success-soft' : 'btn-warning-soft'"
                    @click="itemForm.deliverNow = !itemForm.deliverNow"
                    :disabled="isProcessing"
                    :aria-pressed="itemForm.deliverNow"
                    aria-labelledby="item-delivery-label">
                    {{ itemForm.deliverNow ? '✓ Ahora' : '⏳ Pendiente' }}
                  </button>
                </div>
              </div>
              <div class="col-md-1">
                <button type="button" class="btn btn-primary w-100" @click="handleAddItem" :disabled="!canAddItem || isProcessing" aria-label="Agregar ítem">+</button>
              </div>
            </div>
          </div>

          <!-- Items table -->
          <div v-if="saleForm.items.length > 0" class="table-responsive">
            <table class="tac-table">
              <thead>
                <tr>
                  <th scope="col">Producto</th><th scope="col">Talle</th>
                  <th scope="col" class="text-center">Cant.</th>
                  <th scope="col" class="text-end">Precio</th>
                  <th scope="col" class="text-end">Subtotal</th>
                  <th scope="col" class="text-center">Entrega</th>
                  <th scope="col" class="text-center" style="width:60px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in saleForm.items" :key="idx">
                  <td class="fw-bold">{{ getProductName(item.productId) }}</td>
                  <td><span class="chip">{{ getSizeName(item.sizeId) }}</span></td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-end">${{ item.unitPrice.toFixed(2) }}</td>
                  <td class="text-end fw-bold">${{ (item.quantity * item.unitPrice).toFixed(2) }}</td>
                  <td class="text-center">
                    <button type="button"
                      class="btn btn-sm"
                      :class="item.deliverNow !== false ? 'btn-success-soft' : 'btn-warning-soft'"
                      @click="item.deliverNow = !item.deliverNow"
                      :disabled="isProcessing"
                      :aria-pressed="item.deliverNow !== false"
                      :aria-label="`Entrega de ${getProductName(item.productId)}`">
                      {{ item.deliverNow !== false ? '✓ Ahora' : '⏳ Pendiente' }}
                    </button>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-danger btn-icon" @click="removeItem(idx)" :disabled="isProcessing" :aria-label="`Quitar ${getProductName(item.productId)}`">✕</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr v-if="saleForm.discount > 0">
                  <td colspan="4" class="text-end" style="color:var(--text-muted)">Subtotal:</td>
                  <td class="text-end">${{ subtotal.toFixed(2) }}</td><td></td>
                </tr>
                <tr v-if="saleForm.discount > 0">
                  <td colspan="4" class="text-end text-danger">Descuento:</td>
                  <td class="text-end text-danger">-${{ saleForm.discount.toFixed(2) }}</td><td></td>
                </tr>
                <tr>
                  <td colspan="4" class="text-end"><h5 class="mb-0">Total:</h5></td>
                  <td class="text-end"><h5 class="mb-0 text-success">${{ total.toFixed(2) }}</h5></td><td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div v-else class="tac-alert tac-alert-info">Sin ítems. Agregá al menos un producto para continuar.</div>
        </div>
      </div>

      <!-- ── HISTORIAL ──────────────────────────────────── -->
      <div class="tac-card">
        <div class="tac-card-header">
          <h5>Historial de Ventas</h5>
          <span class="badge badge-neutral">{{ salesSummary }}</span>
        </div>
        <div class="tac-card-body">
          <!-- Filtros -->
          <div class="row g-2 mb-3">
            <div class="col-md-3">
              <div class="form-group">
                <label for="sales-filter-period">Período</label>
                <select id="sales-filter-period" v-model="salesFilters.timeFilter" class="form-select form-select-sm" @change="fetchSales">
                  <option value="today">Hoy</option>
                  <option value="all">Todas</option>
                  <option value="byDate">Fecha específica</option>
                </select>
              </div>
            </div>
            <div v-if="salesFilters.timeFilter === 'byDate'" class="col-md-3">
              <div class="form-group">
                <label for="sales-filter-date">Fecha</label>
                <input id="sales-filter-date" type="date" v-model="salesFilters.specificDate" class="form-control form-control-sm" @change="fetchSales" />
              </div>
            </div>
            <div class="col-md-3">
              <div class="form-group">
                <label for="sales-search-type">Buscar por</label>
                <select id="sales-search-type" v-model="salesFilters.searchType" class="form-select form-select-sm">
                  <option value="">Sin filtro</option>
                  <option value="name">Nombre cliente</option>
                  <option value="identification">Identificación</option>
                  <option value="date">Fecha</option>
                </select>
              </div>
            </div>
            <div v-if="salesFilters.searchType" class="col-md-3">
              <div class="form-group">
                <label for="sales-search-value">Valor</label>
                <input v-if="salesFilters.searchType !== 'date'"
                  id="sales-search-value"
                  v-model="salesFilters.searchValue" class="form-control form-control-sm"
                  :placeholder="salesFilters.searchType === 'name' ? 'Nombre...' : 'DNI/CUIT...'"
                  @keyup.enter="handleSearch" />
                <input v-else id="sales-search-value" type="date" v-model="salesFilters.searchValue" class="form-control form-control-sm" @change="handleSearch" />
              </div>
            </div>
            <div class="col-md-auto d-flex align-items-end gap-2">
              <button class="btn btn-sm btn-primary" @click="handleSearch" :disabled="!salesFilters.searchType || !salesFilters.searchValue || isLoading">Buscar</button>
              <button v-if="salesFilters.searchType" class="btn btn-sm btn-secondary" @click="handleResetSearch" :disabled="isLoading" aria-label="Limpiar búsqueda">✕</button>
            </div>
          </div>

          <div v-if="isLoading" class="empty-state">
            <div class="spinner" style="margin:0 auto 1rem"></div>
            <p>Cargando...</p>
          </div>

          <div v-else-if="sales.length > 0" class="table-responsive">
            <table class="tac-table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th><th scope="col">Cliente</th><th scope="col">ID</th>
                  <th scope="col">Pago</th>
                  <th scope="col" class="text-end">Total</th><th scope="col">Observ.</th>
                  <th scope="col">Ítems</th><th scope="col" class="text-center" style="width:90px">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sale in sales" :key="sale.id">
                  <td style="white-space:nowrap"><small>{{ formatDateTime(sale.saleDate) }}</small></td>
                  <td class="fw-bold">{{ sale.customerName }}</td>
                  <td>
                    <span v-if="sale.customerIdentification" class="badge badge-steel">{{ sale.customerIdentification }}</span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td><span class="payment-badge" :class="paymentClass(sale.paymentMethod)">{{ paymentLabel(sale.paymentMethod) }}</span></td>
                  <td class="text-end fw-bold text-success">${{ sale.total?.toFixed(2) }}</td>
                  <td><small class="text-muted">{{ sale.observations || '—' }}</small></td>
                  <td>
                    <details>
                      <summary class="summary-trigger">
                        {{ sale.items?.length || 0 }} ítem(s)
                        <span v-if="hasPendingItems(sale)" class="pending-dot" title="Tiene entregas pendientes" aria-label="Tiene entregas pendientes">⏳</span>
                      </summary>
                      <div class="items-detail">
                        <div v-for="item in sale.items" :key="item.id" class="item-detail-row">
                          <span class="fw-bold">{{ item.product?.name || 'N/A' }}</span>
                          <span v-if="item.size?.name" class="chip">{{ item.size.name }}</span>
                          <span class="text-muted">×{{ item.quantity }}</span>
                          <span>${{ item.unitPrice.toFixed(2) }}</span>
                          <span class="delivery-badge" :class="item.deliveryStatus === 'PENDIENTE' ? 'delivery-pending' : 'delivery-done'">
                            {{ item.deliveryStatus === 'PENDIENTE' ? '⏳ Pendiente' : '✓ Entregado' }}
                          </span>
                          <button v-if="item.deliveryStatus === 'PENDIENTE'"
                            class="btn btn-sm btn-success-soft"
                            style="padding:.15rem .5rem;font-size:.72rem"
                            @click.stop="handleDeliverItem(item, sale)"
                            :disabled="isProcessing">
                            Entregar
                          </button>
                        </div>
                      </div>
                    </details>
                  </td>
                  <td class="text-center">
                    <div class="d-flex justify-content-center gap-1">
                      <button class="btn btn-sm btn-warning btn-icon" @click="startEditSale(sale)" :disabled="isProcessing" title="Editar" :aria-label="`Editar venta de ${sale.customerName}`">✎</button>
                      <button class="btn btn-sm btn-danger btn-icon"  @click="handleDeleteSale(sale)" :disabled="isProcessing" title="Eliminar venta" :aria-label="`Eliminar venta de ${sale.customerName}`">🗑</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-state">
            <div class="empty-state-icon">◉</div>
            <p>Sin ventas para mostrar</p>
          </div>
        </div>
      </div>

      </div> <!-- fin pestaña ventas -->

      <!-- ── PESTAÑA: PENDIENTES ────────────────────────── -->
      <div v-show="activeTab === 'pending'">
        <div v-if="isPendingLoading" class="empty-state">
          <div class="spinner" style="margin:0 auto 1rem"></div>
          <p>Cargando pendientes...</p>
        </div>

        <div v-else-if="pendingSales.length === 0" class="empty-state">
          <div class="empty-state-icon" style="color:var(--amber-light)">⏳</div>
          <p>Sin entregas pendientes</p>
        </div>

        <div v-else>
          <div v-for="sale in pendingSales" :key="sale.id" class="pending-sale-card mb-3">
            <!-- Header de la venta -->
            <div class="pending-sale-header">
              <div class="d-flex align-items-center gap-3">
                <span class="pending-sale-customer">{{ sale.customerName }}</span>
                <span v-if="sale.customerIdentification" class="badge badge-steel">{{ sale.customerIdentification }}</span>
                <span class="payment-badge" :class="paymentClass(sale.paymentMethod)">{{ paymentLabel(sale.paymentMethod) }}</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <small class="text-muted">{{ formatDateTime(sale.saleDate) }}</small>
                <span class="pending-sale-total">${{ sale.total?.toFixed(2) }}</span>
                <span class="badge badge-neutral">
                  {{ sale.items.filter(i => i.deliveryStatus === 'PENDIENTE').length }} pendiente(s)
                </span>
              </div>
            </div>

            <!-- Tabla de ítems -->
            <div class="table-responsive">
              <table class="tac-table">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">Talle</th>
                    <th scope="col" class="text-center">Cant.</th>
                    <th scope="col" class="text-end">Precio</th>
                    <th scope="col" class="text-center">Estado</th>
                    <th scope="col" class="text-center" style="width:110px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in sale.items" :key="item.id"
                    :class="item.deliveryStatus === 'PENDIENTE' ? 'pending-item-row' : 'delivered-item-row'">
                    <td class="fw-bold">{{ item.product?.name || 'N/A' }}</td>
                    <td><span v-if="item.size?.name" class="chip">{{ item.size.name }}</span><span v-else class="text-muted">—</span></td>
                    <td class="text-center">{{ item.quantity }}</td>
                    <td class="text-end">${{ item.unitPrice?.toFixed(2) }}</td>
                    <td class="text-center">
                      <span class="delivery-badge" :class="item.deliveryStatus === 'PENDIENTE' ? 'delivery-pending' : 'delivery-done'">
                        {{ item.deliveryStatus === 'PENDIENTE' ? '⏳ Pendiente' : '✓ Entregado' }}
                      </span>
                    </td>
                    <td class="text-center">
                      <button v-if="item.deliveryStatus === 'PENDIENTE'"
                        class="btn btn-sm btn-success-soft"
                        @click="handleDeliverItem(item, sale)"
                        :disabled="isProcessing">
                        <span v-if="isProcessing" class="spinner spinner-sm"></span>
                        <span v-else>✓ Entregar</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="sale.observations" class="pending-sale-obs">
              <small class="text-muted">Obs: {{ sale.observations }}</small>
            </div>
          </div>
        </div>
      </div> <!-- fin pestaña pendientes -->

      <!-- ── MODAL CONFIRMAR ELIMINACIÓN ───────────────── -->
      <div v-if="deleteModal.show" class="tac-modal-overlay" @click.self="closeDeleteModal">
        <div class="tac-modal" style="max-width:420px" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div class="tac-modal-header" style="border-left: 3px solid var(--red)">
            <h4 id="delete-modal-title" style="color:var(--red-light)">🗑 Eliminar Venta</h4>
            <button class="btn-close" @click="closeDeleteModal" :disabled="isProcessing" aria-label="Cerrar">✕</button>
          </div>
          <div class="tac-modal-body">
            <div class="tac-alert tac-alert-danger mb-3">
              Esta acción <strong>no se puede deshacer</strong>. El stock de los productos vendidos será restaurado automáticamente.
            </div>
            <div class="delete-detail">
              <div class="delete-detail-row">
                <span>Cliente</span>
                <strong>{{ deleteModal.sale?.customerName }}</strong>
              </div>
              <div class="delete-detail-row">
                <span>Total</span>
                <strong class="text-success">${{ deleteModal.sale?.total?.toFixed(2) }}</strong>
              </div>
              <div class="delete-detail-row">
                <span>Fecha</span>
                <strong>{{ formatDateTime(deleteModal.sale?.saleDate) }}</strong>
              </div>
              <div class="delete-detail-row">
                <span>Ítems</span>
                <strong>{{ deleteModal.sale?.items?.length || 0 }} producto(s)</strong>
              </div>
            </div>
          </div>
          <div class="tac-modal-footer">
            <button class="btn btn-secondary" @click="closeDeleteModal" :disabled="isProcessing">Cancelar</button>
            <button class="btn btn-danger" @click="confirmDeleteSale" :disabled="isProcessing">
              <span v-if="isProcessing" class="spinner spinner-sm"></span>
              <span v-else>Confirmar Eliminación</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── MODAL EDITAR VENTA ─────────────────────────── -->
      <div v-if="editModal.show" class="tac-modal-overlay" @click.self="cancelEdit">
        <div class="tac-modal tac-modal-lg" role="dialog" aria-modal="true" aria-labelledby="edit-sale-modal-title">
          <div class="tac-modal-header">
            <h4 id="edit-sale-modal-title">✎ Editar Venta #{{ editModal.sale?.id }}</h4>
            <button class="btn-close" @click="cancelEdit" :disabled="isProcessing" aria-label="Cerrar">✕</button>
          </div>
          <form @submit.prevent="handleSaveEdit" style="display:flex; flex-direction:column; flex:1; overflow:hidden; min-height:0;">
            <div class="tac-modal-body">
              <div class="row g-2 mb-3">
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="edit-sale-customer-name">Cliente *</label>
                    <input id="edit-sale-customer-name" v-model.trim="editModal.sale.customerName" class="form-control form-control-sm" required :disabled="isProcessing" />
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="edit-sale-customer-id">Identificación</label>
                    <input id="edit-sale-customer-id" v-model.trim="editModal.sale.customerIdentification" class="form-control form-control-sm" :disabled="isProcessing" />
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="edit-sale-observations">Observaciones</label>
                    <input id="edit-sale-observations" v-model.trim="editModal.sale.observations" class="form-control form-control-sm" :disabled="isProcessing" />
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="edit-sale-payment-method">Medio de Pago</label>
                    <select id="edit-sale-payment-method" v-model="editModal.sale.paymentMethod" class="form-select form-select-sm" :disabled="isProcessing">
                      <option value="EFECTIVO">💵 Efectivo</option>
                      <option value="TARJETA">💳 Tarjeta</option>
                      <option value="TRANSFERENCIA">📲 Transferencia</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="form-group">
                    <label for="edit-sale-discount">Descuento ($)</label>
                    <div class="input-group">
                      <span class="input-group-text" aria-hidden="true">$</span>
                      <input id="edit-sale-discount" v-model.number="editModal.sale.discount" type="number" min="0" step="0.01" class="form-control form-control-sm" :disabled="isProcessing" />
                    </div>
                  </div>
                </div>
              </div>

              <hr class="divider" />

              <div class="section-form-label mb-2">Ítems</div>
              <div class="table-responsive mb-3">
                <table class="tac-table">
                  <thead>
                    <tr><th scope="col">Producto</th><th scope="col">Talle</th><th scope="col">Cant.</th><th scope="col">Precio</th><th scope="col" class="text-end">Subtotal</th><th scope="col"></th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in editModal.sale.items" :key="idx">
                      <td>
                        <select v-model.number="item.productId" class="form-select form-select-sm" aria-label="Producto" :disabled="isProcessing">
                          <option value="" disabled>Seleccionar</option>
                          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                      </td>
                      <td>
                        <select v-model.number="item.sizeId" class="form-select form-select-sm" aria-label="Talle" :disabled="isProcessing">
                          <option value="">Sin talle</option>
                          <option v-for="s in sizes" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                      </td>
                      <td><input v-model.number="item.quantity" type="number" min="1" class="form-control form-control-sm" style="width:70px" aria-label="Cantidad" :disabled="isProcessing" /></td>
                      <td>
                        <div class="input-group" style="width:120px">
                          <span class="input-group-text" aria-hidden="true">$</span>
                          <input v-model.number="item.unitPrice" type="number" min="0" step="0.01" class="form-control form-control-sm" aria-label="Precio unitario" :disabled="isProcessing" />
                        </div>
                      </td>
                      <td class="text-end">${{ (item.quantity * item.unitPrice).toFixed(2) }}</td>
                      <td><button type="button" class="btn btn-sm btn-danger btn-icon" @click="removeEditItem(idx)" :disabled="isProcessing" aria-label="Quitar ítem">✕</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Agregar ítem en edición -->
              <div class="section-form mb-3">
                <div class="section-form-label mb-2">Agregar ítem</div>
                <div class="row g-2 align-items-end">
                  <div class="col-md-4">
                    <select v-model.number="editModal.newItem.productId" class="form-select form-select-sm" aria-label="Producto nuevo" :disabled="isProcessing">
                      <option value="" disabled>Producto</option>
                      <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <select v-model.number="editModal.newItem.sizeId" class="form-select form-select-sm" aria-label="Talle nuevo" :disabled="isProcessing">
                      <option value="">Sin talle</option>
                      <option v-for="s in sizes" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <input v-model.number="editModal.newItem.quantity" type="number" min="1" class="form-control form-control-sm" placeholder="Cant." aria-label="Cantidad nueva" :disabled="isProcessing" />
                  </div>
                  <div class="col-md-2">
                    <div class="input-group">
                      <span class="input-group-text" aria-hidden="true">$</span>
                      <input v-model.number="editModal.newItem.unitPrice" type="number" min="0" step="0.01" class="form-control form-control-sm" placeholder="Precio" aria-label="Precio nuevo" :disabled="isProcessing" />
                    </div>
                  </div>
                  <div class="col-md-2">
                    <button type="button" class="btn btn-secondary btn-sm w-100" @click="handleAddEditItem" :disabled="!canAddEditItem || isProcessing">+ Agregar</button>
                  </div>
                </div>
              </div>

              <div class="totals-box">
                <div class="total-row"><span>Subtotal</span><strong>${{ editSubtotal.toFixed(2) }}</strong></div>
                <div v-if="editModal.sale.discount > 0" class="total-row text-danger">
                  <span>Descuento</span><strong>-${{ editModal.sale.discount.toFixed(2) }}</strong>
                </div>
                <hr class="divider" style="margin:.5rem 0">
                <div class="total-row total-final"><span>Total</span><strong class="text-success">${{ editTotal.toFixed(2) }}</strong></div>
              </div>
            </div>
            <div class="tac-modal-footer">
              <button type="button" class="btn btn-secondary" @click="cancelEdit" :disabled="isProcessing">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="!canSaveEdit || isProcessing">
                <span v-if="isProcessing" class="spinner spinner-sm"></span>
                <span v-else>Guardar Cambios</span>
              </button>
            </div>
          </form>
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
import BaseLayout from '@/components/BaseLayout.vue'
import { getAllSales, getTodaySales, getSalesByDate, createSale, searchSalesByName, searchSalesByIdentification, updateSale, deleteSale, deliverItem, getPendingSales } from '@/services/saleService'
import { getAllProducts } from '@/services/productService'
import { getAllSizes }    from '@/services/sizeService'
import { getAllStock }    from '@/services/stockService'

export default {
  name: 'Sales',
  components: { BaseLayout },
  data() {
    return {
      activeTab: 'sales',
      sales: [], products: [], sizes: [], stock: [],
      pendingSales: [], isPendingLoading: false,
      saleForm: { customerName: '', customerIdentification: '', observations: '', discount: 0, paymentMethod: 'EFECTIVO', items: [] },
      itemForm: { productId: '', sizeId: '', quantity: 1, unitPrice: 0, deliverNow: true },
      productSearch: '', showProductDropdown: false,
      salesFilters: { timeFilter: 'today', specificDate: '', searchType: '', searchValue: '' },
      editModal: { show: false, sale: null, originalSale: null, newItem: { productId: '', sizeId: '', quantity: 1, unitPrice: 0 } },
      deleteModal: { show: false, sale: null },
      isLoading: false, isProcessing: false,
      errors: {},
      currentDateTime: '',
      toast: { show: false, type: 'success', message: '' }
    }
  },
  computed: {
    filteredProducts() {
      const q = this.productSearch.trim().toLowerCase()
      if (!q) return this.products.slice(0, 8)
      return this.products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8)
    },
    currentStockAvailable() {
      if (!this.itemForm.productId) return null
      return this.getStockQty(this.itemForm.productId, this.itemForm.sizeId || null)
    },
    itemSubtotal() { return ((this.itemForm.quantity || 0) * (this.itemForm.unitPrice || 0)).toFixed(2) },
    subtotal() { return this.saleForm.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) },
    total() { const r = this.subtotal - (this.saleForm.discount || 0); return r >= 0 ? r : 0 },
    canAddItem() {
      if (!this.itemForm.productId || this.itemForm.quantity <= 0 || this.itemForm.unitPrice < 0) return false
      if (this.itemForm.deliverNow && this.currentStockAvailable !== null && this.itemForm.quantity > this.currentStockAvailable) return false
      return true
    },
    canSubmitSale() {
      return this.saleForm.customerName.trim() !== '' && this.saleForm.items.length > 0 && this.total >= 0
    },
    salesSummary() {
      const t = this.sales.reduce((s, x) => s + (x.total || 0), 0)
      return `${this.sales.length} venta(s) · $${t.toFixed(0)}`
    },
    editSubtotal() {
      if (!this.editModal.sale) return 0
      return this.editModal.sale.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    },
    editTotal() { const r = this.editSubtotal - (this.editModal.sale?.discount || 0); return r >= 0 ? r : 0 },
    canAddEditItem() {
      const i = this.editModal.newItem
      return i.productId && i.quantity > 0 && i.unitPrice >= 0
    },
    canSaveEdit() {
      return this.editModal.sale && this.editModal.sale.customerName?.trim() !== '' && this.editModal.sale.items.length > 0
    }
  },
  watch: {
    'itemForm.productId'(val) {
      if (val) {
        const p = this.products.find(x => x.id === val)
        if (p) this.itemForm.unitPrice = this.saleForm.paymentMethod === 'TARJETA' ? p.price : (p.priceCash ?? p.price)
      }
    },
    'saleForm.paymentMethod'(val) {
      if (this.itemForm.productId) {
        const p = this.products.find(x => x.id === this.itemForm.productId)
        if (p) this.itemForm.unitPrice = val === 'TARJETA' ? p.price : (p.priceCash ?? p.price)
      }
      this.saleForm.items = this.saleForm.items.map(item => {
        const p = this.products.find(x => x.id === item.productId)
        if (p) return { ...item, unitPrice: val === 'TARJETA' ? p.price : (p.priceCash ?? p.price) }
        return item
      })
    },
    'salesFilters.searchValue'(val) {
      clearTimeout(this._searchTimeout)
      if (this.salesFilters.searchType) {
        if (val) {
          this._searchTimeout = setTimeout(() => this.handleSearch(), 400)
        } else {
          this.fetchSales()
        }
      }
    },
    'salesFilters.searchType'(val) {
      this.salesFilters.searchValue = ''
      if (!val) this.fetchSales()
    },
    'editModal.newItem.productId'(val) {
      if (val) {
        const p = this.products.find(x => x.id === val)
        if (p) this.editModal.newItem.unitPrice = this.editModal.sale?.paymentMethod === 'TARJETA' ? p.price : (p.priceCash ?? p.price)
      }
    }
  },
  mounted() {
    this.updateDateTime()
    setInterval(this.updateDateTime, 60000)
    this.initializeData()
    document.addEventListener('keydown', this.handleEsc)
  },
  unmounted() {
    document.removeEventListener('keydown', this.handleEsc)
  },
  methods: {
    handleEsc(e) {
      if (e.key !== 'Escape') return
      if (this.deleteModal.show) this.closeDeleteModal()
      else if (this.editModal.show) this.cancelEdit()
    },
    async initializeData() {
      this.isLoading = true
      try { await Promise.all([this.fetchProducts(), this.fetchSizes(), this.fetchStock(), this.fetchSales()]) }
      catch { this.showToast('error', 'Error al cargar datos') }
      finally { this.isLoading = false }
    },
    async fetchProducts() { this.products = (await getAllProducts()).data || [] },
    async fetchSizes()    { this.sizes    = (await getAllSizes()).data    || [] },
    async fetchStock()    { try { this.stock = (await getAllStock()).data || [] } catch { this.stock = [] } },
    async fetchSales() {
      this.isLoading = true
      try {
        const { timeFilter, specificDate } = this.salesFilters
        let r
        if (timeFilter === 'all') r = await getAllSales()
        else if (timeFilter === 'byDate' && specificDate) r = await getSalesByDate(specificDate)
        else r = await getTodaySales()
        this.sales = r.data || []
      } catch { this.showToast('error', 'Error al cargar ventas') }
      finally { this.isLoading = false }
    },
    async handleSearch() {
      if (!this.salesFilters.searchType || !this.salesFilters.searchValue) return
      this.isLoading = true
      try {
        const { searchType, searchValue } = this.salesFilters
        let r
        if (searchType === 'name')           r = await searchSalesByName(searchValue)
        else if (searchType === 'identification') r = await searchSalesByIdentification(searchValue)
        else                                  r = await getSalesByDate(searchValue)
        this.sales = r?.data || []
      } catch { this.showToast('error', 'Error en búsqueda') }
      finally { this.isLoading = false }
    },
    handleResetSearch() { this.salesFilters.searchType = ''; this.salesFilters.searchValue = ''; this.fetchSales() },

    handleAddItem() {
      const available = this.currentStockAvailable
      if (!this.itemForm.productId) { this.showToast('error', 'Seleccione un producto'); return }
      if (this.itemForm.deliverNow && available !== null && this.itemForm.quantity > available) { this.showToast('error', `Stock insuficiente (${available})`); return }
      this.saleForm.items.push({ productId: this.itemForm.productId, sizeId: this.itemForm.sizeId || null, quantity: this.itemForm.quantity, unitPrice: Number(this.itemForm.unitPrice), deliverNow: this.itemForm.deliverNow })
      this.itemForm = { productId: '', sizeId: '', quantity: 1, unitPrice: 0, deliverNow: true }
      this.productSearch = ''
      this.showToast('success', 'Ítem agregado')
    },
    removeItem(idx) { this.saleForm.items.splice(idx, 1) },

    async handleCreateSale() {
      if (!this.canSubmitSale) return
      this.isProcessing = true
      try {
        await createSale({ ...this.saleForm, paymentMethod: this.saleForm.paymentMethod, items: this.saleForm.items.map(i => ({ ...i, sizeId: i.sizeId || null, unitPrice: Number(i.unitPrice) })) })
        this.showToast('success', '¡Venta registrada!')
        this.resetSaleForm()
        await this.fetchSales(); await this.fetchStock()
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al registrar venta') }
      finally { this.isProcessing = false }
    },
    resetSaleForm() {
      this.saleForm = { customerName: '', customerIdentification: '', observations: '', discount: 0, paymentMethod: 'EFECTIVO', items: [] }
      this.itemForm = { productId: '', sizeId: '', quantity: 1, unitPrice: 0, deliverNow: true }
      this.productSearch = ''
      this.errors = {}
    },
    selectProduct(p) {
      this.itemForm.productId = p.id
      this.productSearch = p.name
      this.showProductDropdown = false
    },
    onProductBlur() {
      setTimeout(() => { this.showProductDropdown = false }, 150)
    },

    // ── DELETE ──────────────────────────────────────────
    handleDeleteSale(sale) {
      this.deleteModal = { show: true, sale }
    },
    closeDeleteModal() {
      if (!this.isProcessing) this.deleteModal = { show: false, sale: null }
    },
    async confirmDeleteSale() {
      this.isProcessing = true
      try {
        await deleteSale(this.deleteModal.sale.id)
        this.showToast('success', 'Venta eliminada correctamente')
        this.closeDeleteModal()
        await this.fetchSales()
        await this.fetchStock()
      } catch (e) {
        this.showToast('error', e.response?.data?.message || 'Error al eliminar la venta')
      } finally {
        this.isProcessing = false
      }
    },

    // ── EDIT ─────────────────────────────────────────────
    startEditSale(sale) {
      const cloned = JSON.parse(JSON.stringify(sale))
      cloned.items = (cloned.items || []).map(i => ({
        id: i.id, productId: i.product?.id ?? i.productId ?? null,
        sizeId: i.size?.id ?? i.sizeId ?? null,
        quantity: i.quantity, unitPrice: Number(i.unitPrice)
      }))
      cloned.discount = cloned.discount || 0
      cloned.paymentMethod = cloned.paymentMethod || 'EFECTIVO'
      this.editModal = { show: true, sale: cloned, originalSale: JSON.parse(JSON.stringify(sale)), newItem: { productId: '', sizeId: '', quantity: 1, unitPrice: 0 } }
    },
    cancelEdit() {
      if (!this.isProcessing && confirm('¿Descartar cambios?'))
        this.editModal = { show: false, sale: null, originalSale: null, newItem: { productId: '', sizeId: '', quantity: 1, unitPrice: 0 } }
    },
    handleAddEditItem() {
      const i = this.editModal.newItem
      if (!i.productId || i.quantity < 1) { this.showToast('error', 'Complete los campos'); return }
      this.editModal.sale.items.push({ id: null, productId: i.productId, sizeId: i.sizeId || null, quantity: i.quantity, unitPrice: Number(i.unitPrice) })
      this.editModal.newItem = { productId: '', sizeId: '', quantity: 1, unitPrice: 0 }
      this.showToast('success', 'Ítem agregado')
    },
    removeEditItem(idx) { this.editModal.sale.items.splice(idx, 1) },
    async handleSaveEdit() {
      if (!this.canSaveEdit) return
      this.isProcessing = true
      try {
        const payload = {
          id: this.editModal.sale.id,
          customerName: this.editModal.sale.customerName.trim(),
          customerIdentification: this.editModal.sale.customerIdentification?.trim() || '',
          observations: this.editModal.sale.observations?.trim() || '',
          discount: this.editModal.sale.discount || 0,
          paymentMethod: this.editModal.sale.paymentMethod || 'EFECTIVO',
          items: this.editModal.sale.items.map(i => ({ id: i.id || null, productId: i.productId, sizeId: i.sizeId || null, quantity: i.quantity, unitPrice: Number(i.unitPrice) }))
        }
        await updateSale(payload.id, payload)
        this.showToast('success', 'Venta actualizada')
        this.editModal.show = false
        await this.fetchSales(); await this.fetchStock()
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al actualizar') }
      finally { this.isProcessing = false }
    },

    // Helpers
    getStockQty(productId, sizeId) {
      const e = this.stock.find(s => s.product?.id === productId && ((sizeId == null && !s.size) || s.size?.id === sizeId))
      return e ? e.quantity : 0
    },
    getProductName(productId) { return this.products.find(p => p.id === productId)?.name || 'Desconocido' },
    getSizeName(sizeId) { if (!sizeId) return 'Sin talle'; return this.sizes.find(s => s.id === sizeId)?.name || 'Desconocido' },
    formatDateTime(d) {
      if (!d) return '—'
      return new Date(d).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    },
    updateDateTime() {
      this.currentDateTime = new Date().toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    },
    paymentLabel(method) {
      const m = { EFECTIVO: '💵 Efectivo', TARJETA: '💳 Tarjeta', TRANSFERENCIA: '📲 Transferencia' }
      return m[method] || method || '—'
    },
    paymentClass(method) {
      const c = { EFECTIVO: 'pay-cash', TARJETA: 'pay-card', TRANSFERENCIA: 'pay-transfer' }
      return c[method] || ''
    },
    async switchToPending() {
      this.activeTab = 'pending'
      await this.fetchPendingSales()
    },
    async fetchPendingSales() {
      this.isPendingLoading = true
      try {
        const res = await getPendingSales()
        this.pendingSales = res.data || []
      } catch {
        this.showToast('error', 'Error al cargar pendientes')
      } finally {
        this.isPendingLoading = false
      }
    },
    hasPendingItems(sale) {
      return sale.items?.some(i => i.deliveryStatus === 'PENDIENTE')
    },
    async handleDeliverItem(item, sale) {
      this.isProcessing = true
      try {
        await deliverItem(item.id)
        item.deliveryStatus = 'ENTREGADO'
        this.showToast('success', `"${item.product?.name}" entregado`)
        await this.fetchStock()
        // Si la venta ya no tiene pendientes, quitarla de la lista
        if (!sale.items.some(i => i.deliveryStatus === 'PENDIENTE')) {
          this.pendingSales = this.pendingSales.filter(s => s.id !== sale.id)
        }
      } catch (e) {
        this.showToast('error', e.response?.data?.message || 'Error al registrar entrega')
      } finally {
        this.isProcessing = false
      }
    },
    showToast(type, message) { this.toast = { show: true, type, message }; setTimeout(() => { this.toast.show = false }, 3200) }
  }
}
</script>

<style scoped>
.topbar-time-display {
  font-family: var(--font-display); font-size: 0.82rem;
  color: var(--text-muted); letter-spacing: 0.04em; text-transform: capitalize;
}
.section-form-label {
  font-size: .75rem; font-family: var(--font-display); letter-spacing: .06em;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: .4rem;
}
.subtotal-display {
  background: var(--bg-input); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 0.45rem 0.75rem;
  font-family: var(--font-display); font-weight: 700; color: var(--crimson-light);
}
.summary-trigger {
  cursor: pointer; color: var(--crimson-light); font-family: var(--font-display);
  font-weight: 600; font-size: 0.82rem; letter-spacing: 0.04em;
  user-select: none; list-style: none;
}
.summary-trigger::-webkit-details-marker { display: none; }
.summary-trigger::before { content: '▶ '; transition: transform .2s; display: inline-block; }
details[open] .summary-trigger::before { transform: rotate(90deg); }
.items-detail { margin-top: .5rem; display: flex; flex-direction: column; gap: .35rem; }
.item-detail-row {
  display: flex; align-items: center; gap: .5rem; font-size: .82rem;
  padding: .3rem 0; border-bottom: 1px solid var(--border);
}
.item-detail-row:last-child { border-bottom: none; }

/* Delete modal detail */
.delete-detail { display: flex; flex-direction: column; gap: 0.5rem; }
.delete-detail-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 0; border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}
.delete-detail-row:last-child { border-bottom: none; }
.delete-detail-row span { color: var(--text-muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; font-family: var(--font-display); }

/* Totals */
.totals-box {
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 1rem; max-width: 320px; margin-left: auto;
}
.total-row { display: flex; justify-content: space-between; align-items: center; padding: .2rem 0; font-size: .9rem; }
.total-final { font-size: 1.1rem; }
.total-final strong { font-family: var(--font-display); font-size: 1.3rem; }

.payment-badge {
  font-family: var(--font-display); font-weight: 700; font-size: 0.72rem;
  letter-spacing: 0.04em; padding: 0.22rem 0.55rem; border-radius: 3px;
  display: inline-flex; align-items: center; gap: 0.25rem; white-space: nowrap;
}
.pay-cash     { background: rgba(74,160,74,0.15);  color: #6db96d; border: 1px solid rgba(74,160,74,0.3); }
.pay-card     { background: rgba(58,124,165,0.15); color: #6ab4e8; border: 1px solid rgba(58,124,165,0.3); }
.pay-transfer { background: rgba(201,125,44,0.15); color: var(--amber-light); border: 1px solid rgba(201,125,44,0.3); }

/* Autocomplete */
.autocomplete-wrap { position: relative; }
.autocomplete-dropdown {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow-lg);
  max-height: 220px; overflow-y: auto; margin-top: 2px;
}
.autocomplete-item {
  padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.875rem; transition: background 0.1s;
}
.autocomplete-item:hover { background: var(--bg-hover); color: var(--crimson-light); }
.autocomplete-empty { padding: 0.5rem 0.75rem; color: var(--text-muted); font-size: 0.85rem; }

.tac-toast {
  position: fixed; bottom: 1.5rem; right: 1.5rem;
  padding: .75rem 1.25rem; border-radius: var(--radius);
  font-family: var(--font-display); font-weight: 600; font-size: .85rem;
  letter-spacing: .04em; z-index: 9999; box-shadow: var(--shadow-lg);
}
.tac-toast-success { background: var(--crimson); color: #fff; }
.tac-toast-error   { background: var(--red);     color: #fff; }
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

.btn-success-soft {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}
.btn-success-soft:hover { background: rgba(34, 197, 94, 0.22); color: #22c55e; }

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

.delivery-badge {
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
  white-space: nowrap;
}
.delivery-done    { background: rgba(34,197,94,0.1);   color: #22c55e;          border: 1px solid rgba(34,197,94,0.25); }
.delivery-pending { background: rgba(201,125,44,0.1);  color: var(--amber-light); border: 1px solid rgba(201,125,44,0.25); }

.pending-dot { margin-left: 0.3rem; font-size: 0.8rem; }

/* Tab count amber */
.tab-count-amber {
  background: rgba(201, 125, 44, 0.2);
  color: var(--amber-light);
  border: 1px solid rgba(201, 125, 44, 0.35);
}

/* Pending sale cards */
.pending-sale-card {
  background: var(--bg-card);
  border: 1px solid rgba(201, 125, 44, 0.3);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.pending-sale-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  background: rgba(201, 125, 44, 0.06);
  border-bottom: 1px solid rgba(201, 125, 44, 0.2);
}
.pending-sale-customer {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}
.pending-sale-total {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
}
.pending-item-row { background: rgba(201, 125, 44, 0.04); }
.delivered-item-row { opacity: 0.5; }
.pending-sale-obs {
  padding: 0.5rem 1.25rem;
  border-top: 1px solid var(--border);
}

@media (max-width: 700px) {
  .totals-box { max-width: 100%; }
  .item-detail-row { flex-wrap: wrap; }
}

@media (max-width: 480px) {
  .tac-toast { left: 1rem; right: 1rem; bottom: 1rem; text-align: center; }
  .pending-sale-header { align-items: flex-start; }
}
</style>
