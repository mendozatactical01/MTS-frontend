<template>
  <div class="img-editor">
    <ul v-if="modelValue.length" class="img-editor-list" aria-label="Fotos cargadas">
      <li v-for="(url, idx) in modelValue" :key="url" class="img-editor-item">
        <img :src="url" :alt="`Foto ${idx + 1}`" />
        <span v-if="idx === 0" class="img-editor-cover">Portada</span>
        <div class="img-editor-actions">
          <button type="button" :disabled="disabled || idx === 0" @click="move(idx, -1)" :aria-label="`Mover foto ${idx + 1} a la izquierda`">◀</button>
          <button type="button" :disabled="disabled" @click="remove(idx)" :aria-label="`Quitar foto ${idx + 1}`">✕</button>
          <button type="button" :disabled="disabled || idx === modelValue.length - 1" @click="move(idx, 1)" :aria-label="`Mover foto ${idx + 1} a la derecha`">▶</button>
        </div>
      </li>
    </ul>
    <label class="img-editor-add" :class="{ disabled: disabled || uploading }">
      <input type="file" accept="image/*" multiple :id="inputId" :disabled="disabled || uploading" @change="handleFiles" />
      <span v-if="uploading"><span class="spinner spinner-sm"></span> Subiendo {{ progress }}...</span>
      <span v-else>+ Agregar fotos</span>
    </label>
    <p class="img-editor-help">Podés elegir varias a la vez. La primera es la portada.</p>
  </div>
</template>

<script>
import { uploadImage } from '../../services/productService'

export default {
  name: 'ImageListEditor',
  props: {
    modelValue: { type: Array, default: () => [] },
    folder: { type: String, default: 'products' },
    disabled: { type: Boolean, default: false },
    inputId: { type: String, default: undefined }
  },
  emits: ['update:modelValue', 'uploading', 'error'],
  data() {
    return { uploading: false, progress: '' }
  },
  methods: {
    move(idx, delta) {
      const list = [...this.modelValue]
      const [item] = list.splice(idx, 1)
      list.splice(idx + delta, 0, item)
      this.$emit('update:modelValue', list)
    },
    remove(idx) {
      this.$emit('update:modelValue', this.modelValue.filter((_, i) => i !== idx))
    },
    async handleFiles(event) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (!files.length) return
      this.uploading = true
      this.$emit('uploading', true)
      let list = [...this.modelValue]
      let failed = 0
      try {
        for (let i = 0; i < files.length; i++) {
          this.progress = files.length > 1 ? `${i + 1}/${files.length}` : ''
          try {
            const res = await uploadImage(files[i], this.folder)
            list = [...list, res.data.url]
            this.$emit('update:modelValue', list)
          } catch {
            failed++
          }
        }
      } finally {
        this.uploading = false
        this.progress = ''
        this.$emit('uploading', false)
        if (failed) this.$emit('error', failed === 1 ? 'No se pudo subir una foto' : `No se pudieron subir ${failed} fotos`)
      }
    }
  }
}
</script>

<style scoped>
.img-editor-list { list-style: none; margin: 0 0 .5rem; padding: 0; display: flex; flex-wrap: wrap; gap: .5rem; }
.img-editor-item { position: relative; width: 88px; }
.img-editor-item img { width: 88px; height: 88px; object-fit: cover; border-radius: var(--radius); border: 1px solid var(--border); display: block; }
.img-editor-cover {
  position: absolute; top: 4px; left: 4px; font-size: .62rem; font-weight: 700; letter-spacing: .04em;
  background: var(--crimson); color: #fff; padding: .05rem .35rem; border-radius: var(--radius-sm);
}
.img-editor-actions { display: flex; justify-content: space-between; margin-top: .2rem; }
.img-editor-actions button {
  flex: 1; background: var(--bg-hover); border: 1px solid var(--border); color: var(--text-secondary);
  font-size: .7rem; padding: .15rem 0; cursor: pointer;
}
.img-editor-actions button:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
.img-editor-actions button:last-child { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.img-editor-actions button:hover:not(:disabled) { color: var(--text-primary); }
.img-editor-actions button:disabled { opacity: .35; cursor: not-allowed; }
.img-editor-add {
  display: inline-flex; align-items: center; gap: .4rem; padding: .35rem .75rem; cursor: pointer;
  border: 1px dashed var(--border); border-radius: var(--radius); font-size: .82rem; color: var(--text-secondary);
}
.img-editor-add:hover:not(.disabled) { border-color: var(--crimson); color: var(--text-primary); }
.img-editor-add.disabled { opacity: .6; cursor: not-allowed; }
.img-editor-add input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.img-editor-add:focus-within { outline: 2px solid var(--crimson); outline-offset: 2px; }
.img-editor-help { font-size: .72rem; color: var(--text-muted); margin: .3rem 0 0; }
</style>
