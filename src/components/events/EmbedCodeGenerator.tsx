'use client';

import { useState } from 'react';
import { Code, Copy, Check, X } from 'lucide-react';

interface EmbedCodeGeneratorProps {
  eventSlug: string;
  eventTitle: string;
}

export default function EmbedCodeGenerator({ eventSlug, eventTitle }: EmbedCodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [copied, setCopied] = useState(false);

  const embedUrl = `https://explorehtx.us.com/embed/${eventSlug}${theme === 'dark' ? '?theme=dark' : ''}`;
  const embedCode = `<iframe
  src="${embedUrl}"
  width="400"
  height="350"
  frameborder="0"
  style="border-radius: 16px; max-width: 100%;"
  title="${eventTitle}"
></iframe>`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Code className="w-4 h-4" />
        Embed this event
      </button>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Code className="w-4 h-4 text-sunset-orange-500" />
          Embed Event
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Theme selector */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
          Theme
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              theme === 'light'
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Code preview */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
          Embed Code
        </label>
        <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all">
          {embedCode}
        </pre>
      </div>

      {/* Copy button */}
      <button
        onClick={copyToClipboard}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-sm rounded-lg transition-all ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Embed Code
          </>
        )}
      </button>

      {/* Preview link */}
      <a
        href={embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-3 text-center text-xs text-gray-500 hover:text-gray-700"
      >
        Preview embed →
      </a>
    </div>
  );
}
