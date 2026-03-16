import type { BlogPost } from '@/types/database'

interface BlogJsonLdProps {
  post: BlogPost
}

const BASE_URL = 'https://explorehtx.us.com'

export default function BlogJsonLd({ post }: BlogJsonLdProps) {
  const url = `${BASE_URL}/blog/${post.slug}`

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    url,
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ExploreHTX',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    ...(post.cover_image_url
      ? {
          image: {
            '@type': 'ImageObject',
            url: post.cover_image_url,
            description: post.cover_image_alt ?? post.title,
          },
        }
      : {}),
    ...(post.keywords?.length > 0
      ? { keywords: post.keywords.join(', ') }
      : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
