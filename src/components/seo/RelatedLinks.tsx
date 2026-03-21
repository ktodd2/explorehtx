import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface RelatedLink {
  href: string;
  label: string;
  description?: string;
}

interface RelatedLinksProps {
  title?: string;
  links: RelatedLink[];
}

/**
 * Contextual internal linking component for SEO.
 * Helps distribute link equity and improves crawlability by
 * providing relevant navigation at the bottom of detail pages.
 */
export default function RelatedLinks({
  title = 'Explore More',
  links,
}: RelatedLinksProps) {
  if (links.length === 0) return null;

  return (
    <section className="border-t border-gray-200 pt-8 mt-12">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div>
              <span className="font-medium text-gray-900 group-hover:text-sunset-orange-600 transition-colors">
                {link.label}
              </span>
              {link.description && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {link.description}
                </p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-sunset-orange-500 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
