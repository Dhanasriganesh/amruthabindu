import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Leaf, Shield, Heart, Award, Users, Factory, Recycle } from 'lucide-react'

function About() {
  const location = useLocation()
  
  const getCurrentSection = () => {
    const path = location.pathname
    if (path.includes('our-story')) return 'story'
    if (path.includes('manufacturing')) return 'manufacturing'
    if (path.includes('sustainability')) return 'sustainability'
    if (path.includes('ingredients')) return 'ingredients'
    return 'main'
  }

  const currentSection = getCurrentSection()

  const navigation = [
    { id: 'main', label: 'About Us', href: '/about' },
    { id: 'story', label: 'Our Brand Story', href: '/about/our-story' },
    { id: 'manufacturing', label: 'Manufacturing & Quality', href: '/about/manufacturing' },
    { id: 'sustainability', label: 'Sustainability Promise', href: '/about/sustainability' },
    { id: 'ingredients', label: 'Our Ingredients', href: '/about/ingredients' }
  ]

  const MainAbout = () => (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          About Amrutha Bindu
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          We believe the best care comes from the wisdom of nature and the traditions passed down through generations.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-gradient-to-br from-[#FAF8F3] to-[#F0E5D0] p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            To bring back the purity of natural living and make traditional care accessible to every household. 
            Guided by our core values of <strong>purity, authenticity, affordability, and sustainability</strong>, 
            every product is crafted with respect for people, tradition, and the planet.
          </p>
          <p className="text-gray-700">
            What makes us unique is our commitment to blending heritage with modern convenience. Our formulations 
            are inspired by authentic recipes, manufactured in-house with carefully sourced natural ingredients, 
            and offered at prices that make natural care practical for families.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-[#F0E5D0] to-[#E5D4B8] p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
          <p className="text-gray-700">
            To build a community that embraces natural living and to revive forgotten traditions in a way that 
            fits today's lifestyle. With Amrutha Bindu, you don't just choose products – you choose a way 
            of life rooted in trust, care, and timeless wisdom.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Leaf className="w-12 h-12 text-green-800 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Purity</h3>
            <p className="text-gray-600">100% natural ingredients, free from harmful chemicals</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Heart className="w-12 h-12 text-green-800 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Authenticity</h3>
            <p className="text-gray-600">Traditional recipes passed down through generations</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Award className="w-12 h-12 text-green-800 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Affordability</h3>
            <p className="text-gray-600">Natural care accessible to every family</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Recycle className="w-12 h-12 text-green-800 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sustainability</h3>
            <p className="text-gray-600">Eco-friendly practices for a greener tomorrow</p>
          </div>
        </div>
      </section>

      {/* Team Message */}
      <section className="bg-gradient-to-br from-[#FAF8F3] to-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Team's Message</h2>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-700 mb-4">
            At Amrutha Bindu, we are more than just a brand – we are a team united by a shared passion 
            for natural living and the revival of timeless traditions. Every product we create is a reflection 
            of our belief that wellness should be pure, affordable, and accessible to all.
          </p>
          <p className="text-gray-700 mb-4">
            Our journey is guided by trust and authenticity. From sourcing natural ingredients to crafting each 
            blend with care, we put our hearts into ensuring that our customers receive only the best. We see 
            ourselves not just as makers of products, but as custodians of a legacy – one that belongs to every 
            family that chooses to live closer to nature.
          </p>
          <p className="text-gray-700">
            Together, as a team, we promise to continue innovating while staying true to our roots, so that with 
            Amrutha Bindu, you always experience care that is honest, natural, and lasting.
          </p>
        </div>
      </section>
    </div>
  )

  const BrandStory = () => (
    <div className="space-y-16">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Our Brand Story
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Every tradition carries a story, and ours begins with a simple belief – that nature knows best.
        </p>
      </section>

      <section className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Beginning</h2>
          <p className="text-gray-700">
            For generations, families have relied on herbal powders and natural remedies for everyday care, 
            but over time, these practices faded in the shadow of quick-fix, chemical alternatives.
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#FAF8F3] to-[#F0E5D0] p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Vision</h2>
          <p className="text-gray-700">
            Amrutha Bindu was born from the desire to bring these age-old recipes back into modern homes. 
            What started as a small effort to preserve family traditions has grown into a trusted brand that 
            makes natural care accessible, affordable, and relevant for today's lifestyles.
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#F0E5D0] to-[#E5D4B8] p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Promise</h2>
          <p className="text-gray-700">
            Each of our products is a reflection of this journey – crafted with purity, rooted in heritage, 
            and designed to nurture the body naturally. From the fragrance of freshly ground herbs to the 
            gentle touch of chemical-free ingredients, our legacy is built on authenticity, trust, and care.
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#F0E5D0] to-[#E5D4B8] p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The Legacy Continues</h2>
          <p className="text-gray-700">
            With Amrutha Bindu, we don't just offer products; we share a piece of tradition – one that 
            promises to stay true to its roots while embracing the needs of the present.
          </p>
        </div>
      </section>
    </div>
  )

  const Manufacturing = () => (
    <div className="space-y-16">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Manufacturing & Quality Assurance
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Every product is crafted with care in our in-house manufacturing unit, where tradition meets modern standards.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <Factory className="w-12 h-12 text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">In-House Manufacturing</h2>
            <p className="text-gray-700">
              We follow time-tested formulations using carefully sourced, natural ingredients to ensure purity 
              and effectiveness in every batch. Our manufacturing process combines traditional methods with 
              modern hygiene standards.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#FAF8F3] to-[#F0E5D0] p-8 rounded-lg">
            <Shield className="w-12 h-12 text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quality Standards</h2>
            <p className="text-gray-700">
              Quality is at the heart of what we do. From raw material selection to processing and final packaging, 
              each step is carried out under strict hygiene and safety protocols.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#F0E5D0] to-[#E5D4B8] p-8 rounded-lg">
            <Leaf className="w-12 h-12 text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Natural Ingredients</h2>
            <p className="text-gray-700">
              Our products are free from harmful chemicals, preservatives, and artificial additives – making them 
              safe for the whole family. Every ingredient is carefully selected for its natural properties and benefits.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#F0E5D0] to-[#E5D4B8] p-8 rounded-lg">
            <Award className="w-12 h-12 text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
            <p className="text-gray-700">
              By combining traditional methods with rigorous quality checks, we ensure that every product that 
              carries Amrutha Bindu name lives up to its promise of authenticity, trust, and natural care.
            </p>
          </div>
        </div>
      </section>
    </div>
  )

  const Sustainability = () => (
    <div className="space-y-16">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Sustainability & Natural Ingredients Promise
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          We are committed to creating products that are as kind to the planet as they are to people.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#FAF8F3] to-[#F0E5D0] p-8 rounded-lg">
            <Leaf className="w-12 h-12 text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Natural Ingredients Promise</h2>
            <p className="text-gray-700">
              Our promise begins with ingredients – every herb, grain, and natural extract is carefully chosen 
              for its purity, effectiveness, and safety. We avoid harmful chemicals, artificial fragrances, 
              and preservatives, ensuring that what you use is 100% natural and family-friendly.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#F0E5D0] to-[#E5D4B8] p-8 rounded-lg">
            <Recycle className="w-12 h-12 text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sustainable Practices</h2>
            <p className="text-gray-700">
              Sustainability guides the way we work. From sourcing ingredients responsibly to adopting eco-friendly 
              packaging practices, we strive to reduce our footprint while preserving traditional methods of wellness.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-[#F0E5D0] to-[#E5D4B8] p-8 rounded-lg">
            <Users className="w-12 h-12 text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Community Impact</h2>
            <p className="text-gray-700">
              We work directly with local farmers and suppliers to source our ingredients, supporting local 
              communities and ensuring fair trade practices.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <Heart className="w-12 h-12 text-green-800 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Promise to You</h2>
            <p className="text-gray-700">
              With every product, we not only protect your well-being but also contribute to a healthier, 
              greener tomorrow. Your choice to use natural products helps preserve traditional knowledge 
              and supports sustainable practices.
            </p>
          </div>
        </div>
      </section>
    </div>
  )

  const Ingredients = () => (
    <div className="space-y-16">
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Our Ingredients
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Discover the natural ingredients that make our products special
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            name: "Turmeric",
            benefits: "Anti-inflammatory, skin brightening, natural antiseptic",
            usage: "Used in skin care products for glowing complexion"
          },
          {
            name: "Sandalwood",
            benefits: "Cooling effect, natural fragrance, skin soothing",
            usage: "Premium ingredient in our luxury skin care range"
          },
          {
            name: "Neem",
            benefits: "Antibacterial, acne treatment, skin purification",
            usage: "Key ingredient in our problem-solving formulations"
          },
          {
            name: "Amla",
            benefits: "Rich in Vitamin C, hair strengthening, anti-aging",
            usage: "Essential in our hair care products for healthy hair"
          },
          {
            name: "Multani Mitti",
            benefits: "Deep cleansing, oil control, skin detoxification",
            usage: "Natural clay for deep pore cleansing"
          },
          {
            name: "Rose Petals",
            benefits: "Skin hydration, natural fragrance, anti-inflammatory",
            usage: "Adds gentle fragrance and skin benefits"
          }
        ].map((ingredient, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-3">{ingredient.name}</h3>
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Benefits:</h4>
              <p className="text-gray-600 text-sm">{ingredient.benefits}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Usage:</h4>
              <p className="text-gray-600 text-sm">{ingredient.usage}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )

  const renderContent = () => {
    switch (currentSection) {
      case 'story':
        return <BrandStory />
      case 'manufacturing':
        return <Manufacturing />
      case 'sustainability':
        return <Sustainability />
      case 'ingredients':
        return <Ingredients />
      default:
        return <MainAbout />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] via-[#FAF8F3] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <nav className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {navigation.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`w-full text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentSection === item.id
                    ? 'bg-emerald-800 text-white'
                    : 'text-gray-700 hover:bg-[#F5F5DC] hover:text-emerald-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  )
}

export default About
