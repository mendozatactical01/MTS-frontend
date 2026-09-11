// Fixtures con la MISMA forma que van a tener los DTOs reales del backend
// (ver /home/nicolas/.claude/plans/optimized-beaming-hummingbird.md).
// Sirven para desarrollar el frontend de la tienda online mientras el
// backend de esta feature todavía no existe (Etapa A del plan).

export const mockProducts = [
  {
    id: 6,
    name: 'Gorra Táctica',
    description: 'Gorra táctica ajustable, tela ripstop resistente al agua. Ideal para uso diario o entrenamiento.',
    price: 25000,
    priceCash: 20000,
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80',
    published: true,
    weightKg: 0.2,
    category: { id: 9, name: 'Gorras' },
    sizes: null,
    available: true
  },
  {
    id: 7,
    name: 'Remera Combat V2',
    description: 'Remera de combate manga larga, tejido transpirable de secado rápido.',
    price: 35000,
    priceCash: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    published: true,
    weightKg: 0.3,
    category: { id: 1, name: 'Remeras' },
    sizes: [
      { id: 1, name: 'S', available: true },
      { id: 2, name: 'M', available: true },
      { id: 3, name: 'L', available: false },
      { id: 4, name: 'XL', available: true }
    ],
    available: true
  },
  {
    id: 8,
    name: 'Pantalón Ripstop G2',
    description: 'Pantalón táctico ripstop, refuerzos en rodillas, seis bolsillos.',
    price: 63000,
    priceCash: null,
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80',
    published: true,
    weightKg: 0.6,
    category: { id: 2, name: 'Pantalones' },
    sizes: [
      { id: 5, name: '38', available: true },
      { id: 6, name: '40', available: true },
      { id: 7, name: '42', available: true }
    ],
    available: true
  },
  {
    id: 9,
    name: 'Caña de Pescar Telescópica',
    description: 'Caña telescópica de fibra de carbono, 2.10m, ideal para pesca embarcada o costa.',
    price: 45000,
    priceCash: 40000,
    imageUrl: 'https://images.unsplash.com/photo-1445264918150-66e4d633c92c?w=600&q=80',
    published: true,
    weightKg: 0.4,
    category: { id: 5, name: 'Pesca' },
    sizes: null,
    available: true
  },
  {
    id: 10,
    name: 'Reel Frontal 3000',
    description: 'Reel frontal 5 rulemanes, drag máximo 8kg.',
    price: 38000,
    priceCash: 33000,
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80',
    published: true,
    weightKg: 0.35,
    category: { id: 5, name: 'Pesca' },
    sizes: null,
    available: true
  },
  {
    id: 11,
    name: 'Botas Trekking',
    description: 'Botas impermeables de trekking, suela antideslizante.',
    price: 78000,
    priceCash: 68000,
    imageUrl: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&q=80',
    published: false,
    weightKg: 1.1,
    category: { id: 3, name: 'Calzado' },
    sizes: [
      { id: 8, name: '40', available: true },
      { id: 9, name: '42', available: true },
      { id: 10, name: '44', available: false }
    ],
    available: true
  }
]

export const mockCombos = [
  {
    id: 1,
    name: 'Combo Pesca Iniciación',
    description: 'Caña telescópica + reel frontal, todo lo necesario para arrancar.',
    price: 76000,
    imageUrl: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&q=80',
    published: true,
    items: [
      { productId: 9, productName: 'Caña de Pescar Telescópica', quantity: 1 },
      { productId: 10, productName: 'Reel Frontal 3000', quantity: 1 }
    ]
  },
  {
    id: 2,
    name: 'Combo Táctico Verano',
    description: 'Gorra táctica + remera combat, el equipo básico.',
    price: 52000,
    imageUrl: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&q=80',
    published: true,
    items: [
      { productId: 6, productName: 'Gorra Táctica', quantity: 1 },
      { productId: 7, productName: 'Remera Combat V2', quantity: 1 }
    ]
  }
]

export const mockShippingZones = [
  { id: 1, provinceName: 'Mendoza',      baseCost: 0,    costPerExtraKg: 0,    freeShippingThreshold: null,  estimatedDays: '1-2', active: true },
  { id: 2, provinceName: 'Buenos Aires', baseCost: 4500, costPerExtraKg: 900,  freeShippingThreshold: 100000, estimatedDays: '3-5', active: true },
  { id: 3, provinceName: 'Córdoba',      baseCost: 4000, costPerExtraKg: 800,  freeShippingThreshold: 100000, estimatedDays: '3-4', active: true },
  { id: 4, provinceName: 'Santa Fe',     baseCost: 4000, costPerExtraKg: 800,  freeShippingThreshold: 100000, estimatedDays: '3-4', active: true },
  { id: 5, provinceName: 'San Juan',     baseCost: 3000, costPerExtraKg: 700,  freeShippingThreshold: 80000,  estimatedDays: '2-3', active: true },
  { id: 6, provinceName: 'Neuquén',      baseCost: 5500, costPerExtraKg: 1100, freeShippingThreshold: null,   estimatedDays: '4-6', active: true },
  { id: 7, provinceName: 'Salta',        baseCost: 6500, costPerExtraKg: 1300, freeShippingThreshold: null,   estimatedDays: '5-7', active: true }
]

export const mockOrders = [
  {
    id: 1,
    accessToken: 'demo-token-1234',
    status: 'PAID',
    customerName: 'Juan Pérez',
    customerEmail: 'juan.perez@example.com',
    customerPhone: '2611234567',
    customerDni: '30123456',
    shippingStreet: 'San Martín',
    shippingNumber: '450',
    shippingCity: 'Ciudad de Mendoza',
    shippingPostalCode: '5500',
    shippingZoneId: 1,
    notes: '',
    subtotal: 76000,
    shippingCost: 0,
    total: 76000,
    mpPaymentStatus: 'approved',
    saleId: 29,
    items: [
      { itemType: 'COMBO', comboId: 1, productId: null, sizeId: null, quantity: 1, unitPrice: 76000, productNameSnapshot: 'Combo Pesca Iniciación' }
    ],
    createdAt: '2026-09-10T14:22:00',
    expiresAt: '2026-09-10T14:52:00'
  }
]

export function delay(ms = 250) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
