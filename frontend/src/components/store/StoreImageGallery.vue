<template>
  <div class="gallery">
    <div class="gallery-stage">
    <div class="gallery-main" ref="track" @scroll.passive="onScroll" :aria-label="`Fotos de ${alt}`" role="region" tabindex="0" @keydown.left.prevent="go(current - 1)" @keydown.right.prevent="go(current + 1)">
      <div v-if="!list.length" class="gallery-slide gallery-empty" aria-hidden="true">MTS</div>
      <div v-for="(url, idx) in list" :key="url" class="gallery-slide">
        <img :src="url" :alt="list.length > 1 ? `${alt} — foto ${idx + 1} de ${list.length}` : alt" :loading="idx === 0 ? 'eager' : 'lazy'" />
      </div>
    </div>
    <slot />
    <template v-if="list.length > 1">
      <button type="button" class="gallery-nav prev" :disabled="current === 0" @click="go(current - 1)" aria-label="Foto anterior">‹</button>
      <button type="button" class="gallery-nav next" :disabled="current === list.length - 1" @click="go(current + 1)" aria-label="Foto siguiente">›</button>
    </template>
    </div>
    <template v-if="list.length > 1">
      <div class="gallery-thumbs">
        <button v-for="(url, idx) in list" :key="url" type="button" class="gallery-thumb" :class="{ active: idx === current }" :aria-label="`Ver foto ${idx + 1}`" :aria-current="idx === current" @click="go(idx)">
          <img :src="url" alt="" loading="lazy" />
        </button>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'StoreImageGallery',
  props: {
    images: { type: Array, default: () => [] },
    fallback: { type: String, default: '' },
    alt: { type: String, default: '' }
  },
  data() {
    return { current: 0 }
  },
  computed: {
    list() {
      if (this.images && this.images.length) return this.images
      return this.fallback ? [this.fallback] : []
    }
  },
  watch: {
    list() {
      this.current = 0
      if (this.$refs.track) this.$refs.track.scrollLeft = 0
    }
  },
  methods: {
    go(idx) {
      if (idx < 0 || idx >= this.list.length) return
      const track = this.$refs.track
      track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' })
      this.current = idx
    },
    onScroll() {
      const track = this.$refs.track
      if (track.clientWidth) this.current = Math.round(track.scrollLeft / track.clientWidth)
    }
  }
}
</script>

<style scoped>
.gallery-stage { position: relative; }
.gallery-main {
  display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
  aspect-ratio: 1 / 1; border-radius: var(--radius-lg); border: 1px solid var(--border); background: var(--bg-input);
}
.gallery-main::-webkit-scrollbar { display: none; }
.gallery-main:focus-visible { outline: 2px solid var(--crimson); outline-offset: 2px; }
.gallery-slide { flex: 0 0 100%; scroll-snap-align: start; display: flex; align-items: center; justify-content: center; }
.gallery-slide img { width: 100%; height: 100%; object-fit: cover; }
.gallery-empty { font-family: var(--font-display); font-size: 2rem; color: var(--text-muted); }
.gallery-nav {
  position: absolute; top: calc(50% - 1.125rem); width: 2.25rem; height: 2.25rem; border-radius: 50%;
  border: 1px solid var(--border); background: rgba(0, 0, 0, .55); color: #fff; font-size: 1.4rem; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.gallery-nav.prev { left: .5rem; }
.gallery-nav.next { right: .5rem; }
.gallery-nav:disabled { opacity: .3; cursor: default; }
.gallery-thumbs { display: flex; gap: .5rem; margin-top: .6rem; overflow-x: auto; padding-bottom: .2rem; }
.gallery-thumb {
  flex: 0 0 64px; height: 64px; padding: 0; border: 2px solid transparent; border-radius: var(--radius-sm);
  overflow: hidden; background: var(--bg-input); cursor: pointer; opacity: .7;
}
.gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gallery-thumb.active { border-color: var(--crimson); opacity: 1; }
.gallery-thumb:hover { opacity: 1; }
@media (hover: none) { .gallery-nav { display: none; } }
</style>
