// Arma el árbol de categorías (principal → subcategorías) a partir de las categorías
// de los productos publicados. Las principales vienen anidadas en category.parent.
export function buildCategoryTree(products) {
  const groups = new Map()
  const groupFor = (cat) => {
    if (!groups.has(cat.id)) groups.set(cat.id, { id: cat.id, name: cat.name, children: [] })
    return groups.get(cat.id)
  }
  products.forEach(p => {
    const cat = p.category
    if (!cat) return
    if (cat.parent) {
      const g = groupFor(cat.parent)
      if (!g.children.some(c => c.id === cat.id)) g.children.push({ id: cat.id, name: cat.name })
    } else {
      groupFor(cat)
    }
  })
  const byName = (a, b) => a.name.localeCompare(b.name)
  return [...groups.values()].sort(byName).map(g => ({ ...g, children: g.children.sort(byName) }))
}

// ¿El producto entra en la categoría elegida? (elegir una principal incluye sus subcategorías)
export function productInCategory(product, categoryId) {
  const cat = product.category
  return !!cat && (cat.id === categoryId || cat.parent?.id === categoryId)
}
