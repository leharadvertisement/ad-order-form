
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Printable Application Form', // Updated title
  description: 'Generates a printable application form.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
      </head>
      <body className="font-arial"> {/* Use a generic class for Arial from globals.css */}
        <main>
          {children}
        </main>
        <Toaster /> {/* Add Toaster component */}
        {/* html2pdf.js loaded here to ensure it's available after page content */}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
