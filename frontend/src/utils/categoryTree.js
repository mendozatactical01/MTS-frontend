// Agrupa las categorías por su sección del menú (Indumentaria, Pesca...). Una categoría sin
// sección va sola. El id de una sección es "sec:<nombre>" para no chocar con ids de categoría.
export const sectionId = (name) => `sec:${name}`

export function groupCategories(categories) {
  const groups = new Map()
  categories.forEach(cat => {
    if (!cat) return
    if (cat.section) {
      const id = sectionId(cat.section)
      if (!groups.has(id)) groups.set(id, { id, name: cat.section, children: [] })
      const g = groups.get(id)
      if (!g.children.some(c => c.id === cat.id)) g.children.push(cat)
    } else if (!groups.has(cat.id)) {
      groups.set(cat.id, { ...cat, children: [] })
    }
  })
  const byName = (a, b) => a.name.localeCompare(b.name)
  return [...groups.values()].sort(byName).map(g => ({ ...g, children: g.children.sort(byName) }))
}

// Menú de la tienda: solo las categorías que tienen productos publicados
export function buildCategoryTree(products) {
  return groupCategories(products.map(p => p.category))
}

// ¿El producto entra en lo elegido? (una sección incluye todas sus categorías)
export function productInCategory(product, categoryId) {
  const cat = product.category
  if (!cat) return false
  if (typeof categoryId === 'string' && categoryId.startsWith('sec:')) return cat.section === categoryId.slice(4)
  return cat.id === categoryId
}
