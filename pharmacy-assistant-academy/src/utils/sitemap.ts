// Sitemap generator utility

interface SitemapUrl {
    loc: string
    lastmod?: string
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority?: number
}

export class SitemapGenerator {
    private urls: SitemapUrl[] = []
    private baseUrl: string

    constructor(baseUrl: string = 'https://pharmacy-academy.com') {
        this.baseUrl = baseUrl
    }

    addUrl(url: SitemapUrl) {
        this.urls.push(url)
    }

    addStaticUrls() {
        const staticUrls: SitemapUrl[] = [
            {
                loc: '/',
                changefreq: 'daily',
                priority: 1.0,
                lastmod: new Date().toISOString().split('T')[0]
            },
            {
                loc: '/courses',
                changefreq: 'daily',
                priority: 0.9,
                lastmod: new Date().toISOString().split('T')[0]
            },
            {
                loc: '/jobs',
                changefreq: 'daily',
                priority: 0.9,
                lastmod: new Date().toISOString().split('T')[0]
            },
            {
                loc: '/instructors',
                changefreq: 'weekly',
                priority: 0.8,
                lastmod: new Date().toISOString().split('T')[0]
            },
            {
                loc: '/documents',
                changefreq: 'weekly',
                priority: 0.7,
                lastmod: new Date().toISOString().split('T')[0]
            },
            {
                loc: '/login',
                changefreq: 'monthly',
                priority: 0.5
            },
            {
                loc: '/register',
                changefreq: 'monthly',
                priority: 0.5
            }
        ]

        staticUrls.forEach(url => this.addUrl(url))
    }

    async addDynamicUrls() {
        try {
            // Add course URLs
            const courses = await this.fetchCourses()
            courses.forEach((course: any) => {
                this.addUrl({
                    loc: `/courses/${course.id}`,
                    changefreq: 'weekly',
                    priority: 0.8,
                    lastmod: course.updated_at?.split('T')[0]
                })
            })

            // Add job URLs
            const jobs = await this.fetchJobs()
            jobs.forEach((job: any) => {
                this.addUrl({
                    loc: `/jobs/${job.id}`,
                    changefreq: 'daily',
                    priority: 0.7,
                    lastmod: job.created_at?.split('T')[0]
                })
            })

            // Add instructor URLs
            const instructors = await this.fetchInstructors()
            instructors.forEach((instructor: any) => {
                this.addUrl({
                    loc: `/instructors/${instructor.id}`,
                    changefreq: 'monthly',
                    priority: 0.6,
                    lastmod: instructor.updated_at?.split('T')[0]
                })
            })
        } catch (error) {
            console.error('Error fetching dynamic URLs for sitemap:', error)
        }
    }

    private async fetchCourses() {
        // This would fetch from your API
        // For now, return empty array
        return []
    }

    private async fetchJobs() {
        // This would fetch from your API
        // For now, return empty array
        return []
    }

    private async fetchInstructors() {
        // This would fetch from your API
        // For now, return empty array
        return []
    }

    generateXML(): string {
        const urlElements = this.urls.map(url => {
            const loc = `${this.baseUrl}${url.loc}`
            let urlXml = `  <url>\n    <loc>${loc}</loc>\n`

            if (url.lastmod) {
                urlXml += `    <lastmod>${url.lastmod}</lastmod>\n`
            }

            if (url.changefreq) {
                urlXml += `    <changefreq>${url.changefreq}</changefreq>\n`
            }

            if (url.priority !== undefined) {
                urlXml += `    <priority>${url.priority}</priority>\n`
            }

            urlXml += `  </url>`
            return urlXml
        }).join('\n')

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`
    }

    async generate(): Promise<string> {
        this.urls = [] // Reset URLs
        this.addStaticUrls()
        await this.addDynamicUrls()
        return this.generateXML()
    }
}

// Generate sitemap and save to public directory
export const generateSitemap = async () => {
    const generator = new SitemapGenerator()
    const sitemapXML = await generator.generate()

    // In a real application, you would save this to the public directory
    // For now, we'll just return it
    return sitemapXML
}