'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarPlus, ChevronDown, Download, ExternalLink } from 'lucide-react';

interface AddToCalendarButtonProps {
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string | null;
  location: string;
  url: string;
}

/**
 * Format date for iCal format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: string): string {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format date for Google Calendar (YYYYMMDDTHHMMSS)
 */
function formatGoogleDate(date: string): string {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z');
}

/**
 * Generate iCal (.ics) file content
 */
function generateICS(event: AddToCalendarButtonProps): string {
  const start = formatICalDate(event.startDate);
  const end = formatICalDate(event.endDate || event.startDate);

  // Escape special characters for iCal
  const escapeIcal = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ExploreHTX//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcal(event.title)}`,
    `DESCRIPTION:${escapeIcal(event.description || '')}\\n\\nMore info: ${event.url}`,
    `LOCATION:${escapeIcal(event.location)}`,
    `URL:${event.url}`,
    `UID:${Date.now()}@explorehtx.us.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Generate Google Calendar URL
 */
function googleCalendarUrl(event: AddToCalendarButtonProps): string {
  const start = formatGoogleDate(event.startDate);
  const end = formatGoogleDate(event.endDate || event.startDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description || ''}\n\nMore info: ${event.url}`,
    location: event.location,
    sprop: 'website:explorehtx.us.com',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Web URL
 */
function outlookWebUrl(event: AddToCalendarButtonProps): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: `${event.description || ''}\n\nMore info: ${event.url}`,
    location: event.location,
    startdt: event.startDate,
    enddt: event.endDate || event.startDate,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export default function AddToCalendarButton({
  title,
  description,
  startDate,
  endDate,
  location,
  url,
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const eventData: AddToCalendarButtonProps = {
    title,
    description,
    startDate,
    endDate,
    location,
    url,
  };

  const handleDownloadICS = () => {
    const icsContent = generateICS(eventData);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-space-blue-100 hover:bg-space-blue-200 text-space-blue-800 font-semibold text-sm rounded-xl transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CalendarPlus className="w-4 h-4" />
        Add to Calendar
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <a
            href={googleCalendarUrl(eventData)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
              <rect x="8" y="12" width="3" height="3" rx="0.5" fill="#EA4335" />
              <rect x="13" y="12" width="3" height="3" rx="0.5" fill="#FBBC05" />
              <rect x="8" y="16" width="3" height="3" rx="0.5" fill="#34A853" />
            </svg>
            <span>Google Calendar</span>
            <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
          </a>

          <a
            href={outlookWebUrl(eventData)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#0078D4" />
              <path d="M8 11a3 3 0 106 0 3 3 0 00-6 0z" fill="white" />
              <path d="M11 11v6" stroke="white" strokeWidth="1.5" />
            </svg>
            <span>Outlook</span>
            <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
          </a>

          <hr className="my-2 border-gray-100" />

          <button
            onClick={handleDownloadICS}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Download .ics</span>
            <span className="text-xs text-gray-400 ml-auto">Apple, etc.</span>
          </button>
        </div>
      )}
    </div>
  );
}
