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
        { name: 'Dehydrated Powders', href: '/shop/dehydrated-powders', icon: '🌱' },
        { name: 'Health mix', href: '/shop/health-mix', icon: '🥣' },
        { name: 'Wood Pressed Oils', href: '/shop/wood-pressed-oils', icon: '🫙' },
      ],
    },
    { name: 'Dehydrated Powders', href: '/shop/dehydrated-powders' },
    { name: 'Health mix', href: '/shop/health-mix' },
    { name: 'Wood Pressed Oils', href: '/shop/wood-pressed-oils' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
}

const CATEGORY_NAV_TARGETS = [
  {
    name: 'Dehydrated Powders',
    href: '/shop/dehydrated-powders',
    icon: '🌱',
    matchNames: ['dehydrated powders', 'naturals'],
    matchHrefs: ['/shop/dehydrated-powders', '/shop/naturals'],
  },
  {
    name: 'Health mix',
    href: '/shop/health-mix',
    icon: '🥣',
    matchNames: ['health mix', 'foods'],
    matchHrefs: ['/shop/health-mix', '/shop/foods'],
  },
  {
    name: 'Wood Pressed Oils',
    href: '/shop/wood-pressed-oils',
    icon: '🫙',
    matchNames: ['wood pressed oils', 'oils'],
    matchHrefs: ['/shop/wood-pressed-oils', '/shop/oils'],
  },
]

function matchesCategoryNav(item, target) {
  const name = (item.name || '').trim().toLowerCase()
  const href = (item.href || '').trim().toLowerCase()
  return target.matchNames.includes(name) || target.matchHrefs.some((h) => href.includes(h))
}

function normalizeNavItem(item) {
  for (const target of CATEGORY_NAV_TARGETS) {
    if (matchesCategoryNav(item, target)) {
      return { ...item, name: target.name, href: target.href, icon: item.icon || target.icon }
    }
  }
  return item
}

/** Map CMS navigation items to the shape Header expects */
export function mapCmsNavigation(cmsNav) {
  if (!Array.isArray(cmsNav) || cmsNav.length === 0) {
    return DEFAULT_HEADER.navigation
  }

  return cmsNav.map((item) => {
    const submenu = Array.isArray(item.submenu) ? item.submenu : []
    let nextSubmenu = submenu.map((sub) => {
      const mapped = normalizeNavItem({
        name: sub.name || 'Link',
        href: sub.href || '/',
        icon: sub.icon || '•',
      })
      return mapped
    })

    const href = (item.href || '').toLowerCase()
    const isShop =
      item.name?.toLowerCase() === 'shop' || href === '/shop' || href.startsWith('/shop')
    if (isShop && nextSubmenu.length > 0) {
      for (const target of CATEGORY_NAV_TARGETS) {
        const hasCategory = nextSubmenu.some((sub) => matchesCategoryNav(sub, target))
        if (!hasCategory) {
          nextSubmenu = [
            ...nextSubmenu,
            { name: target.name, href: target.href, icon: target.icon },
          ]
        }
      }
    }

    const normalizedItem = normalizeNavItem({
      name: item.name || 'Menu',
      href: item.href || '/',
    })

    return {
      name: normalizedItem.name,
      href: normalizedItem.href,
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

  for (const target of CATEGORY_NAV_TARGETS) {
    const hasTopLevel = navigation.some((item) => matchesCategoryNav(item, target))
    if (!hasTopLevel) {
      const shopIndex = navigation.findIndex(
        (item) =>
          (item.name || '').toLowerCase() === 'shop' || (item.href || '') === '/shop'
      )
      const insertAt = shopIndex >= 0 ? shopIndex + 1 : navigation.length
      navigation = [
        ...navigation.slice(0, insertAt),
        { name: target.name, href: target.href },
        ...navigation.slice(insertAt),
      ]
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
