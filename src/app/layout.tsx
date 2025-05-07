
import type { Metadata } from 'next';
import './globals.css';
// Toaster related imports are removed as they are not used in the simple HTML version
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Printable Application Form', // Kept updated title
  description: 'Generates a printable application form.', // Kept updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* FontAwesome CDN for icons if used directly in HTML (e.g. print icon) */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </head>
      {/* Removed font-arial class, Arial is set as default in globals.css body */}
      <body>
        <main>
          {children}
        </main>
        {/* html2pdf.js loaded here to ensure it's available after page content */}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
