// src/components/ad-order-form.tsx
'use client';

import type { ReactNode } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Eye, CalendarIcon, Download, Printer, Trash2, UploadCloud, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://placehold.co/178x98.png';
const DEFAULT_COMPANY_LOGO_PLACEHOLDER = "https://placehold.co/300x280.png";


const AdOrderForm = (): JSX.Element => {
  const [ron, setRon] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [clientName, setClientName] = useState<string>('');
  const [advManagerInput1, setAdvManagerInput1] = useState<string>('');
  const [advManagerInput2, setAdvManagerInput2] = useState<string>('');
  const [headingCaption, setHeadingCaption] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [matterText, setMatterText] = useState<string>('');

  const [stampImage, setStampImage] = useState<string>(DEFAULT_STAMP_IMAGE_PLACEHOLDER);
  const [companyLogo, setCompanyLogo] = useState<string>(DEFAULT_COMPANY_LOGO_PLACEHOLDER);
  const [companyLogoInputKey, setCompanyLogoInputKey] = useState<number>(Date.now());
  const [stampInputKey, setStampInputKey] = useState<number>(Date.now() + 1);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);


  const [rowsData, setRowsData] = useState<Array<Record<string, string | Date | undefined | null>>>(() => [
    { keyNo: '', publication: '', edition: '', size: '', scheduledDate: null, position: '' },
  ]);

  const printableAreaRef = useRef<HTMLDivElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  const printPreviewContentRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement | null, contextDocument?: Document) => {
    if (textarea) {
      const doc = contextDocument || document;
      const win = doc.defaultView || window;
      textarea.style.height = 'auto'; // Reset height to correctly calculate scrollHeight
      const computedStyle = win.getComputedStyle(textarea);

      // Determine min-height based on context (screen, print, PDF)
      let minHeightScreen = 120; // Default for generic textareas on screen
      if (textarea.id === 'matterTextarea') {
        minHeightScreen = 100; // Specific min-height for matter textarea on screen
      } else if (textarea.classList.contains('print-textarea')) {
        minHeightScreen = 220; // Specific min-height for table cell textareas on screen
      }
      // Ensure the calculated min-height is not less than explicitly set CSS min-height
      minHeightScreen = Math.max(parseFloat(computedStyle.minHeight) || 0, minHeightScreen);

      const isPdfExport = doc.body.classList.contains('pdf-export-active');
      const isPrinting = doc.body.classList.contains('printing-from-preview') ||
                         doc.body.classList.contains('direct-print-active') ||
                         doc.body.classList.contains('clean-view-printing') ||
                         (win.matchMedia && win.matchMedia('print').matches);


      if (isPdfExport) {
        // PDF Export specific height constraints
        const pdfMinHeightVar = textarea.classList.contains('print-textarea') ? '--pdf-table-textarea-min-height' : '--pdf-matter-textarea-min-height';
        const pdfMaxHeightVar = textarea.classList.contains('print-textarea') ? '--pdf-table-textarea-max-height' : '--pdf-matter-textarea-max-height';
        
        // Use getPropertyValue from documentElement.style for CSS variables set globally
        const pdfMinHeight = parseFloat(doc.documentElement.style.getPropertyValue(pdfMinHeightVar).replace('px', '') || '180');
        const pdfMaxHeight = parseFloat(doc.documentElement.style.getPropertyValue(pdfMaxHeightVar).replace('px', '') || '180');

        let newHeight = textarea.scrollHeight;
        if (newHeight < pdfMinHeight) newHeight = pdfMinHeight; // Ensure min height
        
        textarea.style.height = `${Math.min(newHeight, pdfMaxHeight)}px`; // Apply height, capped at max
        textarea.style.overflowY = newHeight > pdfMaxHeight ? 'hidden' : 'hidden'; // Hide scrollbar if content exceeds max

      } else if (isPrinting) {
        // Print (direct or preview) specific height constraints
        let printMinHeight = textarea.classList.contains('print-textarea') ? 220 : 80;
        if (textarea.id === 'matterTextarea') printMinHeight = 80; // Specific min height for matter textarea in print
        
        textarea.style.height = `${Math.max(textarea.scrollHeight, printMinHeight)}px`;
        textarea.style.overflowY = 'hidden'; // Always hide scrollbar in print

      } else {
        // Screen context
        textarea.style.height = `${Math.max(textarea.scrollHeight, minHeightScreen)}px`;
        textarea.style.overflowY = textarea.scrollHeight > minHeightScreen ? 'auto' : 'hidden';
      }
    }
  }, []);

  const transformTableDatesToStaticText = useCallback((
    containerElement: HTMLElement,
    currentRowsData: Array<Record<string, string | Date | undefined | null>>
  ) => {
    const datePickerWrappers = containerElement.querySelectorAll('.table-date-picker-wrapper');
    datePickerWrappers.forEach(wrapper => {
      const tableCell = wrapper.closest('td');
      const tableRow = tableCell?.closest('tr');
      // Ensure `tableRow` is not null before accessing `dataset`
      const rowIndexAttr = tableRow?.dataset.rowIndex; 
      if (rowIndexAttr) {
        const rowIndex = parseInt(rowIndexAttr, 10);
        if (!isNaN(rowIndex) && currentRowsData[rowIndex]) {
          const dateValue = currentRowsData[rowIndex].scheduledDate;
          let displayValue = '\u00A0'; // Default to a non-breaking space for empty dates

          if (dateValue instanceof Date) {
            displayValue = format(dateValue, 'dd.MM.yyyy');
          } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
            // Attempt to parse and format if it's a string; otherwise, use as is or default
            try {
              displayValue = format(new Date(dateValue), 'dd.MM.yyyy');
            } catch { /* If parsing fails, displayValue remains as is or default */ } 
          }

          const span = document.createElement('span');
          span.textContent = displayValue;
          // Apply styles consistent with print requirements
          span.style.display = 'block';
          span.style.width = '100%';
          span.style.textAlign = 'center';
          span.style.fontWeight = 'bold';
          span.style.fontSize = '9pt'; // Consistent with print styles
          span.style.color = 'black';
          span.style.backgroundColor = 'transparent';
          span.style.border = 'none'; // No border for static date text
          span.style.padding = '4px'; // Minimal padding
          span.style.lineHeight = '1.1';
          span.style.minHeight = '1.2em'; // Ensure it has some height

          // Clear the wrapper and append the new static span
          wrapper.innerHTML = '';
          wrapper.appendChild(span);
        }
      }
    });
  }, []);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // Adjust all textareas on the main form
      const allTextareas = document.querySelectorAll('#printable-area-pdf textarea');
      allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));

      // If previewing, adjust textareas in the cloned preview content as well
      if (isPreviewing && printPreviewContentRef.current) {
        const previewTextareas = printPreviewContentRef.current.querySelectorAll('textarea');
        previewTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement, printPreviewContentRef.current?.ownerDocument));
      }
    }
  }, [isClient, rowsData, matterText, adjustTextareaHeight, headingCaption, packageName, advManagerInput1, advManagerInput2, clientName, ron, isPreviewing, isFullScreenPreview, orderDate]); // Added orderDate to dependencies


  useEffect(() => {
    if (isClient) {
      const savedImage = localStorage.getItem('uploadedStampImage');
      if (savedImage) {
        setStampImage(savedImage);
      } else {
        setStampImage(DEFAULT_STAMP_IMAGE_PLACEHOLDER);
      }

      const savedLogo = localStorage.getItem('uploadedCompanyLogo');
      if (savedLogo) {
        setCompanyLogo(savedLogo);
      } else {
        setCompanyLogo(DEFAULT_COMPANY_LOGO_PLACEHOLDER);
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isPreviewing && printableAreaRef.current && printPreviewContentRef.current) {
      document.body.classList.add('print-preview-active');
      const clonedContent = printableAreaRef.current.cloneNode(true) as HTMLElement;

      // Remove elements not needed in preview
      clonedContent.querySelectorAll('.no-print-preview, .no-print, .action-buttons-container, button[aria-label="Remove Stamp"], button[aria-label="Remove Logo"], .table-row-actions')
        .forEach(el => el.remove());

      // Transform interactive date pickers to static text for preview
      transformTableDatesToStaticText(clonedContent, rowsData);

      printPreviewContentRef.current.innerHTML = ''; // Clear previous content
      printPreviewContentRef.current.appendChild(clonedContent);

      // Adjust textareas in the preview after content is set
      const textareasInPreview = printPreviewContentRef.current.querySelectorAll('textarea');
      textareasInPreview.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement, printPreviewContentRef.current?.ownerDocument));

    } else {
      document.body.classList.remove('print-preview-active');
    }
    // Cleanup function
    return () => document.body.classList.remove('print-preview-active');
  }, [isPreviewing, adjustTextareaHeight, rowsData, transformTableDatesToStaticText]);


  useEffect(() => {
    const mainContainer = document.getElementById('main-application-container');
    const printableArea = document.getElementById('printable-area-pdf');
    let fullscreenControls: HTMLDivElement | null = null;

    if (isFullScreenPreview && mainContainer && printableArea) {
      document.body.classList.add('fullscreen-preview-active-body');
      mainContainer.classList.add('fullscreen-preview-active-main');
      printableArea.classList.add('fullscreen-preview-active');

      // Create and append fullscreen controls
      fullscreenControls = document.createElement('div');
      fullscreenControls.id = 'fullscreen-content-host'; // Host for controls
      fullscreenControls.className = 'fixed top-4 right-4 z-[2100] flex gap-2 no-print'; // Style appropriately

      const printButtonEl = document.createElement('button');
      printButtonEl.innerHTML = '<i class="fas fa-print mr-2"></i> Print'; // Using FontAwesome
      printButtonEl.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center print-button-fullscreen';
      printButtonEl.onclick = () => {
        if (fullscreenControls) fullscreenControls.style.display = 'none'; // Hide controls during print
        window.print(); // Trigger browser print
        setTimeout(() => { // Restore controls after print dialog
          if (fullscreenControls) fullscreenControls.style.display = 'flex';
        }, 500);
      };

      const closeButtonEl = document.createElement('button');
      closeButtonEl.innerHTML = '<i class="fas fa-times mr-2"></i> Close Fullscreen';
      closeButtonEl.className = 'bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center close-button-fullscreen';
      closeButtonEl.onclick = () => setIsFullScreenPreview(false); // Close fullscreen

      fullscreenControls.appendChild(printButtonEl);
      fullscreenControls.appendChild(closeButtonEl);
      document.body.appendChild(fullscreenControls); // Append to body

    } else {
      // Cleanup when fullscreen is exited
      document.body.classList.remove('fullscreen-preview-active-body');
      mainContainer?.classList.remove('fullscreen-preview-active-main');
      printableArea?.classList.remove('fullscreen-preview-active');
      document.getElementById('fullscreen-content-host')?.remove(); // Remove controls
    }
    // Cleanup function for the effect
    return () => {
      document.body.classList.remove('fullscreen-preview-active-body');
      mainContainer?.classList.remove('fullscreen-preview-active-main');
      printableArea?.classList.remove('fullscreen-preview-active');
      document.getElementById('fullscreen-content-host')?.remove();
    };
  }, [isFullScreenPreview]);


  const handleDateChange = (date: Date | undefined) => {
    setOrderDate(date);
  };

  const handleCellDateChange = (date: Date | undefined, index: number) => {
    const newRowsData = [...rowsData];
    newRowsData[index].scheduledDate = date;
    setRowsData(newRowsData);
  };

  const handleTextareaInput = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    index: number,
    field: string
  ) => {
    const newRowsData = [...rowsData];
    newRowsData[index][field] = e.target.value;
    setRowsData(newRowsData);
    adjustTextareaHeight(e.target);
  };

  const handleMatterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMatterText(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const addRow = useCallback(() => {
    setRowsData(prevRows => [
      ...prevRows,
      { keyNo: '', publication: '', edition: '', size: '', scheduledDate: null, position: '' },
    ]);
  }, []);

  const deleteRow = useCallback((index: number) => {
    if (rowsData.length > 1) {
      setRowsData(prevRows => prevRows.filter((_, i) => i !== index));
    } else {
      // If it's the last row, clear its content instead of deleting it
      setRowsData([{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: null, position: '' }]);
    }
  }, [rowsData.length]);


  const handleStampUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStampImage(result);
        if (typeof window !== 'undefined') {
          localStorage.setItem('uploadedStampImage', result);
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
    // Reset file input to allow uploading the same file again
    setStampInputKey(Date.now());
  };

  const triggerStampUpload = () => {
    stampInputRef.current?.click();
  };

  const removeStampImage = () => {
    setStampImage(DEFAULT_STAMP_IMAGE_PLACEHOLDER);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('uploadedStampImage');
    }
    // Reset file input key if needed, though less critical for removal
    setStampInputKey(Date.now());
  };

  const handleCompanyLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCompanyLogo(result);
        if (typeof window !== 'undefined') {
          localStorage.setItem('uploadedCompanyLogo', result);
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
    setCompanyLogoInputKey(Date.now());
  };

  const triggerCompanyLogoUpload = () => {
    companyLogoInputRef.current?.click();
  };

  const removeCompanyLogo = () => {
    setCompanyLogo(DEFAULT_COMPANY_LOGO_PLACEHOLDER);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('uploadedCompanyLogo');
    }
    setCompanyLogoInputKey(Date.now());
  };

  const generatePdf = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).html2pdf) {
        console.error('html2pdf.js not loaded or not in window scope.');
        alert('PDF generation library not available. Please ensure you are online or the library is correctly loaded.');
        return;
    }

    const html2pdf = (window as any).html2pdf; // Access from window

    const elementToPrint = printableAreaRef.current;
    if (!elementToPrint) {
        console.error('Element not found for PDF generation.');
        alert('Element to print not found.');
        return;
    }

    // Add class to body for PDF-specific styling
    document.body.classList.add('pdf-export-active');
    // Set CSS variables for PDF textarea heights, these should be defined in globals.css for `body.pdf-export-active`
    document.documentElement.style.setProperty('--pdf-table-textarea-min-height', '180px'); 
    document.documentElement.style.setProperty('--pdf-table-textarea-max-height', '180px');
    document.documentElement.style.setProperty('--pdf-matter-textarea-min-height', '80px');
    document.documentElement.style.setProperty('--pdf-matter-textarea-max-height', '100px');

    // Ensure all textareas are adjusted using the PDF context
    const textareasOnPage = elementToPrint.querySelectorAll('textarea');
    textareasOnPage.forEach(ta => adjustTextareaHeight(ta, document)); // Pass document to use PDF context

    // Clone the element to avoid modifying the live DOM directly
    const clonedElement = elementToPrint.cloneNode(true) as HTMLElement;

    // Remove elements not needed for PDF
    clonedElement.querySelectorAll('.no-pdf-export, .no-print, .action-buttons-container, .table-row-actions, button[aria-label="Remove Stamp"], button[aria-label="Remove Logo"]')
      .forEach(el => el.remove());

    // Set fixed dimensions and styles for PDF page
    clonedElement.style.width = '210mm';
    clonedElement.style.height = '297mm'; // Fixed height for A4
    clonedElement.style.minHeight = '297mm';
    clonedElement.style.maxHeight = '297mm';
    clonedElement.style.overflow = 'hidden'; // Crucial to prevent overflow
    clonedElement.style.padding = '10mm 10mm 16mm 10mm'; // Standard A4 padding
    clonedElement.style.borderWidth = '4px'; // Ensure main border is correct for PDF
    clonedElement.style.boxSizing = 'border-box';

    // Ensure company logo uses the current state for PDF
    const logoContainer = clonedElement.querySelector('.company-logo-container-pdf') as HTMLElement;
    if (logoContainer) {
      const imgElement = logoContainer.querySelector('img');
      if (imgElement && companyLogo && companyLogo !== DEFAULT_COMPANY_LOGO_PLACEHOLDER) {
        imgElement.src = companyLogo; // Use current logo
      } else if (imgElement && (!companyLogo || companyLogo === DEFAULT_COMPANY_LOGO_PLACEHOLDER)) {
        imgElement.src = DEFAULT_COMPANY_LOGO_PLACEHOLDER; // Fallback to placeholder
      }
    }

    // Convert input fields to static text for PDF
    const inputsToConvert = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input.custom-input-pdf');
    inputsToConvert.forEach(inputEl => {
      const p = document.createElement('span');
      const input = inputEl as HTMLInputElement;
      let value = input.value;
      if (input.id === 'orderDate' && orderDate) { // Use state for RO Date
        value = format(orderDate, 'dd.MM.yyyy');
      } else if (input.type === 'date' && !input.value && input.placeholder) {
        value = '\u00A0'; // Non-breaking space for empty placeholder dates
      } else if (input.type === 'date' && input.value) {
        try { value = format(new Date(input.value), 'dd.MM.yyyy'); }
        catch (e) { value = input.value || '\u00A0'; } // Fallback if date parsing fails
      } else {
        value = input.value || '\u00A0'; // Non-breaking space for other empty inputs
      }
      p.textContent = value;
      p.className = 'static-print-text'; // Class for styling static text in PDF
      const inputStyle = getComputedStyle(input); // Get computed style for fidelity
      p.style.cssText = input.style.cssText; // Copy inline styles
      p.style.display = 'inline-block';
      p.style.width = inputStyle.width;
      p.style.minHeight = '1em'; // Ensure some height
      p.style.fontFamily = inputStyle.fontFamily;
      p.style.fontSize = '9pt'; // Standard PDF font size
      p.style.fontWeight = inputStyle.fontWeight;
      p.style.lineHeight = '1.1'; // Standard PDF line height
      p.style.color = 'black';
      p.style.border = '2px solid black'; // Consistent border
      p.style.padding = '4px'; // Consistent padding
      p.style.backgroundColor = 'transparent';
      p.style.borderRadius = '0.25rem';
      input.parentNode?.replaceChild(p, input);
    });

    // Convert table date pickers to static text for PDF
    transformTableDatesToStaticText(clonedElement, rowsData);


    // Convert textareas to static divs for PDF
    const textareasToConvert = clonedElement.querySelectorAll('textarea');
    textareasToConvert.forEach(textareaEl => {
      const div = document.createElement('div');
      const textarea = textareaEl as HTMLTextAreaElement;
      div.innerHTML = textarea.value.replace(/\n/g, '<br>') || '\u00A0'; // Preserve line breaks
      div.className = 'textarea-static-print'; // Class for styling

      // Copy relevant styles from textarea to the div
      const textareaStyle = getComputedStyle(textarea);
      div.style.cssText = textarea.style.cssText; // Copy inline styles
      div.style.fontFamily = textareaStyle.fontFamily;
      div.style.fontWeight = textareaStyle.fontWeight;
      div.style.fontSize = textarea.classList.contains('print-textarea') ? '6.5pt' : '8pt'; // Adjust font size
      div.style.lineHeight = '1.0'; // Adjust line height
      div.style.color = 'black';
      div.style.backgroundColor = 'transparent';
      div.style.border = 'none'; // Textarea's own border is removed, cell border provides outline
      div.style.padding = '1px'; // Minimal padding
      div.style.height = 'auto'; // Let content determine height (within cell's min/max)
      div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
      div.style.wordWrap = 'break-word';
      div.style.overflow = 'hidden'; // Hide overflow

      if (textarea.id === 'matterTextarea') {
        div.classList.add('matter-container-print'); // Specific class for matter section in PDF
        div.style.textAlign = textareaStyle.textAlign;
      }
      textarea.parentNode?.replaceChild(div, textarea);
    });

    // Apply print-specific class transformations for PDF
    const releaseOrderTitleClone = clonedElement.querySelector('.release-order-title-screen') as HTMLElement;
    if (releaseOrderTitleClone) releaseOrderTitleClone.className = 'release-order-titlebar-print-preview'; // Use preview class

    const matterContainer = clonedElement.querySelector('.matter-container-print-parent');
    if (matterContainer) {
      const matterLabelClone = matterContainer.querySelector('.matter-label-screen') as HTMLElement;
      if (matterLabelClone) matterLabelClone.className = 'matter-label-print-preview'; // Use preview class
    }

    const stampContainerClone = clonedElement.querySelector('.stamp-container-screen') as HTMLElement;
    if (stampContainerClone) {
      stampContainerClone.className = 'stamp-container-print-preview'; // Use preview class
      const imgInStamp = stampContainerClone.querySelector('img');
      const placeholderDiv = stampContainerClone.querySelector('div.placeholder-div'); // If using a placeholder div

      if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER) { // Check if a real stamp image exists
        if (imgInStamp) {
          imgInStamp.src = stampImage;
          imgInStamp.alt = "Stamp";
        } else { // If no img tag, create one (e.g., if placeholder was text)
          const newImg = document.createElement('img');
          newImg.src = stampImage;
          newImg.alt = "Stamp";
          stampContainerClone.innerHTML = ''; // Clear placeholder
          stampContainerClone.appendChild(newImg);
        }
      } else if (placeholderDiv) {
        // If placeholder div is used and no stamp, ensure it's styled
      } else if (!imgInStamp) { // If no image and no placeholder div, clear text
        stampContainerClone.textContent = ''; // Or set a default like "Upload Image"
      }
    }
    // Transform main table for PDF
    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
      tableClone.classList.remove('main-table-bordered');
      tableClone.classList.add('print-table'); // Use generic print table class for PDF
      const tableHeaders = tableClone.querySelectorAll('th');
      tableHeaders.forEach(th => th.classList.add('print-table-header')); // Style headers for PDF
    }

    const pdfOptions: any = {
      margin: [0,0,0,0], // No extra margin from html2pdf, control via CSS padding on clonedElement
      filename: 'release_order_form.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2, // Higher scale for better quality
        useCORS: true, // If images are from other domains
        logging: false, // Disable html2canvas logging
        onclone: (documentClone: Document) => {
          // This onclone is crucial for applying PDF-specific styles to the cloned document
          // before html2canvas renders it.
          const clonedBody = documentClone.body;
          clonedBody.classList.add('pdf-export-active'); // Ensure PDF styles are active
           const _ = clonedBody.offsetHeight; // Force reflow to apply styles

          // Re-adjust heights of static divs (converted from textareas) in the cloned document
          // This is important because scrollHeight might be different in the cloned context
          const textareasInClone = clonedBody.querySelectorAll('.textarea-static-print');
          textareasInClone.forEach(ta => {
            const htmlTa = ta as HTMLElement;
            htmlTa.style.height = 'auto'; // Reset height

            const computedStyle = getComputedStyle(htmlTa);
            // Get min/max height from CSS variables if defined, or use sensible defaults
            const maxHeightStyle = htmlTa.style.maxHeight || computedStyle.maxHeight;
            const minHeightStyle = htmlTa.style.minHeight || computedStyle.minHeight;

            const maxHeight = parseFloat(maxHeightStyle.replace('px','')) || 9999; // Default large max height
            const minHeight = parseFloat(minHeightStyle.replace('px','')) || 0; // Default 0 min height

            let newHeight = htmlTa.scrollHeight; // Calculate new scrollHeight in clone
            if (newHeight < minHeight) newHeight = minHeight; // Enforce min height

            htmlTa.style.height = `${Math.min(newHeight, maxHeight)}px`; // Set height, capped at max
            htmlTa.style.overflowY = newHeight > maxHeight ? 'hidden' : 'hidden'; // Hide overflow
          });
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate PDF
    html2pdf().from(clonedElement).set(pdfOptions).save().then(() => {
      // Cleanup after PDF generation
      document.body.classList.remove('pdf-export-active');
      // Remove dynamically set CSS variables if they are not needed globally
      document.documentElement.style.removeProperty('--pdf-table-textarea-min-height');
      document.documentElement.style.removeProperty('--pdf-table-textarea-max-height');
      document.documentElement.style.removeProperty('--pdf-matter-textarea-min-height');
      document.documentElement.style.removeProperty('--pdf-matter-textarea-max-height');
    }).catch((error: Error) => {
      console.error("Error generating PDF:", error);
      // Ensure cleanup even if there's an error
      document.body.classList.remove('pdf-export-active');
      document.documentElement.style.removeProperty('--pdf-table-textarea-min-height');
      document.documentElement.style.removeProperty('--pdf-table-textarea-max-height');
      document.documentElement.style.removeProperty('--pdf-matter-textarea-min-height');
      document.documentElement.style.removeProperty('--pdf-matter-textarea-max-height');
    });

  }, [orderDate, stampImage, companyLogo, rowsData, matterText, advManagerInput1, advManagerInput2, clientName, headingCaption, packageName, ron, adjustTextareaHeight, transformTableDatesToStaticText]); // Added transformTableDatesToStaticText


  const handleOpenCleanViewAndPrint = useCallback(() => {
    if (typeof window === 'undefined' || !printableAreaRef.current) return;

    const currentScrollX = window.scrollX;
    const currentScrollY = window.scrollY;

    const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Release Order</title>');
      // Copy all styles from the main document's head to the new window
      Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]')).forEach(tag => {
        printWindow.document.head.appendChild(tag.cloneNode(true));
      });

      // Clone the printable area
      const clonedPrintableArea = printableAreaRef.current.cloneNode(true) as HTMLElement;
      // Remove elements not needed for print
      clonedPrintableArea.querySelectorAll('.no-print, .no-pdf-export, .no-print-preview, .action-buttons-container, button[aria-label="Remove Stamp"], button[aria-label="Remove Logo"], .table-row-actions')
        .forEach(el => el.remove());

      // Transform interactive date pickers to static text
      transformTableDatesToStaticText(clonedPrintableArea, rowsData);

      // Add specific styles for the new window's print view
      const printSpecificStyles = printWindow.document.createElement('style');
      printSpecificStyles.textContent = `
        body {
          margin: 0; padding: 20px; display: flex; justify-content: center;
          align-items: flex-start; background-color: #e0e0e0; min-height: 100vh;
        }
        #printable-area-pdf { /* Style for the printable area in the new window */
          margin: 0 auto !important; /* Center it */
          box-shadow: 0 0 15px rgba(0,0,0,0.3) !important; /* Add shadow for better viewing */
        }
        .print-button-new-window { /* Style for the print button in the new window */
          position: fixed !important; top: 15px !important; right: 15px !important;
          z-index: 10000 !important; padding: 10px 20px; background-color: #007bff;
          color: white; border: none; border-radius: 5px; cursor: pointer;
          font-size: 16px;
        }
        .print-button-new-window:hover { background-color: #0056b3; }
        @media print { /* Styles applied when printing from the new window */
          body { margin: 0 !important; padding: 0 !important; background-color: white !important; }
          body.clean-view-printing #printable-area-pdf {
             margin: 0 auto !important;
             padding: 4px 24px 48px 24px !important; /* Consistent padding */
             border: 4px solid black !important; /* Consistent border */
             box-shadow: none !important; /* No shadow when printing */
             page-break-inside: avoid !important; /* Try to keep content on one page */
             background-color: white !important;
             color: black !important;
             overflow: hidden !important; /* Hide overflow */
             position: static !important;
             font-size: 9pt !important; /* Standard print font size */
             line-height: 1.1 !important; /* Standard print line height */
             display: flex !important; /* Use flex for layout consistency */
             flex-direction: column !important;
             width: 210mm !important; /* A4 width */
             min-height: 297mm !important; /* A4 height */
             height: 297mm !important; /* Fixed A4 height */
             box-sizing: border-box !important;
          }
          body.clean-view-printing #printable-area-pdf > .print-footer-box {
            margin-top: auto !important; /* Push footer to bottom */
            flex-shrink: 0 !important; /* Prevent footer from shrinking */
          }
          .print-button-new-window { display: none !important; } /* Hide print button in new window during actual print */
        }
      `;
      printWindow.document.head.appendChild(printSpecificStyles);

      printWindow.document.write('</head><body>');
      printWindow.document.body.appendChild(clonedPrintableArea); // Add cloned content

      // Adjust textareas in the new window
      const textareasInNewWindow = printWindow.document.querySelectorAll('#printable-area-pdf textarea');
      textareasInNewWindow.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement, printWindow.document));


      // Add a print button to the new window
      const printButtonInNewWindow = printWindow.document.createElement('button');
      printButtonInNewWindow.textContent = 'Print';
      printButtonInNewWindow.className = 'print-button-new-window';
      printButtonInNewWindow.onclick = () => {
        printButtonInNewWindow.style.display = 'none'; // Hide button before printing
        printWindow.document.body.classList.add('clean-view-printing'); // Add class for print-specific styles
        printWindow.print(); // Trigger print dialog
        printWindow.document.body.classList.remove('clean-view-printing'); // Remove class after printing
        printButtonInNewWindow.style.display = 'block'; // Show button again
      };
      printWindow.document.body.appendChild(printButtonInNewWindow);

      printWindow.document.close(); // Close document writing
      printWindow.focus(); // Focus the new window
      window.scrollTo(currentScrollX, currentScrollY); // Restore scroll position on original window
    }
  }, [adjustTextareaHeight, rowsData, transformTableDatesToStaticText]);


  if (!isClient) {
    // Optional: Render a loading state or null on the server
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">

      {/* Action Buttons Container */}
      <div className="flex justify-end items-center gap-2 p-2 mb-2 action-buttons-container sticky top-0 bg-background z-50">
        <Button onClick={() => setIsPreviewing(true)} variant="outline" size="sm" className="no-print-preview">
          <Eye className="mr-2 h-4 w-4" />Print Preview
        </Button>
        <Button onClick={generatePdf} variant="default" size="sm" className="no-print-preview">
          <Download className="mr-2 h-4 w-4" />Download PDF
        </Button>
        <Button onClick={handleOpenCleanViewAndPrint} variant="secondary" size="sm" className="no-print-preview">
          <Printer className="mr-2 h-4 w-4" />Open Clean View &amp; Print
        </Button>
      </div>

      {/* Print Preview Modal */}
      {isPreviewing && (
        <div id="printPreviewOverlay" className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex justify-center items-center no-print" onClick={() => setIsPreviewing(false)}>
          <div id="printPreviewModalContentContainer" className="bg-white p-4 rounded-lg shadow-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Print Preview</h3>
              <Button onClick={() => setIsPreviewing(false)} variant="ghost" size="icon"><XCircle className="h-6 w-6" /></Button>
            </div>
            <div ref={printPreviewContentRef} id="printPreviewContent" className="border border-gray-300 overflow-auto flex-grow">
              {/* Content will be cloned here by useEffect */}
            </div>
            <div className="mt-4 flex justify-end gap-2">
            <Button
                onClick={() => {
                  if (printPreviewContentRef.current && printPreviewContentRef.current.firstChild) {
                    const clonedFormElement = printPreviewContentRef.current.firstChild as HTMLElement;
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.left = '-9999px'; // Position off-screen
                    iframe.style.width = '0'; iframe.style.height = '0'; // Invisible
                    iframe.style.border = 'none';
                    iframe.setAttribute('aria-hidden', 'true');
                    iframe.setAttribute('title', 'Print Frame'); // For accessibility
                    document.body.appendChild(iframe);

                    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
                    if (iframeDoc) {
                      iframeDoc.open();
                      iframeDoc.write('<html><head><title>Print</title>');
                      // Copy styles to iframe
                      Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]')).forEach(styleEl => {
                        iframeDoc.head.appendChild(styleEl.cloneNode(true));
                      });
                      iframeDoc.write('</head><body class="printing-from-preview">'); // Add class for print context
                      iframeDoc.write(clonedFormElement.outerHTML); // Write cloned content
                      iframeDoc.write('</body></html>');
                      iframeDoc.close();

                      // Adjust textareas within the iframe before printing
                      const textareasInIframe = iframeDoc.querySelectorAll('textarea');
                      textareasInIframe.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement, iframeDoc));

                      // Delay print slightly to ensure content is rendered
                      setTimeout(() => {
                        if (iframe.contentWindow) {
                          iframe.contentWindow.focus(); // Focus iframe
                          iframe.contentWindow.print(); // Trigger print dialog
                        }
                        // Clean up iframe after a delay
                        setTimeout(() => {
                          if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                          }
                        }, 1000); // Delay removal to ensure print dialog processes
                      }, 300); // Short delay for rendering
                    }
                  }
                }}
                variant="default"
              >
                <Printer className="mr-2 h-4 w-4" />Print
              </Button>
              <Button onClick={() => setIsPreviewing(false)} variant="outline">Close Preview</Button>
            </div>
          </div>
        </div>
      )}


      {/* Printable Area */}
      <div id="printable-area-pdf" ref={printableAreaRef} className="w-full print-target bg-card text-card-foreground shadow-sm border-4 border-black">
        {/* Release Order Title */}
        <div className="text-center mt-2 mb-5 release-order-title-screen"> {/* Adjusted margins */}
          <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        {/* Top Section: Company Info & RO/Date/Client */}
        <div className="flex flex-col md:flex-row md:items-stretch gap-4 mb-5 print-header-box">
           {/* Left Box: Company Logo/Info */}
           <div
            className="w-full md:w-[300px] h-[280px] border-0 rounded relative company-logo-container-screen company-logo-container-pdf cursor-pointer overflow-hidden"
            onClick={triggerCompanyLogoUpload}
            title="Click to upload company logo"
          >
            <div className="relative w-full h-full flex items-center justify-center"> {/* Inner div for centering and object-fit */}
              <Image
                  src={companyLogo}
                  alt="Company Logo"
                  fill
                  style={{ objectFit: "cover" }} 
                  data-ai-hint="company logo"
                  priority // Ensures LCP optimization if this is a primary image
                />
            </div>
            <Input key={companyLogoInputKey} type="file" ref={companyLogoInputRef} onChange={handleCompanyLogoUpload} accept="image/*" className="hidden" aria-label="Upload company logo" />
            {companyLogo !== DEFAULT_COMPANY_LOGO_PLACEHOLDER && companyLogo !== '' && (
              <Button onClick={(e) => { e.stopPropagation(); removeCompanyLogo(); }} variant="ghost" size="icon" className="absolute top-1 right-1 z-10 no-print no-pdf-export no-print-preview" aria-label="Remove Logo">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>

          {/* Right Box: RO Info, Adv Manager */}
          <div className="flex-1 flex flex-col gap-3 p-3 border-2 border-black rounded print-info-column">
            <div className="flex gap-3 items-center">
              <div className="flex-1 flex items-center">
                <Label htmlFor="roNumber" className="text-sm font-bold mr-2 whitespace-nowrap">R.O. No. LN:</Label>
                <Input id="roNumber" type="text" value={ron} onChange={(e) => setRon(e.target.value)} className="text-sm py-1 px-2 h-auto border-2 border-black" placeholder="" />
              </div>
              <div className="flex-1 flex items-center">
                <Label htmlFor="orderDate" className="text-sm font-bold mr-2 whitespace-nowrap">Date:</Label>
                {isClient ? (
                  <DatePicker
                    selected={orderDate}
                    onChange={handleDateChange}
                    dateFormat="dd.MM.yyyy"
                    className="text-sm py-1 px-2 h-auto w-full border-2 border-black text-center"
                    id="orderDate"
                    placeholderText="" />
                ) : (
                  <Button
                    variant={"outline"}
                    id="orderDate"
                    className={cn(
                      "text-sm py-1 px-2 h-auto w-full border-2 border-black",
                      "date-picker-trigger-button text-muted-foreground justify-center" // Ensures consistent styling
                    )}
                    disabled
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Loading...</span>
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <Label htmlFor="clientName" className="text-sm font-bold mr-2 whitespace-nowrap">Client:</Label>
              <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-sm py-1 px-2 h-auto border-2 border-black" placeholder="" />
            </div>
            <div className="mt-2">
              <Label className="text-sm font-bold">The Advertisement Manager</Label>
              <Input value={advManagerInput1} onChange={(e) => setAdvManagerInput1(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1 border-2 border-black" placeholder="" />
              <Input value={advManagerInput2} onChange={(e) => setAdvManagerInput2(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1 border-2 border-black" placeholder="" />
            </div>
            <div className="mt-auto pt-2 border-t border-black"> {/* Pushes this to bottom of flex container */}
              <p className="text-sm font-bold">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
            </div>
          </div>
        </div>

        {/* Heading/Caption & Package Section */}
        <div className="flex flex-col md:flex-row gap-2 mb-3 print-header-box"> {/* Reduced gap and mb */}
          <div className="flex-1 p-2 border-2 border-black rounded print-content-block">
            <div className="flex items-center">
              <Label htmlFor="headingCaption" className="text-sm font-bold mr-2 whitespace-nowrap">Heading/Caption:</Label>
              <Input id="headingCaption" value={headingCaption} onChange={(e) => setHeadingCaption(e.target.value)} className="flex-1 text-sm py-1 px-2 h-auto border-2 border-black" placeholder="" />
            </div>
          </div>
          <div className="w-full md:w-[40%] p-2 border-2 border-black rounded print-content-block">
            <div className="flex items-center">
              <Label htmlFor="packageName" className="text-sm font-bold mr-2 whitespace-nowrap">Package:</Label>
              <Input id="packageName" value={packageName} onChange={(e) => setPackageName(e.target.value)} className="flex-1 text-sm py-1 px-2 h-auto border-2 border-black" placeholder="" />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="mb-5 table-container-print">
          <Table className="main-table-bordered print-table border-2 border-black">
            <TableHeader className="bg-secondary print-table-header">
              <TableRow>
                <TableHead className="w-[9%] border border-black p-1.5 text-sm font-bold text-center text-foreground">Key No.</TableHead>
                <TableHead className="w-[30%] border border-black p-1.5 text-sm font-bold text-center text-foreground">Publication(s)</TableHead>
                <TableHead className="w-[19%] border border-black p-1.5 text-sm font-bold text-center text-foreground">Edition(s)</TableHead>
                <TableHead className="w-[14%] border border-black p-1.5 text-sm font-bold text-center text-foreground">Size</TableHead>
                <TableHead className="w-[14%] border border-black p-1.5 text-sm font-bold text-center text-foreground">Scheduled Date(s)</TableHead>
                <TableHead className="w-[14%] border border-black p-1.5 text-sm font-bold text-center text-foreground">Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowsData.map((row, index) => (
                <TableRow key={index} data-row-index={index} className="print-table-row">
                  <TableCell className="main-table-bordered p-0 align-top border border-black">
                    <Textarea value={row.keyNo as string} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} className="text-xs text-foreground p-1 border-0 rounded-none resize-none min-h-[220px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                  </TableCell>
                  <TableCell className="main-table-bordered p-0 align-top border border-black">
                    <Textarea value={row.publication as string} onChange={(e) => handleTextareaInput(e, index, 'publication')} className="text-xs text-foreground p-1 border-0 rounded-none resize-none min-h-[220px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                  </TableCell>
                  <TableCell className="main-table-bordered p-0 align-top border border-black">
                    <Textarea value={row.edition as string} onChange={(e) => handleTextareaInput(e, index, 'edition')} className="text-xs text-foreground p-1 border-0 rounded-none resize-none min-h-[220px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                  </TableCell>
                  <TableCell className="main-table-bordered p-0 align-top border border-black">
                    <Textarea value={row.size as string} onChange={(e) => handleTextareaInput(e, index, 'size')} className="text-xs text-foreground p-1 border-0 rounded-none resize-none min-h-[220px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                  </TableCell>
                  <TableCell className="main-table-bordered p-0 align-top border border-black table-date-picker-wrapper">
                    <DatePicker
                      selected={row.scheduledDate instanceof Date ? row.scheduledDate : undefined}
                      onChange={(date) => handleCellDateChange(date, index)}
                      dateFormat="dd.MM.yyyy"
                      className="text-xs text-foreground h-auto w-full text-center"
                      placeholderText=""
                    />
                  </TableCell>
                  <TableCell className="main-table-bordered p-0 align-top border border-black">
                    <Textarea value={row.position as string} onChange={(e) => handleTextareaInput(e, index, 'position')} className="text-xs text-foreground p-1 border-0 rounded-none resize-none min-h-[220px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Matter Section */}
        <div className="flex mb-3 min-h-[80px] items-stretch matter-container-print-parent p-0 border-2 border-black rounded">
          <div className="matter-label-screen flex items-center justify-center p-1 w-[38px] self-stretch">
            <span className="text-sm font-bold">MATTER</span>
          </div>
          <Textarea
            id="matterTextarea"
            value={matterText}
            onChange={handleMatterChange}
            className="flex-1 text-sm p-2 border-l-0 rounded-none resize-none min-h-[80px] h-auto no-shadow-outline focus:border-black matter-content-screen border-t-0 border-r-0 border-b-0 border-2 !border-l-black !border-black"
            placeholder=""
          />
        </div>

        {/* Footer Section: Forwarding Info, Notes, Stamp */}
        <div className="p-3 border-2 border-black rounded flex flex-col print-footer-box relative">
          <div className="w-full mb-2">
            <p className="text-xs font-bold mb-1">Forward all bills with relevant VTS copy to :-</p>
            <p className="text-xs leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101</p>
          </div>

          <hr className="border-black border-b-2 my-2 w-full" />

          <div className="flex justify-between items-start mt-0 pt-0">
            {/* Notes Section */}
            <div className="w-[62%]">
              <p className="text-sm font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Note:</p>
              <ol className="list-decimal list-inside text-xs space-y-0.5">
                <li>Space reserved vide our letter No.</li>
                <li>No two advertisements of the same client should appear in the same issue.</li>
                <li>Please quote R.O. No. in all your bills and letters.</li>
                <li>Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</li>
              </ol>
            </div>

            {/* Stamp Area */}
            <div
              className="w-[35%] flex flex-col items-center justify-end stamp-parent-container mt-2 md:mt-0 self-end" // Aligns to bottom-right of its flex container
            >
              <div
                className="stamp-container-screen w-[178px] h-[98px] flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80 relative border-0"
                onClick={triggerStampUpload}
                title="Click to upload stamp image"
              >
                {stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER ? (
                  <Image src={stampImage} alt="Stamp" layout="intrinsic" width={178} height={98} className="object-contain" data-ai-hint="signature company stamp" />
                ) : (
                  // Placeholder when no stamp image is uploaded
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 placeholder-div">
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" layout="intrinsic" width={178} height={98} className="object-contain" data-ai-hint="upload placeholder"/>
                  </div>
                )}
                <Input key={stampInputKey} type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" aria-label="Upload stamp" />
                {/* Remove stamp button */}
                {stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && stampImage !== '' && (
                  <Button onClick={(e) => { e.stopPropagation(); removeStampImage(); }} variant="ghost" size="icon" className="absolute top-1 right-1 no-print no-pdf-export no-print-preview" aria-label="Remove Stamp">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdOrderForm;
