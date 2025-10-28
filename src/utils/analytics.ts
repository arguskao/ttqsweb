// Simple analytics stub (no external tracking)

export class Analytics {
  private readonly trackingId: string
  private isInitialized = false

  constructor(trackingId: string) {
    this.trackingId = trackingId
  }

  init() {
    // No-op: analytics disabled
    this.isInitialized = true
  }

  // Track page views (console only)
  trackPageView(path: string, title?: string) {
    console.log('Analytics: Page view', { path, title })
  }

  // Track events (console only)
  trackEvent(action: string, category: string, label?: string, value?: number) {
    console.log('Analytics: Event', { action, category, label, value })
  }

  // Track course enrollment (console only)
  trackCourseEnrollment(courseId: string, courseName: string) {
    this.trackEvent('enroll', 'Course', `${courseId}: ${courseName}`)
  }

  // Track job application (console only)
  trackJobApplication(jobId: string, jobTitle: string) {
    this.trackEvent('apply', 'Job', `${jobId}: ${jobTitle}`)
  }

  // Track document download (console only)
  trackDocumentDownload(documentId: string, documentName: string) {
    this.trackEvent('download', 'Document', `${documentId}: ${documentName}`)
  }

  // Track user registration (console only)
  trackUserRegistration(userType: 'job_seeker' | 'employer') {
    this.trackEvent('sign_up', 'User', userType)
  }

  // Track user login (console only)
  trackUserLogin(userType: 'job_seeker' | 'employer') {
    this.trackEvent('login', 'User', userType)
  }

  // Track search (console only)
  trackSearch(searchTerm: string, category: string) {
    this.trackEvent('search', category, searchTerm)
  }

  // Track form submission (console only)
  trackFormSubmission(formName: string) {
    this.trackEvent('submit', 'Form', formName)
  }

  // Track video play (console only)
  trackVideoPlay(videoTitle: string) {
    this.trackEvent('play', 'Video', videoTitle)
  }

  // Track scroll depth (console only)
  trackScrollDepth(percentage: number) {
    this.trackEvent('scroll', 'Engagement', `${percentage}%`, percentage)
  }

  // Track time on page (console only)
  trackTimeOnPage(seconds: number) {
    this.trackEvent('timing_complete', 'Engagement', 'time_on_page', seconds)
  }

  // Enhanced ecommerce tracking (console only)
  trackPurchase(transactionId: string, items: any[]) {
    console.log('Analytics: Purchase', { transactionId, items })
  }
}

// Create analytics instance (disabled)
export const analytics = new Analytics('')

// Initialize (no-op)
if (typeof window !== 'undefined') {
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
