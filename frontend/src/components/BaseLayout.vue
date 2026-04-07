<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-brand">
        <div class="brand-logo-wrap">
          <img src="../assets/logo.jpeg" alt="Mendoza Tactical Store" class="brand-logo-img" />
        </div>
        <button class="btn-close-sidebar mobile-only" @click="sidebarOpen = false">✕</button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">Sistema</div>
        <router-link to="/" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon">⌂</span><span>Inicio</span>
        </router-link>

        <div class="nav-section-label">Gestión</div>
        <router-link to="/admin" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon">◈</span><span>Administración</span>
        </router-link>
        <router-link to="/stock" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon">▦</span><span>Stock</span>
        </router-link>
        <router-link to="/sales" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon">◉</span><span>Ventas</span>
        </router-link>

        <div class="nav-section-label">Reportes</div>
        <router-link to="/statistics" class="nav-item" @click="sidebarOpen = false">
          <span class="nav-icon">◎</span><span>Estadísticas</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-footer-text">
          <span>v1.0</span>
          <span class="separator">·</span>
          <span class="status-dot"></span>
          <span>Conectado</span>
        </div>
      </div>
    </aside>

    <div class="sidebar-overlay" v-if="sidebarOpen" @click="sidebarOpen = false"></div>

    <div class="main-wrap">
      <header class="topbar">
        <button class="btn btn-icon mobile-only" @click="sidebarOpen = true" style="color:var(--text-secondary)">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="topbar-title">{{ pageTitle }}</div>
        <div class="topbar-right">
          <span class="topbar-time">{{ currentTime }}</span>
          <button class="btn btn-sm btn-danger" style="margin-left:1rem" @click="handleLogout">Salir</button>
        </div>
      </header>
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import { logout } from '../services/authService'

export default {
  name: 'BaseLayout',
  data() { return { sidebarOpen: false, currentTime: '' } },
  computed: {
    pageTitle() {
      const t = { '/': 'Inicio', '/admin': 'Administración', '/stock': 'Stock', '/sales': 'Ventas', '/statistics': 'Estadísticas' }
      return t[this.$route?.path] || 'MTS'
    }
  },
  mounted() { this.updateTime(); setInterval(this.updateTime, 60000) },
  methods: {
    updateTime() {
      this.currentTime = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    },
    handleLogout() {
      logout()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.app-shell { display: flex; min-height: 100vh; }

.sidebar {
  width: var(--sidebar-width); background: var(--bg-surface);
  border-right: 1px solid var(--border); display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 200; transition: transform 0.25s ease;
}

.sidebar-brand {
  border-bottom: 1px solid var(--border);
  background: #0a0b0a;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 0.75rem;
}

.brand-logo-wrap { flex: 1; display: flex; justify-content: center; }

.brand-logo-img {
  width: 100%; max-width: 155px; height: auto; object-fit: contain;
  /* Invierte el logo blanco/rojo a rojo oscuro sobre fondo negro */
  filter: brightness(0.9) contrast(1.1);
  border-radius: 3px;
}

.btn-close-sidebar {
  background: transparent; border: none; color: var(--text-muted);
  font-size: 1.1rem; cursor: pointer; padding: 0.25rem; flex-shrink: 0; margin-left: 0.5rem;
}

.sidebar-nav { flex: 1; padding: 0.75rem 0; overflow-y: auto; }

.nav-section-label {
  font-family: var(--font-display); font-size: 0.63rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted);
  padding: 0.5rem 1rem 0.2rem; margin-top: 0.35rem;
}

.nav-item {
  display: flex; align-items: center; gap: 0.65rem; padding: 0.58rem 1rem;
  color: var(--text-secondary); text-decoration: none;
  font-family: var(--font-display); font-weight: 600; font-size: 0.86rem;
  letter-spacing: 0.04em; text-transform: uppercase;
  transition: var(--transition); border-left: 2px solid transparent;
}
.nav-item:hover { color: var(--text-primary); background: var(--bg-hover); border-left-color: var(--border); }
.nav-item.router-link-exact-active { color: var(--crimson-light); background: var(--crimson-glow); border-left-color: var(--crimson); }

.nav-icon { font-size: 1rem; width: 18px; text-align: center; flex-shrink: 0; }

.sidebar-footer { padding: 0.75rem 1rem; border-top: 1px solid var(--border); }
.sidebar-footer-text { font-size: 0.72rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem; }
.separator { opacity: 0.4; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--crimson-light); animation: pulse 2s infinite; flex-shrink: 0; }

.main-wrap { margin-left: var(--sidebar-width); flex: 1; display: flex; flex-direction: column; min-height: 100vh; }

.topbar {
  height: 52px; background: var(--bg-surface); border-bottom: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 1.5rem; gap: 1rem;
  position: sticky; top: 0; z-index: 100;
}
.topbar-title { font-family: var(--font-display); font-weight: 700; font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-secondary); }
.topbar-right { margin-left: auto; }
.topbar-time { font-family: var(--font-display); font-size: 0.88rem; font-weight: 600; color: var(--text-muted); }

.page-content { flex: 1; padding: 1.75rem; max-width: 1400px; width: 100%; }

.mobile-only { display: none; }
.sidebar-overlay { display: none; }

@media (max-width: 768px) {
  .mobile-only { display: flex; }
  .sidebar { transform: translateX(-100%); width: 260px; z-index: 300; }
  .sidebar.sidebar-open { transform: translateX(0); }
  .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 250; }
  .main-wrap { margin-left: 0; }
  .page-content { padding: 1rem; }
}
</style>
