// Google Analytics integration

declare global {
    interface Window {
        gtag: (...args: any[]) => void
        dataLayer: any[]
    }
}

export class Analytics {
  private readonly trackingId: string
  private isInitialized = false

  constructor(trackingId: string) {
    this.trackingId = trackingId
  }

  init() {
    if (this.isInitialized || !this.trackingId) return

    // Load Google Analytics script
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`
    document.head.appendChild(script1)

    // Initialize gtag
    window.dataLayer = window.dataLayer ?? []
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }

    window.gtag('js', new Date())
    window.gtag('config', this.trackingId, {
      page_title: document.title,
      page_location: window.location.href
    })

    this.isInitialized = true
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    if (!this.isInitialized) return

    window.gtag('config', this.trackingId, {
      page_path: path,
      page_title: title || document.title
    })
  }

  // Track events
  trackEvent(action: string, category: string, label?: string, value?: number) {
    if (!this.isInitialized) return

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    })
  }

  // Track course enrollment
  trackCourseEnrollment(courseId: string, courseName: string) {
    this.trackEvent('enroll', 'Course', `${courseId}: ${courseName}`)
  }

  // Track job application
  trackJobApplication(jobId: string, jobTitle: string) {
    this.trackEvent('apply', 'Job', `${jobId}: ${jobTitle}`)
  }

  // Track document download
  trackDocumentDownload(documentId: string, documentName: string) {
    this.trackEvent('download', 'Document', `${documentId}: ${documentName}`)
  }

  // Track user registration
  trackUserRegistration(userType: 'job_seeker' | 'employer') {
    this.trackEvent('sign_up', 'User', userType)
  }

  // Track user login
  trackUserLogin(userType: 'job_seeker' | 'employer') {
    this.trackEvent('login', 'User', userType)
  }

  // Track search
  trackSearch(searchTerm: string, category: string) {
    this.trackEvent('search', category, searchTerm)
  }

  // Track form submission
  trackFormSubmission(formName: string) {
    this.trackEvent('submit', 'Form', formName)
  }

  // Track video play (if you have video content)
  trackVideoPlay(videoTitle: string) {
    this.trackEvent('play', 'Video', videoTitle)
  }

  // Track scroll depth
  trackScrollDepth(percentage: number) {
    this.trackEvent('scroll', 'Engagement', `${percentage}%`, percentage)
  }

  // Track time on page
  trackTimeOnPage(seconds: number) {
    this.trackEvent('timing_complete', 'Engagement', 'time_on_page', seconds)
  }

  // Enhanced ecommerce tracking (for course purchases)
  trackPurchase(transactionId: string, items: any[]) {
    if (!this.isInitialized) return

    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: items.reduce((total, item) => total + item.price, 0),
      currency: 'TWD',
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: 1,
        price: item.price
      }))
    })
  }
}

// Create analytics instance
const trackingId = import.meta.env.VITE_GA_TRACKING_ID
export const analytics = new Analytics(trackingId)

// Auto-initialize if tracking ID is available
if (trackingId && typeof window !== 'undefined') {
  analytics.init()
}

// Composable for Vue components
export const useAnalytics = () => {
  return {
    trackPageView: analytics.trackPageView.bind(analytics),
    trackEvent: analytics.trackEvent.bind(analytics),
    trackCourseEnrollment: analytics.trackCourseEnrollment.bind(analytics),
    trackJobApplication: analytics.trackJobApplication.bind(analytics),
    trackDocumentDownload: analytics.trackDocumentDownload.bind(analytics),
    trackUserRegistration: analytics.trackUserRegistration.bind(analytics),
    trackUserLogin: analytics.trackUserLogin.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackFormSubmission: analytics.trackFormSubmission.bind(analytics)
  }
}
