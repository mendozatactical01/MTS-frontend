<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-brand">
        <img src="../assets/logo.jpeg" alt="Mendoza Tactical Store" class="login-logo" />
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Usuario</label>
          <input
            v-model.trim="username"
            class="form-control"
            :class="{ 'is-invalid': error }"
            placeholder="Ingresá tu usuario"
            autocomplete="username"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <input
            v-model="password"
            type="password"
            class="form-control"
            :class="{ 'is-invalid': error }"
            placeholder="Ingresá tu contraseña"
            autocomplete="current-password"
            :disabled="loading"
          />
          <span v-if="error" class="invalid-feedback d-block">{{ error }}</span>
        </div>

        <button type="submit" class="btn btn-primary w-100 mt-2" :disabled="loading || !username || !password">
          <span v-if="loading" class="spinner spinner-sm"></span>
          <span v-else>Ingresar</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { login, saveToken } from '../services/authService'

export default {
  name: 'Login',
  data() {
    return { username: '', password: '', loading: false, error: '' }
  },
  methods: {
    async handleLogin() {
      this.error = ''
      this.loading = true
      try {
        const res = await login(this.username, this.password)
        saveToken(res.data.token)
        this.$router.push(this.$route.query.redirect || '/')
      } catch (e) {
        const status = e.response?.status
        if (status === 401) this.error = 'Usuario o contraseña incorrectos'
        else this.error = 'Error al conectar con el servidor'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  padding: 1rem;
}

.login-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 8px);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 360px;
  box-shadow: var(--shadow-lg);
}

.login-brand {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  width: 180px;
  height: auto;
  object-fit: contain;
}

.login-form .form-group {
  margin-bottom: 1rem;
}

.login-form label {
  display: block;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
}
</style>
