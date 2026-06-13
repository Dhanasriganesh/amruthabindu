import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, Phone, MapPin, Leaf, Heart, Award, ShieldCheck, MessageCircle } from 'lucide-react'
import { loadHeaderContent } from '../../services/cms'
import {
  DEFAULT_HEADER,
  HEADER_CONTENT_UPDATED_EVENT,
  mergeHeaderContent,
  readHeaderContentCache,
} from '../../utils/headerContent'
import {
  CONTACT_EMAIL,
  INSTAGRAM_URL,
  PHONE_DISPLAY,
  PHONE_TEL,
  MAPS_URL,
  SHOP_ADDRESS_LINES,
  WHATSAPP_URL,
} from '../../config/brand'

function Footer() {
  const currentYear = new Date().getFullYear()
  const [brand, setBrand] = useState({
    logo: DEFAULT_HEADER.logo,
    siteName: DEFAULT_HEADER.siteName,
    tagline: DEFAULT_HEADER.tagline,
  })

  const refreshBrand = useCallback(async () => {
    const cached = readHeaderContentCache()
    if (cached) {
      setBrand({
        logo: cached.logo,
        siteName: cached.siteName,
        tagline: cached.tagline,
      })
    }

    try {
      const content = await loadHeaderContent()
      if (content) {
        const merged = mergeHeaderContent(content)
        setBrand({
          logo: merged.logo,
          siteName: merged.siteName,
          tagline: merged.tagline,
        })
      }
    } catch (error) {
      console.error('Failed to load footer brand:', error)
    }
  }, [])

  useEffect(() => {
    refreshBrand()
    const onUpdated = () => refreshBrand()
    window.addEventListener(HEADER_CONTENT_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(HEADER_CONTENT_UPDATED_EVENT, onUpdated)
  }, [refreshBrand])

  return (
    <footer className="bg-gradient-to-br from-[#2d5f3f] via-[#1e4029] to-[#2d5f3f] text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 group">
              <img 
                src={brand.logo} 
                alt={brand.siteName} 
                className={`h-10 w-auto sm:h-12 max-h-12 object-contain transition-transform group-hover:scale-105 ${
                  brand.logo.startsWith('data:') ? '' : 'brightness-0 invert'
                }`} 
              />
              <div>
                <div className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {brand.siteName}
              </div>
                <div className="text-[10px] sm:text-xs text-[#d4a574] font-medium">
                  {brand.tagline}
                </div>
              </div>
            </Link>
            <p className="text-stone-200 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
              Handcrafted with love, rooted in tradition. We bring you the finest natural powders made from pure, chemical-free ingredients.
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs">
                <Leaf size={12} className="sm:w-3.5 sm:h-3.5 text-[#d4a574] flex-shrink-0" />
                <span>100% Natural</span>
            </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs">
                <ShieldCheck size={12} className="sm:w-3.5 sm:h-3.5 text-[#d4a574] flex-shrink-0" />
                <span>Safe & Pure</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-2 sm:gap-3">
              <a 
                href="https://www.facebook.com/amruthabindu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-[#d4a574] rounded-lg transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={16} className="sm:w-[18px] sm:h-[18px]" />
              </a>
              <a 
                href={INSTAGRAM_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-[#d4a574] rounded-lg transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={16} className="sm:w-[18px] sm:h-[18px]" />
              </a>
              <a 
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-[#d4a574] rounded-lg transition-all hover:scale-110"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
              </a>
              <a 
                href={`mailto:${CONTACT_EMAIL}`}
                className="p-2 sm:p-2.5 bg-white/10 hover:bg-[#d4a574] rounded-lg transition-all hover:scale-110"
                aria-label="Email"
              >
                <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#d4a574' }}>
              Quick Links
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              <li>
                <Link to="/" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  My Favorites
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#d4a574' }}>
              Categories
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              <li>
                <Link to="/shop/foods" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  Foods
                </Link>
              </li>
              <li>
                <Link to="/shop/naturals" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  Naturals
                </Link>
              </li>
            </ul>
            
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 mt-5 sm:mt-6" style={{ fontFamily: 'Playfair Display, serif', color: '#d4a574' }}>
              Policies
            </h3>
            <ul className="space-y-2 sm:space-y-2.5">
              <li>
                <Link to="/privacy" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-stone-200 hover:text-[#d4a574] transition-colors text-xs sm:text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-[#d4a574] rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                  Shipping Information
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#d4a574' }}>
              Get In Touch
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3 group">
                <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg group-hover:bg-[#d4a574] transition-colors flex-shrink-0">
                  <Mail size={14} className="sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs text-stone-300 mb-0.5 sm:mb-1">Email Us</div>
                  <a 
                    href={`mailto:${CONTACT_EMAIL}`} 
                    className="text-white hover:text-[#d4a574] transition-colors text-xs sm:text-sm font-medium break-all"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 group">
                <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg group-hover:bg-[#d4a574] transition-colors flex-shrink-0">
                  <Phone size={14} className="sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-stone-300 mb-0.5 sm:mb-1">Call Us</div>
                  <a 
                    href={`tel:${PHONE_TEL}`} 
                    className="text-white hover:text-[#d4a574] transition-colors text-xs sm:text-sm font-medium"
                  >
                    {PHONE_DISPLAY}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 group">
                <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg group-hover:bg-[#d4a574] transition-colors flex-shrink-0">
                  <MapPin size={14} className="sm:w-4 sm:h-4 mt-0.5" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-stone-300 mb-0.5 sm:mb-1">Visit Us</div>
                  <address className="text-white text-xs sm:text-sm not-italic leading-relaxed">
                    {SHOP_ADDRESS_LINES.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                    <a
                      href={MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-[#d4a574] hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </address>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-stone-300 text-center">
              © {currentYear} Amrutha Bindu. All rights reserved. Developed by{' '}
              <a 
                href="https://www.grahmind.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#d4a574] hover:underline transition-colors"
              >
                Grahmind Innovations
              </a>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-stone-300">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Award size={12} className="sm:w-3.5 sm:h-3.5 text-[#d4a574] flex-shrink-0" />
                <span>Certified Natural</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Leaf size={12} className="sm:w-3.5 sm:h-3.5 text-[#d4a574] flex-shrink-0" />
                <span>Eco-Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
