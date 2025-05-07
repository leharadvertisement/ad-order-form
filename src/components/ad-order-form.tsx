
// src/components/ad-order-form.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker'; 
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Download, Printer, Eye, X, Save, Trash2, UploadCloud, Search, Eraser, CheckCircle, FileText, Settings, Copy, Palette, Briefcase, Users, Building, CalendarDays, FileDown, Maximize, EyeOff, Undo, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://picsum.photos/180/100?random&data-ai-hint=signature+placeholder';


const AdOrderForm: React.FC = () => {
  const [ron, setRon] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [clientName, setClientName] = useState<string>('');
  const [advManagerInput1, setAdvManagerInput1] = useState<string>('');
  const [advManagerInput2, setAdvManagerInput2] = useState<string>('');
  const [headingCaption, setHeadingCaption] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [matterText, setMatterText] = useState<string>('');
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [rowsData, setRowsData] = useState<Array<Record<string, string>>>([
    { keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
  ]);

  const printableAreaRef = useRef<HTMLDivElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);


  const handleDateChange = (date: Date | undefined) => {
    setOrderDate(date);
  };

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to recalculate
      // Check if printing or PDF generation is active, if so, don't set scrollHeight
      if (!document.body.classList.contains('pdf-export-active') && !window.matchMedia('print').matches && !isPreviewing && !isFullScreenPreview) {
        textarea.style.height = `${textarea.scrollHeight}px`;
      } else if (isPreviewing || isFullScreenPreview) {
        // For preview, allow it to grow based on content
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }
  },[isPreviewing, isFullScreenPreview]);
  
  useEffect(() => {
    const allTextareas = document.querySelectorAll('#printable-area-pdf textarea');
    allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
  }, [rowsData, matterText, adjustTextareaHeight]);


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
      { keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
    ]);
  }, []);

  const deleteRow = useCallback((index: number) => {
    setRowsData(prevRows => prevRows.filter((_, i) => i !== index));
  }, []);


  const handleStampUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStampImage(result);
        localStorage.setItem('uploadedStampImage', result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const triggerStampUpload = () => {
    stampInputRef.current?.click();
  };
  
  useEffect(() => {
    const savedImage = localStorage.getItem('uploadedStampImage');
    if (savedImage) {
      setStampImage(savedImage);
    }
  }, []);
  
  useEffect(() => {
    if(!orderDate){
        setOrderDate(new Date());
    }
  }, [orderDate]);


  const clearForm = () => {
    setRon('');
    setOrderDate(new Date());
    setClientName('');
    setAdvManagerInput1('');
    setAdvManagerInput2('');
    setHeadingCaption('');
    setPackageName('');
    setMatterText('');
    setRowsData([{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
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
      rowsData,
      stampImage, 
    };
    localStorage.setItem('adOrderFormDraft', JSON.stringify(draftData));
    alert('Draft saved!');
  };

  const loadDraft = () => {
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
      setRowsData(draftData.rowsData && draftData.rowsData.length > 0 ? draftData.rowsData : [{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
      setStampImage(draftData.stampImage); 
      alert('Draft loaded!');
    } else {
      alert('No draft found.');
    }
  };
  
  const generatePdf = useCallback(async () => {
    const element = printableAreaRef.current;
    if (!element) return;

    document.body.classList.add('pdf-export-active');

    const inputs = Array.from(element.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea')) as (HTMLInputElement | HTMLTextAreaElement)[];
    const originalValues: { el: HTMLElement, value: string, style?: string }[] = [];

    inputs.forEach(input => {
        originalValues.push({ el: input, value: input.value, style: input.style.cssText });
        if (input.id === 'orderDate' && orderDate) { // Check if it's the date input
          input.value = format(orderDate, 'dd.MM.yyyy');
        }
    });
    
    // Clone the printable area for PDF generation to avoid altering the live DOM directly for styling
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Ensure all textareas in the clone have their full scrollHeight
    const textareasInClone = clonedElement.querySelectorAll('textarea');
    textareasInClone.forEach(ta => {
        ta.style.height = 'auto'; // Reset height
        ta.style.height = `${ta.scrollHeight}px`; // Set to scroll height
        ta.style.overflow = 'hidden'; // Hide scrollbar
    });
    
    // Convert inputs and textareas to static text in the cloned document
    const inputsToConvert = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
    inputsToConvert.forEach(inputEl => {
        const p = document.createElement('span');
        const input = inputEl as HTMLInputElement;
        let value = input.value;
        if (input.id === 'orderDate' && orderDate) {
             value = format(orderDate, 'dd.MM.yyyy');
        } else if (input.type === 'date' && !input.value && input.placeholder) {
            value = ''; // Keep placeholder if date not set
        }
        p.textContent = value || ''; // Use empty string if no value
        p.className = 'static-print-text';
        // Copy relevant styles, ensure display block or inline-block for proper layout
        p.style.display = 'inline-block'; // Or block if it takes full width
        p.style.width = getComputedStyle(input).width; // Maintain width
        p.style.fontFamily = getComputedStyle(input).fontFamily;
        p.style.fontSize = getComputedStyle(input).fontSize;
        p.style.fontWeight = getComputedStyle(input).fontWeight;
        p.style.lineHeight = getComputedStyle(input).lineHeight;
        p.style.color = 'black';
        p.style.borderBottom = '1px solid black';
        p.style.padding = '2px 0';
        input.parentNode?.replaceChild(p, input);
    });

    const textareasToConvert = clonedElement.querySelectorAll('textarea');
    textareasToConvert.forEach(textareaEl => {
        const div = document.createElement('div');
        const textarea = textareaEl as HTMLTextAreaElement;
        // Preserve line breaks from textarea
        div.innerHTML = textarea.value.replace(/\n/g, '<br>') || ''; // Use empty string if no value
        div.className = 'static-print-text textarea-static-print';

        // Apply specific styles for matter textarea
        if (textarea.id === 'matterTextarea') {
             div.classList.add('matter-container-print'); // For specific PDF styling of matter
        }
        
        div.style.cssText = getComputedStyle(textarea).cssText; // Copy all computed styles
        div.style.border = 'none'; // Remove default textarea border for print
         if (textarea.id === 'matterTextarea') { // Special border for matter
            div.style.borderTop = '1px solid black';
            div.style.borderBottom = '1px solid black';
        }
        div.style.height = 'auto'; // Let content define height
        div.style.minHeight = 'unset';
        div.style.overflow = 'visible'; // Ensure all content is visible
        div.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
        div.style.wordWrap = 'break-word'; // Wrap long words
        textarea.parentNode?.replaceChild(div, textarea);
    });

    // Apply print-specific classes for PDF
    const releaseOrderTitleClone = clonedElement.querySelector('.release-order-title-screen') as HTMLElement;
    if (releaseOrderTitleClone) {
        releaseOrderTitleClone.className = 'release-order-titlebar-print-preview';
    }
    const matterLabelClone = clonedElement.querySelector('.matter-label-screen') as HTMLElement;
    if (matterLabelClone) {
        matterLabelClone.className = 'matter-label-print-preview';
    }
    const stampContainerClone = clonedElement.querySelector('.stamp-container-screen') as HTMLElement;
    if(stampContainerClone) {
        stampContainerClone.className = 'stamp-container-print-preview';
        if (stampImage) {
            const img = document.createElement('img');
            img.src = stampImage;
            img.alt = "Stamp";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.objectFit = "contain";
            stampContainerClone.innerHTML = ''; // Clear placeholder
            stampContainerClone.appendChild(img);
        } else {
            stampContainerClone.textContent = 'Stamp Area'; // Fallback text
        }
    }
    
    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
        tableClone.classList.add('print-table');
        const tableHeaders = tableClone.querySelectorAll('th');
        tableHeaders.forEach(th => th.classList.add('print-table-header'));
    }


    const opt = {
        margin: [10, 5, 10, 5], // top, left, bottom, right in mm
        filename: 'application_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false, // Disable logging for cleaner console
            scrollY: -window.scrollY, // Try to capture from top
            windowWidth: clonedElement.scrollWidth,
            windowHeight: clonedElement.scrollHeight, // Capture full height
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
        },
        pagebreak: { mode: ['css', 'avoid-all'], before: '.page-break-before' }
    };
    
    if ((window as any).html2pdf) {
        (window as any).html2pdf().from(clonedElement).set(opt).save()
        .then(() => {
            // Restore original values and styles on the actual form
            inputs.forEach(input => {
                const original = originalValues.find(ov => ov.el === input);
                if (original) {
                    input.value = original.value;
                    if(original.style) input.style.cssText = original.style;
                    else input.removeAttribute('style');
                }
                if (input.tagName.toLowerCase() === 'textarea') {
                    adjustTextareaHeight(input as HTMLTextAreaElement);
                }
            });
            document.body.classList.remove('pdf-export-active');
        })
        .catch((error: any) => {
            console.error("Error generating PDF:", error);
            inputs.forEach(input => {
                const original = originalValues.find(ov => ov.el === input);
                if (original) {
                    input.value = original.value;
                    if(original.style) input.style.cssText = original.style;
                     else input.removeAttribute('style');
                }
                 if (input.tagName.toLowerCase() === 'textarea') {
                    adjustTextareaHeight(input as HTMLTextAreaElement);
                }
            });
            document.body.classList.remove('pdf-export-active');
        });
    } else {
        console.error('html2pdf is not loaded');
        document.body.classList.remove('pdf-export-active');
    }

  }, [orderDate, stampImage, rowsData, matterText, clientName, advManagerInput1, advManagerInput2, headingCaption, packageName, ron, adjustTextareaHeight]);


  const handlePrintPreview = useCallback(() => {
    setIsPreviewing(true);
    document.body.classList.add('print-preview-active'); 
  }, []);

  const handleClosePrintPreview = useCallback(() => {
    setIsPreviewing(false);
    document.body.classList.remove('print-preview-active');
    const previewContentDiv = document.getElementById('printPreviewContent');
    if (previewContentDiv) {
        previewContentDiv.innerHTML = ''; 
    }
  }, []);

  const handleActualPrint = useCallback(() => {
    window.print();
  }, []);

  const handleFullScreenPreview = useCallback(() => {
    const element = printableAreaRef.current;
    if (!element) return;
  
    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => {
        setIsFullScreenPreview(true);
        document.body.classList.add('fullscreen-body-active');
        element.classList.add('fullscreen-preview-active');
      }).catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else if ((element as any).mozRequestFullScreen) { /* Firefox */
      (element as any).mozRequestFullScreen();
      setIsFullScreenPreview(true);
      document.body.classList.add('fullscreen-body-active');
      element.classList.add('fullscreen-preview-active');
    } else if ((element as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      (element as any).webkitRequestFullscreen();
      setIsFullScreenPreview(true);
      document.body.classList.add('fullscreen-body-active');
      element.classList.add('fullscreen-preview-active');
    } else if ((element as any).msRequestFullscreen) { /* IE/Edge */
      (element as any).msRequestFullscreen();
      setIsFullScreenPreview(true);
      document.body.classList.add('fullscreen-body-active');
      element.classList.add('fullscreen-preview-active');
    }
  }, []);

  const handleExitFullScreenPreview = useCallback(() => {
    const element = printableAreaRef.current;
    if (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { /* Firefox */
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) { /* Chrome, Safari and Opera */
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { /* IE/Edge */
        (document as any).msExitFullscreen();
      }
    }
    setIsFullScreenPreview(false);
    document.body.classList.remove('fullscreen-body-active');
    if (element) {
        element.classList.remove('fullscreen-preview-active');
    }
  }, []);
  
  useEffect(() => {
    const fullscreenChangeHandler = () => {
      const isCurrentlyFullScreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
      setIsFullScreenPreview(isCurrentlyFullScreen);
      const element = printableAreaRef.current;
      if (!isCurrentlyFullScreen) {
          document.body.classList.remove('fullscreen-body-active');
           if (element) {
                element.classList.remove('fullscreen-preview-active');
           }
      } else {
          document.body.classList.add('fullscreen-body-active');
          if (element) {
                element.classList.add('fullscreen-preview-active');
          }
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
    document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
    document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
    
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
      document.removeEventListener('webkitfullscreenchange', fullscreenChangeHandler);
      document.removeEventListener('mozfullscreenchange', fullscreenChangeHandler);
      document.removeEventListener('MSFullscreenChange', fullscreenChangeHandler);
    };
  }, []);


  useEffect(() => {
    if (isPreviewing && !isFullScreenPreview) {
      const previewNode = printableAreaRef.current?.cloneNode(true) as HTMLElement | null;
      const previewContentDiv = document.getElementById('printPreviewContent');
      
      if (previewContentDiv && previewNode) {
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());

        const releaseOrderTitle = previewNode.querySelector('.release-order-title-screen');
        if (releaseOrderTitle) {
            releaseOrderTitle.className = 'release-order-titlebar-print-preview';
        }

        const matterLabel = previewNode.querySelector('.matter-label-screen');
        if (matterLabel) {
            matterLabel.className = 'matter-label-print-preview';
        }
        
        const stampContainer = previewNode.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.className = 'stamp-container-print-preview';
            if (stampImage) {
                 const img = document.createElement('img');
                 img.src = stampImage;
                 img.alt = "Stamp";
                 img.style.maxWidth = "100%";
                 img.style.maxHeight = "100%";
                 img.style.objectFit = "contain";
                 stampContainer.innerHTML = ''; 
                 stampContainer.appendChild(img);
            } else {
                stampContainer.textContent = 'Stamp Area';
            }
        }

        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            let value = input.value || '';
            if (input.id === 'orderDate' && orderDate) {
                 value = format(orderDate, 'dd.MM.yyyy');
            } else if (!input.value && input.placeholder && input.type !== 'date') { // Show placeholder only for non-date empty inputs
                value = ''; 
            } else if (input.type === 'date' && !input.value) {
                 value = ''; // Empty for date if no value
            }
            p.textContent = value;
            p.className = 'static-print-text';
            p.style.display = 'inline-block'; // Ensure it takes space like input
            p.style.width = getComputedStyle(input).width; // Maintain width
            p.style.fontFamily = getComputedStyle(input).fontFamily;
            p.style.fontSize = getComputedStyle(input).fontSize;
            p.style.fontWeight = getComputedStyle(input).fontWeight;
            p.style.lineHeight = getComputedStyle(input).lineHeight;
            p.style.color = 'black';
            p.style.borderBottom = '1px solid black'; // Mimic underline
            p.style.padding = '2px 0'; // Mimic input padding
            input.parentNode?.replaceChild(p, input);
        });

        const textareas = previewNode.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            let value = textarea.value.replace(/\n/g, '<br>') || '';
            if (!textarea.value && textarea.placeholder) {
                value = ''; 
            }
            div.innerHTML = value;
            div.className = 'static-print-text textarea-static-print';
             // Apply specific styles for matter textarea
            if (textarea.id === 'matterTextarea') {
                 div.classList.add('matter-container-print');
            }
            div.style.cssText = getComputedStyle(textarea).cssText;
            div.style.border = 'none'; // remove default textarea border for print
            if (textarea.id === 'matterTextarea') { // Special border for matter
                div.style.borderTop = '1px solid black';
                div.style.borderBottom = '1px solid black';
            }
            div.style.backgroundColor = 'transparent';
            div.style.height = 'auto'; 
            div.style.minHeight = 'unset';
            div.style.overflow = 'visible';
            div.style.whiteSpace = 'pre-wrap'; 
            div.style.wordWrap = 'break-word'; 
            textarea.parentNode?.replaceChild(div, textarea);
        });
        
        const tableInPreview = previewNode.querySelector('.main-table-bordered');
        if (tableInPreview) {
            tableInPreview.classList.add('print-table');
            const tableHeaders = tableInPreview.querySelectorAll('th');
            tableHeaders.forEach(th => th.classList.add('print-table-header'));
        }


        previewContentDiv.innerHTML = ''; 
        previewContentDiv.appendChild(previewNode);

        // Re-adjust heights for textareas in preview
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


  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">
      <Card className="mb-4 shadow-lg no-print">
        <CardContent className="p-4 flex flex-wrap gap-2 justify-center">
          <Button onClick={saveDraft} variant="outline"><Save className="mr-2 h-4 w-4" />Save Draft</Button>
          <Button onClick={loadDraft} variant="outline"><UploadCloud className="mr-2 h-4 w-4" />Load Draft</Button>
          <Button onClick={clearForm} variant="destructive"><Eraser className="mr-2 h-4 w-4" />Clear Form</Button>
          <Button onClick={generatePdf} variant="default"><FileDown className="mr-2 h-4 w-4" />Download PDF</Button>
          <Button onClick={handlePrintPreview} variant="outline" className="no-pdf-export"><Eye className="mr-2 h-4 w-4" />Print Preview</Button>
          <Button onClick={handleFullScreenPreview} variant="outline" className="no-pdf-export"><Maximize className="mr-2 h-4 w-4" />Full Screen View</Button>
        </CardContent>
      </Card>

      <div id="printable-area-pdf" ref={printableAreaRef} className={`w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 rounded-lg border-4 border-black ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-5">
          <div className="w-full md:w-[35%] p-3 border-2 border-black rounded box-decoration-break-clone">
            <h3 className="text-lg font-bold">Lehar</h3>
            <h4 className="text-md font-semibold">ADVERTISING PVT.LTD.</h4>
            <p className="text-xs mt-1">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
            <p className="text-xs">Alaknanda Commercial complex, <br /> New Delhi-110019</p>
            <p className="text-xs mt-1">Tel.: 49573333, 34, 35, 36</p>
            <p className="text-xs">Fax: 26028101</p>
            <p className="text-xs mt-1"><strong>GSTIN:</strong> 07AABCL5406F1ZU</p>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex gap-3 p-2 border-2 border-black rounded items-center">
              <div className="flex-1 flex items-center">
                <Label htmlFor="roNumber" className="text-sm font-bold mr-2 whitespace-nowrap">R.O. No. LN:</Label>
                <Input id="roNumber" type="number" placeholder="Enter Number" value={ron} onChange={(e) => setRon(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
              </div>
              <div className="flex-1 flex items-center">
                 <Label htmlFor="orderDate" className="text-sm font-bold mr-2 whitespace-nowrap">Date:</Label>
                 <DatePicker selected={orderDate} onChange={handleDateChange} dateFormat="dd.MM.yyyy" className="text-sm py-1 px-2 h-auto w-full" id="orderDate" />
              </div>
            </div>
            <div className="p-2 border-2 border-black rounded flex items-center">
              <Label htmlFor="clientName" className="text-sm font-bold mr-2 whitespace-nowrap">Client:</Label>
              <Input id="clientName" placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
            </div>
            <div className="p-3 border-2 border-black rounded flex flex-col gap-2">
              <Label className="text-sm font-bold">The Advertisement Manager</Label>
              <Input placeholder="Publication Name / Address Line 1" value={advManagerInput1} onChange={(e) => setAdvManagerInput1(e.target.value)} className="text-sm py-1 px-2 h-auto" />
              <Input placeholder="Address Line 2 / City" value={advManagerInput2} onChange={(e) => setAdvManagerInput2(e.target.value)} className="text-sm py-1 px-2 h-auto" />
            </div>
            <div className="mt-2 pt-2 border-t border-black">
              <p className="text-sm font-bold">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-5">
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
         <Table className="print-table main-table-bordered">
           <TableHeader className="print-table-header">
             <TableRow>
               <TableHead className="w-[10%] main-table-bordered p-1.5 text-sm font-bold">Key No.</TableHead>
               <TableHead className="w-[25%] main-table-bordered p-1.5 text-sm font-bold">Publication(s)</TableHead>
               <TableHead className="w-[20%] main-table-bordered p-1.5 text-sm font-bold">Edition(s)</TableHead>
               <TableHead className="w-[15%] main-table-bordered p-1.5 text-sm font-bold">Size</TableHead>
               <TableHead className="w-[15%] main-table-bordered p-1.5 text-sm font-bold">Scheduled Date(s)</TableHead>
               <TableHead className="w-[15%] main-table-bordered p-1.5 text-sm font-bold">Position</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {rowsData.map((row, index) => (
               <TableRow key={index} className="print-table-row">
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.keyNo} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} placeholder="Key" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.publication} onChange={(e) => handleTextareaInput(e, index, 'publication')} placeholder="Publication" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.edition} onChange={(e) => handleTextareaInput(e, index, 'edition')} placeholder="Edition" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.size} onChange={(e) => handleTextareaInput(e, index, 'size')} placeholder="Size" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.scheduledDate} onChange={(e) => handleTextareaInput(e, index, 'scheduledDate')} placeholder="Date(s)" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.position} onChange={(e) => handleTextareaInput(e, index, 'position')} placeholder="Position" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
          <div className="flex justify-center gap-2 mt-2 no-print no-pdf-export no-print-preview">
            <Button onClick={addRow} size="sm" variant="outline">Add Row</Button>
            {rowsData.length > 1 && <Button onClick={() => deleteRow(rowsData.length -1)} size="sm" variant="destructive">Delete Last Row</Button>}
          </div>
        </div>
        
        <div className="flex mb-3 min-h-[100px] items-stretch matter-container-print">
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
        
        <div className="p-3 border-2 border-black rounded flex flex-col print-footer-box">
          <div className="flex flex-col md:flex-row justify-between gap-4 pb-2">
            <div className="w-full md:w-[58%]">
              <p className="text-xs font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Forward all bills with relevant VTS copy to :-</p>
              <p className="text-xs leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101</p>
            </div>
            <div className="w-full md:w-[38%] flex justify-center md:justify-end items-start stamp-parent-container">
                <div 
                  className="stamp-container-screen w-[180px] h-[100px] border-0 flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                >
                {stampImage ? (
                     <Image src={stampImage} alt="Stamp" width={176} height={96} style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} className="border border-dashed border-gray-300" data-ai-hint="signature company stamp"/>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-50">
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" width={176} height={96} style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} data-ai-hint="upload placeholder"/>
                  </div>
                )}
                <Input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                </div>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-black">
            <p className="text-xs font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Note:</p>
            <ol className="list-decimal list-inside text-xs space-y-0.5">
              <li>Space reserved vide our letter No. <span className="no-underline-print">_______________</span></li>
              <li>No two advertisements of the same client should appear in the same issue.</li>
              <li>Please quote R.O. No. in all your bills and letters.</li>
              <li>Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</li>
            </ol>
          </div>
        </div>
      </div>
      
      {isPreviewing && !isFullScreenPreview && (
        <div 
          id="printPreviewOverlay" 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 no-print"
          onClick={(e) => {
            // Close only if clicking on the overlay itself, not the content
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
                {/* Cloned content will be injected here by useEffect */}
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
         <div id="fullscreen-content-host" className="fixed inset-0 bg-white z-[2000] overflow-auto p-4 no-print print-preview-active">
            {/* The printable area itself is styled to be fullscreen via CSS class 'fullscreen-preview-active' */}
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
