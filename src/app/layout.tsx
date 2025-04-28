import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist to Inter
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

const inter = Inter({ // Changed font variable
  subsets: ['latin'],
  variable: '--font-sans', // Changed variable name
});

export const metadata: Metadata = {
  title: 'Ad Order Form - Lehar Advertising', // Updated title
  description: 'Generate Release Orders for Lehar Advertising', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased font-bold`}> {/* Use new font variable and add font-bold */}
        <main className="p-4"> {/* Wrap children in main and add padding */}
          {children}
        </main>
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
