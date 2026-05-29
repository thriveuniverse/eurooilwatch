'use client';

import Script from 'next/script';

interface Props {
  measurementId: string;
}

export default function GoogleAnalytics({ measurementId }: Props) {
  if (!measurementId) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'wait_for_update': 500,
          });
          try {
            if (localStorage.getItem('cookieConsent') === 'granted') {
              gtag('consent', 'update', { 'analytics_storage': 'granted' });
            }
          } catch (e) {}
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
