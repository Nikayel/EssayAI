import type { MetadataRoute } from 'next';

/**
 * robots.txt configuration for search engine crawling
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ivyway.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/reviewer/',
          '/dashboard/',
          '/analysis/',
          '/ivy/results/',
          '/onboarding/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
