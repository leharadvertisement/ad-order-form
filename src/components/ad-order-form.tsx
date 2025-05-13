// src/components/ad-order-form.tsx
'use client';

import type { ChangeEvent, FC } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Printer, PlusSquare, MinusSquare, Eye, Expand, Save, FileText, Trash2, Copy, Briefcase, UserSquare, FileInput, Rows, CalendarDays, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
// import html2canvas from 'html2canvas'; // Removed static import

const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/stamp/178/98';
const COMPANY_LOGO_PLACEHOLDER = "https://picsum.photos/seed/leharlogo/200/100";


const AdOrderForm: FC = () => {
  const [ron, setRon] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [clientName, setClientName] = useState<string>('');
  const [advManagerInput1, setAdvManagerInput1] = useState<string>('');
  const [advManagerInput2, setAdvManagerInput2] = useState<string>('');
  const [headingCaption, setHeadingCaption] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [matterText, setMatterText] = useState<string>('');

  const [stampImage, setStampImage] = useState<string>(DEFAULT_STAMP_IMAGE_PLACEHOLDER);
  const [companyLogo, setCompanyLogo] = useState<string>(COMPANY_LOGO_PLACEHOLDER);

  const [rowsData, setRowsData] = useState<Array<Record<string, string | Date | undefined | null>>>(() => [
    { keyNo: '', publication: '', edition: '', size: '', scheduledDate: null, position: '' },
  ]);

  const printableAreaRef = useRef<HTMLDivElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && orderDate === undefined) {
        setOrderDate(new Date());
    }
  }, [isClient, orderDate]);

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
        setCompanyLogo(COMPANY_LOGO_PLACEHOLDER);
      }
    }
  }, [isClient]);


  const handleDateChange = (date: Date | undefined) => {
    setOrderDate(date);
  };

  const handleCellDateChange = (date: Date | undefined, index: number) => {
    const newRowsData = [...rowsData];
    newRowsData[index].scheduledDate = date;
    setRowsData(newRowsData);
  };

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      const computedStyle = typeof window !== 'undefined' ? getComputedStyle(textarea) : null;

      let minHeightScreen = 120; // Default for table textareas
      if (textarea.id === 'matterTextarea') {
        minHeightScreen = 100; // Specific for matter textarea
      } else if (textarea.classList.contains('print-textarea')) { // General class for table textareas
         minHeightScreen = 150; // Ensure this is sufficient
      }


      minHeightScreen = computedStyle ? Math.max(parseFloat(computedStyle.minHeight) || 0, minHeightScreen) : minHeightScreen;

      const isPrintingOrPdfContext = typeof window !== 'undefined' &&
                                     (document.body.classList.contains('pdf-export-active') ||
                                      document.body.classList.contains('print-preview-active') || // For modal preview
                                      document.body.classList.contains('fullscreen-body-active') || // For fullscreen preview
                                      document.body.classList.contains('printing-from-preview') || // For direct print from modal
                                      document.body.classList.contains('direct-print-active') || // For direct print from main page
                                      window.matchMedia('print').matches);

      if (isPrintingOrPdfContext) {
        // PDF Export specific height adjustments
        if (document.body.classList.contains('pdf-export-active')) {
            const pdfMinHeightVar = textarea.classList.contains('print-textarea') ? '--pdf-table-textarea-min-height' : '--pdf-matter-textarea-min-height';
            const pdfMaxHeightVar = textarea.classList.contains('print-textarea') ? '--pdf-table-textarea-max-height' : '--pdf-matter-textarea-max-height';
            const pdfMinHeight = parseFloat(computedStyle?.getPropertyValue(pdfMinHeightVar) || '20');
            const pdfMaxHeight = parseFloat(computedStyle?.getPropertyValue(pdfMaxHeightVar) || 'Infinity');

            let newHeight = textarea.scrollHeight;
            if (newHeight < pdfMinHeight) newHeight = pdfMinHeight;
            textarea.style.height = `${Math.min(newHeight, pdfMaxHeight)}px`;
            textarea.style.overflowY = newHeight > pdfMaxHeight ? 'hidden' : 'hidden'; // Clip if exceeds max height
        } else { // General print (browser print, print preview modal, fullscreen print)
            // For general print, allow content to define height mostly, but respect min-heights if set by CSS
            let newHeight = textarea.scrollHeight;
            if (textarea.classList.contains('print-textarea') && computedStyle) { // Specifically for table textareas in print
                const printTableMinHeight = parseFloat(computedStyle.getPropertyValue('--print-table-textarea-min-height') || 'auto');
                if (!isNaN(printTableMinHeight) && newHeight < printTableMinHeight) newHeight = printTableMinHeight;
            }
            textarea.style.height = `${newHeight}px`;
            textarea.style.overflowY = 'visible'; // Allow overflow in print to see all content
        }
      } else { // Screen view
        textarea.style.height = `${Math.max(textarea.scrollHeight, minHeightScreen)}px`;
        textarea.style.overflowY = 'auto'; // Scroll for overflow on screen
      }
    }
  }, []);


  useEffect(() => {
    // Adjust height for all textareas on relevant state changes or on initial load
    const allTextareas = document.querySelectorAll('#printable-area-pdf textarea, #printPreviewContent textarea');
    allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
  }, [rowsData, matterText, adjustTextareaHeight, headingCaption, packageName, advManagerInput1, advManagerInput2, clientName, ron, isPreviewing, isFullScreenPreview]);


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
     if (rowsData.length > 1) { // Only allow deletion if more than one row exists
        setRowsData(prevRows => prevRows.filter((_, i) => i !== index));
     } else {
        // Optionally, clear the first row instead of deleting it, or alert user
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
  };

  const triggerStampUpload = () => {
    stampInputRef.current?.click();
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
  };

  const triggerCompanyLogoUpload = () => {
    companyLogoInputRef.current?.click();
  };


  const generatePdf = useCallback(async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const elementToPrint = printableAreaRef.current;
    if (!elementToPrint || typeof window === 'undefined' || !html2pdf) {
        console.error('Element not found for PDF generation or html2pdf.js not loaded.');
        alert('PDF generation library not loaded. Please try again in a moment.');
        return;
    }

    // Temporarily add class for PDF specific styling and force reflow for textareas
    document.body.classList.add('pdf-export-active');
    const textareasOnPage = elementToPrint.querySelectorAll('textarea');
    textareasOnPage.forEach(ta => adjustTextareaHeight(ta)); // Adjust height based on PDF styles


    // Clone the element to avoid modifying the live DOM directly for PDF generation
    const clonedElement = elementToPrint.cloneNode(true) as HTMLElement;

    // Remove elements not needed for PDF
    clonedElement.querySelectorAll('.no-pdf-export').forEach(el => el.remove());
    clonedElement.querySelectorAll('.action-buttons-container').forEach(el => el.remove());
    clonedElement.querySelectorAll('.table-row-actions').forEach(el => el.remove());


    // Apply A4 dimensions and other essential styles for PDF generation
    clonedElement.style.width = '210mm';
    clonedElement.style.height = '297mm'; // Fixed height for single page PDF
    clonedElement.style.minHeight = '297mm';
    clonedElement.style.maxHeight = '297mm';
    clonedElement.style.overflow = 'hidden'; // Crucial to clip content to A4 size
    clonedElement.style.padding = '5mm';
    clonedElement.style.borderWidth = '2px'; // Match print styles for border
    clonedElement.style.boxSizing = 'border-box';
    
    // Ensure company logo uses the uploaded one if available for PDF
    const logoContainer = clonedElement.querySelector('.company-logo-container-pdf') as HTMLElement;
    if (logoContainer) {
        const imgElement = logoContainer.querySelector('img');
        if (imgElement && companyLogo && companyLogo !== COMPANY_LOGO_PLACEHOLDER) {
            imgElement.src = companyLogo;
        } else if (imgElement && (!companyLogo || companyLogo === COMPANY_LOGO_PLACEHOLDER)) {
             // Keep placeholder or remove if not desired in PDF
             imgElement.src = COMPANY_LOGO_PLACEHOLDER; // Or some default
        }
    }


    // Convert input fields to static text for PDF
    const inputsToConvert = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input.custom-input-pdf');
    inputsToConvert.forEach(inputEl => {
        const p = document.createElement('span');
        const input = inputEl as HTMLInputElement;
        let value = input.value;
        if (input.id === 'orderDate' && orderDate) {
             value = format(orderDate, 'dd.MM.yyyy');
        } else if (input.type === 'date' && !input.value && input.placeholder) {
            value = '\u00A0'; // Non-breaking space for empty placeholder dates
        } else if (input.type === 'date' && input.value){
            try {
                value = format(new Date(input.value), 'dd.MM.yyyy');
            } catch (e) {
                 value = input.value || '\u00A0'; // Fallback to raw value or nbsp
            }
        } else {
            value = input.value || '\u00A0'; // Non-breaking space for other empty inputs
        }
        p.textContent = value;
        p.className = 'static-print-text'; // Apply class for PDF styling
        const inputStyle = getComputedStyle(input); // Get styles from original input
        p.style.display = 'inline-block';
        p.style.width = inputStyle.width;
        p.style.minHeight = '1em'; // Ensure some height for empty fields
        p.style.fontFamily = inputStyle.fontFamily;
        p.style.fontSize = inputStyle.fontSize; // Use original font size, PDF CSS can override
        p.style.fontWeight = inputStyle.fontWeight;
        p.style.lineHeight = inputStyle.lineHeight;
        p.style.color = 'black'; // Ensure text is black
        p.style.borderBottom = inputStyle.borderBottomWidth + ' ' + inputStyle.borderBottomStyle + ' ' + inputStyle.borderBottomColor;
        p.style.padding = inputStyle.padding;
        p.style.backgroundColor = 'transparent'; // Ensure no background color
        input.parentNode?.replaceChild(p, input);
    });

    // Convert DatePickers in table to static text for PDF
    const datePickersInTable = clonedElement.querySelectorAll('.table-date-picker-wrapper');
    datePickersInTable.forEach((wrapper, index) => {
        const p = document.createElement('span');
        const originalRowData = rowsData[index]; // Get data from the state
        const dateValue = originalRowData?.scheduledDate;
        let displayValue = '\u00A0'; // Default to non-breaking space

        if (dateValue instanceof Date) {
            displayValue = format(dateValue, 'dd.MM.yyyy');
        } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
            // Attempt to parse if it's a string, otherwise use as is or placeholder
            try {
                displayValue = format(new Date(dateValue), 'dd.MM.yyyy');
            } catch { displayValue = dateValue; } // Fallback to the string if not a valid date
        }

        p.textContent = displayValue;
        p.className = 'static-print-text'; // Apply class for PDF styling
        // Apply specific styles for table date text
        p.style.display = 'block'; // Ensure it takes full cell width for centering
        p.style.width = '100%';
        p.style.textAlign = 'center';
        p.style.minHeight = '1em';
        p.style.fontFamily = 'Arial, sans-serif'; // Consistent font
        p.style.fontSize = '8pt'; // Match PDF table font size
        p.style.fontWeight = 'bold';
        p.style.lineHeight = '1.0'; // Match PDF table line height
        p.style.color = 'black';
        p.style.padding = '1px'; // Minimal padding
        p.style.backgroundColor = 'transparent';
        wrapper.parentNode?.replaceChild(p, wrapper);
    });


    // Convert textareas to static divs for PDF
    const textareasToConvert = clonedElement.querySelectorAll('textarea');
    textareasToConvert.forEach(textareaEl => {
        const div = document.createElement('div');
        const textarea = textareaEl as HTMLTextAreaElement;
        div.innerHTML = textarea.value.replace(/\n/g, '<br>') || '\u00A0'; // Preserve line breaks, use nbsp if empty
        div.className = 'static-print-text textarea-static-print'; // Apply classes for PDF styling

        // Copy relevant styles, PDF CSS will primarily control these
        const textareaStyle = getComputedStyle(textarea);
        div.style.fontFamily = textareaStyle.fontFamily;
        div.style.fontSize = textarea.id === 'matterTextarea' ? textareaStyle.fontSize : '8pt'; // Smaller font for table textareas
        div.style.fontWeight = textareaStyle.fontWeight;
        div.style.lineHeight = '1.0'; // Tighter line height for PDF
        div.style.color = 'black';
        div.style.backgroundColor = 'transparent';
        div.style.border = 'none'; // Remove individual border, container might have one
        div.style.height = 'auto'; // Allow content to dictate height initially
        div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
        div.style.wordWrap = 'break-word'; // Wrap long words

        if (textarea.id === 'matterTextarea') {
             div.classList.add('matter-container-print'); // Special class for matter container
             div.style.textAlign = textareaStyle.textAlign; // Preserve text alignment
        }
        textarea.parentNode?.replaceChild(div, textarea);
    });

    // Adapt specific elements for PDF appearance using classes defined in CSS
    const releaseOrderTitleClone = clonedElement.querySelector('.release-order-title-screen') as HTMLElement;
    if (releaseOrderTitleClone) releaseOrderTitleClone.className = 'release-order-titlebar-print-preview';

    const matterContainer = clonedElement.querySelector('.matter-container-print-parent');
    if(matterContainer) {
        const matterLabelClone = matterContainer.querySelector('.matter-label-screen') as HTMLElement;
        if (matterLabelClone) matterLabelClone.className = 'matter-label-print-preview';
    }

    const stampContainerClone = clonedElement.querySelector('.stamp-container-screen') as HTMLElement;
    if(stampContainerClone) {
        stampContainerClone.className = 'stamp-container-print-preview';
        const imgInStamp = stampContainerClone.querySelector('img');
        const placeholderDiv = stampContainerClone.querySelector('div.placeholder-div');

        if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER) {
            if (imgInStamp) {
                imgInStamp.src = stampImage; // Use current stamp image
                imgInStamp.alt = "Stamp";
            } else { // If no img tag, create one (e.g., if placeholder was just text)
                const newImg = document.createElement('img');
                newImg.src = stampImage;
                newImg.alt = "Stamp";
                stampContainerClone.innerHTML = ''; // Clear placeholder content
                stampContainerClone.appendChild(newImg);
            }
        } else if (placeholderDiv) {
            // Placeholder styling will be handled by CSS for .stamp-container-print-preview > div
        } else if (!imgInStamp) { // If no image and no specific placeholder div, ensure it's empty or styled by CSS
            stampContainerClone.textContent = ''; // Clear any default text
        }
    }
    // Ensure table uses PDF-specific classes
    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
        tableClone.classList.remove('main-table-bordered');
        tableClone.classList.add('print-table'); // Apply print-table class for PDF styling
        const tableHeaders = tableClone.querySelectorAll('th');
        tableHeaders.forEach(th => th.classList.add('print-table-header')); // Style for table headers in PDF
    }

    // html2pdf generation
    html2pdf().from(clonedElement).set({
        margin: [5,5,5,5], // Minimal margins [top, right, bottom, left] in mm
        filename: 'release_order_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2, // Higher scale for better quality
            useCORS: true, // For external images if any
            logging: false, // Disable html2canvas logging
            onclone: (documentClone: Document) => { // Adjust styles within the cloned document for html2canvas
                const clonedBody = documentClone.body;
                clonedBody.classList.add('pdf-export-active'); // Ensure PDF styles are active in clone
                
                // Force reflow/repaint to ensure styles are applied before rendering
                const _ = clonedBody.offsetHeight; // Reading offsetHeight can trigger reflow

                // Special handling for textarea static divs to ensure height fits content within PDF constraints
                const textareasInClone = clonedBody.querySelectorAll('.textarea-static-print');
                textareasInClone.forEach(ta => {
                    const htmlTa = ta as HTMLElement;
                    htmlTa.style.height = 'auto'; // Reset height to calculate scrollHeight correctly

                    // Apply min/max height constraints from CSS variables if available
                    const computedStyle = getComputedStyle(htmlTa);
                    const maxHeight = parseFloat(computedStyle.maxHeight || '9999'); // Default large if not set
                    const minHeight = parseFloat(computedStyle.minHeight || '0');  // Default 0 if not set

                    let newHeight = htmlTa.scrollHeight;
                    if (newHeight < minHeight) newHeight = minHeight;

                    htmlTa.style.height = `${Math.min(newHeight, maxHeight)}px`;
                    htmlTa.style.overflowY = 'hidden'; // Ensure content is clipped if it exceeds max-height
                });
            }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save().then(() => {
      document.body.classList.remove('pdf-export-active'); // Clean up class from body
    }).catch((error: Error) => {
        console.error("Error generating PDF:", error);
        document.body.classList.remove('pdf-export-active'); // Clean up class on error
    });

  }, [orderDate, stampImage, companyLogo, rowsData, matterText, advManagerInput1, advManagerInput2, clientName, headingCaption, packageName, ron, adjustTextareaHeight]);


  const handlePrintPreview = useCallback(() => {
    setIsPreviewing(true);
    if (typeof window !== 'undefined') document.body.classList.add('print-preview-active');
  }, []);

  const handleClosePrintPreview = useCallback(() => {
    setIsPreviewing(false);
    if (typeof window !== 'undefined') document.body.classList.remove('print-preview-active');
    const previewContentDiv = typeof window !== 'undefined' ? document.getElementById('printPreviewContent') : null;
    if (previewContentDiv) {
        previewContentDiv.innerHTML = ''; // Clear previous preview
    }
  }, []);


 // Function to handle the actual printing, can be called from preview modal or directly
 const printInternal = useCallback((isFromPreviewModal = false) => {
    if (typeof window !== 'undefined') {
        // Determine the source element for printing
        const contentSourceElement = isFromPreviewModal
            ? document.getElementById('printPreviewContent') // Use content from the modal
            : printableAreaRef.current; // Use content from the main page

        if (!contentSourceElement) {
            console.error("Content source for printing not found.");
            return;
        }

        // Add a class to body to signify printing context for CSS
        document.body.classList.add('printing-from-preview'); // Or a more generic 'printing-active'

        // Ensure all textareas are adjusted for print - this might be better handled by CSS @media print
        const allTextareas = contentSourceElement.querySelectorAll('textarea, .textarea-static-print'); // Include converted divs
        allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement)); // Adjust height

        // Create an iframe for isolated printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.left = '-9999px'; // Hide the iframe
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) {
            console.error("Could not access iframe document.");
            if(document.body.contains(iframe)) document.body.removeChild(iframe);
            document.body.classList.remove('printing-from-preview');
            return;
        }

        iframeDoc.open();
        iframeDoc.write('<html><head><title>Print</title>');
        // Copy stylesheets to iframe
        Array.from(document.styleSheets).forEach(styleSheet => {
            try {
                if (styleSheet.href && (styleSheet.href.startsWith('http') || styleSheet.href.startsWith('blob:'))) {
                     // For external stylesheets, link them directly
                     iframeDoc.write(`<link rel="stylesheet" type="${styleSheet.type || 'text/css'}" href="${styleSheet.href}">`);
                } else {
                    // For internal stylesheets, copy rules
                    const cssRules = Array.from(styleSheet.cssRules || [])
                        .map(rule => rule.cssText)
                        .join('\n');
                    if (cssRules) {
                        iframeDoc.write(`<style>${cssRules}</style>`);
                    }
                }
            } catch (e) {
                console.warn("Could not copy stylesheet for printing:", styleSheet.href, e);
                 // Fallback for stylesheets that couldn't be read (e.g. CORS issues if any, though unlikely for same-origin)
                 if (styleSheet.href) { // Try linking anyway if href exists
                    iframeDoc.write(`<link rel="stylesheet" type="${styleSheet.type || 'text/css'}" href="${styleSheet.href}">`);
                }
            }
        });
        iframeDoc.write('</head><body class="printing-from-preview direct-print-active">'); // Apply print-specific body classes

        // Clone the content to print into the iframe
        const clonedContent = contentSourceElement.cloneNode(true) as HTMLElement;
        // Ensure the cloned content also gets an ID that print CSS might target
        clonedContent.id = "printable-area-pdf"; // Standardize ID for print CSS

        // Append cloned content to iframe body
        iframeDoc.body.appendChild(clonedContent);
        iframeDoc.write('</body></html>');
        iframeDoc.close();


        // Trigger print and cleanup
        setTimeout(() => { // Timeout to allow iframe content to load
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => { // Timeout for print dialog to close
              if(document.body.contains(iframe)) { // Check if iframe still exists before removing
                 document.body.removeChild(iframe);
              }
              // Remove body classes after printing
              document.body.classList.remove('printing-from-preview');
              document.body.classList.remove('direct-print-active');
            }, 1000); // Adjust delay as needed
        }, 500); // Adjust delay as needed
    }
}, [adjustTextareaHeight]); // adjustTextareaHeight is a dependency


  const handleActualPrint = useCallback((isFromPreview = false) => {
    if (typeof window === 'undefined') return;

    if (isFromPreview && document.getElementById('printPreviewContent')) {
        // Printing content that's already prepared in the preview modal
        printInternal(true);
    } else {
        // Printing directly from the main page content
        const wasFullScreen = isFullScreenPreview;
        const exitFullscreenAndPrint = () => {
            // Brief timeout allows UI to settle if exiting fullscreen
            setTimeout(() => {
                document.body.classList.add('direct-print-active'); // Add class for direct print styling
                // Adjust textareas on the main printable area before printing
                const textareasOnPage = printableAreaRef.current?.querySelectorAll('textarea');
                textareasOnPage?.forEach(ta => adjustTextareaHeight(ta));

                window.print(); // Trigger browser's print dialog

                // Clean up class after print dialog likely closed
                setTimeout(() => document.body.classList.remove('direct-print-active'), 1000);
            }, 100);
        };

        if (wasFullScreen && document.fullscreenElement) {
            document.exitFullscreen().then(exitFullscreenAndPrint).catch(err => {
                console.error("Error exiting fullscreen:", err);
                exitFullscreenAndPrint(); // Proceed with printing even if exit fails
            });
        } else if (isPreviewing) { // If was in modal preview, close it first
            handleClosePrintPreview();
            setTimeout(exitFullscreenAndPrint, 50); // Short delay after closing modal
        }
         else {
            exitFullscreenAndPrint(); // Print directly
        }
    }
  }, [isPreviewing, isFullScreenPreview, handleClosePrintPreview, printInternal, adjustTextareaHeight]);


  const handleFullScreenPreviewToggle = useCallback(() => {
    const element = printableAreaRef.current;
    if (!element || typeof window === 'undefined') return;

    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
          // Inform user if fullscreen request fails
          alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
      document.exitFullscreen();
    }
  }, []);


  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fullscreenChangeHandler = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      setIsFullScreenPreview(isCurrentlyFullScreen);
      const element = printableAreaRef.current;
      if (element) {
          if (isCurrentlyFullScreen) {
            document.body.classList.add('fullscreen-body-active'); // Class for body when in fullscreen
            element.classList.add('fullscreen-preview-active');    // Class for the form itself
          } else {
            document.body.classList.remove('fullscreen-body-active');
            element.classList.remove('fullscreen-preview-active');
          }
          // Re-adjust textareas when fullscreen state changes, as layout might differ
          const allTextareas = document.querySelectorAll('#printable-area-pdf textarea, #printPreviewContent textarea');
          allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
      // Cleanup classes if component unmounts while in fullscreen
      if (document.body.classList.contains('fullscreen-body-active')) {
        document.body.classList.remove('fullscreen-body-active');
      }
      const activeElement = printableAreaRef.current;
      if(activeElement?.classList.contains('fullscreen-preview-active')) {
        activeElement.classList.remove('fullscreen-preview-active');
      }
    };
  }, [adjustTextareaHeight]);


  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isPreviewing && !isFullScreenPreview && printableAreaRef.current) {
      const previewNode = printableAreaRef.current.cloneNode(true) as HTMLElement | null;
      const previewContentDiv = document.getElementById('printPreviewContent');

      if (previewContentDiv && previewNode) {
        // Remove elements not desired in modal preview
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());
        previewNode.querySelectorAll('.action-buttons-container').forEach(el => el.remove()); // Remove action buttons
        previewNode.querySelectorAll('.table-row-actions').forEach(el => el.remove()); // Remove add/delete row buttons

        // Adapt specific elements for print preview appearance
        const releaseOrderTitle = previewNode.querySelector('.release-order-title-screen');
        if (releaseOrderTitle) {
            releaseOrderTitle.className = 'release-order-titlebar-print-preview'; // Use print-specific class
        }

        const matterContainerParent = previewNode.querySelector('.matter-container-print-parent');
        if(matterContainerParent) {
            const matterLabel = matterContainerParent.querySelector('.matter-label-screen');
            if (matterLabel) {
                matterLabel.className = 'matter-label-print-preview'; // Use print-specific class
            }
        }

        // Ensure company logo uses the uploaded one if available
        const companyLogoContainer = previewNode.querySelector('.company-logo-container-screen');
        if (companyLogoContainer) {
            // companyLogoContainer.className = 'company-logo-container-print-preview'; // If specific class needed
            const imgElement = companyLogoContainer.querySelector('img');
             if (companyLogo && companyLogo !== COMPANY_LOGO_PLACEHOLDER && imgElement) {
                 imgElement.src = companyLogo;
             } else if (imgElement) { // Ensure placeholder is used if no custom logo
                 imgElement.src = COMPANY_LOGO_PLACEHOLDER;
             }
        }

        const stampContainer = previewNode.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.className = 'stamp-container-print-preview'; // Use print-specific class
            const imgElement = stampContainer.querySelector('img');
            // Ensure stamp image or placeholder is correctly set
            if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && imgElement) {
                 imgElement.src = stampImage;
             } else if (imgElement) { // Placeholder if no custom stamp
                 imgElement.src = DEFAULT_STAMP_IMAGE_PLACEHOLDER;
            }
            // If imgElement is null (e.g. if placeholder was just text), this won't update.
            // Ensure the placeholder logic in JSX creates an <img> tag for DEFAULT_STAMP_IMAGE_PLACEHOLDER too.
        }

        // Convert inputs to static text for preview
        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            let value = input.value || ''; // Default to empty string if no value
            if (input.id === 'orderDate' && orderDate) { // Special handling for main orderDate
                 value = format(orderDate, 'dd.MM.yyyy');
            } else if (!input.value && input.placeholder && input.type !== 'date') {
                value = '\u00A0'; // Use non-breaking space for empty fields with placeholders
            } else if (input.type === 'date' && !input.value) { // Empty date fields
                 value = '\u00A0';
            } else if (input.type === 'date' && input.value){ // Format date if value exists
                try {
                    value = format(new Date(input.value), 'dd.MM.yyyy');
                } catch (e) { // Fallback if date is invalid
                    value = input.value || '\u00A0';
                }
            } else {
                value = input.value || '\u00A0'; // Fallback for other inputs
            }
            p.textContent = value;
            p.className = 'static-print-text no-underline-print'; // Apply styling class
            p.style.width = getComputedStyle(input).width; // Match original width
            p.style.minHeight = '1em'; // Ensure some height for empty fields
            input.parentNode?.replaceChild(p, input);
        });

        // Convert DatePickers in table to static text for preview
        const tableDatePickers = previewNode.querySelectorAll('.table-date-picker-wrapper');
        tableDatePickers.forEach((wrapper, index) => {
            const p = document.createElement('span');
            const originalRowData = rowsData[index];
            const dateValue = originalRowData?.scheduledDate;
            let displayValue = '\u00A0';

            if (dateValue instanceof Date) {
                displayValue = format(dateValue, 'dd.MM.yyyy');
            } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
                try {
                    displayValue = format(new Date(dateValue), 'dd.MM.yyyy');
                } catch { displayValue = dateValue; } // Fallback if not a valid date string
            }
            p.textContent = displayValue;
            p.className = 'static-print-text no-underline-print';
            // Basic styling for table date text
            p.style.display = 'block';
            p.style.width = '100%';
            p.style.textAlign = 'center';
            p.style.minHeight = '1em';
            wrapper.parentNode?.replaceChild(p, wrapper);
        });


        // Convert textareas to static divs for preview
        const textareas = previewNode.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            let value = textarea.value.replace(/\n/g, '<br>') || '';
            if (!textarea.value && textarea.placeholder) {
                value = '\u00A0'; // Use non-breaking space if empty with placeholder
            } else if(!textarea.value) {
                value = '\u00A0'; // Use non-breaking space if empty
            }
            div.innerHTML = value; // Use innerHTML to render <br> tags
            div.className = 'static-print-text textarea-static-print no-underline-print';
            if (textarea.id === 'matterTextarea') {
                 div.classList.add('matter-container-print'); // Special class for matter styling
                 div.style.textAlign = getComputedStyle(textarea).textAlign as CanvasTextAlign; // Preserve alignment
            }
            // Copy basic styles, print CSS will primarily control these
            const textareaStyle = getComputedStyle(textarea);
            div.style.fontFamily = textareaStyle.fontFamily;
            div.style.fontSize = textareaStyle.fontSize;
            div.style.fontWeight = textareaStyle.fontWeight;
            div.style.lineHeight = textareaStyle.lineHeight;
            div.style.color = 'black'; // Ensure text is black for preview
            div.style.backgroundColor = 'transparent'; // No background
            div.style.height = 'auto'; // Let content determine height
            div.style.minHeight = textareaStyle.minHeight || (textarea.id === 'matterTextarea' ? '100px' :'120px'); // Fallback min-height
            div.style.overflow = 'visible'; // Show all content
            div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
            div.style.wordWrap = 'break-word'; // Wrap long words

            textarea.parentNode?.replaceChild(div, textarea);
        });

        // Adapt table for print preview
        const tableInPreview = previewNode.querySelector('.main-table-bordered');
        if (tableInPreview) {
            tableInPreview.classList.remove('main-table-bordered');
            tableInPreview.classList.add('print-table'); // Use print-specific table class
            const tableHeaders = tableInPreview.querySelectorAll('th');
            tableHeaders.forEach(th => th.classList.add('print-table-header')); // Style headers
        }


        // Populate the preview modal content
        previewContentDiv.innerHTML = ''; // Clear previous content
        previewContentDiv.appendChild(previewNode);

        // Adjust height of converted textareas in the preview modal after appending
        const textareasInPreview = previewContentDiv.querySelectorAll('.textarea-static-print, .static-print-text'); // Include all static text elements
        textareasInPreview.forEach(ta => {
            const htmlTa = ta as HTMLElement;
            htmlTa.style.height = 'auto'; // Reset height
            htmlTa.style.height = `${htmlTa.scrollHeight}px`; // Set to scrollHeight
        });
      }
    } else if (!isPreviewing && !isFullScreenPreview) { // If exiting preview, clear content
        const previewContentDiv = document.getElementById('printPreviewContent');
        if (previewContentDiv) previewContentDiv.innerHTML = '';
    }
  }, [isPreviewing, isFullScreenPreview, orderDate, companyLogo, stampImage, rowsData, matterText, clientName, advManagerInput1, advManagerInput2, headingCaption, packageName, ron, adjustTextareaHeight ]);

  if (!isClient || orderDate === undefined) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">

      <div className="flex justify-end items-center gap-2 p-2 mb-2 no-print no-pdf-export action-buttons-container sticky top-0 bg-background z-50">
        <Button onClick={handlePrintPreview} variant="outline" size="sm"><Eye className="mr-2"/>Preview</Button>
        <Button onClick={() => handleActualPrint(false)} variant="outline" size="sm"><Printer className="mr-2"/>Print</Button>
        <Button onClick={handleFullScreenPreviewToggle} variant="outline" size="sm"><Expand className="mr-2"/>Fullscreen</Button>
        <Button onClick={generatePdf} variant="outline" size="sm"><Download className="mr-2"/>Download PDF</Button>
      </div>

      <div id="printable-area-pdf" ref={printableAreaRef} className={`w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 border-4 border-black ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-5 print-header-box">
            <div
                className="w-full md:w-[30%] p-3 border-2 border-black rounded box-decoration-clone company-logo-container-screen company-logo-container-pdf cursor-pointer"
                onClick={triggerCompanyLogoUpload}
                title="Click to upload company logo"
            >
                <Image src={companyLogo} alt="Company Logo" width={200} height={100} data-ai-hint="company logo" className="w-full h-auto object-contain max-h-full"/>
                <Input type="file" ref={companyLogoInputRef} onChange={handleCompanyLogoUpload} accept="image/*" className="hidden" />
            </div>
            <div className="flex-1 flex flex-col gap-3 p-3 border-2 border-black rounded">
                <div className="flex gap-3 items-center">
                    <div className="flex-1 flex items-center">
                        <Label htmlFor="roNumber" className="text-sm font-bold mr-2 whitespace-nowrap">R.O. No. LN:</Label>
                        <Input id="roNumber" type="text" value={ron} onChange={(e) => setRon(e.target.value)} className="text-sm py-1 px-2 h-auto border-2 border-black" placeholder=""/>
                    </div>
                    <div className="flex-1 flex items-center">
                         <Label htmlFor="orderDate" className="text-sm font-bold mr-2 whitespace-nowrap">Date:</Label>
                        <DatePicker selected={orderDate} onChange={handleDateChange} dateFormat="dd.MM.yyyy" className="text-sm py-1 px-2 h-auto w-full border-2 border-black text-center justify-center" id="orderDate" placeholderText=""/>
                    </div>
                </div>
                <div className="flex items-center">
                    <Label htmlFor="clientName" className="text-sm font-bold mr-2 whitespace-nowrap">Client:</Label>
                    <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-sm py-1 px-2 h-auto border-2 border-black" placeholder=""/>
                </div>
                 <div className="mt-2">
                    <Label className="text-sm font-bold">The Advertisement Manager</Label>
                    <Input value={advManagerInput1} onChange={(e) => setAdvManagerInput1(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1 border-2 border-black" placeholder=""/>
                    <Input value={advManagerInput2} onChange={(e) => setAdvManagerInput2(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1 border-2 border-black" placeholder=""/>
                </div>
                <div className="mt-auto pt-2 border-t border-black">
                    <p className="text-sm font-bold">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-5 print-header-box">
            <div className="flex-1 p-3 border-2 border-black rounded">
                <Label htmlFor="headingCaption" className="text-sm font-bold block mb-1">Heading/Caption:</Label>
                <Input id="headingCaption" value={headingCaption} onChange={(e) => setHeadingCaption(e.target.value)} className="text-sm py-1 px-2 h-auto border-2 border-black" placeholder=""/>
            </div>
            <div className="w-full md:w-[35%] p-3 border-2 border-black rounded">
                <Label htmlFor="packageName" className="text-sm font-bold block mb-1">Package:</Label>
                <Input id="packageName" value={packageName} onChange={(e) => setPackageName(e.target.value)} className="text-sm py-1 px-2 h-auto border-2 border-black" placeholder=""/>
            </div>
        </div>

        <div className="mb-5 table-container-print">
         <Table className="main-table-bordered print-border border border-black">
           <TableHeader className="bg-secondary print-table-header">
             <TableRow>
               <TableHead className="w-[10%] print-border border border-black p-1.5 text-sm font-bold">Key No.</TableHead>
               <TableHead className="w-[25%] print-border border border-black p-1.5 text-sm font-bold">Publication(s)</TableHead>
               <TableHead className="w-[20%] print-border border border-black p-1.5 text-sm font-bold">Edition(s)</TableHead>
               <TableHead className="w-[15%] print-border border border-black p-1.5 text-sm font-bold">Size</TableHead>
               <TableHead className="w-[15%] print-border border border-black p-1.5 text-sm font-bold">Scheduled Date(s)</TableHead>
               <TableHead className="w-[15%] print-border border border-black p-1.5 text-sm font-bold">Position</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {rowsData.map((row, index) => (
               <TableRow key={index} className="print-table-row">
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.keyNo as string} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.publication as string} onChange={(e) => handleTextareaInput(e, index, 'publication')}  className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.edition as string} onChange={(e) => handleTextareaInput(e, index, 'edition')} className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.size as string} onChange={(e) => handleTextareaInput(e, index, 'size')} className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black table-date-picker-wrapper">
                    <DatePicker
                        selected={row.scheduledDate instanceof Date ? row.scheduledDate : undefined}
                        onChange={(date) => handleCellDateChange(date, index)}
                        dateFormat="dd.MM.yyyy"
                        className="text-xs py-0.5 px-1 h-auto w-full border-0 rounded-none no-shadow-outline print-textarea text-center justify-center"
                        placeholderText=""
                    />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.position as string} onChange={(e) => handleTextareaInput(e, index, 'position')}  className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
          <div className="flex justify-start gap-2 mt-2 no-print no-pdf-export no-print-preview table-row-actions">
            <Button onClick={addRow} size="sm" variant="outline"><PlusSquare className="mr-2"/>Add Row</Button>
            {rowsData.length > 1 && <Button onClick={() => deleteRow(rowsData.length -1)} size="sm" variant="destructive"><MinusSquare className="mr-2"/>Delete Last Row</Button>}
          </div>
        </div>

        <div className="flex mb-3 min-h-[100px] items-stretch matter-container-print-parent p-0 border-2 border-black rounded">
            <div className="matter-label-screen flex items-center justify-center p-1 w-[38px] self-stretch">
                <span className="text-sm font-bold">MATTER</span>
            </div>
            <Textarea
              id="matterTextarea"
              value={matterText}
              onChange={handleMatterChange}
              className="flex-1 text-sm p-2 border-l-0 rounded-none resize-none min-h-[100px] h-auto no-shadow-outline focus:border-black matter-content-screen border-t-0 border-r-0 border-b-0 border-2 !border-l-0 !border-black"
              placeholder=""
            />
        </div>

        <div className="p-3 border-2 border-black rounded flex flex-col print-footer-box relative">
          <div className="w-full mb-2">
            <p className="text-xs font-bold mb-1">Forward all bills with relevant VTS copy to :-</p>
            <p className="text-xs leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101</p>
          </div>

          <hr className="border-black border-b-2 my-2 w-full" />

          <div className="flex justify-between items-start mt-0 pt-0">
            <div className="w-[62%]">
                <p className="text-sm font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Note:</p>
                <ol className="list-decimal list-inside text-xs space-y-0.5">
                  <li>Space reserved vide our letter No.</li>
                  <li>No two advertisements of the same client should appear in the same issue.</li>
                  <li>Please quote R.O. No. in all your bills and letters.</li>
                  <li>Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</li>
                </ol>
            </div>

             <div
                className="w-[35%] flex flex-col items-center justify-end stamp-parent-container mt-2 md:mt-0 self-end"
            >
                <div
                  className="stamp-container-screen w-[178px] h-[98px] flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                >
                {stampImage ? (
                     <Image src={stampImage} alt="Stamp" width={178} height={98} className="object-contain" data-ai-hint="signature company stamp" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 placeholder-div">
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" width={178} height={98} className="object-contain" data-ai-hint="upload placeholder"/>
                  </div>
                )}
                <Input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {isPreviewing && !isFullScreenPreview && (
        <div
          id="printPreviewOverlay"
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 no-print"
          onClick={(e) => { // Close modal if backdrop is clicked
             if (e.target === e.currentTarget) { 
                handleClosePrintPreview();
            }
          }}
        >
          <div
            id="printPreviewModalContentContainer"
            className="bg-white w-auto max-w-[210mm] min-h-[297mm] h-auto max-h-[95vh] p-0 shadow-2xl overflow-y-auto print-preview-modal-content no-print"
            onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
          >
             <div className="flex justify-end p-2 sticky top-0 bg-white z-10 border-b">
                <Button onClick={() => handleActualPrint(true)} variant="outline" size="sm" className="mr-2">
                    <Printer className="mr-2 h-4 w-4"/> Print
                </Button>
                <Button onClick={handleClosePrintPreview} variant="destructive" size="sm">
                    <XCircle className="mr-2 h-4 w-4" /> Close
                </Button>
            </div>
             <div id="printPreviewContent" className="print-preview-inner-content p-4">
                {/* Content will be cloned here by useEffect */}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdOrderForm;
