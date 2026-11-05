import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cashcarry.pk';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/landing', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin', '/api/', '/settings'],
      },
      {
        userAgent: ['PerplexityBot', 'GPTBot', 'ClaudeBot', 'Google-Extended'],
        allow: ['/', '/landing', '/llms.txt', '/llms-full.txt'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
