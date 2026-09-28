import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
        <title>MortX — Hyperlocal Intelligence & Discovery</title>
        <ScrollViewStyleReset />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style
          id="custom-tailwind-utilities"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-display: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                --font-body: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              }
              body {
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                background-color: #F8F7F4;
                color: #0D1117;
                margin: 0;
                padding: 0;
                -webkit-tap-highlight-color: transparent;
              }
              .font-display {
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              }
              .no-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .pb-safe {
                padding-bottom: max(6px, env(safe-area-inset-bottom, 6px));
              }
              .hover-lift {
                transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .hover-lift:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
              }
              .hover-lift:active {
                transform: translateY(0);
              }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .animate-fade-in-up {
                animation: fadeInUp 0.25s ease-out forwards;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
