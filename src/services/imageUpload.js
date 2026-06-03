import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../lib/firebase'

/**
 * Upload image to Firebase Storage
 * @param {File} file - Image file to upload
 * @param {string} folder - Storage folder (e.g., 'products', 'home', 'header')
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded image
 */
export async function uploadImageToStorage(file, folder = 'products', onProgress = null) {
  try {
    // Validate file
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file')
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB. Please compress your image.')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 9)
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}_${randomString}.${extension}`
    
    // Create storage reference
    const storageRef = ref(storage, `${folder}/${filename}`)
    
    // Upload file with progress monitoring
    const uploadTask = uploadBytesResumable(storageRef, file)
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress monitoring
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          if (onProgress) {
            onProgress(Math.round(progress))
          }
          console.log(`Upload progress: ${Math.round(progress)}%`)
        },
        (error) => {
          // Error handling
          console.error('Upload error:', error)
          reject(new Error(`Upload failed: ${error.message}`))
        },
        async () => {
          // Success - get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            console.log('✅ Image uploaded successfully:', downloadURL)
            resolve(downloadURL)
          } catch (error) {
            reject(new Error(`Failed to get download URL: ${error.message}`))
          }
        }
      )
    })
  } catch (error) {
    console.error('❌ Upload error:', error)
    throw error
  }
}

/**
 * Delete image from Firebase Storage
 * @param {string} imageUrl - Full Firebase Storage URL
 * @returns {Promise<boolean>} Success status
 */
export async function deleteImageFromStorage(imageUrl) {
  try {
    // Check if it's a Firebase Storage URL
    if (!imageUrl.includes('firebasestorage.googleapis.com')) {
      console.log('Not a Firebase Storage URL, skipping deletion')
      return false
    }

    // Extract path from URL
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
    if (!pathMatch) {
      throw new Error('Invalid Firebase Storage URL')
    }
    
    const path = decodeURIComponent(pathMatch[1])
    const imageRef = ref(storage, path)
    
    await deleteObject(imageRef)
    console.log('✅ Image deleted from storage')
    return true
  } catch (error) {
    console.error('❌ Delete error:', error)
    // Don't throw - deletion failure shouldn't block other operations
    return false
  }
}

/**
 * Compress image before upload (optional but recommended)
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (maxWidth / width) * height
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
  })
}

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate image dimensions
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export async function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => reject(new Error('Failed to load image'))
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
  })
}

