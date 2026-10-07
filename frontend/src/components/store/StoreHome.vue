<template>
  <StoreLayout>
    <section class="hero">
      <StoreEmblem class="hero-watermark" />
      <div class="hero-inner">
        <p class="hero-kicker">Mendoza Tactical Store</p>
        <h1 class="hero-title">Equipamiento táctico<br><span>de alto rendimiento</span></h1>
        <p class="hero-subtitle">Indumentaria, accesorios de portación, outdoor y pesca. Stock real y envíos a todo el país.</p>
        <div class="hero-actions">
          <router-link to="/tienda" class="hero-btn hero-btn-primary">Ver productos</router-link>
          <a v-if="combos.length" href="#combos" class="hero-btn hero-btn-ghost">Ver combos</a>
        </div>
      </div>
    </section>

    <section class="home-block home-block-surface" aria-labelledby="novedades-title">
      <div class="home-block-inner">
        <header class="home-block-head">
          <h2 id="novedades-title">Novedades</h2>
          <p>Explorá nuestra colección de indumentaria y accesorios tácticos.</p>
        </header>

        <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
        <div v-else-if="products.length === 0" class="empty-state">
          <div class="empty-state-icon">◇</div>
          <p>Todavía no hay productos publicados</p>
        </div>
        <div v-else class="home-grid">
          <StoreProductCard v-for="product in products.slice(0, 8)" :key="'prod-'+product.id" :item="product" />
        </div>

        <div v-if="!loading && products.length" class="home-block-foot">
          <router-link to="/tienda" class="hero-btn hero-btn-ghost">Ver todos los productos</router-link>
        </div>
      </div>
    </section>

    <section v-if="combos.length" id="combos" class="home-block" aria-labelledby="combos-title">
      <div class="home-block-inner">
        <header class="home-block-head">
          <h2 id="combos-title">Combos</h2>
          <p>Equipos armados con lo que necesitás, a un mejor precio.</p>
        </header>
        <div class="home-grid">
          <StoreProductCard v-for="combo in combos" :key="'combo-'+combo.id" :item="combo" combo />
        </div>
      </div>
    </section>

    <div class="ticker" aria-hidden="true">
      <div class="ticker-track">
        <span v-for="n in 16" :key="n">Envío a todo el país</span>
      </div>
    </div>

    <section class="benefits" aria-label="Beneficios">
      <div class="benefits-inner">
        <div class="benefit">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" aria-hidden="true"><path d="M3 5h11v3h3.5L21 12v5h-2a2.5 2.5 0 0 1-5 0H9a2.5 2.5 0 0 1-5 0H3V5Zm11 5v3h5v-.2L16.7 10H14ZM6.5 16.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Zm10 0a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z"/></svg>
          <h3>Envíos operativos</h3>
          <p>Despachamos a todo el país. Logística rápida y segura para que tu equipo llegue a tiempo a la misión.</p>
        </div>
        <div class="benefit">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" aria-hidden="true"><path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm2 2h16V6H4v2Zm0 3v7h16v-7H4Zm2 3h5v2H6v-2Z"/></svg>
          <h3>Métodos de pago</h3>
          <p>Pagá con tarjeta, transferencia o efectivo vía Mercado Pago. Precio especial pagando en efectivo o transferencia.</p>
        </div>
        <div class="benefit">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 2.2V12H6V6.4l6-2.2Zm0 7.8h6c-.5 4-3 7.3-6 8.4V12Z"/></svg>
          <h3>Compra blindada</h3>
          <p>Tus pagos se procesan en Mercado Pago, con stock real y seguimiento de tu pedido en todo momento.</p>
        </div>
      </div>
    </section>

    <section class="elite" aria-labelledby="elite-title">
      <StoreEmblem class="elite-watermark" />
      <div class="elite-inner">
        <h2 id="elite-title">Equipamiento de élite</h2>
        <p>Indumentaria, portación, outdoor y pesca: todo lo que tu misión necesita, en un solo lugar.</p>
        <router-link to="/tienda" class="hero-btn hero-btn-primary">Explorar catálogo</router-link>
      </div>
    </section>
  </StoreLayout>
</template>

<script>
import StoreLayout from './StoreLayout.vue'
import StoreEmblem from './StoreEmblem.vue'
import StoreProductCard from './StoreProductCard.vue'
import { getPublishedProducts, getPublishedCombos } from '../../services/storeService'

export default {
  name: 'StoreHome',
  components: { StoreLayout, StoreEmblem, StoreProductCard },
  data() {
    return { products: [], combos: [], loading: true }
  },
  async mounted() {
    try {
      const [productsRes, combosRes] = await Promise.all([getPublishedProducts(), getPublishedCombos()])
      this.products = productsRes.data
      this.combos = combosRes.data
    } finally {
      this.loading = false
    }
  }
}
</script>

<style scoped>
/* ── Hero ───────────────────────────────────────────────────── */
.hero {
  position: relative; overflow: hidden; min-height: min(72vh, 640px);
  display: flex; align-items: center; justify-content: center; text-align: center;
  padding: 4rem 1.25rem;
  background:
    radial-gradient(ellipse at 50% 120%, rgba(139, 26, 26, 0.45), transparent 60%),
    linear-gradient(180deg, #050606 0%, var(--bg-base) 100%);
}
.hero::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 10%, transparent 75%);
}
.hero-watermark {
  position: absolute; top: 50%; left: 50%; width: min(560px, 90vw); height: auto;
  transform: translate(-50%, -50%); color: var(--crimson); opacity: 0.12; pointer-events: none;
}
.hero-inner { position: relative; max-width: 820px; }
.hero-kicker {
  font-family: var(--font-display); font-weight: 600; font-size: 0.95rem;
  letter-spacing: 0.35em; text-transform: uppercase; color: var(--crimson-light); margin-bottom: 1rem;
}
.hero-title {
  font-size: clamp(2.4rem, 6vw, 4.6rem); font-weight: 800; line-height: 1;
  letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 1.25rem;
}
.hero-title span { color: var(--text-secondary); }
.hero-subtitle {
  color: var(--text-secondary); font-size: 1.1rem; max-width: 560px; margin: 0 auto 2rem;
}
.hero-actions { display: flex; gap: 0.85rem; justify-content: center; flex-wrap: wrap; }

.hero-btn {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: 700; font-size: 1rem;
  letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none;
  padding: 0.85rem 2rem; border: 2px solid transparent; transition: var(--transition);
}
.hero-btn-primary { background: var(--crimson); color: #fff; border-color: var(--crimson); }
.hero-btn-primary:hover { background: var(--crimson-light); border-color: var(--crimson-light); }
.hero-btn-ghost { background: transparent; color: var(--text-primary); border-color: var(--text-primary); }
.hero-btn-ghost:hover { background: var(--text-primary); color: var(--text-inverse); }

/* ── Bloques de productos ───────────────────────────────────── */
.home-block { padding: 4rem 1.25rem; }
.home-block-surface { background: var(--bg-surface); }
.home-block-inner { max-width: 1400px; margin: 0 auto; }
.home-block-head { text-align: center; margin-bottom: 2.25rem; }
.home-block-head h2 {
  font-size: clamp(1.8rem, 3.5vw, 2.4rem); letter-spacing: 0.12em; text-transform: uppercase;
  margin-bottom: 0.4rem;
}
.home-block-head h2::after {
  content: ''; display: block; width: 56px; height: 3px; background: var(--crimson);
  margin: 0.6rem auto 0;
}
.home-block-head p { color: var(--text-secondary); }
.home-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem 1rem; }
.home-block-foot { text-align: center; margin-top: 2.5rem; }

/* ── Ticker ─────────────────────────────────────────────────── */
.ticker { background: var(--crimson-dark); overflow: hidden; white-space: nowrap; }
.ticker-track { display: inline-flex; animation: ticker 40s linear infinite; }
.ticker-track span {
  font-family: var(--font-display); font-weight: 700; font-size: 1.05rem;
  letter-spacing: 0.14em; text-transform: uppercase; color: #fff; padding: 1.1rem 2.5rem;
}
@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* ── Beneficios ─────────────────────────────────────────────── */
.benefits { background: var(--bg-card); border-bottom: 1px solid var(--border); }
.benefits-inner {
  max-width: 1200px; margin: 0 auto; padding: 3.5rem 1.25rem;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem;
}
.benefit { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
.benefit svg { color: var(--crimson-light); }
.benefit h3 { font-size: 1.4rem; letter-spacing: 0.08em; text-transform: uppercase; }
.benefit p { color: var(--text-secondary); max-width: 320px; }

/* ── Bloque final ───────────────────────────────────────────── */
.elite { position: relative; overflow: hidden; background: #050606; padding: 5rem 1.25rem; text-align: center; }
.elite-watermark {
  position: absolute; top: 50%; left: 50%; width: 420px; height: auto;
  transform: translate(-50%, -50%); color: #fff; opacity: 0.05; pointer-events: none;
}
.elite-inner { position: relative; max-width: 760px; margin: 0 auto; }
.elite h2 {
  font-size: clamp(1.9rem, 4.5vw, 3rem); font-weight: 500; letter-spacing: 0.18em;
  text-transform: uppercase; margin-bottom: 1rem;
}
.elite p { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 2rem; }

@media (max-width: 1024px) {
  .home-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 760px) {
  .home-grid { grid-template-columns: repeat(2, 1fr); gap: 1.25rem 0.75rem; }
  .home-block { padding: 3rem 1rem; }
  .benefits-inner { grid-template-columns: 1fr; gap: 2rem; padding: 2.75rem 1rem; }
  .hero { min-height: 0; padding: 3.5rem 1rem; }
  .hero-btn { padding: 0.75rem 1.4rem; }
}
</style>
