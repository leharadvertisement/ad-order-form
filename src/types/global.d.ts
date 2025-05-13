// src/types/global.d.ts
declare global {
  interface Window {
    html2pdf: any; // You can replace 'any' with a more specific type if you have one for html2pdf
  }
}

export {}; // This ensures the file is treated as a module.
