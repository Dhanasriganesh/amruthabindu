import React, { useState, useEffect } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { saveHomeContentToSupabase, loadHomeContentFromSupabase } from '../../services/cms'
import { DEFAULT_HOME_CONTENT, mergeHomeContent } from '../../utils/homeContent'

function SectionHeadingFields({ heading, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          value={heading?.label || ''}
          onChange={(e) => onChange({ ...heading, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={heading?.title || ''}
          onChange={(e) => onChange({ ...heading, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
        <input
          type="text"
          value={heading?.subtitle || ''}
          onChange={(e) => onChange({ ...heading, subtitle: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>
  )
}

function ImageField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder={placeholder}
          />
        </div>
        {value && (
          <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-100 shrink-0">
            <img src={value} alt={`${label} preview`} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  )
}

function HomeContentManager() {
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    async function loadContent() {
      try {
        const stored = await loadHomeContentFromSupabase()
        if (stored && typeof stored === 'object') {
          setHomeContent(mergeHomeContent(stored))
        }
      } catch (error) {
        console.error('Failed to load home content:', error)
      }
    }
    loadContent()
  }, [])

  const handleSave = async () => {
    const result = await saveHomeContentToSupabase(homeContent)
    if (result.success) {
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
      alert('Home content saved successfully!')
    } else {
      alert('Error: Failed to save. ' + result.error)
    }
  }

  const handleReset = () => {
    if (window.confirm('Reset local cache and reload? Use Save to publish defaults to the site.')) {
      localStorage.removeItem('admin_home_content')
      localStorage.removeItem('home_content')
      window.location.reload()
    }
  }

  const updateFeature = (index, field, value) => {
    const features = [...homeContent.features]
    features[index] = { ...features[index], [field]: value }
    setHomeContent({ ...homeContent, features })
  }

  const updateTestimonial = (index, field, value) => {
    const testimonials = [...homeContent.testimonials]
    testimonials[index] = { ...testimonials[index], [field]: value }
    setHomeContent({ ...homeContent, testimonials })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Home Page Content</h3>
          <p className="text-sm text-gray-500 mt-1">
            Hero carousel is managed under Hero Slides. Everything below matches the live home page.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw size={20} />
            Reset Cache
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isSaved ? 'bg-green-600 text-white' : 'bg-emerald-800 text-white hover:bg-emerald-700'
            }`}
          >
            <Save size={20} />
            {isSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        The top hero banner is edited in <strong>Hero Slides</strong>. This page controls manifesto, categories,
        features, products heading, testimonials, and newsletter sections.
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Manifesto Section</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={homeContent.manifesto?.label || ''}
              onChange={(e) =>
                setHomeContent({
                  ...homeContent,
                  manifesto: { ...homeContent.manifesto, label: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline Line 1</label>
              <input
                type="text"
                value={homeContent.manifesto?.line1 || ''}
                onChange={(e) =>
                  setHomeContent({
                    ...homeContent,
                    manifesto: { ...homeContent.manifesto, line1: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline Line 2</label>
              <input
                type="text"
                value={homeContent.manifesto?.line2 || ''}
                onChange={(e) =>
                  setHomeContent({
                    ...homeContent,
                    manifesto: { ...homeContent.manifesto, line2: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={homeContent.manifesto?.description || ''}
              onChange={(e) =>
                setHomeContent({
                  ...homeContent,
                  manifesto: { ...homeContent.manifesto, description: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows="3"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Category Images</h4>
        <div className="space-y-4">
          <ImageField
            label="Foods Category Image"
            value={homeContent.categories?.foodsImage}
            placeholder="/face.jpg"
            onChange={(value) =>
              setHomeContent({
                ...homeContent,
                categories: { ...homeContent.categories, foodsImage: value },
              })
            }
          />
          <ImageField
            label="Naturals Category Image"
            value={homeContent.categories?.naturalsImage}
            placeholder="/hair.jpg"
            onChange={(value) =>
              setHomeContent({
                ...homeContent,
                categories: { ...homeContent.categories, naturalsImage: value },
              })
            }
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Features Section</h4>
        <SectionHeadingFields
          heading={homeContent.featuresHeading}
          onChange={(featuresHeading) => setHomeContent({ ...homeContent, featuresHeading })}
        />
        <div className="space-y-4">
          {(homeContent.features || []).map((feature, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3">Feature {index + 1}</h5>
              <div className="space-y-3">
                <input
                  type="text"
                  value={feature?.title || ''}
                  onChange={(e) => updateFeature(index, 'title', e.target.value)}
                  placeholder="Title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  value={feature?.description || ''}
                  onChange={(e) => updateFeature(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows="2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Bestsellers Section Heading</h4>
        <SectionHeadingFields
          heading={homeContent.productsHeading}
          onChange={(productsHeading) => setHomeContent({ ...homeContent, productsHeading })}
        />
        <p className="text-sm text-gray-500">Product cards are pulled automatically from your shop catalog.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Testimonials</h4>
        <SectionHeadingFields
          heading={homeContent.testimonialsHeading}
          onChange={(testimonialsHeading) => setHomeContent({ ...homeContent, testimonialsHeading })}
        />
        <div className="space-y-4">
          {(homeContent.testimonials || []).map((testimonial, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3">Testimonial {index + 1}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={testimonial?.name || ''}
                  onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={testimonial?.location || ''}
                  onChange={(e) => updateTestimonial(index, 'location', e.target.value)}
                  placeholder="Location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={testimonial?.avatar || ''}
                  onChange={(e) => updateTestimonial(index, 'avatar', e.target.value)}
                  placeholder="Avatar initials"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={testimonial?.customerImage || ''}
                  onChange={(e) => updateTestimonial(index, 'customerImage', e.target.value)}
                  placeholder="/reviews/r1.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                  value={testimonial?.comment || ''}
                  onChange={(e) => updateTestimonial(index, 'comment', e.target.value)}
                  placeholder="Comment"
                  className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows="2"
                />
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={testimonial?.rating || 5}
                  onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Newsletter Section</h4>
        <div className="space-y-4">
          <input
            type="text"
            value={homeContent.newsletter?.badge || ''}
            onChange={(e) =>
              setHomeContent({
                ...homeContent,
                newsletter: { ...homeContent.newsletter, badge: e.target.value },
              })
            }
            placeholder="Badge text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            value={homeContent.newsletter?.title || ''}
            onChange={(e) =>
              setHomeContent({
                ...homeContent,
                newsletter: { ...homeContent.newsletter, title: e.target.value },
              })
            }
            placeholder="Title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
          <textarea
            value={homeContent.newsletter?.subtitle || ''}
            onChange={(e) =>
              setHomeContent({
                ...homeContent,
                newsletter: { ...homeContent.newsletter, subtitle: e.target.value },
              })
            }
            placeholder="Subtitle"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            rows="2"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={homeContent.newsletter?.buttonText || ''}
              onChange={(e) =>
                setHomeContent({
                  ...homeContent,
                  newsletter: { ...homeContent.newsletter, buttonText: e.target.value },
                })
              }
              placeholder="Button text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              value={homeContent.newsletter?.successMessage || ''}
              onChange={(e) =>
                setHomeContent({
                  ...homeContent,
                  newsletter: { ...homeContent.newsletter, successMessage: e.target.value },
                })
              }
              placeholder="Success message"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
            isSaved ? 'bg-green-600 text-white' : 'bg-emerald-800 text-white hover:bg-emerald-700'
          }`}
        >
          <Save size={20} />
          {isSaved ? 'Saved!' : 'Save All Changes'}
        </button>
      </div>
    </div>
  )
}

export default HomeContentManager
