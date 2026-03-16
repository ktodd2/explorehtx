'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SearchBar({
  defaultValue = '',
  placeholder = 'Search Houston events, blog posts…',
  className = '',
  inputClassName = '',
  size = 'md',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const sizeClasses = {
    sm: 'py-2 pl-9 pr-4 text-sm',
    md: 'py-3 pl-11 pr-5 text-base',
    lg: 'py-4 pl-12 pr-6 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4 left-2.5',
    md: 'w-5 h-5 left-3',
    lg: 'w-6 h-6 left-3.5',
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`relative flex items-center ${className}`}
    >
      <Search
        className={`absolute ${iconSizes[size]} text-gray-400 pointer-events-none flex-shrink-0`}
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className={`w-full ${sizeClasses[size]} rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sunset-orange-400 focus:border-transparent transition ${inputClassName}`}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-sunset-orange-500 hover:bg-sunset-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
        aria-label="Submit search"
      >
        Search
      </button>
    </form>
  );
}
