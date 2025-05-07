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
import { Download, Printer, Eye, X, Save, UploadCloud, Search, Eraser, CheckCircle, FileText, Settings, Copy, Palette, Briefcase, Users, Building, CalendarDays, FileDown, Maximize, EyeOff, Undo, ExternalLink, MinusSquare, PlusSquare } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://picsum.photos/200/120?random&data-ai-hint=signature+placeholder';


const AdOrderForm: FC = () => {
  const [ron, setRon] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [clientName, setClientName] = useState<string>('');
  const [advManagerInput1, setAdvManagerInput1] = useState<string>('');
  const [advManagerInput2, setAdvManagerInput2] = useState<string>('');
  const [headingCaption, setHeadingCaption] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [matterText, setMatterText] = useState<string>('');
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [rowsData, setRowsData] = useState<Array<Record<string, string | Date | undefined | null>>>(() => [
    { keyNo: '', publication: '', edition: '', size: '', scheduledDate: null, position: '' },
  ]);

  const printableAreaRef = useRef<HTMLDivElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Ensure orderDate is initialized on client if not already set
    if (typeof window !== 'undefined' && !orderDate) {
        setOrderDate(new Date());
    }
  }, [orderDate]);


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
      const minHeight = computedStyle ? parseFloat(computedStyle.minHeight) : 70;

      const isPrintingOrPdfContext = typeof window !== 'undefined' &&
                                     (document.body.classList.contains('pdf-export-active') ||
                                      document.body.classList.contains('print-preview-active') ||
                                      document.body.classList.contains('fullscreen-body-active') ||
                                      window.matchMedia('print').matches);

      if (isPrintingOrPdfContext) {
        if (document.body.classList.contains('pdf-export-active')) {
            textarea.style.height = `${Math.max(textarea.scrollHeight, parseFloat(computedStyle?.getPropertyValue('--pdf-textarea-min-height') || '20'))}px`;
        } else {
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
      } else {
        textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
      }
    }
  }, []);


  useEffect(() => {
    const allTextareas = document.querySelectorAll('#printable-area-pdf textarea');
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
     if (rowsData.length > 1) {
        setRowsData(prevRows => prevRows.filter((_, i) => i !== index));
     } else {
        // Optionally, clear the first row instead of deleting it
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedImage = localStorage.getItem('uploadedStampImage');
      if (savedImage) {
        setStampImage(savedImage);
      }
    }
  }, []);


  const clearForm = () => {
    setRon('');
    setOrderDate(new Date());
    setClientName('');
    setAdvManagerInput1('');
    setAdvManagerInput2('');
    setHeadingCaption('');
    setPackageName('');
    setMatterText('');
    setRowsData([{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: null, position: '' }]);
    setStampImage(null);
    if (typeof window !== 'undefined') {
        localStorage.removeItem('adOrderFormDraft');
        localStorage.removeItem('uploadedStampImage');
    }
  };

  const saveDraft = () => {
    const draftData = {
      ron,
      orderDate: orderDate?.toISOString(),
      clientName,
      advManagerInput1,
      advManagerInput2,
      headingCaption,
      packageName,
      matterText,
      rowsData: rowsData.map(row => ({...row, scheduledDate: row.scheduledDate instanceof Date ? row.scheduledDate.toISOString() : row.scheduledDate })),
      stampImage,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('adOrderFormDraft', JSON.stringify(draftData));
      alert('Draft saved!');
    }
  };

  const loadDraft = () => {
    if (typeof window !== 'undefined') {
      const draftString = localStorage.getItem('adOrderFormDraft');
      if (draftString) {
        const draftData = JSON.parse(draftString);
        setRon(draftData.ron || '');
        setOrderDate(draftData.orderDate ? new Date(draftData.orderDate) : new Date());
        setClientName(draftData.clientName || '');
        setAdvManagerInput1(draftData.advManagerInput1 || '');
        setAdvManagerInput2(draftData.advManagerInput2 || '');
        setHeadingCaption(draftData.headingCaption || '');
        setPackageName(draftData.packageName || '');
        setMatterText(draftData.matterText || '');
        setRowsData(draftData.rowsData && draftData.rowsData.length > 0 ? draftData.rowsData.map((row:any) => ({...row, scheduledDate: row.scheduledDate ? new Date(row.scheduledDate) : null})) : [{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: null, position: '' }]);
        setStampImage(draftData.stampImage || null);
        alert('Draft loaded!');
      } else {
        alert('No draft found.');
      }
    }
  };

  const generatePdf = useCallback(async () => {
    const element = printableAreaRef.current;
    if (!element || typeof window === 'undefined' || !(window as any).html2pdf) {
        console.error('html2pdf is not loaded or element not found');
        return;
    }

    document.body.classList.add('pdf-export-active');

    const textareasOnPage = element.querySelectorAll('textarea');
    textareasOnPage.forEach(ta => adjustTextareaHeight(ta));

    const clonedElement = element.cloneNode(true) as HTMLElement;

    clonedElement.querySelectorAll('.no-pdf-export').forEach(el => el.remove());

    clonedElement.style.width = '210mm';
    clonedElement.style.height = '297mm'; // Ensure fixed height for A4
    clonedElement.style.minHeight = '297mm';
    clonedElement.style.maxHeight = '297mm';
    clonedElement.style.overflow = 'hidden'; // Important to prevent content overflow
    clonedElement.style.padding = '5mm';
    clonedElement.style.fontSize = '9pt';
    clonedElement.style.lineHeight = '1.1';
    clonedElement.style.borderWidth = '2px';
    clonedElement.style.boxSizing = 'border-box';


    const inputsToConvert = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
    inputsToConvert.forEach(inputEl => {
        const p = document.createElement('span');
        const input = inputEl as HTMLInputElement;
        let value = input.value;
        if (input.id === 'orderDate' && orderDate) {
             value = format(orderDate, 'dd.MM.yyyy');
        } else if (input.type === 'date' && !input.value && input.placeholder) {
            value = '';
        } else if (input.type === 'date' && input.value){
            try {
                value = format(new Date(input.value), 'dd.MM.yyyy');
            } catch (e) {
                // if date is invalid, keep original value
            }
        }
        p.textContent = value || '\u00A0'; // Use non-breaking space for empty values
        p.className = 'static-print-text';
        p.style.display = 'inline-block';
        p.style.width = getComputedStyle(input).width;
        p.style.minHeight = '1em';
        p.style.fontFamily = getComputedStyle(input).fontFamily;
        p.style.fontSize = 'inherit'; // Inherit from parent for PDF
        p.style.fontWeight = getComputedStyle(input).fontWeight;
        p.style.lineHeight = 'inherit'; // Inherit for PDF
        p.style.color = 'black';
        p.style.borderBottom = '1px solid black';
        p.style.padding = '1px 0'; // Minimal padding for PDF
        p.style.backgroundColor = 'transparent';
        input.parentNode?.replaceChild(p, input);
    });

    const datePickersInTable = clonedElement.querySelectorAll('.table-date-picker-wrapper');
    datePickersInTable.forEach((wrapper, index) => {
        const p = document.createElement('span');
        const originalRowData = rowsData[index];
        const dateValue = originalRowData?.scheduledDate;
        let displayValue = '\u00A0'; // Non-breaking space
        if (dateValue instanceof Date) {
            displayValue = format(dateValue, 'dd.MM.yyyy');
        } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
            try {
                displayValue = format(new Date(dateValue), 'dd.MM.yyyy');
            } catch { displayValue = dateValue; }
        }

        p.textContent = displayValue;
        p.className = 'static-print-text';
        p.style.display = 'block';
        p.style.width = '100%';
        p.style.minHeight = '1em';
        p.style.fontFamily = 'Arial, sans-serif'; // Consistent font for PDF
        p.style.fontSize = '8pt'; // Reduced font for table cells in PDF
        p.style.fontWeight = 'bold';
        p.style.lineHeight = '1.0'; // Tighter line height for PDF
        p.style.color = 'black';
        p.style.padding = '1px'; // Minimal padding
        p.style.backgroundColor = 'transparent';
        wrapper.parentNode?.replaceChild(p, wrapper);
    });


    const textareasToConvert = clonedElement.querySelectorAll('textarea');
    textareasToConvert.forEach(textareaEl => {
        const div = document.createElement('div');
        const textarea = textareaEl as HTMLTextAreaElement;
        div.innerHTML = textarea.value.replace(/\n/g, '<br>') || '\u00A0'; // Use non-breaking space
        div.className = 'static-print-text textarea-static-print';
        if (textarea.id === 'matterTextarea') {
             div.classList.add('matter-container-print');
             // Define specific min/max heights for matter textarea in PDF to control overflow
             div.style.minHeight = 'var(--pdf-matter-textarea-min-height, 40px)';
             div.style.maxHeight = 'var(--pdf-matter-textarea-max-height, 80px)'; // Adjust as needed
             div.style.overflow = 'hidden'; // Hide overflow for PDF
        } else {
            // Define specific min/max heights for table textareas
            div.style.minHeight = 'var(--pdf-table-textarea-min-height, 15px)';
            div.style.maxHeight = 'var(--pdf-table-textarea-max-height, 40px)'; // Adjust as needed
            div.style.overflow = 'hidden'; // Hide overflow
        }
        div.style.fontFamily = getComputedStyle(textarea).fontFamily;
        div.style.fontSize = textarea.id === 'matterTextarea' ? 'inherit' : '8pt'; // Smaller for table
        div.style.fontWeight = getComputedStyle(textarea).fontWeight;
        div.style.lineHeight = '1.0'; // Tighter line height for PDF
        div.style.color = 'black';
        div.style.backgroundColor = 'transparent';
        div.style.border = 'none'; // Remove original textarea border
         if (textarea.id === 'matterTextarea') {
            div.style.borderTop = '1px solid black';
            div.style.borderBottom = '1px solid black';
            div.style.padding = '1px';
        }
        div.style.height = 'auto'; // Let content define height up to max-height
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        textarea.parentNode?.replaceChild(div, textarea);
        // After replacing, ensure height does not exceed max-height
        const finalHeight = Math.min(div.scrollHeight, parseFloat(div.style.maxHeight || '9999'));
        div.style.height = `${finalHeight}px`;
    });

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
        const placeholderInStamp = stampContainerClone.querySelector('div > img'); // Assuming placeholder is wrapped

        if (stampImage && imgInStamp && imgInStamp.src !== DEFAULT_STAMP_IMAGE_PLACEHOLDER) {
            imgInStamp.style.maxWidth = "100%";
            imgInStamp.style.maxHeight = "100%";
            imgInStamp.style.objectFit = "contain";
        } else if (stampImage && !imgInStamp) { // If stampImage exists but no img tag (e.g., was placeholder)
            const newImg = document.createElement('img');
            newImg.src = stampImage;
            newImg.alt = "Stamp";
            newImg.style.maxWidth = "100%";
            newImg.style.maxHeight = "100%";
            newImg.style.objectFit = "contain";
            stampContainerClone.innerHTML = ''; // Clear previous content (e.g., placeholder text/div)
            stampContainerClone.appendChild(newImg);
        } else if (!stampImage && placeholderInStamp) {
             // Ensure placeholder image is also styled correctly if no stamp is uploaded
             placeholderInStamp.style.maxWidth = "100%";
             placeholderInStamp.style.maxHeight = "100%";
             placeholderInStamp.style.objectFit = "contain";
        } else if (!stampImage && !imgInStamp && !placeholderInStamp) { // Fallback if neither stamp nor placeholder img found
            stampContainerClone.textContent = 'Stamp Area'; // Or some placeholder text
        }
    }
    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
        tableClone.classList.remove('main-table-bordered');
        tableClone.classList.add('print-table'); // Apply PDF-specific table styles
        const tableHeaders = tableClone.querySelectorAll('th');
        tableHeaders.forEach(th => th.classList.add('print-table-header'));
    }


    const opt = {
        margin: [5, 5, 5, 5], // Reduced margins for A4
        filename: 'release_order_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false, // Disable logging for cleaner console
            width: clonedElement.offsetWidth, // Use actual width of the cloned element
            height: clonedElement.offsetHeight, // Use actual height
            windowWidth: clonedElement.scrollWidth,
            windowHeight: clonedElement.scrollHeight,
            onclone: (documentClone: Document) => {
                const clonedBody = documentClone.body;
                clonedBody.classList.add('pdf-export-active'); // Apply PDF styles to the cloned document
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _ = clonedBody.offsetHeight; // Trigger reflow to apply styles

                // Re-adjust textarea heights in the cloned document before rendering to canvas
                const textareasInClone = clonedBody.querySelectorAll('.textarea-static-print'); // Or your class for converted textareas
                 textareasInClone.forEach(ta => {
                    const htmlTa = ta as HTMLElement;
                    htmlTa.style.height = 'auto'; // Reset height
                    const maxHeight = parseFloat(getComputedStyle(htmlTa).maxHeight || '9999');
                    htmlTa.style.height = `${Math.min(htmlTa.scrollHeight, maxHeight)}px`; // Set to scrollHeight or maxHeight
                    htmlTa.style.overflowY = 'hidden'; // Hide scrollbar if content overflows maxHeight
                });
            }
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
        },
        pagebreak: { mode: ['css', 'avoid-all'], before: '.page-break-before' } // Attempt to avoid breaks inside elements
    };


    (window as any).html2pdf().from(clonedElement).set(opt).save()
    .then(() => {
        document.body.classList.remove('pdf-export-active'); // Clean up class from main document
    })
    .catch((error: any) => {
        console.error("Error generating PDF:", error);
        document.body.classList.remove('pdf-export-active');
    });


  }, [orderDate, stampImage, rowsData, matterText, advManagerInput1, advManagerInput2, clientName, headingCaption, packageName, ron, adjustTextareaHeight]);


  const handlePrintPreview = useCallback(() => {
    setIsPreviewing(true);
    if (typeof window !== 'undefined') document.body.classList.add('print-preview-active');
  }, []);

  const handleClosePrintPreview = useCallback(() => {
    setIsPreviewing(false);
    if (typeof window !== 'undefined') document.body.classList.remove('print-preview-active');
    const previewContentDiv = typeof window !== 'undefined' ? document.getElementById('printPreviewContent') : null;
    if (previewContentDiv) {
        previewContentDiv.innerHTML = ''; // Clear preview content on close
    }
  }, []);

  const handleActualPrint = useCallback(() => {
    if (typeof window !== 'undefined') {
        const wasPreviewing = isPreviewing;

        // If currently in modal preview, close it first to ensure styles are reset
        if(wasPreviewing) {
             handleClosePrintPreview();
        }

        // Apply a class to the body specifically for direct printing
        // This allows for print-specific styles that might differ from PDF/preview
        document.body.classList.add('direct-print-active');

        // Use a timeout to allow the DOM to update and styles to apply
        setTimeout(() => {
            window.print();
            // Clean up the class after printing
            document.body.classList.remove('direct-print-active');
        }, 100); // Small delay, adjust if needed
    }
  }, [isPreviewing, handleClosePrintPreview]);


  const handleFullScreenPreview = useCallback(() => {
    const element = printableAreaRef.current;
    if (!element || typeof window === 'undefined') return;

    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(err => {
          alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    }
  }, []);

  const handleExitFullScreenPreview = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (document.fullscreenElement) {
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
            element.classList.add('fullscreen-preview-active'); // Class for the form when in fullscreen
          } else {
            document.body.classList.remove('fullscreen-body-active');
            element.classList.remove('fullscreen-preview-active');
          }
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    };
  }, []);


  // Effect for handling print preview content injection and styling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPreviewing && !isFullScreenPreview && printableAreaRef.current) {
      const previewNode = printableAreaRef.current.cloneNode(true) as HTMLElement | null;
      const previewContentDiv = document.getElementById('printPreviewContent');

      if (previewContentDiv && previewNode) {
        // Remove elements not needed for print preview
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());

        // Convert Release Order title
        const releaseOrderTitle = previewNode.querySelector('.release-order-title-screen');
        if (releaseOrderTitle) {
            releaseOrderTitle.className = 'release-order-titlebar-print-preview';
        }

        // Convert Matter label
        const matterContainerParent = previewNode.querySelector('.matter-container-print-parent');
        if(matterContainerParent) {
            const matterLabel = matterContainerParent.querySelector('.matter-label-screen');
            if (matterLabel) {
                matterLabel.className = 'matter-label-print-preview';
            }
        }

        // Convert Stamp container and image
        const stampContainer = previewNode.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.className = 'stamp-container-print-preview'; // Apply print preview class
            const imgElement = stampContainer.querySelector('img');
            const placeholderDivImg = stampContainer.querySelector('div > img'); // Check for placeholder within a div

            if (stampImage && imgElement && imgElement.src !== DEFAULT_STAMP_IMAGE_PLACEHOLDER) {
                 // If an actual stamp image is set and an img tag exists (not the placeholder)
                 imgElement.style.maxWidth = "100%";
                 imgElement.style.maxHeight = "100%";
                 imgElement.style.objectFit = "contain";
            } else if (stampImage && !imgElement) { // If stamp image is set, but no img tag (was placeholder text/div)
                 const newImg = document.createElement('img');
                 newImg.src = stampImage;
                 newImg.alt = "Stamp";
                 newImg.style.maxWidth = "100%";
                 newImg.style.maxHeight = "100%";
                 newImg.style.objectFit = "contain";
                 stampContainer.innerHTML = ''; // Clear placeholder
                 stampContainer.appendChild(newImg);
            } else if (!stampImage && placeholderDivImg) { // If no stamp, but placeholder img exists
                placeholderDivImg.style.maxWidth = "100%";
                placeholderDivImg.style.maxHeight = "100%";
                placeholderDivImg.style.objectFit = "contain";
            } else if (!stampImage && !imgElement && !placeholderDivImg) { // Fallback if no stamp and no placeholder img
                stampContainer.innerHTML = '<p>Stamp Area</p>'; // Or some other placeholder content
            }
        }

        // Convert inputs to static text
        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            let value = input.value || '';
            if (input.id === 'orderDate' && orderDate) {
                 value = format(orderDate, 'dd.MM.yyyy');
            } else if (!input.value && input.placeholder && input.type !== 'date') {
                value = '\u00A0'; // Use non-breaking space for empty fields to maintain layout
            } else if (input.type === 'date' && !input.value) { // Handle empty date specifically
                 value = '\u00A0';
            } else if (input.type === 'date' && input.value){ // Format date if it exists
                try {
                    value = format(new Date(input.value), 'dd.MM.yyyy');
                } catch (e) {
                    // if date is invalid, keep original value
                }
            }
            p.textContent = value;
            p.className = 'static-print-text'; // Apply class for styling
            p.style.width = getComputedStyle(input).width; // Maintain width
            p.style.minHeight = '1em'; // Ensure it takes up some space
            input.parentNode?.replaceChild(p, input);
        });

        // Convert DatePickers in table to static text
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
                } catch { displayValue = dateValue; } // Fallback to original string if parsing fails
            }
            p.textContent = displayValue;
            p.className = 'static-print-text'; // Apply styling class
            p.style.display = 'block'; // Ensure it takes full cell width
            p.style.width = '100%';
            p.style.minHeight = '1em';
            wrapper.parentNode?.replaceChild(p, wrapper);
        });


        // Convert textareas to static divs
        const textareas = previewNode.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            let value = textarea.value.replace(/\n/g, '<br>') || ''; // Convert newlines, handle empty
            if (!textarea.value && textarea.placeholder) {
                value = '\u00A0'; // Use non-breaking space if empty but has placeholder
            } else if(!textarea.value) {
                value = '\u00A0';
            }
            div.innerHTML = value;
            div.className = 'static-print-text textarea-static-print'; // Apply styling class
            if (textarea.id === 'matterTextarea') {
                 div.classList.add('matter-container-print'); // Specific class for matter textarea styling
            }

            // Copy relevant styles from textarea to the div for visual consistency
            div.style.fontFamily = getComputedStyle(textarea).fontFamily;
            div.style.fontSize = getComputedStyle(textarea).fontSize;
            div.style.fontWeight = getComputedStyle(textarea).fontWeight;
            div.style.lineHeight = getComputedStyle(textarea).lineHeight;
            div.style.color = 'black'; // Ensure text is black for print
            div.style.backgroundColor = 'transparent'; // Ensure background is transparent
            div.style.height = 'auto'; // Let content determine height initially
            div.style.minHeight = getComputedStyle(textarea).minHeight || (textarea.id === 'matterTextarea' ? '100px' :'70px');
            div.style.overflow = 'visible'; // Show all content
            div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and newlines
            div.style.wordWrap = 'break-word'; // Wrap long words

            textarea.parentNode?.replaceChild(div, textarea);
        });

        // Convert main table class for print preview styling
        const tableInPreview = previewNode.querySelector('.main-table-bordered');
        if (tableInPreview) {
            tableInPreview.classList.remove('main-table-bordered');
            tableInPreview.classList.add('print-table'); // Apply print-specific table class
            const tableHeaders = tableInPreview.querySelectorAll('th');
            tableHeaders.forEach(th => th.classList.add('print-table-header')); // Style headers
        }


        previewContentDiv.innerHTML = ''; // Clear previous preview
        previewContentDiv.appendChild(previewNode);

        // After appending, re-adjust textarea (now div) heights based on their content
        const textareasInPreview = previewContentDiv.querySelectorAll('.textarea-static-print');
        textareasInPreview.forEach(ta => {
            const htmlTa = ta as HTMLElement;
            htmlTa.style.height = 'auto'; // Reset height to allow scrollHeight calculation
            htmlTa.style.height = `${htmlTa.scrollHeight}px`; // Set to actual content height
        });
      }
    } else if (!isPreviewing && !isFullScreenPreview) {
        // If preview is closed and not in fullscreen, clear the preview content
        const previewContentDiv = document.getElementById('printPreviewContent');
        if (previewContentDiv) previewContentDiv.innerHTML = '';
    }
  }, [isPreviewing, isFullScreenPreview, orderDate, stampImage, rowsData, matterText, clientName, advManagerInput1, advManagerInput2, headingCaption, packageName, ron, adjustTextareaHeight ]); // Dependencies for re-rendering preview

  if (!isClient) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">
      {/* Buttons removed from here to adhere to request */}

      <div id="printable-area-pdf" ref={printableAreaRef} className={`w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 rounded-lg border-4 border-black ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
        {/* Release Order Title */}
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        {/* Top Section: Company Info & Order Details */}
        <div className="flex flex-col md:flex-row gap-4 mb-5 print-header-box">
            {/* Left Box: Company Details */}
            <div className="w-full md:w-[35%] p-3 border-2 border-black rounded box-decoration-clone">
                <h3 className="text-lg font-bold">Lehar</h3>
                <h4 className="text-md font-semibold">ADVERTISING PVT.LTD.</h4>
                <p className="text-xs mt-1 leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
                <p className="text-xs leading-snug">Alaknanda Commercial complex, <br /> New Delhi-110019</p>
                <p className="text-xs mt-1 leading-snug">Tel.: 49573333, 34, 35, 36</p>
                <p className="text-xs leading-snug">Fax: 26028101</p>
                <p className="text-xs mt-1 leading-snug"><strong>GSTIN:</strong> 07AABCL5406F1ZU</p>
            </div>
             {/* Right Box: Order Specifics */}
            <div className="flex-1 flex flex-col gap-3 p-3 border-2 border-black rounded">
                <div className="flex gap-3 items-center">
                    <div className="flex-1 flex items-center">
                        <Label htmlFor="roNumber" className="text-sm font-bold mr-2 whitespace-nowrap">R.O. No. LN:</Label>
                        <Input id="roNumber" type="text" placeholder="Enter Number" value={ron} onChange={(e) => setRon(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
                    </div>
                    <div className="flex-1 flex items-center">
                        <Label htmlFor="orderDate" className="text-sm font-bold mr-2 whitespace-nowrap">Date:</Label>
                        <DatePicker selected={orderDate} onChange={handleDateChange} dateFormat="dd.MM.yyyy" className="text-sm py-1 px-2 h-auto w-full" id="orderDate" placeholder="Select Date" />
                    </div>
                </div>
                <div className="flex items-center">
                    <Label htmlFor="clientName" className="text-sm font-bold mr-2 whitespace-nowrap">Client:</Label>
                    <Input id="clientName" placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
                </div>
                <div>
                    <Label className="text-sm font-bold">The Advertisement Manager</Label>
                    <Input placeholder="Publication Name / Address Line 1" value={advManagerInput1} onChange={(e) => setAdvManagerInput1(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1" />
                    <Input placeholder="Address Line 2 / City" value={advManagerInput2} onChange={(e) => setAdvManagerInput2(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1" />
                </div>
                <div className="mt-2 pt-2 border-t border-black">
                    <p className="text-sm font-bold">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
        </div>

        {/* Middle Section: Heading/Caption & Package */}
        <div className="flex flex-col md:flex-row gap-4 mb-5 print-header-box">
            <div className="flex-1 p-3 border-2 border-black rounded">
                <Label htmlFor="headingCaption" className="text-sm font-bold block mb-1">Heading/Caption:</Label>
                <Input id="headingCaption" placeholder="Enter caption here" value={headingCaption} onChange={(e) => setHeadingCaption(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
            </div>
            <div className="w-full md:w-[35%] p-3 border-2 border-black rounded">
                <Label htmlFor="packageName" className="text-sm font-bold block mb-1">Package:</Label>
                <Input id="packageName" placeholder="Enter package name" value={packageName} onChange={(e) => setPackageName(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
            </div>
        </div>

        {/* Table Section */}
        <div className="mb-5 print-table-container">
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
                   <Textarea value={row.keyNo as string} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} placeholder="Key" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.publication as string} onChange={(e) => handleTextareaInput(e, index, 'publication')} placeholder="Publication" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.edition as string} onChange={(e) => handleTextareaInput(e, index, 'edition')} placeholder="Edition" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.size as string} onChange={(e) => handleTextareaInput(e, index, 'size')} placeholder="Size" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black table-date-picker-wrapper">
                    <DatePicker
                        selected={row.scheduledDate instanceof Date ? row.scheduledDate : undefined}
                        onChange={(date) => handleCellDateChange(date, index)}
                        dateFormat="dd.MM.yyyy"
                        className="text-xs py-0.5 px-1 h-auto w-full border-0 rounded-none no-shadow-outline print-textarea"
                        placeholder="Date(s)"
                    />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.position as string} onChange={(e) => handleTextareaInput(e, index, 'position')} placeholder="Position" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
          <div className="flex justify-start gap-2 mt-2 no-print no-pdf-export no-print-preview">
            <Button onClick={addRow} size="sm" variant="outline"><PlusSquare className="mr-2"/>Add Row</Button>
            {rowsData.length > 1 && <Button onClick={() => deleteRow(rowsData.length -1)} size="sm" variant="destructive"><MinusSquare className="mr-2"/>Delete Last Row</Button>}
          </div>
        </div>

        {/* Matter Section */}
        <div className="flex mb-3 min-h-[100px] items-stretch matter-container-print-parent matter-container-print">
            <div className="matter-label-screen flex items-center justify-center p-1 w-[38px]">
                <span className="text-sm font-bold">MATTER</span>
            </div>
            <Textarea
              id="matterTextarea"
              placeholder="Enter matter here..."
              value={matterText}
              onChange={handleMatterChange}
              className="flex-1 text-sm p-2 border border-black border-l-0 rounded-none resize-none min-h-[100px] h-auto no-shadow-outline focus:border-black matter-content-screen"
            />
        </div>

        {/* Footer Section: Billing Info, Notes, Stamp */}
        <div className="p-3 border-2 border-black rounded flex flex-col print-footer-box relative">
          <div className="w-full mb-2">
            <p className="text-xs font-bold mb-1">Forward all bills with relevant VTS copy to :-</p>
            <p className="text-xs leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101</p>
          </div>

          <hr className="border-black border-b-2 my-2 w-full" />

          <div className="flex justify-between items-start mt-0 pt-0">
            <div className="w-[62%]">
                <p className="text-xs font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Note:</p>
                <ol className="list-decimal list-inside text-xs space-y-0.5">
                  <li>Space reserved vide our letter No.</li>
                  <li>No two advertisements of the same client should appear in the same issue.</li>
                  <li>Please quote R.O. No. in all your bills and letters.</li>
                  <li>Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</li>
                </ol>
            </div>

            {/* Stamp Area */}
            <div
                className="w-[35%] flex flex-col items-center justify-end stamp-parent-container mt-2 md:mt-0 self-end"
            >
                <div
                  className="stamp-container-screen w-[200px] h-[120px] flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                >
                {stampImage ? (
                     <Image src={stampImage} alt="Stamp" width={200} height={120} className="object-contain max-w-full max-h-full" data-ai-hint="signature company stamp" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 border-0"> {/* Removed border-dashed and border-gray-400 */}
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" width={196} height={116} className="object-contain" data-ai-hint="upload placeholder"/>
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
          onClick={(e) => {
             // Close only if the overlay itself (not its content) is clicked
             if (e.target === e.currentTarget) {
                handleClosePrintPreview();
            }
          }}
        >
          <div
            id="printPreviewModalContentContainer"
            className="bg-white w-auto max-w-[210mm] min-h-[297mm] h-auto max-h-[95vh] p-0 shadow-2xl overflow-y-auto print-preview-modal-content no-print"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
          >
             <div id="printPreviewContent" className="print-preview-inner-content">
                 {/* Preview content will be injected here by useEffect */}
             </div>
          </div>
          <Button
            onClick={handleClosePrintPreview}
            variant="destructive"
            className="fixed top-4 right-4 z-[1001] no-print no-pdf-export"
            aria-label="Close print preview"
          >
            <X className="mr-2 h-4 w-4" /> Close Preview
          </Button>
           <Button
            onClick={handleActualPrint}
            variant="default"
            className="fixed top-4 right-48 z-[1001] no-print no-pdf-export" 
            aria-label="Print document"
          >
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      )}

      {/* Fullscreen Preview Content Host (for buttons etc. if needed when form is fullscreen) */}
      {isFullScreenPreview && (
         <div id="fullscreen-content-host" className="fixed inset-0 bg-white z-[2000] overflow-auto p-4 no-print">
            {/* Example: Buttons specific to fullscreen mode can go here */}
            <Button
                onClick={handleExitFullScreenPreview}
                variant="destructive"
                className="fixed top-4 right-4 z-[2001] no-print no-pdf-export"
                aria-label="Exit Full Screen Preview"
            >
                <X className="mr-2 h-4 w-4" /> Exit Full Screen
            </Button>
            <Button
                onClick={handleActualPrint} 
                variant="default"
                className="fixed top-4 right-56 z-[2001] no-print no-pdf-export" 
                aria-label="Print document from fullscreen"
            >
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
         </div>
      )}
    </div>
  );
};

export default AdOrderForm;
