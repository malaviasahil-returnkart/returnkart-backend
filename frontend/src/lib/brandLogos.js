/**
 * RETURNKART.IN — BRAND LOGO REGISTRY
 *
 * Maps brand names (as returned by Gemini) to their domain.
 * Clearbit Logo API: https://logo.clearbit.com/{domain}
 * Free, no API key, covers 700k+ companies.
 *
 * Fallback chain:
 *   1. Clearbit logo (domain lookup)
 *   2. Branded initials with brand colour (no broken image icons)
 */

export const BRAND_CONFIG = {
  // ── Indian Ecommerce ─────────────────────────────────────────────────
  'Amazon India':       { domain: 'amazon.in',       color: '#FF9900', short: 'AMZ' },
  'Amazon':             { domain: 'amazon.in',       color: '#FF9900', short: 'AMZ' },
  'Flipkart':           { domain: 'flipkart.com',    color: '#2874F0', short: 'FK'  },
  'Myntra':             { domain: 'myntra.com',      color: '#FF3F6C', short: 'MYN' },
  'Meesho':             { domain: 'meesho.com',      color: '#9B59B6', short: 'MEE' },
  'Ajio':               { domain: 'ajio.com',        color: '#E63946', short: 'AJI' },
  'Nykaa':              { domain: 'nykaa.com',       color: '#FC2779', short: 'NYK' },
  'Nykaa Fashion':      { domain: 'nykaafashion.com',color: '#FC2779', short: 'NF'  },
  'JioMart':            { domain: 'jiomart.com',     color: '#0070BA', short: 'JIO' },
  'Tata CLiQ':          { domain: 'tatacliq.com',    color: '#1C1C1C', short: 'TCQ' },
  'TataCliq':           { domain: 'tatacliq.com',    color: '#1C1C1C', short: 'TCQ' },
  'Snapdeal':           { domain: 'snapdeal.com',    color: '#E40000', short: 'SD'  },
  'Croma':              { domain: 'croma.com',       color: '#6ABF45', short: 'CRM' },
  'Reliance Digital':   { domain: 'reliancedigital.in', color: '#003087', short: 'RD' },
  'BigBasket':          { domain: 'bigbasket.com',   color: '#84C225', short: 'BB'  },
  'Grofers':            { domain: 'blinkit.com',     color: '#F5D000', short: 'BLK' },
  'Blinkit':            { domain: 'blinkit.com',     color: '#F5D000', short: 'BLK' },
  'Zepto':              { domain: 'zepto.now',       color: '#8B5CF6', short: 'ZPT' },
  'Swiggy Instamart':   { domain: 'swiggy.com',      color: '#FC8019', short: 'SWG' },
  'Dunzo':              { domain: 'dunzo.com',       color: '#00C1A1', short: 'DNZ' },
  'Paytm Mall':         { domain: 'paytmmall.com',   color: '#002970', short: 'PTM' },
  'ShopClues':          { domain: 'shopclues.com',   color: '#EE4236', short: 'SCL' },
  'Pepperfry':          { domain: 'pepperfry.com',   color: '#F37020', short: 'PFY' },
  'Urban Ladder':       { domain: 'urbanladder.com', color: '#2E7D32', short: 'UL'  },
  'FirstCry':           { domain: 'firstcry.com',    color: '#F4732A', short: 'FCY' },
  'Hopscotch':          { domain: 'hopscotch.in',    color: '#FF6B9D', short: 'HOP' },
  'Limeroad':           { domain: 'limeroad.com',    color: '#7CB342', short: 'LRD' },
  'Craftsvilla':        { domain: 'craftsvilla.com', color: '#C0392B', short: 'CSV' },
  'IndiaMART':          { domain: 'indiamart.com',   color: '#3B82F6', short: 'IM'  },
  'Udaan':              { domain: 'udaan.com',       color: '#F97316', short: 'UDN' },
  'Moglix':             { domain: 'moglix.com',      color: '#1D4ED8', short: 'MOG' },
  'IndiaBulls':         { domain: 'indiabulls.com',  color: '#1E3A5F', short: 'IB'  },
  'Boat':               { domain: 'boat-lifestyle.com', color: '#000000', short: 'BOT' },
  'Noise':              { domain: 'gonoise.com',     color: '#1A1A1A', short: 'NSE' },
  'Fastrack':           { domain: 'fastrack.in',     color: '#E30613', short: 'FST' },
  'Titan':              { domain: 'titan.co.in',     color: '#003087', short: 'TTN' },
  'Tanishq':            { domain: 'tanishq.co.in',   color: '#8B6914', short: 'TNQ' },
  'Malabar Gold':       { domain: 'malabargoldanddiamonds.com', color: '#C5A028', short: 'MAL' },

  // ── Fashion & Apparel ────────────────────────────────────────────────
  'Zara':               { domain: 'zara.com',        color: '#1C1C1C', short: 'ZAR' },
  'H&M':                { domain: 'hm.com',          color: '#E50010', short: 'H&M' },
  'Uniqlo':             { domain: 'uniqlo.com',      color: '#E40000', short: 'UNQ' },
  'Mango':              { domain: 'mango.com',       color: '#1C1C1C', short: 'MNG' },
  'Levi\'s':            { domain: 'levi.com',        color: '#C41230', short: 'LVI' },
  'Allen Solly':        { domain: 'allensolly.com',  color: '#003087', short: 'AS'  },
  'Van Heusen':         { domain: 'vanheusenindia.com', color: '#1A1A6E', short: 'VH' },
  'Arrow':              { domain: 'arrowshirts.in',  color: '#003087', short: 'ARW' },
  'Louis Philippe':     { domain: 'louisphilippe.com', color: '#8B1A1A', short: 'LP' },
  'Peter England':      { domain: 'peterengland.com', color: '#1C3A6E', short: 'PE' },
  'Raymond':            { domain: 'raymond.in',      color: '#1C1C1C', short: 'RMD' },
  'Fabindia':           { domain: 'fabindia.com',    color: '#8B4513', short: 'FBI' },
  'Biba':               { domain: 'biba.in',         color: '#E91E8C', short: 'BBA' },
  'W for Woman':        { domain: 'wforwoman.com',   color: '#9C27B0', short: 'W'   },
  'Global Desi':        { domain: 'global-desi.com', color: '#FF6B35', short: 'GD'  },
  'Max Fashion':        { domain: 'maxfashion.in',   color: '#E30613', short: 'MAX' },
  'Lifestyle':          { domain: 'lifestylestores.com', color: '#FF6B00', short: 'LS' },
  'Westside':           { domain: 'westside.com',    color: '#9B1B30', short: 'WS'  },
  'Pantaloons':         { domain: 'pantaloons.com',  color: '#E30613', short: 'PNT' },
  'Shoppers Stop':      { domain: 'shoppersstop.com', color: '#CC0000', short: 'SS' },
  'Centrepoint':        { domain: 'centrepoint.com', color: '#1C3A6E', short: 'CP'  },
  'Landmark':           { domain: 'landmarkonthenet.com', color: '#003087', short: 'LMK' },

  // ── Electronics & Tech ──────────────────────────────────────────────
  'Apple':              { domain: 'apple.com',       color: '#555555', short: 'APL' },
  'Samsung':            { domain: 'samsung.com',     color: '#1428A0', short: 'SAM' },
  'Sony':               { domain: 'sony.com',        color: '#003087', short: 'SNY' },
  'LG':                 { domain: 'lg.com',          color: '#A50034', short: 'LG'  },
  'OnePlus':            { domain: 'oneplus.com',     color: '#F5010C', short: 'OP'  },
  'Xiaomi':             { domain: 'mi.com',          color: '#FF6900', short: 'MI'  },
  'Realme':             { domain: 'realme.com',      color: '#FFBE00', short: 'RLM' },
  'Oppo':               { domain: 'oppo.com',        color: '#1D8348', short: 'OPP' },
  'Vivo':               { domain: 'vivo.com',        color: '#415FFF', short: 'VIV' },
  'HP':                 { domain: 'hp.com',          color: '#0096D6', short: 'HP'  },
  'Dell':               { domain: 'dell.com',        color: '#007DB8', short: 'DEL' },
  'Lenovo':             { domain: 'lenovo.com',      color: '#E2231A', short: 'LNV' },
  'Asus':               { domain: 'asus.com',        color: '#1B6FBE', short: 'ASS' },
  'Acer':               { domain: 'acer.com',        color: '#83B81A', short: 'ACR' },
  'Canon':              { domain: 'canon.com',       color: '#CC0000', short: 'CAN' },
  'Nikon':              { domain: 'nikon.com',       color: '#FFCC00', short: 'NKN' },
  'JBL':                { domain: 'jbl.com',         color: '#F37020', short: 'JBL' },
  'Bose':               { domain: 'bose.com',        color: '#1C1C1C', short: 'BSE' },
  'Philips':            { domain: 'philips.co.in',   color: '#0B5ED7', short: 'PHL' },

  // ── Beauty & Personal Care ───────────────────────────────────────────
  'Lakme':              { domain: 'lakmeindia.com',  color: '#E91E8C', short: 'LKM' },
  'Maybelline':         { domain: 'maybelline.com',  color: '#CC0000', short: 'MBL' },
  'L\'Oreal':           { domain: 'loreal.com',      color: '#AA151B', short: 'LOR' },
  'Mamaearth':          { domain: 'mamaearth.in',    color: '#5B8C00', short: 'ME'  },
  'WOW Skin Science':   { domain: 'wowskinscience.com', color: '#00A651', short: 'WOW' },
  'Plum':               { domain: 'plumgoodness.com', color: '#6A0DAD', short: 'PLM' },
  'Dot & Key':          { domain: 'dotandkey.com',   color: '#2E7D32', short: 'D&K' },
  'The Body Shop':      { domain: 'thebodyshop.com', color: '#1A6B3C', short: 'TBS' },
  'Forest Essentials':  { domain: 'forestessentialsindia.com', color: '#4A3728', short: 'FE' },
  'Kama Ayurveda':      { domain: 'kamaayurveda.com', color: '#2C5F2E', short: 'KAY' },
  'Biotique':           { domain: 'biotique.com',    color: '#2E7D32', short: 'BIO' },
  'Himalaya':           { domain: 'himalayawellness.com', color: '#1A6B3C', short: 'HIM' },

  // ── Home & Kitchen ──────────────────────────────────────────────────
  'IKEA':               { domain: 'ikea.com',        color: '#FFDA1A', short: 'IKA' },
  'Durian':             { domain: 'durian.in',       color: '#8B4513', short: 'DUR' },
  'Godrej':             { domain: 'godrej.com',      color: '#003087', short: 'GDJ' },
  'Prestige':           { domain: 'prestigegroup.com', color: '#CC0000', short: 'PRG' },
  'Hawkins':            { domain: 'hawkinscookers.com', color: '#CC0000', short: 'HWK' },
  'Milton':             { domain: 'milton.in',       color: '#003087', short: 'MLT' },
  'Tupperware':         { domain: 'tupperware.co.in', color: '#0070BA', short: 'TUP' },
  'Borosil':            { domain: 'borosil.com',     color: '#1C3A8A', short: 'BRS' },
  'Pigeon':             { domain: 'pigeon-india.com', color: '#E30613', short: 'PGN' },

  // ── Sports & Fitness ────────────────────────────────────────────────
  'Nike':               { domain: 'nike.com',        color: '#111111', short: 'NKE' },
  'Adidas':             { domain: 'adidas.com',      color: '#000000', short: 'ADI' },
  'Puma':               { domain: 'puma.com',        color: '#1C1C1C', short: 'PMA' },
  'Reebok':             { domain: 'reebok.com',      color: '#CC0000', short: 'RBK' },
  'Decathlon':          { domain: 'decathlon.in',    color: '#007BC7', short: 'DCT' },
  'Skechers':           { domain: 'skechers.com',    color: '#1C1C1C', short: 'SKC' },
  'Campus':             { domain: 'campusshoes.com', color: '#E30613', short: 'CMP' },
  'Wildcraft':          { domain: 'wildcraft.com',   color: '#2E7D32', short: 'WLD' },
}

/**
 * Get brand config by brand name.
 * Tries exact match first, then case-insensitive partial match.
 */
export function getBrandConfig(brandName) {
  if (!brandName) return null

  // Exact match
  if (BRAND_CONFIG[brandName]) return BRAND_CONFIG[brandName]

  // Case-insensitive match
  const lower = brandName.toLowerCase()
  for (const [key, val] of Object.entries(BRAND_CONFIG)) {
    if (key.toLowerCase() === lower) return val
  }

  // Partial match (brand name contains key or vice versa)
  for (const [key, val] of Object.entries(BRAND_CONFIG)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val
    }
  }

  return null
}

/**
 * Get Clearbit logo URL for a brand.
 * Returns null if brand not in registry.
 */
export function getBrandLogoUrl(brandName) {
  const config = getBrandConfig(brandName)
  if (!config) return null
  return `https://logo.clearbit.com/${config.domain}`
}
