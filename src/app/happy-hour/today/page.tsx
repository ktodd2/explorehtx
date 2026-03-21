import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getCurrentDay(): string {
  const now = new Date();
  const houstonTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return DAYS[houstonTime.getDay()];
}

export const metadata: Metadata = {
  title: "Today's Happy Hour in Houston | Current Deals",
  description: "Find happy hour deals happening right now in Houston. Today's best drink and food specials.",
  alternates: {
    canonical: 'https://explorehtx.us.com/happy-hour/today',
  },
};

export default function HappyHourTodayPage() {
  // Redirect to the main happy hour page with today's section
  // The main page already has a "Today" section
  redirect('/happy-hour#' + getCurrentDay());
}
