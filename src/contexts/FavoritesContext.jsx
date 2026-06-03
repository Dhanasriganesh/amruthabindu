import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { saveFavorite, removeFavorite as removeFavoriteDB, loadFavorites } from '../services/firebase-db'

const FavoritesContext = createContext()

export const FavoritesProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState([])
  const [loading, setLoading] = useState(true)

  // Load favorites from localStorage or Supabase
  useEffect(() => {
    async function loadUserFavorites() {
      setLoading(true)
      try {
        if (currentUser) {
          // Load from Supabase for logged-in users
          const dbFavorites = await loadFavorites(currentUser.id)
          
          // Merge with localStorage favorites (guest favorites)
          const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
          const merged = [...new Set([...dbFavorites, ...localFavorites])]
          
          // If there are local favorites, save them to the user account
          if (localFavorites.length > 0) {
            for (const productId of localFavorites) {
              if (!dbFavorites.includes(productId)) {
                await saveFavorite(currentUser.id, productId)
              }
            }
          }
          
          setFavoriteIds(merged)
          localStorage.setItem('favorites', JSON.stringify(merged))
        } else {
          // Load from localStorage for guests
          const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
          setFavoriteIds(localFavorites)
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
        // Fallback to localStorage
        const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
        setFavoriteIds(localFavorites)
      } finally {
        setLoading(false)
      }
    }

    loadUserFavorites()
  }, [currentUser])

  const addFavorite = async (productId) => {
    try {
      const updated = [...favoriteIds, productId]
      setFavoriteIds(updated)
      localStorage.setItem('favorites', JSON.stringify(updated))
      
      if (currentUser) {
        await saveFavorite(currentUser.id, productId)
      }
    } catch (error) {
      console.error('Error adding favorite:', error)
    }
  }

  const removeFavorite = async (productId) => {
    try {
      const updated = favoriteIds.filter(id => id !== productId)
      setFavoriteIds(updated)
      localStorage.setItem('favorites', JSON.stringify(updated))
      
      if (currentUser) {
        await removeFavoriteDB(currentUser.id, productId)
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const toggleFavorite = async (productId) => {
    if (favoriteIds.includes(productId)) {
      await removeFavorite(productId)
    } else {
      await addFavorite(productId)
    }
  }

  const isFavorite = (productId) => {
    return favoriteIds.includes(productId)
  }

  const value = {
    favoriteIds,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    loading
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

