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
import { Printer, PlusSquare, MinusSquare, Eye, Expand, Download, XCircle, Trash2, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/stamp/178/98';
const DEFAULT_COMPANY_LOGO_PLACEHOLDER = "https://picsum.photos/seed/leharlogo/200/250";


const AdOrderForm: FC = () => {
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

      let minHeightScreen = 120; // Default min-height for textareas in table rows
      if (textarea.id === 'matterTextarea') {
        minHeightScreen = 100; // Specific min-height for matter textarea
      } else if (textarea.classList.contains('print-textarea')) { // This class is on table textareas
         minHeightScreen = 150; // Increased min-height for table textareas
      }


      minHeightScreen = computedStyle ? Math.max(parseFloat(computedStyle.minHeight) || 0, minHeightScreen) : minHeightScreen;

      const isPrintingOrPdfContext = typeof window !== 'undefined' &&
                                     (document.body.classList.contains('pdf-export-active') ||
                                      document.body.classList.contains('print-preview-active') ||
                                      document.body.classList.contains('fullscreen-body-active') ||
                                      document.body.classList.contains('printing-from-preview') ||
                                      document.body.classList.contains('direct-print-active') ||
                                      window.matchMedia('print').matches);

      if (isPrintingOrPdfContext) {
        if (document.body.classList.contains('pdf-export-active')) {
            const pdfMinHeightVar = textarea.classList.contains('print-textarea') ? '--pdf-table-textarea-min-height' : '--pdf-matter-textarea-min-height';
            const pdfMaxHeightVar = textarea.classList.contains('print-textarea') ? '--pdf-table-textarea-max-height' : '--pdf-matter-textarea-max-height';
            const pdfMinHeight = parseFloat(computedStyle?.getPropertyValue(pdfMinHeightVar) || '20');
            const pdfMaxHeight = parseFloat(computedStyle?.getPropertyValue(pdfMaxHeightVar) || 'Infinity');

            let newHeight = textarea.scrollHeight;
            if (newHeight < pdfMinHeight) newHeight = pdfMinHeight;
            textarea.style.height = `${Math.min(newHeight, pdfMaxHeight)}px`;
            textarea.style.overflowY = newHeight > pdfMaxHeight ? 'hidden' : 'hidden';
        } else {
            let newHeight = textarea.scrollHeight;
            if (textarea.classList.contains('print-textarea') && computedStyle) {
                const printTableMinHeight = parseFloat(computedStyle.getPropertyValue('--print-table-textarea-min-height') || 'auto');
                if (!isNaN(printTableMinHeight) && newHeight < printTableMinHeight) newHeight = printTableMinHeight;
            }
            textarea.style.height = `${newHeight}px`;
            textarea.style.overflowY = 'visible'; // Changed from hidden to visible for print
        }
      } else {
        // Screen context
        textarea.style.height = `${Math.max(textarea.scrollHeight, minHeightScreen)}px`;
        textarea.style.overflowY = 'auto';
      }
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const allTextareas = document.querySelectorAll('#printable-area-pdf textarea, #printPreviewContent textarea, body.fullscreen-body-active #printable-area-pdf textarea');
      allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
    }
  }, [isClient, rowsData, matterText, adjustTextareaHeight, headingCaption, packageName, advManagerInput1, advManagerInput2, clientName, ron, isPreviewing, isFullScreenPreview]);


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
        // If it's the last row, clear its content instead of deleting
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
    if (typeof window === 'undefined') {
      console.error('Window object not available for PDF generation.');
      alert('PDF generation is not available in this environment.');
      return;
    }
    
    // Access html2pdf from the window object
    const html2pdf = (window as any).html2pdf;

    const elementToPrint = printableAreaRef.current;
    if (!elementToPrint || !html2pdf) {
        console.error('Element not found for PDF generation or html2pdf.js not loaded.');
        alert('Element to print not found or PDF library not loaded.');
        return;
    }

    document.body.classList.add('pdf-export-active');
    const textareasOnPage = elementToPrint.querySelectorAll('textarea');
    textareasOnPage.forEach(ta => adjustTextareaHeight(ta));


    const clonedElement = elementToPrint.cloneNode(true) as HTMLElement;

    clonedElement.querySelectorAll('.no-pdf-export').forEach(el => el.remove());
    clonedElement.querySelectorAll('.action-buttons-container').forEach(el => el.remove());
    clonedElement.querySelectorAll('.table-row-actions').forEach(el => el.remove());


    // A4 dimensions and styling for PDF
    clonedElement.style.width = '210mm';
    clonedElement.style.height = '297mm'; // Fixed height for A4
    clonedElement.style.minHeight = '297mm';
    clonedElement.style.maxHeight = '297mm';
    clonedElement.style.overflow = 'hidden'; // Important: clip content outside A4
    clonedElement.style.padding = '5mm'; // Reduced padding for PDF
    clonedElement.style.borderWidth = '2px'; // Thinner border for PDF
    clonedElement.style.boxSizing = 'border-box';

    // Ensure company logo is correctly set for PDF
    const logoContainer = clonedElement.querySelector('.company-logo-container-pdf') as HTMLElement;
    if (logoContainer) {
        const imgElement = logoContainer.querySelector('img');
        if (imgElement && companyLogo && companyLogo !== DEFAULT_COMPANY_LOGO_PLACEHOLDER) {
            imgElement.src = companyLogo;
        } else if (imgElement && (!companyLogo || companyLogo === DEFAULT_COMPANY_LOGO_PLACEHOLDER)) {
             imgElement.src = DEFAULT_COMPANY_LOGO_PLACEHOLDER; // Fallback if logo is default or not set
        }
    }


    // Convert inputs to static text for PDF
    const inputsToConvert = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input.custom-input-pdf');
    inputsToConvert.forEach(inputEl => {
        const p = document.createElement('span');
        const input = inputEl as HTMLInputElement;
        let value = input.value;
        if (input.id === 'orderDate' && orderDate) {
             value = format(orderDate, 'dd.MM.yyyy');
        } else if (input.type === 'date' && !input.value && input.placeholder) {
            value = '\u00A0'; // Non-breaking space for empty placeholders
        } else if (input.type === 'date' && input.value){
            try {
                value = format(new Date(input.value), 'dd.MM.yyyy');
            } catch (e) {
                 value = input.value || '\u00A0'; // Fallback if date parsing fails
            }
        } else {
            value = input.value || '\u00A0'; // Non-breaking space for empty inputs
        }
        p.textContent = value;
        p.className = 'static-print-text'; // Ensure this class has appropriate PDF styles
        const inputStyle = getComputedStyle(input);
        p.style.display = 'inline-block'; // Or block, depending on desired layout
        p.style.width = inputStyle.width;
        p.style.minHeight = '1em'; // Ensure some height even if empty
        p.style.fontFamily = inputStyle.fontFamily;
        p.style.fontSize = inputStyle.fontSize; // Consider reducing for PDF
        p.style.fontWeight = inputStyle.fontWeight;
        p.style.lineHeight = inputStyle.lineHeight; // Consider reducing for PDF
        p.style.color = 'black';
        p.style.borderBottom = inputStyle.borderBottomWidth + ' ' + inputStyle.borderBottomStyle + ' ' + inputStyle.borderBottomColor; // Copy border style
        p.style.padding = inputStyle.padding; // Consider reducing for PDF
        p.style.backgroundColor = 'transparent';
        input.parentNode?.replaceChild(p, input);
    });

    // Convert date pickers in table to static text for PDF
    const datePickersInTable = clonedElement.querySelectorAll('.table-date-picker-wrapper');
    datePickersInTable.forEach((wrapper, index) => {
        const p = document.createElement('span');
        const originalRowData = rowsData[index]; // Assuming rowsData is in scope and correctly indexed
        const dateValue = originalRowData?.scheduledDate;
        let displayValue = '\u00A0'; // Default to non-breaking space

        if (dateValue instanceof Date) {
            displayValue = format(dateValue, 'dd.MM.yyyy');
        } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
            try {
                displayValue = format(new Date(dateValue), 'dd.MM.yyyy');
            } catch { displayValue = dateValue; } // Fallback to original string if parsing fails
        }

        p.textContent = displayValue;
        p.className = 'static-print-text'; // Use a consistent class for PDF text
        p.style.display = 'block'; // Or 'inline-block' as needed
        p.style.width = '100%';
        p.style.textAlign = 'center';
        p.style.minHeight = '1em';
        p.style.fontFamily = 'Arial, sans-serif'; // Example font
        p.style.fontSize = '8pt'; // Smaller font for PDF table
        p.style.fontWeight = 'bold';
        p.style.lineHeight = '1.0'; // Tighter line height
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
        div.innerHTML = textarea.value.replace(/\n/g, '<br>') || '\u00A0'; // Handle newlines and empty textareas
        div.className = 'static-print-text textarea-static-print'; // Consistent class for PDF

        // Apply styles for PDF, potentially from CSS variables or directly
        const textareaStyle = getComputedStyle(textarea);
        div.style.fontFamily = textareaStyle.fontFamily;
        // div.style.fontSize = '8pt'; // Example: smaller font for PDF textareas
        div.style.fontWeight = textareaStyle.fontWeight;
        // div.style.lineHeight = '1.0'; // Tighter line height for PDF
        div.style.color = 'black';
        div.style.backgroundColor = 'transparent';
        div.style.border = 'none'; // Remove textarea border, rely on container or CSS for PDF borders
        div.style.height = 'auto'; // Let content dictate height initially
        div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and newlines
        div.style.wordWrap = 'break-word'; // Prevent overflow

        if (textarea.id === 'matterTextarea') {
             div.classList.add('matter-container-print'); // Specific class for matter content
             div.style.textAlign = textareaStyle.textAlign; // Maintain original text alignment
        }
        textarea.parentNode?.replaceChild(div, textarea);
    });

    // Apply specific PDF classes or styles
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
                imgInStamp.src = stampImage;
                imgInStamp.alt = "Stamp";
            } else {
                const newImg = document.createElement('img');
                newImg.src = stampImage;
                newImg.alt = "Stamp";
                stampContainerClone.innerHTML = ''; // Clear placeholder
                stampContainerClone.appendChild(newImg);
            }
        } else if (placeholderDiv) {
            // If placeholder is present and no stampImage, keep it or clear it based on desired PDF output
        } else if (!imgInStamp) {
            // If no image and no placeholder, ensure it's empty or has default text
            stampContainerClone.textContent = ''; // Or some placeholder text
        }
    }
    // Update table classes for PDF styling
    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
        tableClone.classList.remove('main-table-bordered');
        tableClone.classList.add('print-table'); // Apply PDF-specific table class
        const tableHeaders = tableClone.querySelectorAll('th');
        tableHeaders.forEach(th => th.classList.add('print-table-header')); // PDF header style
    }

    // html2pdf options
    html2pdf().from(clonedElement).set({
        margin: [5,5,5,5], // Margins for PDF [top, left, bottom, right] in mm
        filename: 'release_order_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2, // Higher scale for better quality
            useCORS: true, // For external images if any
            logging: false, // Disable html2canvas logging
            onclone: (documentClone: Document) => {
                // This function is called after the element is cloned but before rendering to canvas
                // Useful for final adjustments specific to html2canvas rendering
                const clonedBody = documentClone.body;
                clonedBody.classList.add('pdf-export-active'); // Ensure PDF styles apply in cloned doc

                // Force repaint/reflow might be needed for some complex layouts
                const _ = clonedBody.offsetHeight; // Reading offsetHeight can trigger reflow

                // Adjust height of converted textareas within the cloned document for PDF
                const textareasInClone = clonedBody.querySelectorAll('.textarea-static-print');
                textareasInClone.forEach(ta => {
                    const htmlTa = ta as HTMLElement;
                    htmlTa.style.height = 'auto'; // Reset height

                    // Get PDF-specific min/max height from CSS variables or defaults
                    const computedStyle = getComputedStyle(htmlTa);
                    const maxHeight = parseFloat(computedStyle.maxHeight || '9999'); // Use a large number if no max-height
                    const minHeight = parseFloat(computedStyle.minHeight || '0'); // Default min-height

                    let newHeight = htmlTa.scrollHeight; // Calculate scrollHeight
                    if (newHeight < minHeight) newHeight = minHeight; // Enforce min-height

                    htmlTa.style.height = `${Math.min(newHeight, maxHeight)}px`; // Apply height, capped by max-height
                    htmlTa.style.overflowY = 'hidden'; // Hide overflow for PDF
                });
            }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save().then(() => {
      document.body.classList.remove('pdf-export-active'); // Clean up class after PDF generation
    }).catch((error: Error) => {
        console.error("Error generating PDF:", error);
        document.body.classList.remove('pdf-export-active');
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


 const printInternal = useCallback((isFromPreviewModal = false) => {
    if (typeof window === 'undefined') return;

    const contentSourceElement = isFromPreviewModal
        ? document.getElementById('printPreviewContent') // Source is the modal content
        : printableAreaRef.current; // Source is the main form

    if (!contentSourceElement) {
        console.error("Content source for printing not found.");
        return;
    }

    // Add classes to body to trigger print-specific styles
    document.body.classList.add('printing-from-preview'); // General print class
    if (!isFromPreviewModal) {
        document.body.classList.add('direct-print-active'); // Specific class for direct print
    }

    // Adjust textarea heights for printing context
    const allTextareas = contentSourceElement.querySelectorAll('textarea, .textarea-static-print'); // Include already converted textareas if any
    allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));

    // Create an iframe for isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.left = '-9999px'; // Position off-screen
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
        console.error("Could not access iframe document.");
        if(document.body.contains(iframe)) document.body.removeChild(iframe);
        // Clean up body classes
        document.body.classList.remove('printing-from-preview');
        if (!isFromPreviewModal) document.body.classList.remove('direct-print-active');
        return;
    }

    iframeDoc.open();
    iframeDoc.write('<html><head><title>Print</title>');
    // Copy stylesheets to iframe
    Array.from(document.styleSheets).forEach(styleSheet => {
        try {
            if (styleSheet.href && (styleSheet.href.startsWith('http') || styleSheet.href.startsWith('blob:'))) { // External or blob stylesheets
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
             // Fallback for stylesheets that couldn't be read (e.g. CORS issues for local dev)
             if (styleSheet.href) {
                iframeDoc.write(`<link rel="stylesheet" type="${styleSheet.type || 'text/css'}" href="${styleSheet.href}">`);
            }
        }
    });
    iframeDoc.write('</head><body class="printing-from-preview direct-print-active">'); // Apply print classes to iframe body

    // Clone the content to be printed
    const clonedContent = contentSourceElement.cloneNode(true) as HTMLElement;
    clonedContent.id = "printable-area-pdf"; // Ensure the cloned content has the correct ID for styling

    iframeDoc.body.appendChild(clonedContent);
    iframeDoc.write('</body></html>');
    iframeDoc.close();

    // Wait for iframe to load, then print and cleanup
    setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => { // Cleanup after print dialog
          if(document.body.contains(iframe)) {
             document.body.removeChild(iframe);
          }
          // Remove print-specific classes from main body
          document.body.classList.remove('printing-from-preview');
          if (!isFromPreviewModal) document.body.classList.remove('direct-print-active');
        }, 1000); // Delay to ensure print dialog is handled
    }, 500); // Delay for iframe content to render
}, [adjustTextareaHeight]);


  const handleActualPrint = useCallback((isFromPreview = false) => {
    if (typeof window === 'undefined') return;

    if (isFromPreview && document.getElementById('printPreviewContent')) {
        // Printing from the preview modal
        printInternal(true);
    } else {
        // Direct print from the main page
        const wasFullScreen = isFullScreenPreview;
        const exitFullscreenAndPrint = () => {
            // Ensure form is not in preview mode or fullscreen mode anymore
            // This logic is crucial if printing directly after exiting fullscreen
            // It ensures the correct element and styles are used.
            setTimeout(() => {
                document.body.classList.add('direct-print-active'); // Apply direct print styles
                // Re-adjust textareas on the main form before printing
                const textareasOnPage = printableAreaRef.current?.querySelectorAll('textarea');
                textareasOnPage?.forEach(ta => adjustTextareaHeight(ta));

                window.print(); // Trigger browser's print dialog

                // Clean up class after a delay
                setTimeout(() => document.body.classList.remove('direct-print-active'), 1000);
            }, 100); // Short delay to allow UI to update if exiting fullscreen
        };

        if (wasFullScreen && document.fullscreenElement) {
            document.exitFullscreen().then(exitFullscreenAndPrint).catch(err => {
                console.error("Error exiting fullscreen:", err);
                exitFullscreenAndPrint(); // Attempt to print anyway
            });
        } else if (isPreviewing) {
            // If in modal preview, close it first, then print main form
            handleClosePrintPreview();
            setTimeout(exitFullscreenAndPrint, 50); // Delay to allow modal to close
        }
         else {
            // Standard direct print
            exitFullscreenAndPrint();
        }
    }
  }, [isPreviewing, isFullScreenPreview, handleClosePrintPreview, printInternal, adjustTextareaHeight]);


  const handleFullScreenPreviewToggle = useCallback(() => {
    const element = printableAreaRef.current;
    if (!element || typeof window === 'undefined') return;

    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
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
            document.body.classList.add('fullscreen-body-active');
            element.classList.add('fullscreen-preview-active');
          } else {
            document.body.classList.remove('fullscreen-body-active');
            element.classList.remove('fullscreen-preview-active');
          }
          // Re-adjust textareas on fullscreen change
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


  // Effect for handling Print Preview Modal content
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isPreviewing && !isFullScreenPreview && printableAreaRef.current) {
      const previewNode = printableAreaRef.current.cloneNode(true) as HTMLElement | null;
      const previewContentDiv = document.getElementById('printPreviewContent');

      if (previewContentDiv && previewNode) {
        // Remove elements not needed in preview
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());
        previewNode.querySelectorAll('.action-buttons-container').forEach(el => el.remove());
        previewNode.querySelectorAll('.table-row-actions').forEach(el => el.remove());

        // Apply preview-specific classes and transformations
        const releaseOrderTitle = previewNode.querySelector('.release-order-title-screen');
        if (releaseOrderTitle) {
            releaseOrderTitle.className = 'release-order-titlebar-print-preview';
        }

        const matterContainerParent = previewNode.querySelector('.matter-container-print-parent');
        if(matterContainerParent) {
            const matterLabel = matterContainerParent.querySelector('.matter-label-screen');
            if (matterLabel) {
                matterLabel.className = 'matter-label-print-preview';
            }
        }
        
        // Handle company logo in preview
        const companyLogoContainer = previewNode.querySelector('.company-logo-container-screen');
        if (companyLogoContainer) {
            const imgElement = companyLogoContainer.querySelector('img');
             if (companyLogo && companyLogo !== DEFAULT_COMPANY_LOGO_PLACEHOLDER && imgElement) {
                 imgElement.src = companyLogo;
             } else if (imgElement) { // If no custom logo, use placeholder
                 imgElement.src = DEFAULT_COMPANY_LOGO_PLACEHOLDER;
             }
        }

        // Handle stamp image in preview
        const stampContainer = previewNode.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.className = 'stamp-container-print-preview';
            const imgElement = stampContainer.querySelector('img');
            if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && imgElement) {
                 imgElement.src = stampImage;
             } else if (imgElement) { // If no custom stamp, use placeholder
                 imgElement.src = DEFAULT_STAMP_IMAGE_PLACEHOLDER;
             }
        }

        // Convert inputs to static text for preview
        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            let value = input.value || ''; // Default to empty string
            if (input.id === 'orderDate' && orderDate) {
                 value = format(orderDate, 'dd.MM.yyyy');
            } else if (!input.value && input.placeholder && input.type !== 'date') { // Use placeholder if value is empty (for non-date inputs)
                value = '\u00A0'; // Non-breaking space for empty placeholders
            } else if (input.type === 'date' && !input.value) { // Handle empty date inputs specifically
                 value = '\u00A0';
            } else if (input.type === 'date' && input.value){
                try {
                    value = format(new Date(input.value), 'dd.MM.yyyy');
                } catch (e) { // Fallback if date parsing fails
                    value = input.value || '\u00A0';
                }
            } else {
                value = input.value || '\u00A0'; // Non-breaking space for other empty inputs
            }
            p.textContent = value;
            p.className = 'static-print-text no-underline-print'; // Class for styling static text in preview
            p.style.width = getComputedStyle(input).width; // Maintain width
            p.style.minHeight = '1em'; // Ensure visibility
            input.parentNode?.replaceChild(p, input);
        });

        // Convert table date pickers to static text
        const tableDatePickers = previewNode.querySelectorAll('.table-date-picker-wrapper');
        tableDatePickers.forEach((wrapper, index) => {
            const p = document.createElement('span');
            const originalRowData = rowsData[index];
            const dateValue = originalRowData?.scheduledDate;
            let displayValue = '\u00A0'; // Default to non-breaking space

            if (dateValue instanceof Date) {
                displayValue = format(dateValue, 'dd.MM.yyyy');
            } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
                try {
                    displayValue = format(new Date(dateValue), 'dd.MM.yyyy');
                } catch { displayValue = dateValue; } // Fallback if parsing fails
            }
            p.textContent = displayValue;
            p.className = 'static-print-text no-underline-print';
            p.style.display = 'block'; // Or 'inline-block'
            p.style.width = '100%';
            p.style.textAlign = 'center';
            p.style.minHeight = '1em';
            wrapper.parentNode?.replaceChild(p, wrapper);
        });


        // Convert textareas to divs for preview
        const textareas = previewNode.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            let value = textarea.value.replace(/\n/g, '<br>') || ''; // Handle newlines
            if (!textarea.value && textarea.placeholder) { // Use placeholder if value is empty
                value = '\u00A0'; // Non-breaking space for empty placeholders
            } else if(!textarea.value) {
                value = '\u00A0'; // Non-breaking space for other empty textareas
            }
            div.innerHTML = value;
            div.className = 'static-print-text textarea-static-print no-underline-print'; // Class for styling static textareas in preview
            if (textarea.id === 'matterTextarea') {
                 div.classList.add('matter-container-print'); // Specific class for matter content
                 div.style.textAlign = getComputedStyle(textarea).textAlign as CanvasTextAlign; // Maintain alignment
            }

            // Apply styles to match textarea appearance
            const textareaStyle = getComputedStyle(textarea);
            div.style.fontFamily = textareaStyle.fontFamily;
            div.style.fontSize = textareaStyle.fontSize;
            div.style.fontWeight = textareaStyle.fontWeight;
            div.style.lineHeight = textareaStyle.lineHeight;
            div.style.color = 'black'; // Ensure text is black
            div.style.backgroundColor = 'transparent'; // Ensure background is transparent
            div.style.height = 'auto'; // Let content dictate height
            div.style.minHeight = textareaStyle.minHeight || (textarea.id === 'matterTextarea' ? '100px' :'120px');
            div.style.overflow = 'visible'; // Show all content
            div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace
            div.style.wordWrap = 'break-word'; // Wrap long words

            textarea.parentNode?.replaceChild(div, textarea);
        });

        // Apply preview-specific table class
        const tableInPreview = previewNode.querySelector('.main-table-bordered');
        if (tableInPreview) {
            tableInPreview.classList.remove('main-table-bordered');
            tableInPreview.classList.add('print-table'); // Use print-specific table class
            const tableHeaders = tableInPreview.querySelectorAll('th');
            tableHeaders.forEach(th => th.classList.add('print-table-header')); // Style headers for preview
        }


        previewContentDiv.innerHTML = ''; // Clear previous content
        previewContentDiv.appendChild(previewNode);

        // Final adjustment of textarea heights in preview
        const textareasInPreview = previewContentDiv.querySelectorAll('.textarea-static-print, .static-print-text');
        textareasInPreview.forEach(ta => {
            const htmlTa = ta as HTMLElement;
            htmlTa.style.height = 'auto'; // Reset height
            htmlTa.style.height = `${htmlTa.scrollHeight}px`; // Set to scrollHeight
        });
      }
    } else if (!isPreviewing && !isFullScreenPreview) {
        // Clear preview content when exiting preview mode
        const previewContentDiv = document.getElementById('printPreviewContent');
        if (previewContentDiv) previewContentDiv.innerHTML = '';
    }
  }, [isPreviewing, isFullScreenPreview, orderDate, companyLogo, stampImage, rowsData, matterText, clientName, advManagerInput1, advManagerInput2, headingCaption, packageName, ron, adjustTextareaHeight ]);

  if (!isClient) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">

      <div className="flex justify-end items-center gap-2 p-2 mb-2 no-print no-pdf-export action-buttons-container sticky top-0 bg-background z-50">
        <Button onClick={handlePrintPreview} variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>Preview</Button>
        <Button onClick={() => handleActualPrint(false)} variant="outline" size="sm"><Printer className="mr-2 h-4 w-4"/>Print</Button>
        <Button onClick={handleFullScreenPreviewToggle} variant="outline" size="sm"><Expand className="mr-2 h-4 w-4"/>Fullscreen</Button>
        <Button onClick={generatePdf} variant="outline" size="sm"><Download className="mr-2 h-4 w-4"/>Download PDF</Button>
      </div>

      <div id="printable-area-pdf" ref={printableAreaRef} className={`w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 border-4 border-black ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-stretch gap-4 mb-5 print-header-box">
            <div
                className="w-full md:w-[30%] p-1.5 border-2 border-black rounded flex flex-col relative company-logo-container-screen company-logo-container-pdf cursor-pointer items-center justify-center overflow-hidden min-h-[200px] md:min-h-[250px]"
                onClick={triggerCompanyLogoUpload}
                title="Click to upload company logo"
                style={{ height: 'auto' }} 
            >
                 <div className="relative w-full h-full flex items-center justify-center">
                     <Image
                        src={companyLogo}
                        alt="Company Logo"
                        layout="intrinsic" // Changed to intrinsic
                        width={200} // Provide a base width
                        height={200} // Provide a base height, adjust as needed to fit the 'box' proportionally
                        objectFit="contain"
                        className="rounded max-w-full max-h-full" // max-w-full and max-h-full to ensure it fits
                        data-ai-hint="company logo"
                    />
                </div>
                <Input key={companyLogoInputKey} type="file" ref={companyLogoInputRef} onChange={handleCompanyLogoUpload} accept="image/*" className="hidden" />
                {companyLogo !== DEFAULT_COMPANY_LOGO_PLACEHOLDER && companyLogo !== '' && (
                    <Button onClick={(e) => { e.stopPropagation(); removeCompanyLogo(); }} variant="ghost" size="icon" className="absolute top-1 right-1 no-print no-pdf-export">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                )}
            </div>

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
          <div className="flex justify-start gap-2 mt-2 no-print no-pdf-export no-print-preview table-row-actions">
            <Button onClick={addRow} size="sm" variant="outline"><PlusSquare className="mr-2 h-4 w-4"/>Add Row</Button>
            {rowsData.length > 1 && <Button onClick={() => deleteRow(rowsData.length -1)} size="sm" variant="destructive"><MinusSquare className="mr-2 h-4 w-4"/>Delete Last Row</Button>}
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
                  className="stamp-container-screen w-[178px] h-[98px] flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80 relative"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                >
                {stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER ? (
                     <Image src={stampImage} alt="Stamp" layout="intrinsic" width={178} height={98} objectFit="contain" data-ai-hint="signature company stamp" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 placeholder-div">
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" layout="intrinsic" width={178} height={98} objectFit="contain" data-ai-hint="upload placeholder"/>
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

      {isPreviewing && !isFullScreenPreview && (
        <div
          id="printPreviewOverlay"
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 no-print"
          onClick={(e) => {
             // Close modal if backdrop is clicked
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
                {/* Cloned content will be injected here by useEffect */}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdOrderForm;
