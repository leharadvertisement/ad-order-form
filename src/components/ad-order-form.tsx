// src/components/ad-order-form.tsx
'use client';

import type { FC } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Printer, PlusSquare, MinusSquare, Eye, Expand, Download, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/stamp/178/98';
const COMPANY_LOGO_PLACEHOLDER = "https://picsum.photos/seed/leharlogo/200/100";


const AdOrderForm: FC = () => {
  const [ron, setRon] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date()); // Initialize with current date
  const [clientName, setClientName] = useState<string>('');
  const [advManagerInput1, setAdvManagerInput1] = useState<string>('');
  const [advManagerInput2, setAdvManagerInput2] = useState<string>('');
  const [headingCaption, setHeadingCaption] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [matterText, setMatterText] = useState<string>('');

  const [stampImage, setStampImage] = useState<string>(DEFAULT_STAMP_IMAGE_PLACEHOLDER);
  const [companyLogo, setCompanyLogo] = useState<string>(COMPANY_LOGO_PLACEHOLDER);
  const [companyLogoInputKey, setCompanyLogoInputKey] = useState<number>(Date.now());
  const [stampInputKey, setStampInputKey] = useState<number>(Date.now() + 1);


  const [rowsData, setRowsData] = useState<Array<Record<string, string | Date | undefined | null>>>(() => [
    { keyNo: '', publication: '', edition: '', size: '', scheduledDate: null, position: '' },
  ]);

  const printableAreaRef = useRef<HTMLDivElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      const computedStyle = typeof window !== 'undefined' ? getComputedStyle(textarea) : null;

      let minHeightScreen = 120;
      if (textarea.id === 'matterTextarea') {
        minHeightScreen = 100;
      } else if (textarea.classList.contains('print-textarea')) {
         minHeightScreen = 150;
      }


      minHeightScreen = computedStyle ? Math.max(parseFloat(computedStyle.minHeight) || 0, minHeightScreen) : minHeightScreen;

      const isPrintingOrPdfContext = typeof window !== 'undefined' &&
                                     (document.body.classList.contains('pdf-export-active') ||
                                      document.body.classList.contains('print-preview-active') || // For modal preview
                                      document.body.classList.contains('fullscreen-body-active') || // For fullscreen preview
                                      document.body.classList.contains('printing-from-preview') || // For actual print from modal
                                      document.body.classList.contains('direct-print-active') || // For direct print
                                      window.matchMedia('print').matches); // General print context

      if (isPrintingOrPdfContext) {
        // PDF specific adjustments (takes precedence if pdf-export-active is set)
        if (document.body.classList.contains('pdf-export-active')) {
            const pdfMinHeightVar = textarea.classList.contains('print-textarea') ? '--pdf-table-textarea-min-height' : '--pdf-matter-textarea-min-height';
            const pdfMaxHeightVar = textarea.classList.contains('print-textarea') ? '--pdf-table-textarea-max-height' : '--pdf-matter-textarea-max-height';
            const pdfMinHeight = parseFloat(computedStyle?.getPropertyValue(pdfMinHeightVar) || '20');
            const pdfMaxHeight = parseFloat(computedStyle?.getPropertyValue(pdfMaxHeightVar) || 'Infinity');

            let newHeight = textarea.scrollHeight;
            if (newHeight < pdfMinHeight) newHeight = pdfMinHeight;
            textarea.style.height = `${Math.min(newHeight, pdfMaxHeight)}px`;
            textarea.style.overflowY = newHeight > pdfMaxHeight ? 'hidden' : 'hidden'; // Clip content
        } else { // General print / preview adjustments (non-PDF)
            let newHeight = textarea.scrollHeight;
            // Apply min-height from CSS variable for print-table if it exists
            if (textarea.classList.contains('print-textarea') && computedStyle) {
                const printTableMinHeight = parseFloat(computedStyle.getPropertyValue('--print-table-textarea-min-height') || 'auto');
                if (!isNaN(printTableMinHeight) && newHeight < printTableMinHeight) newHeight = printTableMinHeight;
            }
            textarea.style.height = `${newHeight}px`;
            textarea.style.overflowY = 'visible'; // Allow content to flow in print/preview
        }
      } else { // Screen adjustments
        textarea.style.height = `${Math.max(textarea.scrollHeight, minHeightScreen)}px`;
        textarea.style.overflowY = 'auto'; // Allow scroll on screen if content exceeds
      }
    }
  }, []);


  useEffect(() => {
    setIsClient(true);
  }, []);


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


  useEffect(() => {
    if (isClient) {
      const allTextareas = document.querySelectorAll('#printable-area-pdf textarea, #printPreviewContent textarea, body.fullscreen-body-active #printable-area-pdf textarea');
      allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
    }
  }, [isClient, rowsData, matterText, adjustTextareaHeight, headingCaption, packageName, advManagerInput1, advManagerInput2, clientName, ron, isPreviewing, isFullScreenPreview]);


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
     setStampInputKey(Date.now()); // Reset file input
  };

  const triggerStampUpload = () => {
    stampInputRef.current?.click();
  };
  
  const removeStampImage = () => {
      setStampImage(DEFAULT_STAMP_IMAGE_PLACEHOLDER);
      if (typeof window !== 'undefined') {
          localStorage.removeItem('uploadedStampImage');
      }
      setStampInputKey(Date.now()); // Reset file input
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
    setCompanyLogoInputKey(Date.now()); // Reset file input
  };

  const triggerCompanyLogoUpload = () => {
    companyLogoInputRef.current?.click();
  };
  
  const removeCompanyLogo = () => {
      setCompanyLogo(COMPANY_LOGO_PLACEHOLDER);
      if (typeof window !== 'undefined') {
          localStorage.removeItem('uploadedCompanyLogo');
      }
      setCompanyLogoInputKey(Date.now()); // Reset file input
  };


  const generatePdf = useCallback(async () => {
    if (typeof window === 'undefined' || typeof window.html2pdf === 'undefined') {
        console.error('html2pdf.js is not loaded yet or not available on window.');
        alert('PDF generation library not loaded. Please try again in a moment.');
        return;
    }
    const html2pdfLib = window.html2pdf;

    const elementToPrint = printableAreaRef.current;
    if (!elementToPrint) {
        console.error('Element not found for PDF generation.');
        alert('Element to print not found.');
        return;
    }

    document.body.classList.add('pdf-export-active');
    // Ensure all textareas are adjusted before cloning for PDF
    const textareasOnPage = elementToPrint.querySelectorAll('textarea');
    textareasOnPage.forEach(ta => adjustTextareaHeight(ta));


    // Clone the printable area to modify for PDF without affecting the screen
    const clonedElement = elementToPrint.cloneNode(true) as HTMLElement;

    // Remove elements not needed for PDF
    clonedElement.querySelectorAll('.no-pdf-export').forEach(el => el.remove());
    clonedElement.querySelectorAll('.action-buttons-container').forEach(el => el.remove());
    clonedElement.querySelectorAll('.table-row-actions').forEach(el => el.remove());


    // Apply A4 dimensions and PDF specific styling to the cloned element
    clonedElement.style.width = '210mm';
    clonedElement.style.height = '297mm'; // Fixed height for single page PDF
    clonedElement.style.minHeight = '297mm';
    clonedElement.style.maxHeight = '297mm';
    clonedElement.style.overflow = 'hidden'; // Critical to prevent overflow issues
    clonedElement.style.padding = '5mm'; // Consistent padding for PDF
    clonedElement.style.borderWidth = '2px'; // Thinner border for PDF
    clonedElement.style.boxSizing = 'border-box';

    // Ensure company logo is correctly set in the clone
    const logoContainer = clonedElement.querySelector('.company-logo-container-pdf') as HTMLElement;
    if (logoContainer) {
        const imgElement = logoContainer.querySelector('img');
        if (imgElement && companyLogo && companyLogo !== COMPANY_LOGO_PLACEHOLDER) {
            imgElement.src = companyLogo; // Use the current logo
        } else if (imgElement && (!companyLogo || companyLogo === COMPANY_LOGO_PLACEHOLDER)) {
             imgElement.src = COMPANY_LOGO_PLACEHOLDER; // Fallback to placeholder if needed
        }
    }


    // Convert inputs to static text for PDF
    const inputsToConvert = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input.custom-input-pdf');
    inputsToConvert.forEach(inputEl => {
        const p = document.createElement('span');
        const input = inputEl as HTMLInputElement;
        let value = input.value;
        if (input.id === 'orderDate' && orderDate) { // Ensure orderDate is correctly formatted
             value = format(orderDate, 'dd.MM.yyyy');
        } else if (input.type === 'date' && !input.value && input.placeholder) {
            value = '\u00A0'; // Non-breaking space for empty placeholders
        } else if (input.type === 'date' && input.value){
            try {
                value = format(new Date(input.value), 'dd.MM.yyyy');
            } catch (e) {
                 value = input.value || '\u00A0'; // Fallback for invalid date strings
            }
        } else {
            value = input.value || '\u00A0'; // Non-breaking space for empty inputs
        }
        p.textContent = value;
        p.className = 'static-print-text'; // Use class for PDF styling
        // Copy relevant styles from input to ensure visual consistency
        const inputStyle = getComputedStyle(input);
        p.style.display = 'inline-block'; // Or 'block' if it should take full width
        p.style.width = inputStyle.width; // Or 'auto' or a fixed PDF width
        p.style.minHeight = '1em'; // Ensure some height for empty fields
        p.style.fontFamily = inputStyle.fontFamily;
        p.style.fontSize = inputStyle.fontSize; // This will be overridden by .pdf-export-active .static-print-text
        p.style.fontWeight = inputStyle.fontWeight;
        p.style.lineHeight = inputStyle.lineHeight; // This will be overridden
        p.style.color = 'black'; // Ensure text is black for PDF
        p.style.borderBottom = inputStyle.borderBottomWidth + ' ' + inputStyle.borderBottomStyle + ' ' + inputStyle.borderBottomColor; // Keep underline
        p.style.padding = inputStyle.padding; // May need PDF-specific reduction
        p.style.backgroundColor = 'transparent'; // No background for static text
        input.parentNode?.replaceChild(p, input);
    });

    // Convert date pickers in table to static text
    const datePickersInTable = clonedElement.querySelectorAll('.table-date-picker-wrapper');
    datePickersInTable.forEach((wrapper, index) => {
        const p = document.createElement('span');
        const originalRowData = rowsData[index]; // Get data from state
        const dateValue = originalRowData?.scheduledDate;
        let displayValue = '\u00A0'; // Default to non-breaking space

        if (dateValue instanceof Date) {
            displayValue = format(dateValue, 'dd.MM.yyyy');
        } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
            try {
                displayValue = format(new Date(dateValue), 'dd.MM.yyyy'); // Attempt to parse string
            } catch { displayValue = dateValue; } // Fallback to original string if parsing fails
        }

        p.textContent = displayValue;
        p.className = 'static-print-text'; // Use class for PDF styling
        // Apply specific styles for table date text in PDF
        p.style.display = 'block';
        p.style.width = '100%';
        p.style.textAlign = 'center';
        p.style.minHeight = '1em';
        p.style.fontFamily = 'Arial, sans-serif'; // Consistent font
        p.style.fontSize = '8pt'; // PDF specific font size
        p.style.fontWeight = 'bold';
        p.style.lineHeight = '1.0'; // PDF specific line height
        p.style.color = 'black';
        p.style.padding = '1px';
        p.style.backgroundColor = 'transparent';
        wrapper.parentNode?.replaceChild(p, wrapper);
    });


    // Convert textareas to static divs for PDF
    const textareasToConvert = clonedElement.querySelectorAll('textarea');
    textareasToConvert.forEach(textareaEl => {
        const div = document.createElement('div');
        const textarea = textareaEl as HTMLTextAreaElement;
        div.innerHTML = textarea.value.replace(/\n/g, '<br>') || '\u00A0'; // Preserve line breaks, use nbsp for empty
        div.className = 'static-print-text textarea-static-print'; // Apply base and textarea-specific PDF classes

        // Copy essential styles, specific PDF styles will be applied via CSS
        const textareaStyle = getComputedStyle(textarea);
        div.style.fontFamily = textareaStyle.fontFamily;
        // Font size, line height, etc., will be controlled by .pdf-export-active .textarea-static-print
        div.style.fontWeight = textareaStyle.fontWeight;
        div.style.color = 'black';
        div.style.backgroundColor = 'transparent';
        div.style.border = 'none'; // Remove textarea border; container might have one
        div.style.height = 'auto'; // Let content determine height initially
        div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
        div.style.wordWrap = 'break-word'; // Prevent overflow

        if (textarea.id === 'matterTextarea') {
             div.classList.add('matter-container-print'); // Specific class for matter container styling in PDF
             div.style.textAlign = textareaStyle.textAlign;
        }
        textarea.parentNode?.replaceChild(div, textarea);
    });

    // Standardize titles and labels for PDF
    const releaseOrderTitleClone = clonedElement.querySelector('.release-order-title-screen') as HTMLElement;
    if (releaseOrderTitleClone) releaseOrderTitleClone.className = 'release-order-titlebar-print-preview';

    const matterContainer = clonedElement.querySelector('.matter-container-print-parent');
    if(matterContainer) {
        const matterLabelClone = matterContainer.querySelector('.matter-label-screen') as HTMLElement;
        if (matterLabelClone) matterLabelClone.className = 'matter-label-print-preview';
    }

    // Standardize stamp container for PDF
    const stampContainerClone = clonedElement.querySelector('.stamp-container-screen') as HTMLElement;
    if(stampContainerClone) {
        stampContainerClone.className = 'stamp-container-print-preview';
        const imgInStamp = stampContainerClone.querySelector('img');
        const placeholderDiv = stampContainerClone.querySelector('div.placeholder-div');

        if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER) {
            if (imgInStamp) {
                imgInStamp.src = stampImage;
                imgInStamp.alt = "Stamp";
            } else { // If no img tag, create one
                const newImg = document.createElement('img');
                newImg.src = stampImage;
                newImg.alt = "Stamp";
                stampContainerClone.innerHTML = ''; // Clear current content
                stampContainerClone.appendChild(newImg);
            }
        } else if (placeholderDiv) {
            // Placeholder div exists, do nothing or ensure it's styled for PDF
        } else if (!imgInStamp) { // No image and no placeholder, ensure content is cleared or set to placeholder text
            stampContainerClone.textContent = ''; // Or appropriate placeholder text for PDF
        }
    }
    // Standardize table for PDF
    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
        tableClone.classList.remove('main-table-bordered');
        tableClone.classList.add('print-table');
        const tableHeaders = tableClone.querySelectorAll('th');
        tableHeaders.forEach(th => th.classList.add('print-table-header'));
    }

    // html2pdf options
    html2pdfLib().from(clonedElement).set({
        margin: [5,5,5,5], // Margins in mm [top, left, bottom, right]
        filename: 'release_order_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2, // Higher scale for better quality
            useCORS: true, // For external images
            logging: false, // Disable extensive logging
            onclone: (documentClone: Document) => { // Callback after cloning, before rendering to canvas
                const clonedBody = documentClone.body;
                // Ensure the body also has the pdf-export-active class for styles to apply
                clonedBody.classList.add('pdf-export-active');

                // Trigger reflow to ensure styles are applied before rendering
                // This is a common trick to force the browser to recalculate layout
                const _ = clonedBody.offsetHeight; 

                // Adjust height of converted textareas within the cloned document
                const textareasInClone = clonedBody.querySelectorAll('.textarea-static-print');
                textareasInClone.forEach(ta => {
                    const htmlTa = ta as HTMLElement;
                    htmlTa.style.height = 'auto'; // Reset height to allow scrollHeight calculation

                    const computedStyle = getComputedStyle(htmlTa);
                    const maxHeight = parseFloat(computedStyle.maxHeight || '9999'); // Use a specific PDF max height from CSS or fallback
                    const minHeight = parseFloat(computedStyle.minHeight || '0');  // Use a specific PDF min height from CSS or fallback

                    let newHeight = htmlTa.scrollHeight;
                    if (newHeight < minHeight) newHeight = minHeight;
                    
                    htmlTa.style.height = `${Math.min(newHeight, maxHeight)}px`; // Set height, capped by max-height
                    htmlTa.style.overflowY = 'hidden'; // Important for PDF to clip content
                });
            }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save().then(() => {
      document.body.classList.remove('pdf-export-active'); // Clean up class from live body
    }).catch((error: Error) => {
        console.error("Error generating PDF:", error);
        document.body.classList.remove('pdf-export-active'); // Clean up on error
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
        previewContentDiv.innerHTML = ''; // Clear previous preview content
    }
  }, []);


  // Simplified print function to handle both direct and modal printing
 const printInternal = useCallback((isFromPreviewModal = false) => {
    if (typeof window === 'undefined') return;

    const contentSourceElement = isFromPreviewModal 
        ? document.getElementById('printPreviewContent') // Use content from modal
        : printableAreaRef.current; // Use content from main page

    if (!contentSourceElement) {
        console.error("Content source for printing not found.");
        return;
    }
    
    // Add classes to body to indicate print context
    document.body.classList.add('printing-from-preview'); // General class for styles during print iframe creation
    if (!isFromPreviewModal) {
        document.body.classList.add('direct-print-active'); // Specific class if printing directly from main page
    }

    // Adjust textareas in the source element before cloning
    const allTextareas = contentSourceElement.querySelectorAll('textarea, .textarea-static-print'); // Include already converted static divs
    allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));

    // Create an iframe for isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.left = '-9999px'; // Hide iframe off-screen
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
        console.error("Could not access iframe document.");
        if(document.body.contains(iframe)) document.body.removeChild(iframe); // Clean up iframe
        // Clean up body classes
        document.body.classList.remove('printing-from-preview');
        if (!isFromPreviewModal) document.body.classList.remove('direct-print-active');
        return;
    }

    iframeDoc.open();
    iframeDoc.write('<html><head><title>Print</title>');
    // Copy stylesheets
    Array.from(document.styleSheets).forEach(styleSheet => {
        try {
            if (styleSheet.href && (styleSheet.href.startsWith('http') || styleSheet.href.startsWith('blob:'))) { // External stylesheets
                 iframeDoc.write(`<link rel="stylesheet" type="${styleSheet.type || 'text/css'}" href="${styleSheet.href}">`);
            } else { // Inline stylesheets
                const cssRules = Array.from(styleSheet.cssRules || [])
                    .map(rule => rule.cssText)
                    .join('\n');
                if (cssRules) {
                    iframeDoc.write(`<style>${cssRules}</style>`);
                }
            }
        } catch (e) {
            console.warn("Could not copy stylesheet for printing:", styleSheet.href, e);
             // Fallback to linking if reading rules fails (e.g., CORS)
             if (styleSheet.href) { // Check href again to be sure
                iframeDoc.write(`<link rel="stylesheet" type="${styleSheet.type || 'text/css'}" href="${styleSheet.href}">`);
            }
        }
    });
    iframeDoc.write('</head><body class="printing-from-preview direct-print-active">'); // Add classes to iframe body for styling

    // Clone the content (either from modal or main page)
    const clonedContent = contentSourceElement.cloneNode(true) as HTMLElement;
    clonedContent.id = "printable-area-pdf"; // Ensure the cloned content has the correct ID for print styles

    iframeDoc.body.appendChild(clonedContent); // Append cloned content to iframe
    iframeDoc.write('</body></html>');
    iframeDoc.close();

    // Trigger print and cleanup
    setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => { // Delay removal to allow print dialog to fully process
          if(document.body.contains(iframe)) { // Check if iframe still exists
             document.body.removeChild(iframe);
          }
          // Clean up body classes
          document.body.classList.remove('printing-from-preview');
          if (!isFromPreviewModal) document.body.classList.remove('direct-print-active');
        }, 1000); // Increased delay for safety
    }, 500); // Delay to ensure iframe content is loaded
}, [adjustTextareaHeight]);


  // Unified print handler
  const handleActualPrint = useCallback((isFromPreview = false) => {
    if (typeof window === 'undefined') return;

    if (isFromPreview && document.getElementById('printPreviewContent')) {
        // If printing from the modal preview, use the content within the modal
        printInternal(true);
    } else {
        // If printing directly (not from modal, or modal content not found), handle fullscreen and print main page
        const wasFullScreen = isFullScreenPreview;
        const exitFullscreenAndPrint = () => {
            // Small delay to allow UI to settle after potential fullscreen exit
            setTimeout(() => {
                document.body.classList.add('direct-print-active'); // Class for direct print styling
                // Adjust textareas on the main printable area before printing
                const textareasOnPage = printableAreaRef.current?.querySelectorAll('textarea');
                textareasOnPage?.forEach(ta => adjustTextareaHeight(ta));

                window.print(); // Trigger browser's print dialog

                // Cleanup class after print dialog is likely closed
                setTimeout(() => document.body.classList.remove('direct-print-active'), 1000);
            }, 100); 
        };

        if (wasFullScreen && document.fullscreenElement) {
            // If in fullscreen, exit fullscreen first, then print
            document.exitFullscreen().then(exitFullscreenAndPrint).catch(err => {
                console.error("Error exiting fullscreen:", err);
                exitFullscreenAndPrint(); // Proceed with printing even if exit fails
            });
        } else if (isPreviewing) { // If in modal preview mode but not printing from modal (e.g., "Print" button on main page clicked)
            handleClosePrintPreview(); // Close modal first
            setTimeout(exitFullscreenAndPrint, 50); // Short delay before printing
        }
         else { // Directly print the main page content
            exitFullscreenAndPrint();
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
            document.body.classList.add('fullscreen-body-active'); // For global styles if needed
            element.classList.add('fullscreen-preview-active'); // For specific element styling
          } else {
            document.body.classList.remove('fullscreen-body-active');
            element.classList.remove('fullscreen-preview-active');
          }
          // Re-adjust textareas when fullscreen state changes
          const allTextareas = document.querySelectorAll('#printable-area-pdf textarea, #printPreviewContent textarea');
          allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    // Cleanup function
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
      // Ensure classes are removed if component unmounts while in fullscreen
      if (document.body.classList.contains('fullscreen-body-active')) {
        document.body.classList.remove('fullscreen-body-active');
      }
      const activeElement = printableAreaRef.current;
      if(activeElement?.classList.contains('fullscreen-preview-active')) {
        activeElement.classList.remove('fullscreen-preview-active');
      }
    };
  }, [adjustTextareaHeight]);


  // Effect for handling print preview modal content generation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isPreviewing && !isFullScreenPreview && printableAreaRef.current) {
      const previewNode = printableAreaRef.current.cloneNode(true) as HTMLElement | null;
      const previewContentDiv = document.getElementById('printPreviewContent');

      if (previewContentDiv && previewNode) {
        // Remove elements not intended for preview (e.g., action buttons from the original form)
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());
        previewNode.querySelectorAll('.action-buttons-container').forEach(el => el.remove());
        previewNode.querySelectorAll('.table-row-actions').forEach(el => el.remove());

        // Transform elements for preview (e.g., change classes for specific styling)
        const releaseOrderTitle = previewNode.querySelector('.release-order-title-screen');
        if (releaseOrderTitle) {
            releaseOrderTitle.className = 'release-order-titlebar-print-preview'; // Use print/PDF class
        }

        const matterContainerParent = previewNode.querySelector('.matter-container-print-parent');
        if(matterContainerParent) {
            const matterLabel = matterContainerParent.querySelector('.matter-label-screen');
            if (matterLabel) {
                matterLabel.className = 'matter-label-print-preview'; // Use print/PDF class
            }
        }

        // Handle company logo in preview
        const companyLogoContainer = previewNode.querySelector('.company-logo-container-screen');
        if (companyLogoContainer) {
            const imgElement = companyLogoContainer.querySelector('img');
             if (companyLogo && companyLogo !== COMPANY_LOGO_PLACEHOLDER && imgElement) {
                 imgElement.src = companyLogo; // Use current logo
             } else if (imgElement) {
                 imgElement.src = COMPANY_LOGO_PLACEHOLDER; // Fallback to placeholder
             }
        }

        // Handle stamp image in preview
        const stampContainer = previewNode.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.className = 'stamp-container-print-preview'; // Use print/PDF class
            const imgElement = stampContainer.querySelector('img');
            if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && imgElement) {
                 imgElement.src = stampImage; // Use current stamp
             } else if (imgElement) {
                 imgElement.src = DEFAULT_STAMP_IMAGE_PLACEHOLDER; // Fallback to placeholder
             }
        }

        // Convert inputs to static text for preview
        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            let value = input.value || ''; // Default to empty string
            if (input.id === 'orderDate' && orderDate) { // Special handling for main orderDate
                 value = format(orderDate, 'dd.MM.yyyy');
            } else if (!input.value && input.placeholder && input.type !== 'date') { // Use placeholder if value is empty
                value = '\u00A0'; // Non-breaking space for empty placeholders
            } else if (input.type === 'date' && !input.value) { // Empty date input
                 value = '\u00A0'; // Non-breaking space
            } else if (input.type === 'date' && input.value){ // Format date if value exists
                try {
                    value = format(new Date(input.value), 'dd.MM.yyyy');
                } catch (e) { // Fallback if date parsing fails
                    value = input.value || '\u00A0';
                }
            } else {
                value = input.value || '\u00A0'; // General case for other inputs
            }
            p.textContent = value;
            p.className = 'static-print-text no-underline-print'; // Apply styling class
            // Copy basic width style for layout consistency
            p.style.width = getComputedStyle(input).width;
            p.style.minHeight = '1em'; // Ensure some height
            input.parentNode?.replaceChild(p, input);
        });

        // Convert table date pickers to static text for preview
        const tableDatePickers = previewNode.querySelectorAll('.table-date-picker-wrapper');
        tableDatePickers.forEach((wrapper, index) => {
            const p = document.createElement('span');
            const originalRowData = rowsData[index]; // Get current data from state
            const dateValue = originalRowData?.scheduledDate;
            let displayValue = '\u00A0'; // Default to non-breaking space

            if (dateValue instanceof Date) {
                displayValue = format(dateValue, 'dd.MM.yyyy');
            } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
                try {
                    displayValue = format(new Date(dateValue), 'dd.MM.yyyy'); // Attempt to parse string
                } catch { displayValue = dateValue; } // Fallback if parsing fails
            }
            p.textContent = displayValue;
            p.className = 'static-print-text no-underline-print'; // Apply styling class
            // Basic styling for consistency in preview
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
            let value = textarea.value.replace(/\n/g, '<br>') || ''; // Preserve line breaks
            if (!textarea.value && textarea.placeholder) { // Use placeholder if value is empty
                value = '\u00A0'; // Non-breaking space for empty placeholders
            } else if(!textarea.value) {
                value = '\u00A0'; // Non-breaking space for empty textareas
            }
            div.innerHTML = value;
            div.className = 'static-print-text textarea-static-print no-underline-print'; // Apply styling class
            // Apply specific class for matter textarea for styling (e.g., text alignment)
            if (textarea.id === 'matterTextarea') {
                 div.classList.add('matter-container-print');
                 div.style.textAlign = getComputedStyle(textarea).textAlign as CanvasTextAlign;
            }

            // Copy essential styles from textarea to the div for visual consistency
            const textareaStyle = getComputedStyle(textarea);
            div.style.fontFamily = textareaStyle.fontFamily;
            div.style.fontSize = textareaStyle.fontSize;
            div.style.fontWeight = textareaStyle.fontWeight;
            div.style.lineHeight = textareaStyle.lineHeight;
            div.style.color = 'black'; // Ensure text is black in preview
            div.style.backgroundColor = 'transparent'; // No background for static text
            div.style.height = 'auto'; // Let content determine height
            div.style.minHeight = textareaStyle.minHeight || (textarea.id === 'matterTextarea' ? '100px' :'120px'); // Respect original min-height
            div.style.overflow = 'visible'; // Show all content in preview
            div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
            div.style.wordWrap = 'break-word'; // Prevent overflow

            textarea.parentNode?.replaceChild(div, textarea);
        });

        // Standardize table class for preview
        const tableInPreview = previewNode.querySelector('.main-table-bordered');
        if (tableInPreview) {
            tableInPreview.classList.remove('main-table-bordered');
            tableInPreview.classList.add('print-table'); // Use print/PDF table class
            const tableHeaders = tableInPreview.querySelectorAll('th');
            tableHeaders.forEach(th => th.classList.add('print-table-header')); // Style headers
        }


        previewContentDiv.innerHTML = ''; // Clear previous content
        previewContentDiv.appendChild(previewNode); // Add newly cloned and modified node

        // Re-adjust heights of converted textareas within the preview modal itself
        const textareasInPreview = previewContentDiv.querySelectorAll('.textarea-static-print, .static-print-text');
        textareasInPreview.forEach(ta => {
            const htmlTa = ta as HTMLElement;
            htmlTa.style.height = 'auto'; // Reset height for accurate scrollHeight calculation
            htmlTa.style.height = `${htmlTa.scrollHeight}px`; // Set to scrollHeight
        });
      }
    } else if (!isPreviewing && !isFullScreenPreview) { // If exiting preview or fullscreen
        const previewContentDiv = document.getElementById('printPreviewContent');
        if (previewContentDiv) previewContentDiv.innerHTML = ''; // Clear modal content
    }
  }, [isPreviewing, isFullScreenPreview, orderDate, companyLogo, stampImage, rowsData, matterText, clientName, advManagerInput1, advManagerInput2, headingCaption, packageName, ron, adjustTextareaHeight ]);

  // Loading state until client-side hydration is complete and orderDate is initialized
  if (!isClient) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">

      {/* Action buttons container - hidden in print/PDF */}
      <div className="flex justify-end items-center gap-2 p-2 mb-2 no-print no-pdf-export action-buttons-container sticky top-0 bg-background z-50">
        <Button onClick={handlePrintPreview} variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>Preview</Button>
        <Button onClick={() => handleActualPrint(false)} variant="outline" size="sm"><Printer className="mr-2 h-4 w-4"/>Print</Button>
        <Button onClick={handleFullScreenPreviewToggle} variant="outline" size="sm"><Expand className="mr-2 h-4 w-4"/>Fullscreen</Button>
        <Button onClick={generatePdf} variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
      </div>

      {/* Main printable area of the form */}
      <div id="printable-area-pdf" ref={printableAreaRef} className={`w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 border-4 border-black ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
        {/* Release Order Title */}
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        {/* Header Section: Company Info and RO Details */}
        <div className="flex flex-col md:flex-row gap-4 mb-5 print-header-box">
            {/* Left Box: Company Logo and Details */}
            <div
                className="w-full md:w-[30%] min-h-[150px] p-3 border-2 border-black rounded box-decoration-clone company-logo-container-screen company-logo-container-pdf cursor-pointer flex flex-col items-center justify-center relative"
                onClick={triggerCompanyLogoUpload}
                title="Click to upload company logo"
            >
                <div className="w-full h-full flex items-center justify-center">
                    <Image 
                        src={companyLogo} 
                        alt="Company Logo" 
                        layout="fill"
                        objectFit="contain"
                        data-ai-hint="company logo" 
                    />
                </div>
                <Input key={companyLogoInputKey} type="file" ref={companyLogoInputRef} onChange={handleCompanyLogoUpload} accept="image/*" className="hidden" />
                {companyLogo !== COMPANY_LOGO_PLACEHOLDER && (
                    <Button onClick={(e) => { e.stopPropagation(); removeCompanyLogo(); }} variant="ghost" size="icon" className="absolute top-1 right-1 no-print no-pdf-export">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                )}
            </div>

            {/* Right Box: RO Number, Date, Client, Ad Manager */}
            <div className="flex-1 flex flex-col gap-3 p-3 border-2 border-black rounded">
                <div className="flex gap-3 items-center">
                    <div className="flex-1 flex items-center">
                        <Label htmlFor="roNumber" className="text-sm font-bold mr-2 whitespace-nowrap">R.O. No. LN:</Label>
                        <Input id="roNumber" type="text" value={ron} onChange={(e) => setRon(e.target.value)} className="text-sm py-1 px-2 h-auto border-2 border-black" placeholder=""/>
                    </div>
                    <div className="flex-1 flex items-center">
                         <Label htmlFor="orderDate" className="text-sm font-bold mr-2 whitespace-nowrap">Date:</Label>
                        <DatePicker selected={orderDate} onChange={handleDateChange} dateFormat="dd.MM.yyyy" className="text-sm py-1 px-2 h-auto w-full border-2 border-black" id="orderDate" placeholderText=""/>
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

        {/* Heading/Caption and Package Section */}
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

        {/* Main Table for Ad Details */}
        <div className="mb-5 table-container-print">
         <Table className="main-table-bordered print-table border border-black">
           <TableHeader className="bg-secondary print-table-header">
             <TableRow>
               <TableHead className="w-[10%] border border-black p-1.5 text-sm font-bold">Key No.</TableHead>
               <TableHead className="w-[25%] border border-black p-1.5 text-sm font-bold">Publication(s)</TableHead>
               <TableHead className="w-[20%] border border-black p-1.5 text-sm font-bold">Edition(s)</TableHead>
               <TableHead className="w-[15%] border border-black p-1.5 text-sm font-bold">Size</TableHead>
               <TableHead className="w-[15%] border border-black p-1.5 text-sm font-bold">Scheduled Date(s)</TableHead>
               <TableHead className="w-[15%] border border-black p-1.5 text-sm font-bold">Position</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {rowsData.map((row, index) => (
               <TableRow key={index} className="print-table-row">
                 <TableCell className="main-table-bordered p-0 align-top border border-black">
                   <Textarea value={row.keyNo as string} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top border border-black">
                   <Textarea value={row.publication as string} onChange={(e) => handleTextareaInput(e, index, 'publication')}  className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top border border-black">
                   <Textarea value={row.edition as string} onChange={(e) => handleTextareaInput(e, index, 'edition')} className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top border border-black">
                   <Textarea value={row.size as string} onChange={(e) => handleTextareaInput(e, index, 'size')} className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top border border-black table-date-picker-wrapper">
                    <DatePicker
                        selected={row.scheduledDate instanceof Date ? row.scheduledDate : undefined}
                        onChange={(date) => handleCellDateChange(date, index)}
                        dateFormat="dd.MM.yyyy"
                        className="text-xs py-0.5 px-1 h-auto w-full border-0 rounded-none no-shadow-outline print-textarea"
                        placeholderText=""
                    />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top border border-black">
                   <Textarea value={row.position as string} onChange={(e) => handleTextareaInput(e, index, 'position')}  className="text-xs p-1 border-0 rounded-none resize-none min-h-[150px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
          {/* Add/Delete Row Buttons - hidden in print/PDF */}
          <div className="flex justify-start gap-2 mt-2 no-print no-pdf-export no-print-preview table-row-actions">
            <Button onClick={addRow} size="sm" variant="outline"><PlusSquare className="mr-2 h-4 w-4"/>Add Row</Button>
            {rowsData.length > 1 && <Button onClick={() => deleteRow(rowsData.length -1)} size="sm" variant="destructive"><MinusSquare className="mr-2 h-4 w-4"/>Delete Last Row</Button>}
          </div>
        </div>

        {/* Matter Section */}
        <div className="flex mb-3 min-h-[100px] items-stretch matter-container-print-parent p-0 border-2 border-black rounded">
            {/* Vertical "MATTER" Label */}
            <div className="matter-label-screen flex items-center justify-center p-1 w-[38px] self-stretch">
                <span className="text-sm font-bold">MATTER</span>
            </div>
            {/* Matter Textarea */}
            <Textarea
              id="matterTextarea"
              value={matterText}
              onChange={handleMatterChange}
              className="flex-1 text-sm p-2 border-l-0 rounded-none resize-none min-h-[100px] h-auto no-shadow-outline focus:border-black matter-content-screen border-t-0 border-r-0 border-b-0 border-2 !border-l-0 !border-black"
              placeholder=""
            />
        </div>

        {/* Footer Section: Billing Info, Notes, Stamp */}
        <div className="p-3 border-2 border-black rounded flex flex-col print-footer-box relative">
          {/* Billing Info */}
          <div className="w-full mb-2">
            <p className="text-xs font-bold mb-1">Forward all bills with relevant VTS copy to :-</p>
            <p className="text-xs leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101</p>
          </div>

          {/* Separator Line */}
          <hr className="border-black border-b-2 my-2 w-full" />

          {/* Notes and Stamp Area */}
          <div className="flex justify-between items-start mt-0 pt-0">
            {/* Left Side: Notes */}
            <div className="w-[62%]">
                <p className="text-sm font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Note:</p>
                <ol className="list-decimal list-inside text-xs space-y-0.5">
                  <li>Space reserved vide our letter No.</li>
                  <li>No two advertisements of the same client should appear in the same issue.</li>
                  <li>Please quote R.O. No. in all your bills and letters.</li>
                  <li>Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</li>
                </ol>
            </div>

            {/* Right Side: Stamp Area */}
             <div
                className="w-[35%] flex flex-col items-center justify-end stamp-parent-container mt-2 md:mt-0 self-end"
            >
                <div
                  className="stamp-container-screen w-[178px] h-[98px] flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80 relative"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                >
                {stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER ? (
                     <Image src={stampImage} alt="Stamp" layout="fill" objectFit="contain" data-ai-hint="signature company stamp" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 placeholder-div">
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" layout="fill" objectFit="contain" data-ai-hint="upload placeholder"/>
                  </div>
                )}
                <Input key={stampInputKey} type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                {stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && (
                    <Button onClick={(e) => { e.stopPropagation(); removeStampImage(); }} variant="ghost" size="icon" className="absolute top-1 right-1 no-print no-pdf-export">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                )}
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
            className="bg-white w-auto max-w-[210mm] min-h-[297mm] h-auto max-h-[95vh] p-0 shadow-2xl overflow-y-auto print-preview-modal-content no-print" // Ensure modal itself is not printed
            onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
          >
             {/* Modal Header with Print and Close Buttons */}
             <div className="flex justify-end p-2 sticky top-0 bg-white z-10 border-b"> {/* Sticky header for modal */}
                <Button onClick={() => handleActualPrint(true)} variant="outline" size="sm" className="mr-2">
                    <Printer className="mr-2 h-4 w-4"/> Print
                </Button>
                <Button onClick={handleClosePrintPreview} variant="destructive" size="sm">
                    <XCircle className="mr-2 h-4 w-4" /> Close
                </Button>
            </div>
             {/* Content to be previewed */}
             <div id="printPreviewContent" className="print-preview-inner-content p-4">
                {/* Cloned content will be injected here by useEffect */}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdOrderForm;
