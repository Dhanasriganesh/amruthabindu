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
        { name: 'Oils', href: '/shop/oils', icon: '🫙' },
      ],
    },
    { name: 'Foods', href: '/shop/foods' },
    { name: 'Naturals', href: '/shop/naturals' },
    { name: 'Oils', href: '/shop/oils' },
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
    let nextSubmenu = submenu.map((sub) => ({
      name: sub.name || 'Link',
      href: sub.href || '/',
      icon: sub.icon || '•',
    }))

    // Ensure Oils appears under Shop for older CMS header documents
    const href = (item.href || '').toLowerCase()
    const isShop = item.name?.toLowerCase() === 'shop' || href === '/shop' || href.startsWith('/shop')
    if (isShop && nextSubmenu.length > 0) {
      const hasOils = nextSubmenu.some(
        (sub) =>
          (sub.href || '').includes('/shop/oils') ||
          (sub.name || '').toLowerCase() === 'oils'
      )
      if (!hasOils) {
        nextSubmenu = [...nextSubmenu, { name: 'Oils', href: '/shop/oils', icon: '🫙' }]
      }
    }

    return {
      name: item.name || 'Menu',
      href: item.href || '/',
      hasDropdown: nextSubmenu.length > 0,
      submenu: nextSubmenu,
    }
  })
}

export function mergeHeaderContent(cms) {
  if (!cms || typeof cms !== 'object') {
    return { ...DEFAULT_HEADER }
  }

  let navigation = mapCmsNavigation(cms.navigation)
  const hasTopLevelOils = navigation.some(
    (item) =>
      (item.href || '').includes('/shop/oils') || (item.name || '').toLowerCase() === 'oils'
  )
  if (!hasTopLevelOils) {
    const naturalsIndex = navigation.findIndex(
      (item) =>
        (item.href || '').includes('/shop/naturals') ||
        (item.name || '').toLowerCase() === 'naturals'
    )
    const oilsItem = { name: 'Oils', href: '/shop/oils' }
    if (naturalsIndex >= 0) {
      navigation = [
        ...navigation.slice(0, naturalsIndex + 1),
        oilsItem,
        ...navigation.slice(naturalsIndex + 1),
      ]
    } else {
      navigation = [...navigation, oilsItem]
    }
  }

  return {
    logo: cms.logo || DEFAULT_HEADER.logo,
    siteName: cms.siteName || DEFAULT_HEADER.siteName,
    tagline: cms.tagline || DEFAULT_HEADER.tagline,
    navigation,
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
