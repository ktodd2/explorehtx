import AdUnit from './AdUnit';

interface AdInArticleProps {
  slot: string;
  className?: string;
}

/**
 * In-article ad for blog post content.
 * Uses fluid format so Google can resize it to fit naturally within the prose.
 * Place between paragraphs or sections.
 */
export default function AdInArticle({ slot, className = '' }: AdInArticleProps) {
  return (
    <div className={`my-8 flex justify-center ${className}`} aria-label="Advertisement">
      <AdUnit
        slot={slot}
        format="auto"
        responsive
        className="w-full max-w-2xl min-h-[200px]"
      />
    </div>
  );
}
