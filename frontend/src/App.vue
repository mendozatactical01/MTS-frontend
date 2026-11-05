<template>
  <router-view />
  <ConfirmDialog />
</template>

<script>
import ConfirmDialog from './components/ConfirmDialog.vue'

export default {
  name: 'App',
  components: { ConfirmDialog }
}
</script>
