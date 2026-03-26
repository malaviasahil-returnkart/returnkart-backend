/**
 * RETURNKART.IN — BrandLogo Component
 *
 * Displays the brand logo using Clearbit's free logo API.
 * Falls back to a branded coloured circle with short initials
 * if the logo fails to load or brand is not in the registry.
 *
 * Usage:
 *   <BrandLogo brand="Amazon India" size={32} />
 *   <BrandLogo brand="Flipkart" size={40} className="rounded-xl" />
 */
import { useState } from 'react'
import { getBrandConfig, getBrandLogoUrl } from './brandLogos'

export default function BrandLogo({ brand, size = 32, className = '' }) {
  const [imgError, setImgError] = useState(false)
  const config = getBrandConfig(brand)
  const logoUrl = getBrandLogoUrl(brand)

  const style = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: size * 0.25,
  }

  // Show logo if available and not errored
  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={brand}
        style={style}
        className={`object-contain bg-white ${className}`}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    )
  }

  // Fallback: coloured initials
  const bgColor = config?.color || '#2A2A2A'
  const short = config?.short || getInitials(brand)
  const textSize = size <= 28 ? 9 : size <= 36 ? 11 : 13

  return (
    <div
      style={{ ...style, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      className={`flex-shrink-0 ${className}`}
      title={brand}
    >
      <span style={{ fontSize: textSize, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {short}
      </span>
    </div>
  )
}

/** Generate 2-3 letter initials from a brand name */
function getInitials(name) {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return name.slice(0, 3).toUpperCase()
  return words
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}
