export const HEADER_CONTENT_UPDATED_EVENT = 'headerContentUpdated'

export const DEFAULT_HEADER = {
  logo: '/logo.png',
  siteName: 'Amrutha Bindu',
  tagline: 'Timeless Natural Care',
  navigation: [
    { name: 'Home', href: '/home' },
    {
      name: 'Shop',
      href: '/shop',
      hasDropdown: true,
      submenu: [
        { name: 'All Products', href: '/shop', icon: '🌿' },
        { name: 'Foods', href: '/shop/foods', icon: '🥣' },
        { name: 'Naturals', href: '/shop/naturals', icon: '🌱' },
      ],
    },
    { name: 'Foods', href: '/shop/foods' },
    { name: 'Naturals', href: '/shop/naturals' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
}

/** Map CMS navigation items to the shape Header expects */
export function mapCmsNavigation(cmsNav) {
  if (!Array.isArray(cmsNav) || cmsNav.length === 0) {
    return DEFAULT_HEADER.navigation
  }

  return cmsNav.map((item) => {
    const submenu = Array.isArray(item.submenu) ? item.submenu : []
    return {
      name: item.name || 'Menu',
      href: item.href || '/',
      hasDropdown: submenu.length > 0,
      submenu: submenu.map((sub) => ({
        name: sub.name || 'Link',
        href: sub.href || '/',
        icon: sub.icon || '•',
      })),
    }
  })
}

export function mergeHeaderContent(cms) {
  if (!cms || typeof cms !== 'object') {
    return { ...DEFAULT_HEADER }
  }

  return {
    logo: cms.logo || DEFAULT_HEADER.logo,
    siteName: cms.siteName || DEFAULT_HEADER.siteName,
    tagline: cms.tagline || DEFAULT_HEADER.tagline,
    navigation: mapCmsNavigation(cms.navigation),
  }
}

export function readHeaderContentCache() {
  try {
    const cached = localStorage.getItem('header_content')
    if (!cached) return null
    return mergeHeaderContent(JSON.parse(cached))
  } catch {
    return null
  }
}
