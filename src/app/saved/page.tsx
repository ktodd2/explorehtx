import type { Metadata } from 'next';
import SavedEventsClient from './SavedEventsClient';

export const metadata: Metadata = {
  title: 'Saved Events | ExploreHTX',
  description: 'Your saved Houston events. Plan your perfect outing with your favorited concerts, festivals, and more.',
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return <SavedEventsClient />;
}
