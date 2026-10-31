<template>
  <BaseLayout>
    <div class="fade-in">
      <div class="page-header">
        <h2 class="page-title"><span class="page-title-icon">◈</span> Administración</h2>
        <div class="d-flex gap-2">
          <span class="badge badge-neutral">{{ categories.length }} categorías</span>
          <span class="badge badge-neutral">{{ products.length }} productos</span>
          <span class="badge badge-neutral">{{ sizes.length }} talles</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="empty-state">
        <div class="spinner" style="margin: 0 auto 1rem;"></div>
        <p>Cargando datos...</p>
      </div>

      <div v-else>
        <!-- Tabs -->
        <div class="tac-tabs">
          <button class="tac-tab" :class="{ active: activeTab === 'categories' }" @click="switchTab('categories')">
            ◷ Categorías <span class="tab-count">{{ categories.length }}</span>
          </button>
          <button class="tac-tab" :class="{ active: activeTab === 'products' }" @click="switchTab('products')">
            ◈ Productos <span class="tab-count">{{ products.length }}</span>
          </button>
          <button class="tac-tab" :class="{ active: activeTab === 'sizes' }" @click="switchTab('sizes')">
            ◻ Talles <span class="tab-count">{{ sizes.length }}</span>
          </button>
          <button class="tac-tab" :class="{ active: activeTab === 'users' }" @click="switchTab('users')">
            ✦ Usuarios
          </button>
        </div>

        <!-- ── CATEGORÍAS ────────────────────────────────── -->
        <div v-if="activeTab === 'categories'" class="slide-up">
          <div class="tac-card">
            <div class="tac-card-header">
              <h5>Categorías de Productos</h5>
            </div>
            <div class="tac-card-body">
              <!-- Add form -->
              <form @submit.prevent="handleAddCategory" class="section-form d-flex gap-2 align-items-end flex-wrap mb-3">
                <div class="form-group flex-1">
                  <label for="new-category-name">Nueva categoría</label>
                  <input id="new-category-name" v-model.trim="forms.category.name" class="form-control"
                    :class="{ 'is-invalid': errors.categoryName }"
                    :aria-describedby="errors.categoryName ? 'new-category-error' : null"
                    placeholder="Ej: Remeras, Anzuelos, Reels..." required :disabled="isProcessing" />
                  <span v-if="errors.categoryName" id="new-category-error" class="invalid-feedback">{{ errors.categoryName }}</span>
                </div>
                <div class="form-group">
                  <label for="new-category-parent">Dentro de</label>
                  <select id="new-category-parent" v-model.number="forms.category.parentId" class="form-select" :disabled="isProcessing">
                    <option value="">— Categoría principal —</option>
                    <option v-for="r in rootCategories" :key="r.id" :value="r.id">{{ r.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="new-category-type">Tipo de talle</label>
                  <select id="new-category-type" v-model.number="forms.category.sizeTypeId" class="form-select" :disabled="isProcessing">
                    <option value="">{{ forms.category.parentId ? 'Igual que la principal' : 'Todos los talles' }}</option>
                    <option v-for="t in sizeTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="!forms.category.name || isProcessing">
                  <span v-if="isProcessing" class="spinner spinner-sm"></span>
                  <span v-else>+ Agregar</span>
                </button>
              </form>
              <p class="text-muted small mb-3">
                El tipo de talle define qué talles se ofrecen al cargar stock o vender (ej. Anzuelos solo muestra tamaños de anzuelo).
                Las subcategorías usan el tipo de su principal si no tienen uno propio.
              </p>

              <!-- List -->
              <div v-if="categories.length === 0" class="empty-state">
                <div class="empty-state-icon">◷</div>
                <p>Sin categorías registradas</p>
              </div>

              <div v-else class="tac-card" style="border-color: var(--border)">
                <template v-for="group in categoryTree" :key="group.id">
                  <div v-for="cat in [group, ...group.children]" :key="cat.id" class="list-item" :class="{ 'category-child': cat.parent }">
                    <template v-if="editingId !== cat.id || editingType !== 'category'">
                      <div class="flex-1 d-flex align-items-center gap-2 flex-wrap">
                        <span v-if="cat.parent" class="category-branch" aria-hidden="true">└</span>
                        <span class="list-item-name" :class="{ 'fw-bold': !cat.parent }">{{ cat.name }}</span>
                        <span class="chip" :title="'Tipo de talle'">{{ sizeTypeLabel(cat) }}</span>
                        <span v-if="!cat.parent && group.children.length" class="text-muted small">{{ group.children.length }} subcategoría(s)</span>
                      </div>
                      <div class="list-item-actions">
                        <button class="btn btn-sm btn-warning btn-icon" @click="startEdit('category', cat)" :disabled="isProcessing" title="Editar" :aria-label="`Editar categoría ${cat.name}`">✎</button>
                        <button class="btn btn-sm btn-danger btn-icon"  @click="handleDelete('category', cat.id)" :disabled="isProcessing" title="Eliminar" :aria-label="`Eliminar categoría ${cat.name}`">✕</button>
                      </div>
                    </template>
                    <template v-else>
                      <div class="flex-1 d-flex gap-2 flex-wrap">
                        <input v-model.trim="editingData.name" class="form-control form-control-sm flex-1"
                          :class="{ 'is-invalid': errors.editing }" style="min-width:140px"
                          aria-label="Nombre de la categoría"
                          @keyup.enter="handleSaveEdit('category', cat.id)"
                          @keyup.esc="cancelEdit" />
                        <select v-model.number="editingData.parentId" class="form-select form-select-sm" style="width:auto" aria-label="Dentro de" :disabled="isProcessing">
                          <option value="">— Principal —</option>
                          <option v-for="r in rootCategories.filter(r => r.id !== cat.id)" :key="r.id" :value="r.id">{{ r.name }}</option>
                        </select>
                        <select v-model.number="editingData.sizeTypeId" class="form-select form-select-sm" style="width:auto" aria-label="Tipo de talle" :disabled="isProcessing">
                          <option value="">{{ editingData.parentId ? 'Igual que la principal' : 'Todos los talles' }}</option>
                          <option v-for="t in sizeTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                        <span v-if="errors.editing" class="invalid-feedback d-block">{{ errors.editing }}</span>
                      </div>
                      <div class="list-item-actions">
                        <button class="btn btn-sm btn-primary btn-icon" @click="handleSaveEdit('category', cat.id)" :disabled="isProcessing" aria-label="Guardar cambios">✓</button>
                        <button class="btn btn-sm btn-secondary btn-icon" @click="cancelEdit" :disabled="isProcessing" aria-label="Cancelar edición">✕</button>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- ── PRODUCTOS ─────────────────────────────────── -->
        <div v-else-if="activeTab === 'products'" class="slide-up">
          <div class="tac-card">
            <div class="tac-card-header">
              <h5>Productos</h5>
              <div class="d-flex gap-2 align-items-center products-toolbar">
                <div class="search-wrapper">
                  <span class="search-icon" aria-hidden="true">⌕</span>
                  <input v-model="filters.productSearch" class="form-control form-control-sm search-input"
                    placeholder="Buscar producto..." aria-label="Buscar producto" />
                  <button v-if="filters.productSearch" class="search-clear" @click="filters.productSearch = ''" aria-label="Limpiar búsqueda">✕</button>
                </div>
                <select v-if="!showArchived" v-model.number="productPageSize" class="form-select form-select-sm" style="width:auto" aria-label="Cantidad de productos por página">
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
                <button class="btn btn-sm btn-secondary text-nowrap" @click="toggleArchived" :disabled="isProcessing" :aria-pressed="showArchived">
                  {{ showArchived ? '‹ Volver a activos' : 'Ver archivados' }}
                </button>
              </div>
            </div>
            <div v-if="showArchived" class="tac-card-body">
              <p class="text-muted small mb-3">
                Productos que ya no se venden pero tienen ventas registradas. No aparecen en stock, ventas ni tienda.
                Al restaurarlos vuelven a la lista sin publicar.
              </p>
              <div v-if="loadingArchived" class="empty-state"><p>Cargando...</p></div>
              <div v-else-if="filteredArchived.length === 0" class="empty-state">
                <div class="empty-state-icon">◈</div>
                <p>{{ archivedProducts.length === 0 ? 'No hay productos archivados' : 'Sin resultados' }}</p>
              </div>
              <div v-else class="table-responsive">
                <table class="tac-table">
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col" class="text-end">💳 Tarjeta</th>
                      <th scope="col" class="text-end">💵 Efectivo</th>
                      <th scope="col">Categoría</th>
                      <th scope="col" class="text-center" style="width:130px">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="prod in filteredArchived" :key="prod.id">
                      <td class="fw-bold">{{ prod.name }}</td>
                      <td class="text-end"><span class="badge badge-crimson">${{ prod.price?.toFixed(2) }}</span></td>
                      <td class="text-end"><span class="badge badge-steel">${{ prod.priceCash?.toFixed(2) ?? '—' }}</span></td>
                      <td><span class="chip">{{ prod.category?.name || '—' }}</span></td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-primary" @click="handleRestore(prod)" :disabled="isProcessing" :aria-label="`Restaurar producto ${prod.name}`">Restaurar</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else class="tac-card-body">
              <!-- Add form -->
              <form @submit.prevent="handleAddProduct" class="section-form mb-3">
                <div class="row g-2 align-items-end">
                  <div class="col-md-3">
                    <div class="form-group">
                      <label for="new-product-name">Nombre *</label>
                      <input id="new-product-name" v-model.trim="forms.product.name" class="form-control"
                        :class="{ 'is-invalid': errors.productName }"
                        placeholder="Nombre del producto" :disabled="isProcessing" />
                      <span v-if="errors.productName" class="invalid-feedback">{{ errors.productName }}</span>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="form-group">
                      <label for="new-product-price">💳 Tarjeta *</label>
                      <div class="input-group">
                        <span class="input-group-text" aria-hidden="true">$</span>
                        <input id="new-product-price" v-model.number="forms.product.price" class="form-control"
                          :class="{ 'is-invalid': errors.productPrice }"
                          type="number" min="0" step="0.01" placeholder="0.00" :disabled="isProcessing" />
                      </div>
                      <span v-if="errors.productPrice" class="invalid-feedback d-block">{{ errors.productPrice }}</span>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="form-group">
                      <label for="new-product-price-cash">💵 Efectivo *</label>
                      <div class="input-group">
                        <span class="input-group-text" aria-hidden="true">$</span>
                        <input id="new-product-price-cash" v-model.number="forms.product.priceCash" class="form-control"
                          :class="{ 'is-invalid': errors.productPriceCash }"
                          type="number" min="0" step="0.01" placeholder="0.00" :disabled="isProcessing" />
                      </div>
                      <span v-if="errors.productPriceCash" class="invalid-feedback d-block">{{ errors.productPriceCash }}</span>
                    </div>
                  </div>
                  <div class="col-md-3">
                    <div class="form-group">
                      <label for="new-product-category">Categoría *</label>
                      <select id="new-product-category" v-model.number="forms.product.categoryId" class="form-select"
                        :class="{ 'is-invalid': errors.productCategory }" :disabled="isProcessing">
                        <option value="" disabled>Seleccionar</option>
                        <template v-for="g in categoryTree" :key="g.id">
                          <option v-if="!g.children.length" :value="g.id">{{ g.name }}</option>
                          <optgroup v-else :label="g.name">
                            <option v-for="c in g.children" :key="c.id" :value="c.id">{{ c.name }}</option>
                            <option :value="g.id">{{ g.name }} (general)</option>
                          </optgroup>
                        </template>
                      </select>
                      <span v-if="errors.productCategory" class="invalid-feedback">{{ errors.productCategory }}</span>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <button type="submit" class="btn btn-primary w-100" :disabled="!canAddProduct || isProcessing || isUploadingImage">
                      <span v-if="isProcessing" class="spinner spinner-sm"></span>
                      <span v-else>+ Agregar</span>
                    </button>
                  </div>
                </div>

                <!-- Campos de tienda online -->
                <div class="row g-2 mt-1">
                  <div class="col-md-5">
                    <div class="form-group">
                      <label for="new-product-description">Descripción (tienda online)</label>
                      <textarea id="new-product-description" v-model.trim="forms.product.description" class="form-control form-control-sm" rows="1" :disabled="isProcessing"></textarea>
                    </div>
                  </div>
                  <div class="col-12 order-last">
                    <div class="form-group">
                      <label for="new-product-images">Fotos (tienda online)</label>
                      <ImageListEditor v-model="forms.product.images" folder="products" input-id="new-product-images" :disabled="isProcessing"
                        @uploading="isUploadingImage = $event" @error="showToast('error', $event)" />
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="form-group">
                      <label for="new-product-weight">Peso (kg)</label>
                      <input id="new-product-weight" v-model.number="forms.product.weightKg" type="number" min="0" step="0.1" class="form-control form-control-sm" :disabled="isProcessing" />
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="form-check" style="margin-top:1.6rem">
                      <input v-model="forms.product.published" type="checkbox" id="product-published" class="form-check-input" :disabled="isProcessing" />
                      <label for="product-published" class="form-check-label">Publicar en tienda</label>
                    </div>
                  </div>
                </div>
              </form>

              <!-- Table -->
              <div v-if="filteredProducts.length === 0" class="empty-state">
                <div class="empty-state-icon">◈</div>
                <p>{{ products.length === 0 ? 'Sin productos' : 'Sin resultados' }}</p>
              </div>

              <div v-else class="table-responsive">
                <table class="tac-table">
                  <thead>
                    <tr>
                      <th scope="col">Producto</th>
                      <th scope="col" class="text-end">💳 Tarjeta</th>
                      <th scope="col" class="text-end">💵 Efectivo</th>
                      <th scope="col">Categoría</th>
                      <th scope="col" class="text-center" style="width:130px">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="prod in paginatedProducts" :key="prod.id">
                      <!-- View -->
                      <template v-if="editingId !== prod.id">
                        <td class="fw-bold">{{ prod.name }}</td>
                        <td class="text-end"><span class="badge badge-crimson">${{ prod.price?.toFixed(2) }}</span></td>
                        <td class="text-end"><span class="badge badge-steel">${{ prod.priceCash?.toFixed(2) ?? '—' }}</span></td>
                        <td><span class="chip">{{ prod.category?.name || '—' }}</span></td>
                      </template>
                      <!-- Edit -->
                      <td v-else colspan="4">
                        <div class="row g-2">
                          <div class="col-md-3">
                            <input v-model.trim="editingData.name" class="form-control form-control-sm" placeholder="Nombre" aria-label="Nombre del producto" :disabled="isProcessing" />
                          </div>
                          <div class="col-md-2">
                            <div class="input-group">
                              <span class="input-group-text" aria-hidden="true">$</span>
                              <input v-model.number="editingData.price" class="form-control form-control-sm" type="number" min="0" step="0.01" placeholder="Tarjeta" aria-label="Precio con tarjeta" :disabled="isProcessing" />
                            </div>
                          </div>
                          <div class="col-md-2">
                            <div class="input-group">
                              <span class="input-group-text" aria-hidden="true">$</span>
                              <input v-model.number="editingData.priceCash" class="form-control form-control-sm" type="number" min="0" step="0.01" placeholder="Efectivo" aria-label="Precio en efectivo" :disabled="isProcessing" />
                            </div>
                          </div>
                          <div class="col-md-5">
                            <select v-model.number="editingData.categoryId" class="form-select form-select-sm" aria-label="Categoría" :disabled="isProcessing">
                              <option value="" disabled>Categoría</option>
                              <template v-for="g in categoryTree" :key="g.id">
                          <option v-if="!g.children.length" :value="g.id">{{ g.name }}</option>
                          <optgroup v-else :label="g.name">
                            <option v-for="c in g.children" :key="c.id" :value="c.id">{{ c.name }}</option>
                            <option :value="g.id">{{ g.name }} (general)</option>
                          </optgroup>
                        </template>
                            </select>
                          </div>
                          <div class="col-md-5">
                            <textarea v-model.trim="editingData.description" class="form-control form-control-sm" rows="1" placeholder="Descripción" aria-label="Descripción" :disabled="isProcessing"></textarea>
                          </div>
                          <div class="col-12 order-last">
                            <ImageListEditor v-model="editingData.images" folder="products" :disabled="isProcessing || loadingEditImages"
                              @uploading="isUploadingImage = $event" @error="showToast('error', $event)" />
                          </div>
                          <div class="col-md-2">
                            <input v-model.number="editingData.weightKg" type="number" min="0" step="0.1" class="form-control form-control-sm" placeholder="Peso (kg)" aria-label="Peso en kilogramos" :disabled="isProcessing" />
                          </div>
                          <div class="col-md-2">
                            <div class="form-check" style="margin-top:.4rem">
                              <input v-model="editingData.published" type="checkbox" id="product-edit-published" class="form-check-input" :disabled="isProcessing" />
                              <label for="product-edit-published" class="form-check-label">Publicar</label>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="text-center">
                        <div class="d-flex justify-content-center gap-1">
                          <template v-if="editingId !== prod.id">
                            <button class="btn btn-sm btn-warning btn-icon" @click="startEdit('product', prod)" :disabled="isProcessing" :aria-label="`Editar producto ${prod.name}`">✎</button>
                            <button class="btn btn-sm btn-danger btn-icon"  @click="handleDeleteProduct(prod)" :disabled="isProcessing" :aria-label="`Eliminar producto ${prod.name}`">✕</button>
                          </template>
                          <template v-else>
                            <button class="btn btn-sm btn-primary btn-icon"  @click="handleSaveEdit('product', prod.id)" :disabled="isProcessing || isUploadingImage || loadingEditImages" aria-label="Guardar cambios">✓</button>
                            <button class="btn btn-sm btn-secondary btn-icon" @click="cancelEdit" :disabled="isProcessing" aria-label="Cancelar edición">✕</button>
                          </template>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Paginación -->
                <nav v-if="totalProductPages > 1" class="pagination-bar" aria-label="Paginación de productos">
                  <span class="pagination-info">
                    {{ (productPage - 1) * productPageSize + 1 }}–{{ Math.min(productPage * productPageSize, filteredProducts.length) }}
                    de {{ filteredProducts.length }} productos
                  </span>
                  <div class="pagination-controls">
                    <button class="btn btn-sm btn-secondary" @click="productPage = 1" :disabled="productPage <= 1" title="Primera" aria-label="Primera página">«</button>
                    <button class="btn btn-sm btn-secondary" @click="productPage--" :disabled="productPage <= 1" title="Anterior" aria-label="Página anterior">‹</button>
                    <span class="pagination-pages">
                      <button
                        v-for="p in pageNumbers"
                        :key="p"
                        class="btn btn-sm"
                        :class="p === productPage ? 'btn-primary' : 'btn-secondary'"
                        :aria-current="p === productPage ? 'page' : null"
                        :aria-label="`Página ${p}`"
                        @click="productPage = p"
                      >{{ p }}</button>
                    </span>
                    <button class="btn btn-sm btn-secondary" @click="productPage++" :disabled="productPage >= totalProductPages" title="Siguiente" aria-label="Página siguiente">›</button>
                    <button class="btn btn-sm btn-secondary" @click="productPage = totalProductPages" :disabled="productPage >= totalProductPages" title="Última" aria-label="Última página">»</button>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <!-- ── TALLES ────────────────────────────────────── -->
        <div v-else-if="activeTab === 'sizes'" class="slide-up">
          <!-- Tipos de talle -->
          <div class="tac-card mb-3">
            <div class="tac-card-header">
              <h5>Tipos de talle</h5>
            </div>
            <div class="tac-card-body">
              <form @submit.prevent="handleAddSizeType" class="section-form d-flex gap-2 align-items-end flex-wrap mb-3">
                <div class="form-group flex-1">
                  <label for="new-size-type-name">Nuevo tipo</label>
                  <input id="new-size-type-name" v-model.trim="forms.sizeType.name" class="form-control"
                    placeholder="Ej: Ropa, Calzado, Anzuelos, Tanzas..." :disabled="isProcessing" />
                </div>
                <button type="submit" class="btn btn-primary" :disabled="!forms.sizeType.name || isProcessing">+ Agregar</button>
              </form>
              <div class="sizes-grid">
                <div v-for="t in sizeTypes" :key="t.id" class="size-item">
                  <template v-if="editingId !== t.id || editingType !== 'sizeType'">
                    <span class="size-label">{{ t.name }}</span>
                    <span class="text-muted small">{{ sizesOfType(t.id).length }} talle(s)</span>
                    <div class="d-flex gap-1">
                      <button class="btn btn-sm btn-warning btn-icon" @click="startEdit('sizeType', t)" :disabled="isProcessing" :aria-label="`Editar tipo ${t.name}`">✎</button>
                      <button class="btn btn-sm btn-danger btn-icon"  @click="handleDelete('sizeType', t.id)" :disabled="isProcessing" :aria-label="`Eliminar tipo ${t.name}`">✕</button>
                    </div>
                  </template>
                  <template v-else>
                    <input v-model.trim="editingName" class="form-control form-control-sm" style="min-width:100px"
                      aria-label="Nombre del tipo" @keyup.enter="handleSaveEdit('sizeType', t.id)" @keyup.esc="cancelEdit" :disabled="isProcessing" />
                    <div class="d-flex gap-1">
                      <button class="btn btn-sm btn-primary btn-icon"   @click="handleSaveEdit('sizeType', t.id)" :disabled="isProcessing" aria-label="Guardar cambios">✓</button>
                      <button class="btn btn-sm btn-secondary btn-icon" @click="cancelEdit" :disabled="isProcessing" aria-label="Cancelar edición">✕</button>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div class="tac-card">
            <div class="tac-card-header">
              <h5>Talles</h5>
              <input v-model="filters.sizeSearch" class="form-control form-control-sm size-search"
                placeholder="🔍 Buscar talle..." aria-label="Buscar talle" />
            </div>
            <div class="tac-card-body">
              <!-- Add form -->
              <form @submit.prevent="handleAddSize" class="section-form d-flex gap-2 align-items-end flex-wrap mb-3">
                <div class="form-group flex-1">
                  <label for="new-size-name">Nuevo talle</label>
                  <input id="new-size-name" v-model.trim="forms.size.name" class="form-control"
                    :class="{ 'is-invalid': errors.sizeName }"
                    placeholder="Ej: S, M, 40, 1/0, 0.30mm..." :disabled="isProcessing" />
                  <span v-if="errors.sizeName" class="invalid-feedback">{{ errors.sizeName }}</span>
                </div>
                <div class="form-group">
                  <label for="new-size-type">Tipo</label>
                  <select id="new-size-type" v-model.number="forms.size.sizeTypeId" class="form-select" :disabled="isProcessing">
                    <option value="">Sin tipo (sirve para todo)</option>
                    <option v-for="t in sizeTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="!forms.size.name || isProcessing">
                  <span v-if="isProcessing" class="spinner spinner-sm"></span>
                  <span v-else>+ Agregar</span>
                </button>
              </form>
              <p class="text-muted small mb-3">Los talles se muestran en el orden en que se cargan: cargalos de menor a mayor.</p>

              <!-- Size chips grid, agrupados por tipo -->
              <div v-if="filteredSizes.length === 0" class="empty-state">
                <div class="empty-state-icon">◻</div>
                <p>{{ sizes.length === 0 ? 'Sin talles' : 'Sin resultados' }}</p>
              </div>

              <div v-else>
                <div v-for="group in sizeGroups" :key="group.key" class="mb-3">
                  <div class="section-form-label mb-2">{{ group.name }}</div>
                  <div class="sizes-grid">
                    <div v-for="size in group.sizes" :key="size.id" class="size-item">
                      <template v-if="editingId !== size.id || editingType !== 'size'">
                        <span class="size-label">{{ size.name }}</span>
                        <div class="d-flex gap-1">
                          <button class="btn btn-sm btn-warning btn-icon" @click="startEdit('size', size)" :disabled="isProcessing" :aria-label="`Editar talle ${size.name}`">✎</button>
                          <button class="btn btn-sm btn-danger btn-icon"  @click="handleDelete('size', size.id)" :disabled="isProcessing" :aria-label="`Eliminar talle ${size.name}`">✕</button>
                        </div>
                      </template>
                      <template v-else>
                        <input v-model.trim="editingName" class="form-control form-control-sm"
                          style="min-width:80px"
                          aria-label="Nombre del talle"
                          @keyup.enter="handleSaveEdit('size', size.id)"
                          @keyup.esc="cancelEdit" :disabled="isProcessing" />
                        <select v-model.number="editingData.sizeTypeId" class="form-select form-select-sm" aria-label="Tipo de talle" :disabled="isProcessing">
                          <option value="">Sin tipo</option>
                          <option v-for="t in sizeTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                        </select>
                        <div class="d-flex gap-1">
                          <button class="btn btn-sm btn-primary btn-icon"   @click="handleSaveEdit('size', size.id)" :disabled="isProcessing" aria-label="Guardar cambios">✓</button>
                          <button class="btn btn-sm btn-secondary btn-icon" @click="cancelEdit" :disabled="isProcessing" aria-label="Cancelar edición">✕</button>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── USUARIOS ──────────────────────────────────── -->
        <div v-if="activeTab === 'users'" class="slide-up">
          <div class="tac-card">
            <div class="tac-card-header">
              <h5>Crear Usuario</h5>
            </div>
            <div class="tac-card-body">
              <form @submit.prevent="handleAddUser" class="section-form">
                <div class="row g-2 align-items-end">
                  <div class="col-md-4">
                    <div class="form-group">
                      <label for="new-user-username">Usuario *</label>
                      <input id="new-user-username" v-model.trim="forms.user.username" class="form-control"
                        :class="{ 'is-invalid': errors.userName }"
                        placeholder="Nombre de usuario" :disabled="isProcessing" />
                      <span v-if="errors.userName" class="invalid-feedback">{{ errors.userName }}</span>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-group">
                      <label for="new-user-password">Contraseña *</label>
                      <input id="new-user-password" v-model="forms.user.password" type="password" class="form-control"
                        :class="{ 'is-invalid': errors.userPassword }"
                        placeholder="Contraseña" :disabled="isProcessing" />
                      <span v-if="errors.userPassword" class="invalid-feedback">{{ errors.userPassword }}</span>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <div class="form-group">
                      <label for="new-user-role">Rol *</label>
                      <select id="new-user-role" v-model="forms.user.role" class="form-select" :disabled="isProcessing">
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <button type="submit" class="btn btn-primary w-100"
                      :disabled="!forms.user.username || !forms.user.password || isProcessing">
                      <span v-if="isProcessing" class="spinner spinner-sm"></span>
                      <span v-else>+ Crear</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

      <!-- Toast -->
      <transition name="toast">
        <div v-if="toast.show" class="tac-toast" :class="`tac-toast-${toast.type}`" role="status" aria-live="polite">
          {{ toast.message }}
        </div>
      </transition>
    </div>
  </BaseLayout>
</template>

<script>
import BaseLayout from './BaseLayout.vue'
import { getAllCategories, addCategory, deleteCategory, editCategory } from '../services/categoryService'
import { getAllProducts, addProduct, deleteProduct, editProduct, getArchivedProducts, restoreProduct } from '../services/productService'
import { getProductImages, saveProductImages } from '../services/productImageService'
import ImageListEditor from './admin/ImageListEditor.vue'
import { getAllSizes, addSize, deleteSize, editSize } from '../services/sizeService'
import { getAllSizeTypes, saveSizeType, deleteSizeType } from '../services/sizeTypeService'
import { register } from '../services/authService'

export default {
  name: 'Admin',
  components: { BaseLayout, ImageListEditor },
  data() {
    return {
      activeTab: 'categories',
      categories: [], products: [], sizes: [], sizeTypes: [],
      forms: {
        category: { name: '', parentId: '', sizeTypeId: '' },
        sizeType: { name: '' },
        product: { name: '', price: '', priceCash: '', categoryId: '', description: '', images: [], published: false, weightKg: '' },
        size: { name: '', sizeTypeId: '' },
        user: { username: '', password: '', role: 'USER' }
      },
      editingId: null, editingType: null, editingName: '', editingData: {},
      filters: { productSearch: '', sizeSearch: '' },
      productPage: 1,
      productPageSize: 10,
      showArchived: false, archivedProducts: [], loadingArchived: false,
      isLoading: false, isProcessing: false, isUploadingImage: false, loadingEditImages: false,
      errors: {},
      toast: { show: false, type: 'success', message: '' }
    }
  },
  computed: {
    filteredProducts() {
      const s = this.filters.productSearch.toLowerCase()
      return this.products.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.category?.name || '').toLowerCase().includes(s)
      )
    },
    filteredArchived() {
      const s = this.filters.productSearch.toLowerCase()
      return this.archivedProducts.filter(p =>
        p.name.toLowerCase().includes(s) ||
        (p.category?.name || '').toLowerCase().includes(s)
      )
    },
    paginatedProducts() {
      const start = (this.productPage - 1) * this.productPageSize
      return this.filteredProducts.slice(start, start + this.productPageSize)
    },
    totalProductPages() {
      return Math.max(1, Math.ceil(this.filteredProducts.length / this.productPageSize))
    },
    pageNumbers() {
      const total = this.totalProductPages
      const current = this.productPage
      const delta = 2
      const pages = []
      for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
        pages.push(i)
      }
      return pages
    },
    filteredSizes() {
      const s = this.filters.sizeSearch.toLowerCase()
      return this.sizes.filter(sz => sz.name.toLowerCase().includes(s))
    },
    // Talles agrupados por tipo, en el orden en que se cargaron
    sizeGroups() {
      const groups = this.sizeTypes.map(t => ({ key: t.id, name: t.name, sizes: this.filteredSizes.filter(sz => sz.sizeType?.id === t.id) }))
      groups.push({ key: 'none', name: 'Sin tipo (sirve para cualquier categoría)', sizes: this.filteredSizes.filter(sz => !sz.sizeType) })
      return groups.filter(g => g.sizes.length)
    },
    rootCategories() {
      return this.categories.filter(c => !c.parent).sort((a, b) => a.name.localeCompare(b.name))
    },
    // Principales con sus subcategorías, ordenadas por nombre
    categoryTree() {
      return this.rootCategories.map(r => ({
        ...r,
        children: this.categories.filter(c => c.parent?.id === r.id).sort((a, b) => a.name.localeCompare(b.name))
      }))
    },
    canAddProduct() {
      return this.forms.product.name && this.forms.product.price >= 0 && this.forms.product.priceCash >= 0 && this.forms.product.categoryId
    }
  },
  watch: {
    'filters.productSearch'() { this.productPage = 1 },
    'productPageSize'() { this.productPage = 1 }
  },
  mounted() { this.initializeData() },
  methods: {
    async initializeData() {
      this.isLoading = true
      try { await Promise.all([this.fetchCategories(), this.fetchProducts(), this.fetchSizes(), this.fetchSizeTypes()]) }
      catch { this.showToast('error', 'Error al cargar datos') }
      finally { this.isLoading = false }
    },
    switchTab(tab) { this.activeTab = tab; this.cancelEdit(); this.errors = {} },

    async fetchCategories() { this.categories = (await getAllCategories()).data || [] },
    async fetchProducts()   { this.products   = (await getAllProducts()).data   || [] },
    async fetchSizes()      { this.sizes       = (await getAllSizes()).data      || [] },
    async fetchSizeTypes()  { this.sizeTypes   = (await getAllSizeTypes()).data  || [] },

    sizesOfType(typeId) { return this.sizes.filter(sz => sz.sizeType?.id === typeId) },
    sizeTypeLabel(cat) {
      if (cat.sizeType) return cat.sizeType.name
      const parent = cat.parent && this.categories.find(c => c.id === cat.parent.id)
      if (parent?.sizeType) return `${parent.sizeType.name} (de ${parent.name})`
      return 'Todos los talles'
    },

    async handleAddCategory() {
      if (!this.forms.category.name) { this.errors.categoryName = 'Requerido'; return }
      this.isProcessing = true
      try {
        await addCategory(this.forms.category)
        this.forms.category = { name: '', parentId: '', sizeTypeId: '' }
        await this.fetchCategories()
        this.showToast('success', 'Categoría agregada')
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al agregar') }
      finally { this.isProcessing = false }
    },

    async handleAddProduct() {
      this.errors = {}
      if (!this.forms.product.name)       { this.errors.productName = 'Requerido'; return }
      if (this.forms.product.price < 0)      { this.errors.productPrice = 'Precio inválido'; return }
      if (this.forms.product.priceCash < 0) { this.errors.productPriceCash = 'Precio inválido'; return }
      if (!this.forms.product.categoryId)   { this.errors.productCategory = 'Seleccione categoría'; return }
      this.isProcessing = true
      try {
        const { images, ...product } = this.forms.product
        const res = await addProduct({ ...product, imageUrl: images[0] || '' })
        if (images.length) await saveProductImages(res.data.id, images)
        this.forms.product = { name: '', price: '', priceCash: '', categoryId: '', description: '', images: [], published: false, weightKg: '' }
        await this.fetchProducts()
        this.showToast('success', 'Producto agregado')
      } catch { this.showToast('error', 'Error al agregar') }
      finally { this.isProcessing = false }
    },


    async handleAddSize() {
      if (!this.forms.size.name) { this.errors.sizeName = 'Requerido'; return }
      this.isProcessing = true
      try {
        await addSize(this.forms.size.name, this.forms.size.sizeTypeId || null)
        this.forms.size.name = ''
        await this.fetchSizes()
        this.showToast('success', 'Talle agregado')
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al agregar') }
      finally { this.isProcessing = false }
    },

    async handleAddSizeType() {
      if (!this.forms.sizeType.name) return
      this.isProcessing = true
      try {
        await saveSizeType({ name: this.forms.sizeType.name })
        this.forms.sizeType.name = ''
        await this.fetchSizeTypes()
        this.showToast('success', 'Tipo de talle agregado')
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al agregar') }
      finally { this.isProcessing = false }
    },

    startEdit(type, item) {
      this.editingId = item.id; this.editingType = type
      if (type === 'product') {
        this.editingData = {
          name: item.name, price: item.price, priceCash: item.priceCash, categoryId: item.category?.id || '',
          description: item.description || '', images: item.imageUrl ? [item.imageUrl] : [], published: item.published || false, weightKg: item.weightKg || ''
        }
        this.loadEditImages(item.id)
      } else if (type === 'category') {
        this.editingData = { name: item.name, parentId: item.parent?.id || '', sizeTypeId: item.sizeType?.id || '' }
      } else if (type === 'size') {
        this.editingName = item.name
        this.editingData = { sizeTypeId: item.sizeType?.id || '' }
      } else {
        this.editingName = item.name
      }
    },
    async loadEditImages(productId) {
      this.loadingEditImages = true
      try {
        const res = await getProductImages(productId)
        if (this.editingId === productId && this.editingType === 'product') this.editingData.images = res.data
      } catch {
        // Si falla, queda la portada actual y se puede seguir editando.
      } finally {
        this.loadingEditImages = false
      }
    },
    cancelEdit() { this.editingId = null; this.editingName = ''; this.editingData = {}; this.errors = {} },

    async handleSaveEdit(type, id) {
      this.isProcessing = true
      try {
        if (type === 'category') {
          if (!this.editingData.name?.trim()) { this.errors.editing = 'Requerido'; return }
          await editCategory({ id, ...this.editingData })
          await Promise.all([this.fetchCategories(), this.fetchProducts()])
        } else if (type === 'product') {
          if (!this.editingData.name || !this.editingData.price || this.editingData.priceCash == null || !this.editingData.categoryId) {
            this.showToast('error', 'Complete todos los campos'); return
          }
          const { images, ...product } = this.editingData
          await editProduct({ id, ...product, imageUrl: images[0] || '' })
          await saveProductImages(id, images)
          await this.fetchProducts()
        } else if (type === 'size') {
          if (!this.editingName.trim()) { this.errors.editing = 'Requerido'; return }
          await editSize(id, this.editingName, this.editingData.sizeTypeId || null)
          await this.fetchSizes()
        } else if (type === 'sizeType') {
          if (!this.editingName.trim()) { this.errors.editing = 'Requerido'; return }
          await saveSizeType({ id, name: this.editingName })
          await Promise.all([this.fetchSizeTypes(), this.fetchSizes(), this.fetchCategories()])
        }
        this.cancelEdit()
        this.showToast('success', 'Actualizado correctamente')
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al actualizar') }
      finally { this.isProcessing = false }
    },

    async handleDelete(type, id) {
      if (!confirm('¿Confirmar eliminación?')) return
      this.isProcessing = true
      try {
        if (type === 'category') { await deleteCategory(id); await this.fetchCategories() }
        else if (type === 'product') { await deleteProduct(id); await this.fetchProducts() }
        else if (type === 'size') { await deleteSize(id); await this.fetchSizes() }
        else if (type === 'sizeType') { await deleteSizeType(id); await this.fetchSizeTypes() }
        this.showToast('success', 'Eliminado')
      } catch (e) { this.showToast('error', e.response?.data?.message || 'Error al eliminar') }
      finally { this.isProcessing = false }
    },

    async handleDeleteProduct(prod) {
      if (!confirm(`¿Eliminar "${prod.name}"?\n\nSi tiene ventas registradas se archiva en vez de borrarse (lo podés restaurar desde "Ver archivados").`)) return
      this.isProcessing = true
      try {
        const { data } = await deleteProduct(prod.id)
        await this.fetchProducts()
        if (data?.result === 'ARCHIVED') this.showToast('success', `"${prod.name}" archivado (tiene ventas registradas)`)
        else this.showToast('success', 'Eliminado')
      } catch (e) {
        this.showToast('error', e.response?.data?.message || 'Error al eliminar')
      } finally { this.isProcessing = false }
    },

    async toggleArchived() {
      this.cancelEdit()
      this.showArchived = !this.showArchived
      if (!this.showArchived) return
      this.loadingArchived = true
      try { this.archivedProducts = (await getArchivedProducts()).data || [] }
      catch { this.showToast('error', 'Error al cargar archivados') }
      finally { this.loadingArchived = false }
    },

    async handleRestore(prod) {
      this.isProcessing = true
      try {
        await restoreProduct(prod.id)
        this.archivedProducts = this.archivedProducts.filter(p => p.id !== prod.id)
        await this.fetchProducts()
        this.showToast('success', `"${prod.name}" restaurado (sin publicar)`)
      } catch (e) {
        this.showToast('error', e.response?.data?.message || 'Error al restaurar')
      } finally { this.isProcessing = false }
    },

    async handleAddUser() {
      this.errors = {}
      if (!this.forms.user.username) { this.errors.userName = 'Requerido'; return }
      if (!this.forms.user.password) { this.errors.userPassword = 'Requerido'; return }
      this.isProcessing = true
      try {
        await register(this.forms.user.username, this.forms.user.password, this.forms.user.role)
        this.forms.user = { username: '', password: '', role: 'USER' }
        this.showToast('success', 'Usuario creado correctamente')
      } catch (e) {
        const msg = e.response?.data?.message || 'Error al crear usuario'
        this.showToast('error', msg)
      } finally {
        this.isProcessing = false
      }
    },

    showToast(type, message) {
      this.toast = { show: true, type, message }
      setTimeout(() => { this.toast.show = false }, 3200)
    }
  }
}
</script>

<style scoped>
/* Search input */
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
.search-input {
  padding-left: 1.75rem !important;
  padding-right: 1.75rem !important;
  width: 220px;
}
.search-clear {
  position: absolute;
  right: 0.4rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0;
  line-height: 1;
}
.search-clear:hover { color: var(--text-primary); }

/* Pagination */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
}
.pagination-info {
  font-family: var(--font-display);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.pagination-pages {
  display: flex;
  gap: 0.25rem;
}

.sizes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.65rem;
}

.category-child { padding-left: 2rem; }
.category-branch { color: var(--text-muted); }
.size-item {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.6rem 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  transition: border-color 0.15s;
}

.size-item:hover { border-color: var(--crimson-dark); }

.size-label {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Toast */
.tac-toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  z-index: 9999;
  box-shadow: var(--shadow-lg);
}

.tac-toast-success { background: var(--crimson); color: var(--text-primary); }
.tac-toast-error   { background: var(--red);   color: #fff; }

.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

.size-search { width: 200px; }

@media (max-width: 700px) {
  .tac-card-header { flex-wrap: wrap; gap: 0.6rem; align-items: stretch; }
  .products-toolbar { width: 100%; flex-wrap: wrap; }
  .search-wrapper, .search-input { width: 100%; }
  .size-search { width: 100%; }
}

@media (max-width: 480px) {
  .pagination-bar { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .pagination-controls { flex-wrap: wrap; }
  .tac-toast { left: 1rem; right: 1rem; bottom: 1rem; text-align: center; }
}
</style>
