import React, { useState, useEffect } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import ImageManager from './ImageManager'
import { saveHomeContentToSupabase, loadHomeContentFromSupabase } from '../../services/cms'

function HomeContentManager() {
  const [homeContent, setHomeContent] = useState({
    hero: {
      title: 'Amrutha Bindu',
      subtitle: 'Timeless Wisdom of Traditional Self-Care, Reimagined',
      ctaPrimary: 'Shop Now',
      ctaSecondary: 'Learn More',
      backgroundImage: '/top.jpg'
    },
    categories: {
      skinCareImage: '/4849388.jpg',
      hairCareImage: '/18965903.jpg',
      oralCareImage: '/hair.jpg'
    },
    about: {
      title: 'About Amrutha Bindu',
      description1: 'At Amrutha Bindu, we carry forward the timeless wisdom of traditional self-care, reimagined for today\'s world. Our products are crafted with natural, chemical-free ingredients, offering safe and effective alternatives to everyday personal care and wellness needs.',
      description2: 'From bath powders and hair care to nutritional supplements and tooth powders, each product is rooted in heritage and refined with care to suit modern lifestyles. We are committed to purity, sustainability, and trust – ensuring that every product is thoughtfully sourced, affordable, and family-friendly.'
    },
    features: [
      {
        title: '100% Natural Ingredients',
        description: 'Plant-based powders crafted without harsh chemicals or synthetics.'
      },
      {
        title: 'Safe For Family',
        description: 'Gentle on skin and hair, suitable for all ages.'
      },
      {
        title: 'Rooted In Tradition',
        description: 'Time-tested recipes inspired by authentic regional practices.'
      },
      {
        title: 'Loved By Customers',
        description: 'Consistent 5-star feedback for quality and value.'
      }
    ],
    testimonials: [
      {
        name: 'Priya Sharma',
        location: 'Mumbai',
        rating: 5,
        comment: 'Amazing natural products! My skin has never felt better. The Sassy Sunnipindi is my go-to for glowing skin.'
      },
      {
        name: 'Rajesh Kumar',
        location: 'Delhi',
        rating: 5,
        comment: 'The Anti Hairfall powder worked wonders for my hair. Natural, effective, and affordable - exactly what I was looking for.'
      },
      {
        name: 'Sunita Reddy',
        location: 'Bangalore',
        rating: 5,
        comment: 'Love the authenticity and quality. The products are gentle on skin and deliver amazing results. Highly recommended!'
      }
    ],
    cta: {
      title: 'Experience Natural Care Today',
      subtitle: 'Join thousands of satisfied customers who have embraced natural living',
      primaryButton: 'Start Shopping',
      secondaryButton: 'Get in Touch'
    }
  })

  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    // Load content from Supabase
    async function loadContent() {
      try {
        const supabaseContent = await loadHomeContentFromSupabase()
        if (supabaseContent && typeof supabaseContent === 'object') {
          // Merge with default to ensure all fields exist
          setHomeContent(prevContent => ({
            hero: { ...prevContent.hero, ...(supabaseContent.hero || {}) },
            categories: { ...prevContent.categories, ...(supabaseContent.categories || {}) },
            about: { ...prevContent.about, ...(supabaseContent.about || {}) },
            features: supabaseContent.features || prevContent.features,
            testimonials: supabaseContent.testimonials || prevContent.testimonials,
            cta: { ...prevContent.cta, ...(supabaseContent.cta || {}) }
          }))
        }
      } catch (error) {
        console.error('Failed to load home content:', error)
        // Keep default state if loading fails
      }
    }
    loadContent()
  }, [])

  const handleSave = async () => {
    // Save to Supabase
    const result = await saveHomeContentToSupabase(homeContent)
    
    if (result.success) {
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
      alert('Home content saved to database successfully!')
    } else {
      alert('Error: Failed to save to database. ' + result.error)
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default content?')) {
      localStorage.removeItem('admin_home_content')
      localStorage.removeItem('home_content')
      window.location.reload()
    }
  }

  const updateFeature = (index, field, value) => {
    const newFeatures = [...homeContent.features]
    newFeatures[index] = { ...newFeatures[index], [field]: value }
    setHomeContent({ ...homeContent, features: newFeatures })
  }

  const updateTestimonial = (index, field, value) => {
    const newTestimonials = [...homeContent.testimonials]
    newTestimonials[index] = { ...newTestimonials[index], [field]: value }
    setHomeContent({ ...homeContent, testimonials: newTestimonials })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Home Page Content</h3>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw size={20} />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isSaved
                ? 'bg-green-600 text-white'
                : 'bg-emerald-800 text-white hover:bg-emerald-700'
            }`}
          >
            <Save size={20} />
            {isSaved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Hero Section</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={homeContent.hero?.title || ''}
              onChange={(e) => setHomeContent({
                ...homeContent,
                hero: { ...homeContent.hero, title: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={homeContent.hero?.subtitle || ''}
              onChange={(e) => setHomeContent({
                ...homeContent,
                hero: { ...homeContent.hero, subtitle: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button</label>
              <input
                type="text"
                value={homeContent.hero?.ctaPrimary || ''}
                onChange={(e) => setHomeContent({
                  ...homeContent,
                  hero: { ...homeContent.hero, ctaPrimary: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
              <input
                type="text"
                value={homeContent.hero?.ctaSecondary || ''}
                onChange={(e) => setHomeContent({
                  ...homeContent,
                  hero: { ...homeContent.hero, ctaSecondary: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          {/* Hero Background Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hero Background Image</label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={homeContent.hero.backgroundImage || '/top.jpg'}
                  onChange={(e) => setHomeContent({
                    ...homeContent,
                    hero: { ...homeContent.hero, backgroundImage: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="/top.jpg"
                />
              </div>
              {homeContent.hero.backgroundImage && (
                <div className="w-32 h-20 border rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={homeContent.hero.backgroundImage}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Images Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Category Images</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skin Care Category Image</label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={homeContent.categories?.skinCareImage || '/4849388.jpg'}
                  onChange={(e) => setHomeContent({
                    ...homeContent,
                    categories: { ...homeContent.categories, skinCareImage: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="/4849388.jpg"
                />
              </div>
              {homeContent.categories?.skinCareImage && (
                <div className="w-20 h-20 border rounded-full overflow-hidden bg-gray-100">
                  <img
                    src={homeContent.categories.skinCareImage}
                    alt="Skin care preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hair Care Category Image</label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={homeContent.categories?.hairCareImage || '/18965903.jpg'}
                  onChange={(e) => setHomeContent({
                    ...homeContent,
                    categories: { ...homeContent.categories, hairCareImage: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="/18965903.jpg"
                />
              </div>
              {homeContent.categories?.hairCareImage && (
                <div className="w-20 h-20 border rounded-full overflow-hidden bg-gray-100">
                  <img
                    src={homeContent.categories.hairCareImage}
                    alt="Hair care preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Oral Care Category Image</label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={homeContent.categories?.oralCareImage || '/hair.jpg'}
                  onChange={(e) => setHomeContent({
                    ...homeContent,
                    categories: { ...homeContent.categories, oralCareImage: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="/hair.jpg"
                />
              </div>
              {homeContent.categories?.oralCareImage && (
                <div className="w-20 h-20 border rounded-full overflow-hidden bg-gray-100">
                  <img
                    src={homeContent.categories.oralCareImage}
                    alt="Oral care preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">About Section</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={homeContent.about?.title || ''}
              onChange={(e) => setHomeContent({
                ...homeContent,
                about: { ...homeContent.about, title: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description Paragraph 1</label>
            <textarea
              value={homeContent.about?.description1 || ''}
              onChange={(e) => setHomeContent({
                ...homeContent,
                about: { ...homeContent.about, description1: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description Paragraph 2</label>
            <textarea
              value={homeContent.about?.description2 || ''}
              onChange={(e) => setHomeContent({
                ...homeContent,
                about: { ...homeContent.about, description2: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              rows="3"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Features Section</h4>
        <div className="space-y-4">
          {(homeContent.features || []).map((feature, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3">Feature {index + 1}</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={feature?.title || ''}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={feature?.description || ''}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Testimonials</h4>
        <div className="space-y-4">
          {(homeContent.testimonials || []).map((testimonial, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3">Testimonial {index + 1}</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={testimonial?.name || ''}
                    onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={testimonial?.location || ''}
                    onChange={(e) => updateTestimonial(index, 'location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea
                    value={testimonial?.comment || ''}
                    onChange={(e) => updateTestimonial(index, 'comment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={testimonial?.rating || 5}
                    onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Call to Action Section</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={homeContent.cta?.title || ''}
              onChange={(e) => setHomeContent({
                ...homeContent,
                cta: { ...homeContent.cta, title: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={homeContent.cta?.subtitle || ''}
              onChange={(e) => setHomeContent({
                ...homeContent,
                cta: { ...homeContent.cta, subtitle: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button</label>
              <input
                type="text"
                value={homeContent.cta?.primaryButton || ''}
                onChange={(e) => setHomeContent({
                  ...homeContent,
                  cta: { ...homeContent.cta, primaryButton: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
              <input
                type="text"
                value={homeContent.cta?.secondaryButton || ''}
                onChange={(e) => setHomeContent({
                  ...homeContent,
                  cta: { ...homeContent.cta, secondaryButton: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
            isSaved
              ? 'bg-green-600 text-white'
              : 'bg-emerald-800 text-white hover:bg-emerald-700'
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

