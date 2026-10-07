<template>
  <router-link :to="to" class="sp-card">
    <div class="sp-card-img">
      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" loading="lazy" />
      <div v-else class="sp-card-noimg" aria-hidden="true">MTS</div>
      <span v-if="combo" class="sp-card-tag">Combo</span>
      <div v-if="item.available === false" class="sp-card-unavailable">
        <span>Sin stock</span>
      </div>
      <span class="sp-card-cta" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 7V6a5 5 0 0 1 10 0v1h3l-1 14H5L4 7h3Zm2 0h6V6a3 3 0 0 0-6 0v1Z"/></svg>
      </span>
    </div>
    <div class="sp-card-body">
      <h3 class="sp-card-name">{{ item.name }}</h3>
      <p class="sp-card-price">${{ formatMoney(item.price) }}</p>
      <p v-if="item.priceCash" class="sp-card-cash">Efectivo / transferencia <strong>${{ formatMoney(item.priceCash) }}</strong></p>
    </div>
  </router-link>
</template>

<script>
export default {
  name: 'StoreProductCard',
  props: {
    item: { type: Object, required: true },
    combo: { type: Boolean, default: false }
  },
  computed: {
    to() { return this.combo ? `/combo/${this.item.id}` : `/producto/${this.item.id}` }
  },
  methods: {
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') }
  }
}
</script>

<style scoped>
.sp-card { display: flex; flex-direction: column; text-decoration: none; color: inherit; }

.sp-card-img {
  position: relative; aspect-ratio: 1 / 1; background: #fff; overflow: hidden;
}
.sp-card-img img {
  width: 100%; height: 100%; object-fit: contain; display: block;
  transition: transform 0.35s ease;
}
.sp-card:hover .sp-card-img img { transform: scale(1.05); }
.sp-card-noimg {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: var(--bg-input); color: var(--border); font-family: var(--font-display);
  font-weight: 800; font-size: 2.5rem; letter-spacing: 0.1em;
}

.sp-card-tag {
  position: absolute; top: 0; right: 0; background: var(--crimson); color: #fff;
  font-family: var(--font-display); font-weight: 700; font-size: 0.75rem;
  letter-spacing: 0.08em; text-transform: uppercase; padding: 0.25rem 0.6rem;
}
.sp-card-unavailable {
  position: absolute; inset: 0; background: rgba(13, 15, 14, 0.6);
  display: flex; align-items: center; justify-content: center;
}
.sp-card-unavailable span {
  background: var(--bg-base); color: var(--text-primary); font-family: var(--font-display);
  font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
}
.sp-card-cta {
  position: absolute; left: 0.65rem; bottom: 0.65rem; width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-base); color: #fff; transition: var(--transition);
}
.sp-card:hover .sp-card-cta { background: var(--crimson); }

.sp-card-body { padding: 0.9rem 0.65rem 0.4rem; display: flex; flex-direction: column; gap: 0.3rem; }
.sp-card-name {
  font-family: var(--font-display); font-weight: 600; font-size: 1.05rem;
  letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.2;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sp-card:hover .sp-card-name { color: var(--crimson-light); }
.sp-card-price { font-size: 1rem; color: var(--text-primary); font-weight: 500; }
.sp-card-cash { font-size: 0.85rem; color: var(--text-secondary); }
.sp-card-cash strong { color: var(--text-primary); font-weight: 600; }
</style>
