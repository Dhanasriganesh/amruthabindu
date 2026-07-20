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
    dehydratedPowdersImage: '/products-images/dehydrated-curry-leaf-powder.png',
    healthMixImage: '/products-images/digestive-blend.png',
    woodPressedOilsImage: '/products-images/cold-pressed-groundnuts-oil.png',
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
      name: 'Priya M.',
      location: 'Hyderabad, Telangana',
      avatar: 'PM',
      productName: 'Dehydrated Curry Leaf Powder',
      customerImage: '/products-images/dehydrated-curry-leaf-powder.png',
      rating: 5,
      comment:
        'The curry leaf powder is fresh, aromatic, and so easy to use. We sprinkle it on rice and dosa — pure, natural, and absolutely delicious.',
    },
    {
      name: 'Rajesh Kumar',
      location: 'Tirupati, Andhra Pradesh',
      avatar: 'RK',
      productName: 'Cold-Pressed Groundnut Oil',
      customerImage: '/products-images/cold-pressed-groundnuts-oil.png',
      rating: 5,
      comment:
        'Amrutha Bindu groundnut oil has a rich aroma and clean taste. Perfect for everyday cooking — you can tell it is wood-pressed and chemical-free.',
    },
    {
      name: 'Sunita Reddy',
      location: 'Bangalore, Karnataka',
      avatar: 'SR',
      productName: 'Digestive Blend',
      customerImage: '/products-images/digestive-blend.png',
      rating: 5,
      comment:
        'The Digestive Blend is a wonderful after-meal ritual for our family. Natural spices, no additives, and it genuinely helps with bloating.',
    },
    {
      name: 'Ramya K.',
      location: 'Chennai, Tamil Nadu',
      avatar: 'Ra',
      productName: 'Cold-Pressed Kuridi Coconut Oil',
      customerImage: '/products-images/cold-pressed-coconut-oil.png',
      rating: 5,
      comment:
        'This coconut oil smells authentic and cooks beautifully. Minimal processing, premium quality — exactly what we wanted for our kitchen.',
    },
    {
      name: 'Anitha S.',
      location: 'Vijayawada, Andhra Pradesh',
      avatar: 'AS',
      productName: 'Cold-Pressed White Sesame Oil',
      customerImage: '/products-images/cold-pressed-whiteseam-oil.png',
      rating: 5,
      comment:
        'The white sesame oil adds a lovely depth to our curries and chutneys. Traditional wood-pressed quality we trust for daily use.',
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
      productName: item?.productName || fallback.productName || '',
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
      dehydratedPowdersImage:
        cms.categories?.dehydratedPowdersImage ||
        cms.categories?.naturalsImage ||
        cms.categories?.hairCareImage ||
        DEFAULT_HOME_CONTENT.categories.dehydratedPowdersImage,
      healthMixImage:
        cms.categories?.healthMixImage ||
        cms.categories?.foodsImage ||
        cms.categories?.skinCareImage ||
        DEFAULT_HOME_CONTENT.categories.healthMixImage,
      woodPressedOilsImage:
        cms.categories?.woodPressedOilsImage ||
        cms.categories?.oilsImage ||
        DEFAULT_HOME_CONTENT.categories.woodPressedOilsImage,
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
  const [powders, healthMix, oils] = HOME_COLLECTION_CATEGORIES
  return [
    {
      ...powders,
      image: content.categories.dehydratedPowdersImage || powders.image,
    },
    {
      ...healthMix,
      image: content.categories.healthMixImage || healthMix.image,
    },
    {
      ...oils,
      image: content.categories.woodPressedOilsImage || oils.image,
    },
  ]
}
