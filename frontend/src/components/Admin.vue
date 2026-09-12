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
                    placeholder="Ej: Remeras, Pantalones, Calzado..." required :disabled="isProcessing" />
                  <span v-if="errors.categoryName" id="new-category-error" class="invalid-feedback">{{ errors.categoryName }}</span>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="!forms.category.name || isProcessing">
                  <span v-if="isProcessing" class="spinner spinner-sm"></span>
                  <span v-else>+ Agregar</span>
                </button>
              </form>

              <!-- List -->
              <div v-if="categories.length === 0" class="empty-state">
                <div class="empty-state-icon">◷</div>
                <p>Sin categorías registradas</p>
              </div>

              <div v-else class="tac-card" style="border-color: var(--border)">
                <div v-for="cat in categories" :key="cat.id" class="list-item">
                  <div class="flex-1">
                    <span v-if="editingId !== cat.id" class="list-item-name">{{ cat.name }}</span>
                    <input v-else v-model.trim="editingName" class="form-control form-control-sm"
                      :class="{ 'is-invalid': errors.editing }"
                      aria-label="Nombre de la categoría"
                      @keyup.enter="handleSaveEdit('category', cat.id)"
                      @keyup.esc="cancelEdit" />
                    <span v-if="errors.editing && editingId === cat.id" class="invalid-feedback d-block">{{ errors.editing }}</span>
                  </div>
                  <div class="list-item-actions">
                    <template v-if="editingId !== cat.id">
                      <button class="btn btn-sm btn-warning btn-icon" @click="startEdit('category', cat)" :disabled="isProcessing" title="Editar" :aria-label="`Editar categoría ${cat.name}`">✎</button>
                      <button class="btn btn-sm btn-danger btn-icon"  @click="handleDelete('category', cat.id)" :disabled="isProcessing" title="Eliminar" :aria-label="`Eliminar categoría ${cat.name}`">✕</button>
                    </template>
                    <template v-else>
                      <button class="btn btn-sm btn-primary btn-icon" @click="handleSaveEdit('category', cat.id)" :disabled="isProcessing" aria-label="Guardar cambios">✓</button>
                      <button class="btn btn-sm btn-secondary btn-icon" @click="cancelEdit" :disabled="isProcessing" aria-label="Cancelar edición">✕</button>
                    </template>
                  </div>
                </div>
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
                <select v-model.number="productPageSize" class="form-select form-select-sm" style="width:auto" aria-label="Cantidad de productos por página">
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
              </div>
            </div>
            <div class="tac-card-body">
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
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                      </select>
                      <span v-if="errors.productCategory" class="invalid-feedback">{{ errors.productCategory }}</span>
                    </div>
                  </div>
                  <div class="col-md-2">
                    <button type="submit" class="btn btn-primary w-100" :disabled="!canAddProduct || isProcessing">
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
                  <div class="col-md-3">
                    <div class="form-group">
                      <label for="new-product-image">Imagen</label>
                      <input id="new-product-image" type="file" accept="image/*" class="form-control form-control-sm" :disabled="isProcessing || isUploadingImage"
                        @change="handleImageUpload($event, forms.product)" />
                      <span v-if="forms.product.imageUrl" style="font-size:.72rem;color:var(--crimson-light)">✓ Imagen cargada</span>
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
                              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                            </select>
                          </div>
                          <div class="col-md-5">
                            <textarea v-model.trim="editingData.description" class="form-control form-control-sm" rows="1" placeholder="Descripción" aria-label="Descripción" :disabled="isProcessing"></textarea>
                          </div>
                          <div class="col-md-3">
                            <input type="file" accept="image/*" class="form-control form-control-sm" aria-label="Cambiar imagen del producto" :disabled="isProcessing || isUploadingImage"
                              @change="handleImageUpload($event, editingData)" />
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
                            <button class="btn btn-sm btn-danger btn-icon"  @click="handleDelete('product', prod.id)" :disabled="isProcessing" :aria-label="`Eliminar producto ${prod.name}`">✕</button>
                          </template>
                          <template v-else>
                            <button class="btn btn-sm btn-primary btn-icon"  @click="handleSaveEdit('product', prod.id)" :disabled="isProcessing" aria-label="Guardar cambios">✓</button>
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
                    placeholder="Ej: S, M, L, XL, 38, 40..." :disabled="isProcessing" />
                  <span v-if="errors.sizeName" class="invalid-feedback">{{ errors.sizeName }}</span>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="!forms.size.name || isProcessing">
                  <span v-if="isProcessing" class="spinner spinner-sm"></span>
                  <span v-else>+ Agregar</span>
                </button>
              </form>

              <!-- Size chips grid -->
              <div v-if="filteredSizes.length === 0" class="empty-state">
                <div class="empty-state-icon">◻</div>
                <p>{{ sizes.length === 0 ? 'Sin talles' : 'Sin resultados' }}</p>
              </div>

              <div v-else class="sizes-grid">
                <div v-for="size in filteredSizes" :key="size.id" class="size-item">
                  <template v-if="editingId !== size.id">
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
import { getAllProducts, addProduct, deleteProduct, editProduct, uploadImage } from '../services/productService'
import { getAllSizes, addSize, deleteSize, editSize } from '../services/sizeService'
import { register } from '../services/authService'

export default {
  name: 'Admin',
  components: { BaseLayout },
  data() {
    return {
      activeTab: 'categories',
      categories: [], products: [], sizes: [],
      forms: {
        category: { name: '' },
        product: { name: '', price: '', priceCash: '', categoryId: '', description: '', imageUrl: '', published: false, weightKg: '' },
        size: { name: '' },
        user: { username: '', password: '', role: 'USER' }
      },
      editingId: null, editingType: null, editingName: '', editingData: {},
      filters: { productSearch: '', sizeSearch: '' },
      productPage: 1,
      productPageSize: 10,
      isLoading: false, isProcessing: false, isUploadingImage: false,
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
      try { await Promise.all([this.fetchCategories(), this.fetchProducts(), this.fetchSizes()]) }
      catch { this.showToast('error', 'Error al cargar datos') }
      finally { this.isLoading = false }
    },
    switchTab(tab) { this.activeTab = tab; this.cancelEdit(); this.errors = {} },

    async fetchCategories() { this.categories = (await getAllCategories()).data || [] },
    async fetchProducts()   { this.products   = (await getAllProducts()).data   || [] },
    async fetchSizes()      { this.sizes       = (await getAllSizes()).data      || [] },

    async handleAddCategory() {
      if (!this.forms.category.name) { this.errors.categoryName = 'Requerido'; return }
      this.isProcessing = true
      try {
        await addCategory(this.forms.category.name)
        this.forms.category.name = ''
        await this.fetchCategories()
        this.showToast('success', 'Categoría agregada')
      } catch { this.showToast('error', 'Error al agregar') }
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
        await addProduct(this.forms.product)
        this.forms.product = { name: '', price: '', priceCash: '', categoryId: '', description: '', imageUrl: '', published: false, weightKg: '' }
        await this.fetchProducts()
        this.showToast('success', 'Producto agregado')
      } catch { this.showToast('error', 'Error al agregar') }
      finally { this.isProcessing = false }
    },

    async handleImageUpload(event, target) {
      const file = event.target.files?.[0]
      if (!file) return
      this.isUploadingImage = true
      try {
        const res = await uploadImage(file, 'products')
        target.imageUrl = res.data.url
      } catch {
        this.showToast('error', 'Error al subir la imagen')
      } finally {
        this.isUploadingImage = false
      }
    },

    async handleAddSize() {
      if (!this.forms.size.name) { this.errors.sizeName = 'Requerido'; return }
      this.isProcessing = true
      try {
        await addSize(this.forms.size.name)
        this.forms.size.name = ''
        await this.fetchSizes()
        this.showToast('success', 'Talle agregado')
      } catch { this.showToast('error', 'Error al agregar') }
      finally { this.isProcessing = false }
    },

    startEdit(type, item) {
      this.editingId = item.id; this.editingType = type
      if (type === 'product') {
        this.editingData = {
          name: item.name, price: item.price, priceCash: item.priceCash, categoryId: item.category?.id || '',
          description: item.description || '', imageUrl: item.imageUrl || '', published: item.published || false, weightKg: item.weightKg || ''
        }
      } else {
        this.editingName = item.name
      }
    },
    cancelEdit() { this.editingId = null; this.editingName = ''; this.editingData = {}; this.errors = {} },

    async handleSaveEdit(type, id) {
      this.isProcessing = true
      try {
        if (type === 'category') {
          if (!this.editingName.trim()) { this.errors.editing = 'Requerido'; return }
          await editCategory(id, this.editingName)
          await this.fetchCategories()
        } else if (type === 'product') {
          if (!this.editingData.name || !this.editingData.price || this.editingData.priceCash == null || !this.editingData.categoryId) {
            this.showToast('error', 'Complete todos los campos'); return
          }
          await editProduct({ id, ...this.editingData })
          await this.fetchProducts()
        } else if (type === 'size') {
          if (!this.editingName.trim()) { this.errors.editing = 'Requerido'; return }
          await editSize(id, this.editingName)
          await this.fetchSizes()
        }
        this.cancelEdit()
        this.showToast('success', 'Actualizado correctamente')
      } catch { this.showToast('error', 'Error al actualizar') }
      finally { this.isProcessing = false }
    },

    async handleDelete(type, id) {
      if (!confirm('¿Confirmar eliminación?')) return
      this.isProcessing = true
      try {
        if (type === 'category') { await deleteCategory(id); await this.fetchCategories() }
        else if (type === 'product') { await deleteProduct(id); await this.fetchProducts() }
        else if (type === 'size') { await deleteSize(id); await this.fetchSizes() }
        this.showToast('success', 'Eliminado')
      } catch { this.showToast('error', 'Error al eliminar') }
      finally { this.isProcessing = false }
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
