// Carrito 100% local (localStorage) — no hay endpoint de carrito en el backend.
// El subtotal de acá es solo para mostrar en pantalla: el precio y stock
// reales se recalculan siempre server-side al crear el pedido (checkoutService).
const STORAGE_KEY = 'mts_cart'

// Dos combos iguales con distintas elecciones (caña, reel, talle) van en líneas separadas.
function itemKey({ type, id, sizeId, selections }) {
  const choice = (selections || []).map(s => `${s.comboItemId}:${s.productId}:${s.sizeId ?? ''}`).join('|')
  return `${type}-${id}-${sizeId ?? 'none'}${choice ? `-${choice}` : ''}`
}

// Texto corto de lo elegido en un combo, para mostrar en carrito y checkout.
export function describeSelections(item) {
  return (item.selections || [])
    .map(s => `${s.label ? `${s.label}: ` : ''}${s.productName}${s.sizeName ? ` (talle ${s.sizeName})` : ''}`)
    .join(' · ')
}

export function getCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  // El evento 'storage' del navegador no dispara en la misma pestaña que escribe;
  // este evento propio avisa a StoreLayout (badge del carrito) dentro de la misma pestaña.
  window.dispatchEvent(new Event('mts-cart-updated'))
  return items
}

// item: { type: 'product'|'combo', id, sizeId, sizeName, name, unitPrice, imageUrl, weightKg,
//         selections?: [{ comboItemId, productId, sizeId, label, productName, sizeName }] }
export function addItem(item, quantity = 1) {
  const items = getCart()
  const key = itemKey(item)
  const existing = items.find(i => i.key === key)
  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({ ...item, key, quantity })
  }
  return saveCart(items)
}

export function updateQuantity(key, quantity) {
  let items = getCart()
  if (quantity <= 0) {
    items = items.filter(i => i.key !== key)
  } else {
    const item = items.find(i => i.key === key)
    if (item) item.quantity = quantity
  }
  return saveCart(items)
}

export function removeItem(key) {
  const items = getCart().filter(i => i.key !== key)
  return saveCart(items)
}

export function clearCart() {
  return saveCart([])
}

export function getSubtotal(items = getCart()) {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
}

export function getTotalWeight(items = getCart()) {
  return items.reduce((sum, i) => sum + (i.weightKg || 0) * i.quantity, 0)
}

export function getCount(items = getCart()) {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}
