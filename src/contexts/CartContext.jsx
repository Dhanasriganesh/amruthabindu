import React, { createContext, useContext, useEffect, useReducer, useState } from 'react'
import { useAuth } from './AuthContext'
import { saveCartSnapshot, loadCartSnapshot } from '../services/firebase-db'

const CartContext = createContext()

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload }
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(
        item => item.id === action.payload.id && item.size === action.payload.size
      )
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id && item.size === action.payload.size
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      return { ...state, items: [...state.items, action.payload] }
    }
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id && item.size === action.payload.size
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(
          item => !(item.id === action.payload.id && item.size === action.payload.size)
        )
      }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    default:
      return state
  }
}

const getInitialItems = () => {
  try {
    const ls = localStorage.getItem('cart_items')
    if (ls) return JSON.parse(ls)
  } catch {}
  return []
}

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [state, dispatch] = useReducer(cartReducer, { items: getInitialItems() })
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [notificationItem, setNotificationItem] = useState(null)

  // Hydrate cart from Supabase or localStorage on load and when user changes
  useEffect(() => {
    async function hydrate() {
      try {
        if (currentUser) {
          const items = await loadCartSnapshot(currentUser.id)
          if (items && items.length > 0) {
            dispatch({ type: 'SET_ITEMS', payload: items })
            localStorage.setItem('cart_items', JSON.stringify(items))
            return
          }
        }
      } catch {}
      // Fallback localStorage
      const ls = localStorage.getItem('cart_items')
      if (ls) {
        try {
          const items = JSON.parse(ls)
          dispatch({ type: 'SET_ITEMS', payload: items })
        } catch {}
      }
    }
    hydrate()
  }, [currentUser])

  // Persist cart to Supabase (if logged in) and localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(state.items))
    async function persist() {
      if (!currentUser) return
      try {
        await saveCartSnapshot(currentUser.id, state.items)
      } catch {}
    }
    persist()
  }, [state.items, currentUser])

  const addToCart = (product, size, quantity = 1) => {
    if (!size) return
    const max = Number(size.stock || 0)
    if (max > 0 && quantity > max) {
      quantity = max
    }
    const cartItem = {
      id: product.id,
      name: product.name,
      category: product.category,
      size: size.size,
      sku: size.sku || null,
      weight: size.weight || null,
      price: size.price,
      quantity: quantity,
      image: product.images ? product.images[0] : (product.image || null),
      maxStock: size.stock,
      // Include bundle selection if present
      bundleSelection: size.bundleSelection || null
    }
    dispatch({ type: 'ADD_TO_CART', payload: cartItem })
    setNotificationItem(cartItem)
    setShowCartNotification(true)
    setTimeout(() => {
      setShowCartNotification(false)
      setNotificationItem(null)
    }, 3000)
  }

  const updateQuantity = (id, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, size)
      return
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, size, quantity } })
  }

  const removeFromCart = (id, size) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id, size } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const getCartTotal = () => state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  const getCartItemsCount = () => state.items.reduce((total, item) => total + item.quantity, 0)
  const getCartSavings = () => 0

  const value = {
    items: state.items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    getCartSavings,
    showCartNotification,
    setShowCartNotification,
    notificationItem
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
