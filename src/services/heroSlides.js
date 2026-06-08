import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

export const HERO_SLIDES_UPDATED_EVENT = 'heroSlidesUpdated'

function notifyHeroSlidesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(HERO_SLIDES_UPDATED_EVENT))
  }
}

function sortSlidesByOrder(slides) {
  return [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export const defaultSlides = [
  {
    id: 'default-1',
    image: '/top.jpg',
    title: 'Timeless Beauty,',
    titleAccent: 'Naturally Yours',
    description:
      'Experience the authentic power of traditional Ayurvedic powders. Handcrafted with pure, natural ingredients.',
    ctaPrimary: 'Explore Products',
    ctaPrimaryLink: '/shop',
    ctaSecondary: 'Our Story',
    ctaSecondaryLink: '/about',
    order: 0,
    isActive: true,
  },
]

function mapSlide(docSnap) {
  const slide = docSnap.data()
  return {
    id: docSnap.id,
    image: slide.image_url,
    title: slide.title,
    titleAccent: slide.title_accent,
    description: slide.description,
    ctaPrimary: slide.cta_primary_text,
    ctaPrimaryLink: slide.cta_primary_link,
    ctaSecondary: slide.cta_secondary_text,
    ctaSecondaryLink: slide.cta_secondary_link,
    order: slide.order,
    isActive: slide.is_active,
  }
}

function slideToFirestore(slideData) {
  return {
    image_url: slideData.image,
    title: slideData.title,
    title_accent: slideData.titleAccent,
    description: slideData.description,
    cta_primary_text: slideData.ctaPrimary,
    cta_primary_link: slideData.ctaPrimaryLink,
    cta_secondary_text: slideData.ctaSecondary,
    cta_secondary_link: slideData.ctaSecondaryLink,
    order: slideData.order ?? 0,
    is_active: slideData.isActive !== false,
  }
}

/** Fallback slide IDs are local-only until saved to Firestore. */
export function isPlaceholderSlideId(id) {
  return !id || String(id).startsWith('default-')
}

export async function fetchHeroSlides() {
  try {
    if (!db || !isFirebaseConfigured()) {
      return defaultSlides
    }

    const q = query(collection(db, 'hero_slides'), where('is_active', '==', true))
    const snap = await getDocs(q)

    if (snap.empty) return defaultSlides

    const slides = sortSlidesByOrder(snap.docs.map(mapSlide))
    console.log('✅ Loaded hero slides from Firebase:', slides.length)
    return slides
  } catch (error) {
    console.error('❌ Error fetching hero slides:', error)
    return defaultSlides
  }
}

export async function fetchAllHeroSlides() {
  try {
    if (!db || !isFirebaseConfigured()) return defaultSlides

    const snap = await getDocs(collection(db, 'hero_slides'))
    if (snap.empty) return defaultSlides
    return sortSlidesByOrder(snap.docs.map(mapSlide))
  } catch (error) {
    console.error('❌ Error fetching all hero slides:', error)
    return defaultSlides
  }
}

export async function addHeroSlide(slideData) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    const ref = await addDoc(collection(db, 'hero_slides'), slideToFirestore(slideData))
    notifyHeroSlidesUpdated()
    console.log('✅ Hero slide added successfully')
    return { success: true, data: { id: ref.id } }
  } catch (error) {
    console.error('❌ Error adding hero slide:', error)
    return { success: false, error: error.message }
  }
}

export async function updateHeroSlide(id, slideData) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    if (isPlaceholderSlideId(id)) {
      return addHeroSlide(slideData)
    }

    await updateDoc(doc(db, 'hero_slides', id), slideToFirestore(slideData))
    notifyHeroSlidesUpdated()
    console.log('✅ Hero slide updated successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error updating hero slide:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteHeroSlide(id) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    if (isPlaceholderSlideId(id)) {
      return { success: true }
    }

    await deleteDoc(doc(db, 'hero_slides', id))
    notifyHeroSlidesUpdated()
    console.log('✅ Hero slide deleted successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting hero slide:', error)
    return { success: false, error: error.message }
  }
}

export async function toggleSlideActive(id, isActive) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    if (isPlaceholderSlideId(id)) {
      const placeholder = defaultSlides.find((slide) => slide.id === id) || defaultSlides[0]
      return addHeroSlide({ ...placeholder, isActive })
    }

    await updateDoc(doc(db, 'hero_slides', id), { is_active: isActive })
    notifyHeroSlidesUpdated()
    console.log('✅ Hero slide status toggled')
    return { success: true }
  } catch (error) {
    console.error('❌ Error toggling slide status:', error)
    return { success: false, error: error.message }
  }
}
