
import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Printable Application Form', // From user's HTML
  description: 'Generates a printable application form.', // Generic description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />{/* From user's HTML */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />{/* From user's HTML */}
        {/* FontAwesome CDN from user's HTML */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </head>
      <body>
        <main>
          {children}
        </main>
        {/* html2pdf.js loaded here, as in user's HTML */}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}

    