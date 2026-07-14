/** Stable slugs for merging catalog into Firestore without duplicates */
export const CATALOG_PRODUCT_SLUGS = {
  GROUNDNUT_OIL: 'cold-pressed-groundnut-oil',
  WHITE_SESAME_OIL: 'cold-pressed-white-sesame-oil',
  COCONUT_OIL: 'cold-pressed-kuridi-coconut-oil',
  CURRY_LEAF_POWDER: 'dehydrated-curry-leaf-powder',
  DIGESTIVE_BLEND: 'digestive-blend',
}

function catalogProduct({
  id,
  catalogSlug,
  name,
  category = 'naturals',
  description,
  fullDescription,
  benefits,
  keyBenefits,
  ingredients,
  image,
  sizes,
  priority = 1,
}) {
  return {
    id,
    catalogSlug,
    name,
    category,
    type: 'regular',
    priority,
    description,
    fullDescription,
    benefits,
    keyBenefits,
    ingredients,
    sizes,
    rating: 4.8,
    reviews: 0,
    images: [image],
  }
}

export const NATURALS_CATALOG_PRODUCTS = [
  catalogProduct({
    id: 202607101,
    catalogSlug: CATALOG_PRODUCT_SLUGS.GROUNDNUT_OIL,
    name: 'Cold-Pressed Groundnut Oil (Wood Pressed)',
    category: 'oils',
    description:
      'Premium wood-pressed groundnut oil extracted from carefully selected peanuts to preserve its natural flavor, aroma, and nutrients.',
    fullDescription:
      'Amrutha Bindu Cold-Pressed Groundnut Oil is traditionally extracted from premium-quality groundnuts using the wood-pressed (cold-pressed) method. This gentle extraction process helps preserve the oil’s natural nutrients, rich aroma, and authentic taste without the use of heat, chemicals, or preservatives. Its high smoke point and rich flavor make it an excellent choice for everyday cooking, frying, sautéing, and traditional recipes.',
    benefits:
      'Traditionally wood-pressed to retain natural nutrients\nRich in naturally occurring healthy fats and vitamin E\nSupports heart health as part of a balanced diet\nHigh smoke point, suitable for everyday cooking\nEnhances the flavor and aroma of food\nFree from preservatives, chemicals, and artificial additives\nMinimally processed to preserve natural goodness',
    keyBenefits:
      '100% Natural\nWood Pressed (Cold Pressed)\nNo Preservatives\nNo Chemicals\nRich in Vitamin E\nPremium Quality Groundnut Oil',
    ingredients: '100% Groundnuts (Peanuts)',
    image: '/products-images/cold-pressed-groundnuts-oil.png',
    sizes: [
      { sku: 'AB-GO-500', size: '500 ml', weight: '0.50 kg', price: 219, stock: 50 },
      { sku: 'AB-GO-1000', size: '1000 ml (1 L)', weight: '1.00 kg', price: 449, stock: 50 },
    ],
  }),
  catalogProduct({
    id: 202607102,
    catalogSlug: CATALOG_PRODUCT_SLUGS.WHITE_SESAME_OIL,
    name: 'Cold-Pressed White Sesame Oil (Wood Pressed)',
    category: 'oils',
    description:
      'Premium wood-pressed white sesame oil extracted from carefully selected sesame seeds to preserve its natural aroma, nutrients, and authentic taste.',
    fullDescription:
      'Amrutha Bindu Cold-Pressed White Sesame Oil is traditionally extracted from premium-quality white sesame seeds using the wood-pressed (cold-pressed) method. This natural extraction process helps retain the oil’s original nutrients, rich aroma, and distinctive flavor without the use of heat, chemicals, or preservatives. Ideal for everyday cooking, seasoning, and traditional recipes, it offers a wholesome and natural choice for your kitchen.',
    benefits:
      'Traditionally wood-pressed to preserve natural nutrients\nRich in naturally occurring healthy fats and antioxidants\nSupports heart health as part of a balanced diet\nEnhances the flavor and aroma of food\nFree from preservatives, chemicals, and artificial additives\nSuitable for everyday cooking and traditional recipes\nMinimally processed to retain natural goodness',
    keyBenefits:
      '100% Natural\nWood Pressed (Cold Pressed)\nNo Preservatives\nNo Chemicals\nRich in Natural Antioxidants\nPremium Quality Sesame Oil',
    ingredients: '100% White Sesame Seeds',
    image: '/products-images/cold-pressed-whiteseam-oil.png',
    sizes: [
      { sku: 'AB-WSO-500', size: '500 ml', weight: '0.50 kg', price: 379, stock: 50 },
      { sku: 'AB-WSO-1000', size: '1000 ml (1 L)', weight: '1.00 kg', price: 749, stock: 50 },
    ],
  }),
  catalogProduct({
    id: 202607103,
    catalogSlug: CATALOG_PRODUCT_SLUGS.COCONUT_OIL,
    name: 'Cold-Pressed Kuridi Coconut Cooking Oil (Wood Pressed)',
    category: 'oils',
    description:
      'Premium wood-pressed coconut cooking oil extracted from carefully selected Kuridi coconuts to preserve its natural aroma, nutrients, and authentic flavor.',
    fullDescription:
      'Amrutha Bindu Cold-Pressed Kuridi Coconut Cooking Oil is traditionally extracted from premium Kuridi coconuts using the wood-pressed (cold-pressed) method. This gentle extraction process helps retain the oil’s natural nutrients, aroma, and flavor without the use of heat, chemicals, or preservatives. Ideal for everyday cooking, sautéing, and seasoning, it offers a pure and natural choice for healthy living.',
    benefits:
      'Traditionally wood-pressed to retain natural nutrients\nFree from preservatives, chemicals, and artificial additives\nRich in naturally occurring healthy fats\nEnhances the flavor and aroma of food\nSuitable for everyday cooking\nMinimally processed to preserve natural goodness\nMade from premium-quality Kuridi coconuts',
    keyBenefits:
      '100% Natural\nWood Pressed (Cold Pressed)\nNo Preservatives\nNo Chemicals\nMinimally Processed\nRich Natural Aroma & Flavor',
    ingredients: '100% Kuridi Coconut',
    image: '/products-images/cold-pressed-coconut-oil.png',
    sizes: [
      { sku: 'AB-CO-500', size: '500 ml', weight: '0.50 kg', price: 509, stock: 50 },
      { sku: 'AB-CO-1000', size: '1000 ml (1 L)', weight: '1.00 kg', price: 999, stock: 50 },
    ],
  }),
  catalogProduct({
    id: 202607104,
    catalogSlug: CATALOG_PRODUCT_SLUGS.CURRY_LEAF_POWDER,
    name: 'Dehydrated Curry Leaf Powder',
    description:
      'A nutrient-rich blend of dehydrated curry leaves and aromatic spices, crafted to add authentic flavor and natural goodness to your daily meals.',
    fullDescription:
      'Amrutha Bindu Dehydrated Curry Leaf Powder is made from carefully dehydrated curry leaves blended with coriander seed powder and cumin seed powder. Prepared using 100% natural ingredients without preservatives or added chemicals, this flavorful powder retains the natural aroma and nutrients of curry leaves. It can be sprinkled over rice, idli, dosa, curries, or mixed with ghee to enhance both taste and nutrition.',
    benefits:
      'Rich in natural antioxidants\nSupports healthy digestion\nSource of iron, calcium, and essential nutrients\nAdds authentic flavor and aroma to meals\nHelps support overall wellness\nConvenient and easy to use in everyday cooking\nMade from naturally dehydrated ingredients',
    keyBenefits:
      '100% Natural\nNo Preservatives\nNo Added Chemicals\nRich in Antioxidants\nSupports Healthy Digestion\nNutrient-Rich & Flavorful',
    ingredients: 'Dehydrated Curry Leaves, Coriander Seed Powder, Cumin Seed Powder',
    image: '/products-images/dehydrated-curry-leaf-powder.png',
    sizes: [{ sku: 'AB-CLP-100', size: '100 g', weight: '0.10 kg', price: 149, stock: 50 }],
  }),
  catalogProduct({
    id: 202607105,
    catalogSlug: CATALOG_PRODUCT_SLUGS.DIGESTIVE_BLEND,
    name: 'Digestive Blend',
    description:
      'A natural blend of traditional digestive spices that helps support healthy digestion and promotes everyday gut wellness.',
    fullDescription:
      'Amrutha Bindu Digestive Blend is a carefully crafted combination of coriander seeds, cumin seeds, fennel seeds, and ajwain. Made from 100% natural ingredients with no preservatives or added chemicals, this traditional blend is designed to support healthy digestion, reduce bloating, and refresh your digestive system. It can be enjoyed after meals or incorporated into your daily routine for natural digestive support.',
    benefits:
      'Supports healthy digestion\nHelps reduce bloating and gas\nPromotes gut comfort after meals\nRefreshes the digestive system naturally\nRich in natural antioxidants and essential nutrients\nMade from traditional digestive spices\nSuitable for daily consumption',
    keyBenefits:
      '100% Natural\nNo Preservatives\nNo Added Chemicals\nSupports Healthy Digestion\nHelps Reduce Bloating\nTraditional Herbal Blend',
    ingredients: 'Coriander Seeds, Cumin Seeds, Fennel Seeds (Sompu), Ajwain (Vamu)',
    image: '/products-images/digestive-blend.png',
    sizes: [{ sku: 'AB-DB-100', size: '100 g', weight: '0.10 kg', price: 119, stock: 50 }],
  }),
]
