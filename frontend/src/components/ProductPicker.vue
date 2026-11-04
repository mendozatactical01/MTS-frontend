<template>
  <div class="product-picker" @focusout="onFocusOut">
    <input :id="inputId" ref="input" v-model="query" type="text" autocomplete="off"
      class="form-control" :class="[small ? 'form-control-sm' : '', { 'is-invalid': invalid }]"
      :placeholder="placeholder" :disabled="disabled" role="combobox" :aria-label="ariaLabel"
      :aria-expanded="open" aria-autocomplete="list"
      @focus="onFocus" @input="open = true; active = 0"
      @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="pick(results[active])" @keydown.esc="close" />
    <ul v-if="open && query.trim()" class="picker-results" role="listbox">
      <li v-if="results.length === 0" class="picker-empty">Sin resultados</li>
      <li v-for="(p, i) in results" :key="p.id" role="option" :aria-selected="i === active">
        <button type="button" class="picker-option" :class="{ active: i === active }" tabindex="-1"
          @mousedown.prevent="pick(p)">{{ p.name }}</button>
      </li>
    </ul>
  </div>
</template>

<script>
// Buscador de productos que reemplaza al <select>: se escribe parte del nombre y se elige de la lista.
export default {
  name: 'ProductPicker',
  props: {
    modelValue: { type: [Number, String], default: '' },
    products: { type: Array, default: () => [] },
    placeholder: { type: String, default: 'Buscar producto...' },
    ariaLabel: { type: String, default: 'Producto' },
    inputId: { type: String, default: null },
    disabled: Boolean,
    invalid: Boolean,
    small: Boolean
  },
  emits: ['update:modelValue'],
  data() { return { query: '', open: false, active: 0 } },
  computed: {
    selected() { return this.products.find(p => p.id === this.modelValue) || null },
    results() {
      const words = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
      if (!words.length) return []
      return this.products.filter(p => {
        const name = p.name.toLowerCase()
        return words.every(w => name.includes(w))
      }).slice(0, 12)
    }
  },
  watch: {
    selected: { immediate: true, handler(p) { this.query = p ? p.name : '' } }
  },
  methods: {
    onFocus() { this.$refs.input.select() },
    move(d) {
      if (!this.results.length) return
      this.open = true
      this.active = (this.active + d + this.results.length) % this.results.length
    },
    pick(p) {
      if (!p) return
      this.$emit('update:modelValue', p.id)
      this.query = p.name
      this.open = false
    },
    close() {
      this.open = false
      this.query = this.selected ? this.selected.name : ''
    },
    onFocusOut(e) {
      if (!this.$el.contains(e.relatedTarget)) this.close()
    }
  }
}
</script>

<style scoped>
.product-picker { position: relative; }
.picker-results {
  position: absolute; left: 0; right: 0; top: 100%; z-index: 50;
  list-style: none; margin: .25rem 0 0; padding: .25rem 0;
  max-height: 260px; overflow-y: auto;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow-lg);
}
.picker-option {
  display: block; width: 100%;
  padding: .45rem .75rem; background: none; border: 0; color: inherit; text-align: left; font-size: .85rem;
}
.picker-option:hover, .picker-option.active { background: var(--bg-hover); }
.picker-empty { padding: .45rem .75rem; color: var(--text-muted); font-size: .85rem; }
</style>
