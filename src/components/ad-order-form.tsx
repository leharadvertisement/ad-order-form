// src/components/ad-order-form.tsx
'use client';

import type { ChangeEvent, FC } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker'; 
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Download, Printer, Eye, X, Save, UploadCloud, Search, Eraser, CheckCircle, FileText, Settings, Copy, Palette, Briefcase, Users, Building, CalendarDays, FileDown, Maximize, EyeOff, Undo, ExternalLink, MinusSquare, PlusSquare } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://picsum.photos/200/120?random&data-ai-hint=signature+placeholder';


const AdOrderForm: FC = () => {
  const [ron, setRon] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [clientName, setClientName] = useState<string>('');
  const [advManagerInput1, setAdvManagerInput1] = useState<string>('');
  const [advManagerInput2, setAdvManagerInput2] = useState<string>('');
  const [headingCaption, setHeadingCaption] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [matterText, setMatterText] = useState<string>('');
  const [stampImage, setStampImage] = useState<string | null>(DEFAULT_STAMP_IMAGE_PLACEHOLDER);
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
      const minHeight = computedStyle ? parseFloat(computedStyle.minHeight) : 110; 

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
    setStampImage(DEFAULT_STAMP_IMAGE_PLACEHOLDER);
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
        setStampImage(draftData.stampImage || DEFAULT_STAMP_IMAGE_PLACEHOLDER);
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
    clonedElement.querySelectorAll('.action-buttons-container').forEach(el => el.remove());


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
             div.style.minHeight = 'var(--pdf-matter-textarea-min-height, 40px)';
             div.style.maxHeight = 'var(--pdf-matter-textarea-max-height, 80px)'; 
             div.style.overflow = 'hidden'; 
        } else {
            div.style.minHeight = 'var(--pdf-table-textarea-min-height, 15px)';
            div.style.maxHeight = 'var(--pdf-table-textarea-max-height, 40px)';
            div.style.overflow = 'hidden'; 
        }
        div.style.fontFamily = getComputedStyle(textarea).fontFamily;
        div.style.fontSize = textarea.id === 'matterTextarea' ? 'inherit' : '8pt'; 
        div.style.fontWeight = getComputedStyle(textarea).fontWeight;
        div.style.lineHeight = '1.0'; 
        div.style.color = 'black';
        div.style.backgroundColor = 'transparent';
        div.style.border = 'none'; 
         if (textarea.id === 'matterTextarea') {
            div.style.borderTop = '1px solid black';
            div.style.borderBottom = '1px solid black';
            div.style.padding = '1px';
        }
        div.style.height = 'auto'; 
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        textarea.parentNode?.replaceChild(div, textarea);
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
        const placeholderInStamp = stampContainerClone.querySelector('div > img'); 

        if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && imgInStamp && imgInStamp.src !== DEFAULT_STAMP_IMAGE_PLACEHOLDER) {
            imgInStamp.style.maxWidth = "100%";
            imgInStamp.style.maxHeight = "100%";
            imgInStamp.style.objectFit = "contain";
        } else if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && !imgInStamp) { 
            const newImg = document.createElement('img');
            newImg.src = stampImage;
            newImg.alt = "Stamp";
            newImg.style.maxWidth = "100%";
            newImg.style.maxHeight = "100%";
            newImg.style.objectFit = "contain";
            stampContainerClone.innerHTML = ''; 
            stampContainerClone.appendChild(newImg);
        } else if ((!stampImage || stampImage === DEFAULT_STAMP_IMAGE_PLACEHOLDER) && placeholderInStamp) {
             placeholderInStamp.style.maxWidth = "100%";
             placeholderInStamp.style.maxHeight = "100%";
             placeholderInStamp.style.objectFit = "contain";
        } else if ((!stampImage || stampImage === DEFAULT_STAMP_IMAGE_PLACEHOLDER) && !imgInStamp && !placeholderInStamp) { 
            stampContainerClone.textContent = 'Stamp Area'; 
        }
    }
    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
        tableClone.classList.remove('main-table-bordered');
        tableClone.classList.add('print-table'); 
        const tableHeaders = tableClone.querySelectorAll('th');
        tableHeaders.forEach(th => th.classList.add('print-table-header'));
    }


    const opt = {
        margin: [5, 5, 5, 5], 
        filename: 'release_order_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2, 
            useCORS: true,
            logging: false, 
            width: clonedElement.offsetWidth, 
            height: clonedElement.offsetHeight, 
            windowWidth: clonedElement.scrollWidth,
            windowHeight: clonedElement.scrollHeight,
            onclone: (documentClone: Document) => {
                const clonedBody = documentClone.body;
                clonedBody.classList.add('pdf-export-active'); 
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _ = clonedBody.offsetHeight; 

                const textareasInClone = clonedBody.querySelectorAll('.textarea-static-print'); 
                 textareasInClone.forEach(ta => {
                    const htmlTa = ta as HTMLElement;
                    htmlTa.style.height = 'auto'; 
                    const maxHeight = parseFloat(getComputedStyle(htmlTa).maxHeight || '9999');
                    htmlTa.style.height = `${Math.min(htmlTa.scrollHeight, maxHeight)}px`; 
                    htmlTa.style.overflowY = 'hidden'; 
                });
            }
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
        },
        pagebreak: { mode: ['css', 'avoid-all'], before: '.page-break-before' } 
    };


    (window as any).html2pdf().from(clonedElement).set(opt).save()
    .then(() => {
        document.body.classList.remove('pdf-export-active'); 
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
        previewContentDiv.innerHTML = ''; 
    }
  }, []);

  const handleActualPrint = useCallback(() => {
    if (typeof window !== 'undefined') {
        const wasPreviewing = isPreviewing;

        if(wasPreviewing) {
             handleClosePrintPreview();
        }
        document.body.classList.add('direct-print-active');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('direct-print-active');
        }, 100); 
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
            document.body.classList.add('fullscreen-body-active'); 
            element.classList.add('fullscreen-preview-active'); 
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


  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPreviewing && !isFullScreenPreview && printableAreaRef.current) {
      const previewNode = printableAreaRef.current.cloneNode(true) as HTMLElement | null;
      const previewContentDiv = document.getElementById('printPreviewContent');

      if (previewContentDiv && previewNode) {
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());
        previewNode.querySelectorAll('.action-buttons-container').forEach(el => el.remove());


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

        const stampContainer = previewNode.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.className = 'stamp-container-print-preview'; 
            const imgElement = stampContainer.querySelector('img');
            const placeholderDivImg = stampContainer.querySelector('div > img'); 

            if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && imgElement && imgElement.src !== DEFAULT_STAMP_IMAGE_PLACEHOLDER) {
                 imgElement.style.maxWidth = "100%";
                 imgElement.style.maxHeight = "100%";
                 imgElement.style.objectFit = "contain";
            } else if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && !imgElement) { 
                 const newImg = document.createElement('img');
                 newImg.src = stampImage;
                 newImg.alt = "Stamp";
                 newImg.style.maxWidth = "100%";
                 newImg.style.maxHeight = "100%";
                 newImg.style.objectFit = "contain";
                 stampContainer.innerHTML = ''; 
                 stampContainer.appendChild(newImg);
            } else if ((!stampImage || stampImage === DEFAULT_STAMP_IMAGE_PLACEHOLDER) && placeholderDivImg) { 
                placeholderDivImg.style.maxWidth = "100%";
                placeholderDivImg.style.maxHeight = "100%";
                placeholderDivImg.style.objectFit = "contain";
            } else if ((!stampImage || stampImage === DEFAULT_STAMP_IMAGE_PLACEHOLDER) && !imgElement && !placeholderDivImg) { 
                stampContainer.innerHTML = '<p>Stamp Area</p>'; 
            }
        }

        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            let value = input.value || '';
            if (input.id === 'orderDate' && orderDate) {
                 value = format(orderDate, 'dd.MM.yyyy');
            } else if (!input.value && input.placeholder && input.type !== 'date') {
                value = '\u00A0'; 
            } else if (input.type === 'date' && !input.value) { 
                 value = '\u00A0';
            } else if (input.type === 'date' && input.value){ 
                try {
                    value = format(new Date(input.value), 'dd.MM.yyyy');
                } catch (e) {
                    // if date is invalid, keep original value
                }
            }
            p.textContent = value;
            p.className = 'static-print-text'; 
            p.style.width = getComputedStyle(input).width; 
            p.style.minHeight = '1em'; 
            input.parentNode?.replaceChild(p, input);
        });

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
                } catch { displayValue = dateValue; } 
            }
            p.textContent = displayValue;
            p.className = 'static-print-text'; 
            p.style.display = 'block'; 
            p.style.width = '100%';
            p.style.minHeight = '1em';
            wrapper.parentNode?.replaceChild(p, wrapper);
        });


        const textareas = previewNode.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            let value = textarea.value.replace(/\n/g, '<br>') || ''; 
            if (!textarea.value && textarea.placeholder) {
                value = '\u00A0'; 
            } else if(!textarea.value) {
                value = '\u00A0';
            }
            div.innerHTML = value;
            div.className = 'static-print-text textarea-static-print'; 
            if (textarea.id === 'matterTextarea') {
                 div.classList.add('matter-container-print'); 
            }

            div.style.fontFamily = getComputedStyle(textarea).fontFamily;
            div.style.fontSize = getComputedStyle(textarea).fontSize;
            div.style.fontWeight = getComputedStyle(textarea).fontWeight;
            div.style.lineHeight = getComputedStyle(textarea).lineHeight;
            div.style.color = 'black'; 
            div.style.backgroundColor = 'transparent'; 
            div.style.height = 'auto'; 
            div.style.minHeight = getComputedStyle(textarea).minHeight || (textarea.id === 'matterTextarea' ? '100px' :'110px');
            div.style.overflow = 'visible'; 
            div.style.whiteSpace = 'pre-wrap'; 
            div.style.wordWrap = 'break-word'; 

            textarea.parentNode?.replaceChild(div, textarea);
        });

        const tableInPreview = previewNode.querySelector('.main-table-bordered');
        if (tableInPreview) {
            tableInPreview.classList.remove('main-table-bordered');
            tableInPreview.classList.add('print-table'); 
            const tableHeaders = tableInPreview.querySelectorAll('th');
            tableHeaders.forEach(th => th.classList.add('print-table-header')); 
        }


        previewContentDiv.innerHTML = ''; 
        previewContentDiv.appendChild(previewNode);

        const textareasInPreview = previewContentDiv.querySelectorAll('.textarea-static-print');
        textareasInPreview.forEach(ta => {
            const htmlTa = ta as HTMLElement;
            htmlTa.style.height = 'auto'; 
            htmlTa.style.height = `${htmlTa.scrollHeight}px`; 
        });
      }
    } else if (!isPreviewing && !isFullScreenPreview) {
        const previewContentDiv = document.getElementById('printPreviewContent');
        if (previewContentDiv) previewContentDiv.innerHTML = '';
    }
  }, [isPreviewing, isFullScreenPreview, orderDate, stampImage, rowsData, matterText, clientName, advManagerInput1, advManagerInput2, headingCaption, packageName, ron, adjustTextareaHeight ]); 

  if (!isClient) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">
      {/* Action buttons removed as per user request */}

      <div id="printable-area-pdf" ref={printableAreaRef} className={`w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 rounded-lg border-4 border-black ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-5 print-header-box">
            <div className="w-full md:w-[35%] p-3 border-2 border-black rounded box-decoration-clone">
                <h3 className="text-lg font-bold">Lehar</h3>
                <h4 className="text-md font-semibold">ADVERTISING PVT.LTD.</h4>
                <p className="text-xs mt-1 leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
                <p className="text-xs leading-snug">Alaknanda Commercial complex, <br /> New Delhi-110019</p>
                <p className="text-xs mt-1 leading-snug">Tel.: 49573333, 34, 35, 36</p>
                <p className="text-xs leading-snug">Fax: 26028101</p>
                <p className="text-xs mt-1 leading-snug"><strong>GSTIN:</strong> 07AABCL5406F1ZU</p>
            </div>
            <div className="flex-1 flex flex-col gap-3 p-3 border-2 border-black rounded">
                <div className="flex gap-3 items-center">
                    <div className="flex-1 flex items-center">
                        <Label htmlFor="roNumber" className="text-sm font-bold mr-2 whitespace-nowrap">R.O. No. LN:</Label>
                        <Input id="roNumber" type="text" placeholder="Enter Number" value={ron} onChange={(e) => setRon(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
                    </div>
                    <div className="flex-1 flex items-center">
                         <Label htmlFor="orderDate" className="text-sm font-bold mr-2 whitespace-nowrap">Date:</Label>
                        <DatePicker selected={orderDate} onChange={handleDateChange} dateFormat="dd.MM.yyyy" className="text-sm py-1 px-2 h-auto w-full" id="orderDate" placeholderText="Select Date"/>
                    </div>
                </div>
                <div className="flex items-center">
                    <Label htmlFor="clientName" className="text-sm font-bold mr-2 whitespace-nowrap">Client:</Label>
                    <Input id="clientName" placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
                </div>
                <div>
                    <Label className="text-sm font-bold">The Advertisement Manager</Label>
                    <Input placeholder="Publication Name / Address Line 1" value={advManagerInput1} onChange={(e) => setAdvManagerInput1(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1"/>
                    <Input placeholder="Address Line 2 / City" value={advManagerInput2} onChange={(e) => setAdvManagerInput2(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1"/>
                </div>
                <div className="mt-2 pt-2 border-t border-black">
                    <p className="text-sm font-bold">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
        </div>

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
                   <Textarea value={row.keyNo as string} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} placeholder="Key" className="text-xs p-1 border-0 rounded-none resize-none min-h-[110px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.publication as string} onChange={(e) => handleTextareaInput(e, index, 'publication')} placeholder="Publication" className="text-xs p-1 border-0 rounded-none resize-none min-h-[110px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.edition as string} onChange={(e) => handleTextareaInput(e, index, 'edition')} placeholder="Edition" className="text-xs p-1 border-0 rounded-none resize-none min-h-[110px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.size as string} onChange={(e) => handleTextareaInput(e, index, 'size')} placeholder="Size" className="text-xs p-1 border-0 rounded-none resize-none min-h-[110px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black table-date-picker-wrapper">
                    <DatePicker
                        selected={row.scheduledDate instanceof Date ? row.scheduledDate : undefined}
                        onChange={(date) => handleCellDateChange(date, index)}
                        dateFormat="dd.MM.yyyy"
                        className="text-xs py-0.5 px-1 h-auto w-full border-0 rounded-none no-shadow-outline print-textarea"
                        placeholderText="Date(s)"
                    />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top print-border border border-black">
                   <Textarea value={row.position as string} onChange={(e) => handleTextareaInput(e, index, 'position')} placeholder="Position" className="text-xs p-1 border-0 rounded-none resize-none min-h-[110px] h-auto no-shadow-outline print-textarea textarea-align-top" />
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

             <div
                className="w-[35%] flex flex-col items-center justify-end stamp-parent-container mt-2 md:mt-0 self-end"
            >
                <div
                  className="stamp-container-screen w-[160px] h-[90px] flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                >
                {stampImage ? (
                     <Image src={stampImage} alt="Stamp" width={158} height={88} className="object-contain" data-ai-hint="signature company stamp" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 border-0">
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" width={158} height={88} className="object-contain" data-ai-hint="upload placeholder"/>
                  </div>
                )}
                <Input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
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
             if (e.target === e.currentTarget) {
                handleClosePrintPreview();
            }
          }}
        >
          <div
            id="printPreviewModalContentContainer"
            className="bg-white w-auto max-w-[210mm] min-h-[297mm] h-auto max-h-[95vh] p-0 shadow-2xl overflow-y-auto print-preview-modal-content no-print"
            onClick={(e) => e.stopPropagation()} 
          >
             <div id="printPreviewContent" className="print-preview-inner-content">
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

      {isFullScreenPreview && (
         <div id="fullscreen-content-host" className="fixed inset-0 bg-white z-[2000] overflow-auto p-4 no-print">
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
