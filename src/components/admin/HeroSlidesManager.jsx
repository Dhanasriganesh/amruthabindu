import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react'
import { fetchAllHeroSlides, addHeroSlide, updateHeroSlide, deleteHeroSlide, toggleSlideActive } from '../../services/heroSlides'

function HeroSlidesManager() {
  const [slides, setSlides] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingSlide, setEditingSlide] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState({
    image: '',
    title: '',
    titleAccent: '',
    description: '',
    ctaPrimary: 'Explore Products',
    ctaPrimaryLink: '/shop',
    ctaSecondary: 'Our Story',
    ctaSecondaryLink: '/about',
    order: 0,
    isActive: true
  })

  useEffect(() => {
    loadSlides()
  }, [])

  const loadSlides = async () => {
    setIsLoading(true)
    const data = await fetchAllHeroSlides()
    setSlides(data)
    setIsLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const startEdit = (slide) => {
    setEditingSlide(slide.id)
    setFormData({
      image: slide.image,
      title: slide.title,
      titleAccent: slide.titleAccent,
      description: slide.description,
      ctaPrimary: slide.ctaPrimary,
      ctaPrimaryLink: slide.ctaPrimaryLink,
      ctaSecondary: slide.ctaSecondary,
      ctaSecondaryLink: slide.ctaSecondaryLink,
      order: slide.order,
      isActive: slide.isActive
    })
    setIsAddingNew(false)
  }

  const startAddNew = () => {
    setIsAddingNew(true)
    setEditingSlide(null)
    setFormData({
      image: '',
      title: '',
      titleAccent: '',
      description: '',
      ctaPrimary: 'Explore Products',
      ctaPrimaryLink: '/shop',
      ctaSecondary: 'Our Story',
      ctaSecondaryLink: '/about',
      order: slides.length,
      isActive: true
    })
  }

  const cancelEdit = () => {
    setEditingSlide(null)
    setIsAddingNew(false)
    setFormData({
      image: '',
      title: '',
      titleAccent: '',
      description: '',
      ctaPrimary: 'Explore Products',
      ctaPrimaryLink: '/shop',
      ctaSecondary: 'Our Story',
      ctaSecondaryLink: '/about',
      order: 0,
      isActive: true
    })
  }

  const handleSave = async () => {
    if (!formData.image || !formData.title) {
      alert('Please fill in required fields (Image URL and Title)')
      return
    }

    const result = isAddingNew
      ? await addHeroSlide(formData)
      : await updateHeroSlide(editingSlide, formData)

    if (result.success) {
      alert(isAddingNew ? 'Slide added successfully!' : 'Slide updated successfully!')
      cancelEdit()
      loadSlides()
    } else {
      alert('Error: ' + (result.error || 'Failed to save slide'))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this slide?')) return

    const result = await deleteHeroSlide(id)
    if (result.success) {
      alert('Slide deleted successfully!')
      loadSlides()
    } else {
      alert('Error: ' + (result.error || 'Failed to delete slide'))
    }
  }

  const handleToggleActive = async (id, currentStatus) => {
    const result = await toggleSlideActive(id, !currentStatus)
    if (result.success) {
      loadSlides()
    } else {
      alert('Error: ' + (result.error || 'Failed to toggle slide status'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading slides...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hero Carousel Manager</h2>
          <p className="text-gray-600 mt-1">Manage homepage hero carousel slides</p>
        </div>
        <button
          onClick={startAddNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add New Slide
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingSlide) && (
        <div className="bg-white border-2 border-emerald-500 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {isAddingNew ? 'Add New Slide' : 'Edit Slide'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL * <span className="text-gray-500">(e.g., /top.jpg or full URL)</span>
              </label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="/top.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title * <span className="text-gray-500">(Line 1)</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Timeless Beauty,"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Title Accent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title Accent <span className="text-gray-500">(Line 2, gold color)</span>
              </label>
              <input
                type="text"
                name="titleAccent"
                value={formData.titleAccent}
                onChange={handleInputChange}
                placeholder="Naturally Yours"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Experience the authentic power..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Primary CTA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Button Text
              </label>
              <input
                type="text"
                name="ctaPrimary"
                value={formData.ctaPrimary}
                onChange={handleInputChange}
                placeholder="Explore Products"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Button Link
              </label>
              <input
                type="text"
                name="ctaPrimaryLink"
                value={formData.ctaPrimaryLink}
                onChange={handleInputChange}
                placeholder="/shop"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Secondary CTA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Button Text
              </label>
              <input
                type="text"
                name="ctaSecondary"
                value={formData.ctaSecondary}
                onChange={handleInputChange}
                placeholder="Our Story"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secondary Button Link
              </label>
              <input
                type="text"
                name="ctaSecondaryLink"
                value={formData.ctaSecondaryLink}
                onChange={handleInputChange}
                placeholder="/about"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Order & Active */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Active (Show on website)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Save size={18} />
              Save Slide
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Slides List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Existing Slides ({slides.length})
          </h3>

          {slides.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="mx-auto mb-4" size={48} />
              <p>No slides yet. Add your first hero slide!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    slide.isActive ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder.png'
                          e.target.alt = 'Image not found'
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900">
                            {slide.title} {slide.titleAccent}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {slide.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>Order: {slide.order}</span>
                            <span>CTA: {slide.ctaPrimary} → {slide.ctaPrimaryLink}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleActive(slide.id, slide.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              slide.isActive
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            title={slide.isActive ? 'Hide slide' : 'Show slide'}
                          >
                            {slide.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button
                            onClick={() => startEdit(slide)}
                            className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                            title="Edit slide"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(slide.id)}
                            className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                            title="Delete slide"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• For best results, use landscape images (16:9 ratio recommended)</li>
          <li>• Image size: 1920x1080px or larger for high quality</li>
          <li>• Slides will auto-rotate every 5 seconds</li>
          <li>• Inactive slides won't show on the website but are saved in database</li>
          <li>• Use Order number to control the sequence (0, 1, 2...)</li>
        </ul>
      </div>
    </div>
  )
}

export default HeroSlidesManager

