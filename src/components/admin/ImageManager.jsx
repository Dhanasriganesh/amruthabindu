import React, { useState, useRef } from 'react'
import { Plus, Trash2, Upload, Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react'
import { uploadImageToStorage, deleteImageFromStorage, formatFileSize, compressImage } from '../../services/imageUpload'
import { STORAGE_FOLDERS } from '../../lib/firebase'

function ImageManager({ images = [], onChange, title = "Product Images", folder = "products" }) {
  const [newImageUrl, setNewImageUrl] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [addMethod, setAddMethod] = useState('url') // 'url' or 'upload'
  const [previewError, setPreviewError] = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      onChange([...images, newImageUrl.trim()])
      setNewImageUrl('')
      setShowAddInput(false)
      setAddMethod('url')
    }
  }

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert(`File size (${formatFileSize(file.size)}) exceeds 5MB limit. Please compress your image.`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Convert to base64 and save directly in DB (no Storage)
      // Compress first to keep payload reasonable
      const blob = await compressImage(file, 1200, 0.85)

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Failed to read compressed image'))
        reader.readAsDataURL(blob)
      })

      // Add to images array (dataUrl)
      onChange([...images, dataUrl])
      
      // Reset states
      setShowAddInput(false)
      setAddMethod('url')
      setUploading(false)
      setUploadProgress(0)
      
      // Show success message
      alert('Image added successfully! ✅')
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Image add failed: ${error.message}`)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileInputChange = (e) => {
    handleFileSelect(e.target.files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleRemoveImage = async (index) => {
    const imageUrl = images[index]
    
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      const confirmDelete = window.confirm('This will permanently delete the image from storage. Continue?')
      if (!confirmDelete) return

      await deleteImageFromStorage(imageUrl)
    }
    
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleImageError = (index) => {
    setPreviewError({ ...previewError, [index]: true })
  }

  const moveImage = (index, direction) => {
    const newImages = [...images]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < images.length) {
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]]
      onChange(newImages)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {title}
        </label>
        <button
          type="button"
          onClick={() => setShowAddInput(!showAddInput)}
          className="flex items-center gap-1 text-emerald-800 hover:text-emerald-600 text-sm font-medium"
        >
          <Plus size={16} />
          Add Image
        </button>
      </div>

      {/* Add Image Input */}
      {showAddInput && (
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="space-y-3">
            {/* Method Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAddMethod('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  addMethod === 'upload'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Upload size={16} />
                Upload from Device
              </button>
              <button
                type="button"
                onClick={() => setAddMethod('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  addMethod === 'url'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LinkIcon size={16} />
                Add by URL
              </button>
            </div>

            {/* Upload from Device */}
            {addMethod === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {/* Drag & Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-100'
                      : 'border-gray-300 hover:border-emerald-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {dragActive ? 'Drop image here' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, WebP up to 5MB
                  </p>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add by URL */}
            {addMethod === 'url' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddImage()
                    }
                  }}
                  placeholder="https://example.com/image.jpg or /images/product.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            )}

            {/* Action Buttons */}
            {addMethod === 'url' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddImage}
                  disabled={!newImageUrl.trim()}
                  className="flex-1 bg-emerald-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInput(false)
                    setNewImageUrl('')
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {addMethod === 'upload' && !uploading && (
              <button
                type="button"
                onClick={() => {
                  setShowAddInput(false)
                  setAddMethod('url')
                }}
                className="w-full bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden hover:border-emerald-500 transition-colors"
            >
              {/* Image Preview */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {!previewError[index] ? (
                  <img
                    src={imageUrl}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-xs text-gray-500 break-all">{imageUrl}</p>
                  </div>
                )}
              </div>

              {/* Image Controls Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  {/* Move Up */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, 'up')}
                      className="bg-white text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  
                  {/* Move Down */}
                  {index < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, 'down')}
                      className="bg-white text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                    title="Delete image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Image Index Badge */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                #{index + 1}
              </div>

              {/* Primary Badge (for first image) */}
              {index === 0 && (
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded font-semibold">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-600 mb-2">No images added yet</p>
          <p className="text-sm text-gray-500">Click "Add Image" to get started</p>
        </div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• The first image will be used as the primary/thumbnail image</p>
        <p>• Use arrow buttons to reorder images</p>
        <p>• Upload from device or paste URL</p>
        <p>• Maximum file size: 5MB • Formats: JPG, PNG, GIF, WebP</p>
      </div>
    </div>
  )
}

export default ImageManager

