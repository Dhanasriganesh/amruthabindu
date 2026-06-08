import React, { useState, useEffect, useRef } from 'react'
import { Save, Plus, Trash2, RefreshCw, Upload, Link as LinkIcon } from 'lucide-react'
import { saveHeaderContentToSupabase, loadHeaderContentFromSupabase } from '../../services/cms'
import { HEADER_CONTENT_UPDATED_EVENT } from '../../utils/headerContent'
import { formatFileSize, compressImage } from '../../services/imageUpload'

function HeaderContentManager() {
  const [headerContent, setHeaderContent] = useState({
    logo: '/logo.png',
    siteName: 'Amrutha Bindu',
    navigation: [
      { name: 'Home', href: '/' },
      { 
        name: 'About Us', 
        href: '/about',
        submenu: []
      },
      { 
        name: 'Shop', 
        href: '/shop',
        submenu: [
          { name: 'All Products', href: '/shop' },
          { name: 'Foods', href: '/shop/foods' },
          { name: 'Naturals', href: '/shop/naturals' },
        ]
      },
      { name: 'Contact Us', href: '/contact' }
    ]
  })

  const [isSaved, setIsSaved] = useState(false)
  const [logoMethod, setLogoMethod] = useState('url')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const logoFileInputRef = useRef(null)

  useEffect(() => {
    // Load content from Supabase
    async function loadContent() {
      try {
        const supabaseContent = await loadHeaderContentFromSupabase()
        if (supabaseContent && typeof supabaseContent === 'object') {
          // Merge with default to ensure all fields exist
          setHeaderContent(prevContent => ({
            logo: supabaseContent.logo || prevContent.logo,
            siteName: supabaseContent.siteName || prevContent.siteName,
            navigation: supabaseContent.navigation || prevContent.navigation
          }))
        }
      } catch (error) {
        console.error('Failed to load header content:', error)
        // Keep default state if loading fails
      }
    }
    loadContent()
  }, [])

  const handleSave = async () => {
    // Save to Supabase
    const result = await saveHeaderContentToSupabase(headerContent)
    
    if (result.success) {
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
      window.dispatchEvent(new Event(HEADER_CONTENT_UPDATED_EVENT))
      alert('Header content saved to database successfully!')
    } else {
      alert('Error: Failed to save to database. ' + result.error)
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default header content?')) {
      localStorage.removeItem('admin_header_content')
      localStorage.removeItem('header_content')
      window.location.reload()
    }
  }

  const updateNavItem = (index, field, value) => {
    const newNav = [...headerContent.navigation]
    newNav[index] = { ...newNav[index], [field]: value }
    setHeaderContent({ ...headerContent, navigation: newNav })
  }

  const addNavItem = () => {
    setHeaderContent({
      ...headerContent,
      navigation: [
        ...headerContent.navigation,
        { name: 'New Item', href: '/', submenu: [] }
      ]
    })
  }

  const removeNavItem = (index) => {
    const newNav = headerContent.navigation.filter((_, i) => i !== index)
    setHeaderContent({ ...headerContent, navigation: newNav })
  }

  const addSubmenuItem = (navIndex) => {
    const newNav = [...headerContent.navigation]
    if (!newNav[navIndex].submenu) {
      newNav[navIndex].submenu = []
    }
    newNav[navIndex].submenu.push({ name: 'New Submenu Item', href: '/' })
    setHeaderContent({ ...headerContent, navigation: newNav })
  }

  const updateSubmenuItem = (navIndex, subIndex, field, value) => {
    const newNav = [...headerContent.navigation]
    newNav[navIndex].submenu[subIndex] = {
      ...newNav[navIndex].submenu[subIndex],
      [field]: value
    }
    setHeaderContent({ ...headerContent, navigation: newNav })
  }

  const removeSubmenuItem = (navIndex, subIndex) => {
    const newNav = [...headerContent.navigation]
    newNav[navIndex].submenu = newNav[navIndex].submenu.filter((_, i) => i !== subIndex)
    setHeaderContent({ ...headerContent, navigation: newNav })
  }

  const handleLogoFileSelect = async (files) => {
    if (!files || files.length === 0) return

    const file = files[0]

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(`File size (${formatFileSize(file.size)}) exceeds 5MB limit. Please use a smaller image.`)
      return
    }

    setUploading(true)

    try {
      const blob = await compressImage(file, 400, 0.85)

      const logoUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Failed to read compressed image'))
        reader.readAsDataURL(blob)
      })

      setHeaderContent((prev) => ({ ...prev, logo: logoUrl }))
      setLogoMethod('url')
      alert('Logo ready. Click "Save Changes" to store it in Firestore.')
    } catch (error) {
      console.error('Logo processing failed:', error)
      alert(`Logo processing failed: ${error.message}`)
    } finally {
      setUploading(false)
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = ''
      }
    }
  }

  const handleLogoFileInputChange = (e) => {
    handleLogoFileSelect(e.target.files)
  }

  const handleLogoDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleLogoFileSelect(e.dataTransfer.files)
  }

  const handleLogoDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Header Content Management</h3>
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

      {/* Logo & Site Name */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Logo & Branding</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setLogoMethod('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  logoMethod === 'upload'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload size={16} />
                Upload from Device
              </button>
              <button
                type="button"
                onClick={() => setLogoMethod('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  logoMethod === 'url'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LinkIcon size={16} />
                Enter URL
              </button>
            </div>

            {logoMethod === 'upload' && (
              <div className="mb-3">
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileInputChange}
                  className="hidden"
                />
                <div
                  onDragEnter={handleLogoDrag}
                  onDragLeave={handleLogoDrag}
                  onDragOver={handleLogoDrag}
                  onDrop={handleLogoDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-300 hover:border-emerald-400'
                  } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                  onClick={() => !uploading && logoFileInputRef.current?.click()}
                >
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {dragActive ? 'Drop logo here' : 'Click to choose a logo or drag & drop'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 5MB</p>
                </div>
                {uploading && (
                  <p className="mt-3 text-xs text-gray-600 text-center">Processing image...</p>
                )}
              </div>
            )}

            {logoMethod === 'url' && (
              <div className="flex gap-3 items-center mb-3">
                <input
                  type="text"
                  value={headerContent?.logo || ''}
                  onChange={(e) => setHeaderContent({ ...headerContent, logo: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="/logo.png"
                />
              </div>
            )}

            {headerContent?.logo && (
              <div className="flex items-center gap-3">
                <img
                  src={headerContent.logo}
                  alt="Logo preview"
                  className="h-14 w-auto max-w-full object-contain"
                />
                <p className="text-xs text-gray-500">
                  {headerContent.logo?.startsWith('data:')
                    ? 'Stored as base64 in Firestore when you save.'
                    : logoMethod === 'upload'
                      ? 'Preview updates after upload. Save changes to publish.'
                      : 'Enter a path (e.g. /logo.png) or a full image URL'}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
            <input
              type="text"
              value={headerContent?.siteName || ''}
              onChange={(e) => setHeaderContent({ ...headerContent, siteName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Amrutha Bindu"
            />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-bold text-gray-900">Navigation Menu</h4>
          <button
            onClick={addNavItem}
            className="flex items-center gap-2 text-emerald-800 hover:text-emerald-600 text-sm"
          >
            <Plus size={18} />
            Add Menu Item
          </button>
        </div>

        <div className="space-y-4">
          {(headerContent.navigation || []).map((item, navIndex) => (
            <div key={navIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-3">
                {/* Main Nav Item */}
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Menu Item Name
                      </label>
                      <input
                        type="text"
                        value={item?.name || ''}
                        onChange={(e) => updateNavItem(navIndex, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL Path
                      </label>
                      <input
                        type="text"
                        value={item?.href || ''}
                        onChange={(e) => updateNavItem(navIndex, 'href', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeNavItem(navIndex)}
                    className="text-red-600 hover:text-red-800 mt-8"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Submenu */}
                <div className="ml-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Submenu Items</label>
                    <button
                      onClick={() => addSubmenuItem(navIndex)}
                      className="text-emerald-800 hover:text-emerald-600 text-xs flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Submenu
                    </button>
                  </div>

                  {item.submenu && item.submenu.length > 0 && (
                    <div className="space-y-2">
                      {item.submenu.map((subItem, subIndex) => (
                        <div key={subIndex} className="flex gap-2 items-center bg-white p-2 rounded border">
                          <input
                            type="text"
                            placeholder="Submenu name"
                            value={subItem?.name || ''}
                            onChange={(e) => updateSubmenuItem(navIndex, subIndex, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="URL"
                            value={subItem?.href || ''}
                            onChange={(e) => updateSubmenuItem(navIndex, subIndex, 'href', e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => removeSubmenuItem(navIndex, subIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Header Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Additional Settings</h4>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Changes to the header will be reflected across all pages. 
              Make sure to test the navigation after saving changes.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            <p><strong>Available Features:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Search functionality (always enabled)</li>
              <li>User account icon</li>
              <li>Shopping cart with item count</li>
              <li>Favorites/wishlist icon</li>
              <li>Mobile responsive menu</li>
            </ul>
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

export default HeaderContentManager

