import { create } from 'zustand'

export const useProductStore = create((set) => ({
  products: [],
  loading: false,

  fetchProducts: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      set({ products: Array.isArray(data) ? data : [] })
    } catch {
      set({ products: [] })
    } finally {
      set({ loading: false })
    }
  },

  createProduct: async (data) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const product = await res.json()
    set((s) => ({ products: [product, ...s.products] }))
    return product
  },

  updateProduct: async (id, data) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const product = await res.json()
    set((s) => ({ products: s.products.map((p) => (p._id === id ? product : p)) }))
    return product
  },

  deleteProduct: async (id) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    set((s) => ({ products: s.products.filter((p) => p._id !== id) }))
  },
}))
