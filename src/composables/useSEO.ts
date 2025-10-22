import { ref, onMounted } from 'vue'

interface SEOData {
    title?: string
    description?: string
    keywords?: string
    ogImage?: string
    canonicalUrl?: string
}

export function useSEO(initialData?: SEOData) {
  const seoData = ref<SEOData>(initialData ?? {})

  const updateSEO = (data: Partial<SEOData>) => {
    seoData.value = { ...seoData.value, ...data }
    applySEO()
  }

  const applySEO = () => {
    // Update document title
    if (seoData.value.title) {
      document.title = seoData.value.title
    }

    // Update meta description
    updateMetaTag('name', 'description', seoData.value.description)

    // Update meta keywords
    updateMetaTag('name', 'keywords', seoData.value.keywords)

    // Update Open Graph tags
    updateMetaTag('property', 'og:title', seoData.value.title)
    updateMetaTag('property', 'og:description', seoData.value.description)
    updateMetaTag('property', 'og:image', seoData.value.ogImage)

    // Update Twitter tags
    updateMetaTag('property', 'twitter:title', seoData.value.title)
    updateMetaTag('property', 'twitter:description', seoData.value.description)
    updateMetaTag('property', 'twitter:image', seoData.value.ogImage)

    // Update canonical URL
    if (seoData.value.canonicalUrl) {
      updateLinkTag('canonical', seoData.value.canonicalUrl)
    }
  }

  const updateMetaTag = (attribute: string, name: string, content?: string) => {
    if (!content) return

    let meta = document.querySelector(`meta[${attribute}="${name}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute(attribute, name)
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', content)
  }

  const updateLinkTag = (rel: string, href: string) => {
    let link = document.querySelector(`link[rel="${rel}"]`)
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', rel)
      document.head.appendChild(link)
    }
    link.setAttribute('href', href)
  }

  // JSON-LD structured data
  const addStructuredData = (data: object) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    // Return cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }

  onMounted(() => {
    if (initialData) {
      applySEO()
    }
  })

  return {
    seoData,
    updateSEO,
    addStructuredData
  }
}
