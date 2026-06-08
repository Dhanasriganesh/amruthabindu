import { HOME_COLLECTION_CATEGORIES } from '../constants/categories'

export const HOME_CONTENT_UPDATED_EVENT = 'homeContentUpdated'

export const DEFAULT_HOME_CONTENT = {
  manifesto: {
    label: 'Our Philosophy',
    line1: 'Rooted in Ritual.',
    line2: 'Crafted by Hand.',
    description:
      'Every powder tells a story of soil, sun, and generations of Ayurvedic wisdom — bottled without compromise.',
  },
  categories: {
    foodsImage: HOME_COLLECTION_CATEGORIES[0]?.image || '/face.jpg',
    naturalsImage: HOME_COLLECTION_CATEGORIES[1]?.image || '/hair.jpg',
  },
  featuresHeading: {
    label: 'The Amrutha Standard',
    title: 'Why Choose Us',
    subtitle: 'Where ancient wisdom meets modern purity standards',
  },
  features: [
    {
      title: '100% Natural',
      description: 'Pure botanicals, zero synthetics — gentle enough for daily ritual.',
    },
    {
      title: 'Family Safe',
      description: 'Thoughtfully blended for every age and skin type in your home.',
    },
    {
      title: 'Ancient Recipes',
      description: 'Formulas inherited from generations of traditional healers.',
    },
    {
      title: 'Small Batches',
      description: 'Handcrafted in limited runs for uncompromising freshness.',
    },
  ],
  productsHeading: {
    label: 'Curated',
    title: 'Bestsellers',
    subtitle: 'Loved across India for visible, gentle results',
  },
  testimonialsHeading: {
    label: 'Voices',
    title: 'What They Say',
    subtitle: 'Swipe through real stories — your page keeps scrolling down as usual',
  },
  testimonials: [
    {
      name: 'Priya',
      location: 'Hyderabad, Telangana',
      avatar: 'P',
      customerImage: '/reviews/r1.jpg',
      rating: 5,
      comment:
        'The Sunnipindi transformed my skin! Completely natural and so effective. I have recommended it to all my friends.',
    },
    {
      name: 'Rajesh Kumar',
      location: 'Tirupati, Andhra Pradesh',
      avatar: 'RK',
      customerImage: '/reviews/r2.jpg',
      rating: 5,
      comment:
        'Anti Hairfall powder is a game-changer. Natural ingredients, visible results — my hair feels stronger than ever.',
    },
    {
      name: 'Sunita Reddy',
      location: 'Bangalore, Karnataka',
      avatar: 'SR',
      customerImage: '/reviews/r4.jpg',
      rating: 5,
      comment:
        'Authentic quality and traditional recipes. Chemical-free and safe for my entire family. Highly recommended!',
    },
    {
      name: 'Ramya',
      location: 'Hyderabad, Telangana',
      avatar: 'R',
      customerImage: '/reviews/r3.jpg',
      rating: 5,
      comment: 'A ritual I look forward to every morning. Pure, luxurious, and trustworthy.',
    },
  ],
  newsletter: {
    badge: 'Exclusive offer',
    title: '10% Off Your First Ritual',
    subtitle: 'Join our circle for wellness wisdom, early access, and offers crafted for you.',
    buttonText: 'Subscribe',
    successMessage: 'Welcome to the family',
  },
}

function mergeFeatures(cmsFeatures, defaults) {
  if (!Array.isArray(cmsFeatures) || cmsFeatures.length === 0) return defaults
  return cmsFeatures.map((feature, index) => ({
    title: feature?.title || defaults[index]?.title || '',
    description: feature?.description || defaults[index]?.description || '',
  }))
}

function mergeTestimonials(cmsTestimonials, defaults) {
  if (!Array.isArray(cmsTestimonials) || cmsTestimonials.length === 0) return defaults
  return cmsTestimonials.map((item, index) => {
    const fallback = defaults[index] || {}
    const name = item?.name || fallback.name || 'Customer'
    return {
      name,
      location: item?.location || fallback.location || '',
      avatar: item?.avatar || fallback.avatar || name.slice(0, 2).toUpperCase(),
      customerImage: item?.customerImage || fallback.customerImage || '',
      rating: item?.rating || fallback.rating || 5,
      comment: item?.comment || fallback.comment || '',
    }
  })
}

/** Normalize legacy CMS shapes saved before the home page was wired up. */
export function mergeHomeContent(cms) {
  if (!cms || typeof cms !== 'object') {
    return { ...DEFAULT_HOME_CONTENT }
  }

  const legacyAbout = cms.about || {}
  const legacyCta = cms.cta || {}

  return {
    manifesto: {
      label: cms.manifesto?.label || legacyAbout.title || DEFAULT_HOME_CONTENT.manifesto.label,
      line1: cms.manifesto?.line1 || DEFAULT_HOME_CONTENT.manifesto.line1,
      line2: cms.manifesto?.line2 || DEFAULT_HOME_CONTENT.manifesto.line2,
      description:
        cms.manifesto?.description ||
        legacyAbout.description1 ||
        DEFAULT_HOME_CONTENT.manifesto.description,
    },
    categories: {
      foodsImage:
        cms.categories?.foodsImage ||
        cms.categories?.skinCareImage ||
        DEFAULT_HOME_CONTENT.categories.foodsImage,
      naturalsImage:
        cms.categories?.naturalsImage ||
        cms.categories?.hairCareImage ||
        DEFAULT_HOME_CONTENT.categories.naturalsImage,
    },
    featuresHeading: {
      label: cms.featuresHeading?.label || DEFAULT_HOME_CONTENT.featuresHeading.label,
      title: cms.featuresHeading?.title || DEFAULT_HOME_CONTENT.featuresHeading.title,
      subtitle: cms.featuresHeading?.subtitle || DEFAULT_HOME_CONTENT.featuresHeading.subtitle,
    },
    features: mergeFeatures(cms.features, DEFAULT_HOME_CONTENT.features),
    productsHeading: {
      label: cms.productsHeading?.label || DEFAULT_HOME_CONTENT.productsHeading.label,
      title: cms.productsHeading?.title || DEFAULT_HOME_CONTENT.productsHeading.title,
      subtitle: cms.productsHeading?.subtitle || DEFAULT_HOME_CONTENT.productsHeading.subtitle,
    },
    testimonialsHeading: {
      label: cms.testimonialsHeading?.label || DEFAULT_HOME_CONTENT.testimonialsHeading.label,
      title: cms.testimonialsHeading?.title || DEFAULT_HOME_CONTENT.testimonialsHeading.title,
      subtitle: cms.testimonialsHeading?.subtitle || DEFAULT_HOME_CONTENT.testimonialsHeading.subtitle,
    },
    testimonials: mergeTestimonials(cms.testimonials, DEFAULT_HOME_CONTENT.testimonials),
    newsletter: {
      badge: cms.newsletter?.badge || DEFAULT_HOME_CONTENT.newsletter.badge,
      title: cms.newsletter?.title || legacyCta.title || DEFAULT_HOME_CONTENT.newsletter.title,
      subtitle:
        cms.newsletter?.subtitle || legacyCta.subtitle || DEFAULT_HOME_CONTENT.newsletter.subtitle,
      buttonText:
        cms.newsletter?.buttonText ||
        legacyCta.primaryButton ||
        DEFAULT_HOME_CONTENT.newsletter.buttonText,
      successMessage:
        cms.newsletter?.successMessage || DEFAULT_HOME_CONTENT.newsletter.successMessage,
    },
  }
}

export function readHomeContentCache() {
  try {
    const cached = localStorage.getItem('home_content')
    if (!cached) return null
    return mergeHomeContent(JSON.parse(cached))
  } catch {
    return null
  }
}

export function buildHomeCategories(content) {
  const [foods, naturals] = HOME_COLLECTION_CATEGORIES
  return [
    {
      ...foods,
      image: content.categories.foodsImage || foods.image,
    },
    {
      ...naturals,
      image: content.categories.naturalsImage || naturals.image,
    },
  ]
}
