// src/components/ad-order-form.tsx
'use client';

import type { ReactNode } from 'react'; // Changed from FC for potentially simpler parsing
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Eye, CalendarIcon } from 'lucide-react'; // Eye icon added, Printer, Download, Trash2 removed
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Options } from 'html2pdf.js';


const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/stamp/178/98';
const DEFAULT_COMPANY_LOGO_PLACEHOLDER = "https://picsum.photos/seed/leharlogo/280/280";


const AdOrderForm = (): JSX.Element => { // Changed type signature
  const [ron, setRon] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
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
             else if (textarea.id === 'matterTextarea' && computedStyle) {
                const matterPrintMinHeight = parseFloat(computedStyle.getPropertyValue('--print-matter-textarea-min-height') || 'auto');
                 if (!isNaN(matterPrintMinHeight) && newHeight < matterPrintMinHeight) newHeight = matterPrintMinHeight;
            }
            textarea.style.height = `${newHeight}px`;
            textarea.style.overflowY = 'visible'; 
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
    setOrderDate(new Date());
  }, []);

  useEffect(() => {
    if (isClient) {
      const allTextareas = document.querySelectorAll('#printable-area-pdf textarea');
      allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
    }
  }, [isClient, rowsData, matterText, adjustTextareaHeight, headingCaption, packageName, advManagerInput1, advManagerInput2, clientName, ron]);


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
    if (typeof window === 'undefined' || !window.html2pdf) {
      console.error('html2pdf.js not loaded or window object not available.');
      alert('PDF generation is only available in a browser environment or the PDF library failed to load.');
      return;
    }
    
    const html2pdf = window.html2pdf;

    const elementToPrint = printableAreaRef.current;
    if (!elementToPrint) {
        console.error('Element not found for PDF generation.');
        alert('Element to print not found.');
        return;
    }

    document.body.classList.add('pdf-export-active');
    const textareasOnPage = elementToPrint.querySelectorAll('textarea');
    textareasOnPage.forEach(ta => adjustTextareaHeight(ta));


    const clonedElement = elementToPrint.cloneNode(true) as HTMLElement;

    clonedElement.querySelectorAll('.no-pdf-export').forEach(el => el.remove());
    clonedElement.querySelectorAll('.action-buttons-container').forEach(el => el.remove());
    clonedElement.querySelectorAll('.table-row-actions').forEach(el => el.remove());


    clonedElement.style.width = '210mm';
    clonedElement.style.height = '297mm'; 
    clonedElement.style.minHeight = '297mm';
    clonedElement.style.maxHeight = '297mm';
    clonedElement.style.overflow = 'hidden'; 
    clonedElement.style.padding = '5mm'; 
    clonedElement.style.borderWidth = '2px'; 
    clonedElement.style.boxSizing = 'border-box';

    const logoContainer = clonedElement.querySelector('.company-logo-container-pdf') as HTMLElement;
    if (logoContainer) {
        const imgElement = logoContainer.querySelector('img');
        if (imgElement && companyLogo && companyLogo !== DEFAULT_COMPANY_LOGO_PLACEHOLDER) {
            imgElement.src = companyLogo;
        } else if (imgElement && (!companyLogo || companyLogo === DEFAULT_COMPANY_LOGO_PLACEHOLDER)) {
             imgElement.src = DEFAULT_COMPANY_LOGO_PLACEHOLDER; 
        }
    }


    const inputsToConvert = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], input.custom-input-pdf');
    inputsToConvert.forEach(inputEl => {
        const p = document.createElement('span');
        const input = inputEl as HTMLInputElement;
        let value = input.value;
        if (input.id === 'orderDate' && orderDate) {
             value = format(orderDate, 'dd.MM.yyyy');
        } else if (input.type === 'date' && !input.value && input.placeholder) {
            value = '\u00A0'; 
        } else if (input.type === 'date' && input.value){
            try {
                value = format(new Date(input.value), 'dd.MM.yyyy');
            } catch (e) {
                 value = input.value || '\u00A0'; 
            }
        } else {
            value = input.value || '\u00A0'; 
        }
        p.textContent = value;
        p.className = 'static-print-text'; 
        const inputStyle = getComputedStyle(input);
        p.style.display = 'inline-block'; 
        p.style.width = inputStyle.width;
        p.style.minHeight = '1em'; 
        p.style.fontFamily = inputStyle.fontFamily;
        p.style.fontSize = inputStyle.fontSize; 
        p.style.fontWeight = inputStyle.fontWeight;
        p.style.lineHeight = inputStyle.lineHeight; 
        p.style.color = 'black';
        p.style.borderBottom = inputStyle.borderBottomWidth + ' ' + inputStyle.borderBottomStyle + ' ' + inputStyle.borderBottomColor; 
        p.style.padding = inputStyle.padding; 
        p.style.backgroundColor = 'transparent';
        input.parentNode?.replaceChild(p, input);
    });

    const datePickersInTable = clonedElement.querySelectorAll('.table-date-picker-wrapper');
    datePickersInTable.forEach((wrapper, index) => {
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
        p.style.textAlign = 'center';
        p.style.minHeight = '1em';
        p.style.fontFamily = 'Arial, sans-serif'; 
        p.style.fontSize = '8pt'; 
        p.style.fontWeight = 'bold';
        p.style.lineHeight = '1.0'; 
        p.style.color = 'black';
        p.style.padding = '1px'; 
        p.style.backgroundColor = 'transparent';
        wrapper.parentNode?.replaceChild(p, wrapper);
    });


    const textareasToConvert = clonedElement.querySelectorAll('textarea');
    textareasToConvert.forEach(textareaEl => {
        const div = document.createElement('div');
        const textarea = textareaEl as HTMLTextAreaElement;
        div.innerHTML = textarea.value.replace(/\n/g, '<br>') || '\u00A0'; 
        div.className = 'static-print-text textarea-static-print'; 

        
        const textareaStyle = getComputedStyle(textarea);
        div.style.fontFamily = textareaStyle.fontFamily;
        
        div.style.fontWeight = textareaStyle.fontWeight;
        
        div.style.color = 'black';
        div.style.backgroundColor = 'transparent';
        div.style.border = 'none'; 
        div.style.height = 'auto'; 
        div.style.whiteSpace = 'pre-wrap'; 
        div.style.wordWrap = 'break-word'; 

        if (textarea.id === 'matterTextarea') {
             div.classList.add('matter-container-print'); 
             div.style.textAlign = textareaStyle.textAlign; 
        }
        textarea.parentNode?.replaceChild(div, textarea);
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
        const placeholderDiv = stampContainerClone.querySelector('div.placeholder-div');

        if (stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER) {
            if (imgInStamp) {
                imgInStamp.src = stampImage;
                imgInStamp.alt = "Stamp";
            } else {
                const newImg = document.createElement('img');
                newImg.src = stampImage;
                newImg.alt = "Stamp";
                stampContainerClone.innerHTML = ''; 
                stampContainerClone.appendChild(newImg);
            }
        } else if (placeholderDiv) {
            // Placeholder exists, do nothing to it.
        } else if (!imgInStamp) { // No image and no placeholder, ensure it's empty or has default text.
            stampContainerClone.textContent = ''; 
        }
    }
    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
        tableClone.classList.remove('main-table-bordered');
        tableClone.classList.add('print-table'); 
        const tableHeaders = tableClone.querySelectorAll('th');
        tableHeaders.forEach(th => th.classList.add('print-table-header')); 
    }

    const pdfOptions: Options = {
        margin: [5,5,5,5], 
        filename: 'release_order_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2, 
            useCORS: true, 
            logging: false, 
            onclone: (documentClone: Document) => {
                const clonedBody = documentClone.body;
                clonedBody.classList.add('pdf-export-active'); 
                
                const _ = clonedBody.offsetHeight; 

                const textareasInClone = clonedBody.querySelectorAll('.textarea-static-print');
                textareasInClone.forEach(ta => {
                    const htmlTa = ta as HTMLElement;
                    htmlTa.style.height = 'auto'; 

                    const computedStyle = getComputedStyle(htmlTa);
                    const maxHeight = parseFloat(computedStyle.maxHeight || '9999'); 
                    const minHeight = parseFloat(computedStyle.minHeight || '0'); 

                    let newHeight = htmlTa.scrollHeight; 
                    if (newHeight < minHeight) newHeight = minHeight; 

                    htmlTa.style.height = `${Math.min(newHeight, maxHeight)}px`; 
                    htmlTa.style.overflowY = 'hidden'; 
                });
            }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(clonedElement).set(pdfOptions).save().then(() => {
      document.body.classList.remove('pdf-export-active'); 
    }).catch((error: Error) => {
        console.error("Error generating PDF:", error);
        document.body.classList.remove('pdf-export-active');
    });

  }, [orderDate, stampImage, companyLogo, rowsData, matterText, advManagerInput1, advManagerInput2, clientName, headingCaption, packageName, ron, adjustTextareaHeight]);


  const handleOpenCleanView = useCallback(() => {
    if (typeof window === 'undefined' || !printableAreaRef.current) return;

    const clonedPrintableArea = printableAreaRef.current.cloneNode(true) as HTMLElement;
    
    // Remove specific buttons from the cloned content
    clonedPrintableArea.querySelectorAll('.action-buttons-container button').forEach(button => {
        button.remove();
    });
    
    const actionButtonContainer = clonedPrintableArea.querySelector('.action-buttons-container');
    if(actionButtonContainer && !actionButtonContainer.hasChildNodes()){
        actionButtonContainer.remove();
    }

    // Remove image removal buttons
    clonedPrintableArea.querySelectorAll('button.no-print.no-pdf-export').forEach(btn => btn.remove());


    const newWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write('<html><head><title>Clean View</title>');
      Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach(tag => {
        newWindow.document.head.appendChild(tag.cloneNode(true));
      });
      newWindow.document.write('</head><body>');
      newWindow.document.body.style.margin = '0';
      newWindow.document.body.style.padding = '10px';
      newWindow.document.body.innerHTML = clonedPrintableArea.outerHTML;

      // Add a print button to the new window
      const printButton = newWindow.document.createElement('button');
      printButton.textContent = 'Print';
      printButton.style.position = 'fixed';
      printButton.style.top = '10px';
      printButton.style.right = '10px';
      printButton.style.padding = '10px 20px';
      printButton.style.backgroundColor = '#007bff';
      printButton.style.color = 'white';
      printButton.style.border = 'none';
      printButton.style.borderRadius = '5px';
      printButton.style.cursor = 'pointer';
      printButton.onclick = () => newWindow.print();
      newWindow.document.body.appendChild(printButton);
      
      newWindow.document.close();
      newWindow.focus();
    }
  }, []);


  if (!isClient) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">

      <div className="flex justify-end items-center gap-2 p-2 mb-2 action-buttons-container sticky top-0 bg-background z-50">
          <Button onClick={handleOpenCleanView} variant="outline" size="sm"><Eye className="mr-2 h-4 w-4" />Open Clean View</Button>
      </div>

      <div id="printable-area-pdf" ref={printableAreaRef} className="w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 border-4 border-black">
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-stretch gap-4 mb-5 print-header-box">
             <div
                className="w-full md:w-[300px] h-[280px] p-1.5 border-2 border-black rounded flex flex-col relative company-logo-container-screen company-logo-container-pdf cursor-pointer items-center justify-start overflow-hidden"
                onClick={triggerCompanyLogoUpload}
                title="Click to upload company logo"
            >
                 <div className="relative w-full h-full flex items-start justify-center">
                    <Image
                        src={companyLogo}
                        alt="Company Logo"
                        width={280} 
                        height={280} 
                        style={{ objectFit: "contain", objectPosition: "top", width: '100%', height: '100%' }}
                        className="rounded"
                        data-ai-hint="company logo"
                        priority 
                    />
                </div>
                <Input key={companyLogoInputKey} type="file" ref={companyLogoInputRef} onChange={handleCompanyLogoUpload} accept="image/*" className="hidden" />
                {companyLogo !== DEFAULT_COMPANY_LOGO_PLACEHOLDER && companyLogo !== '' && (
                    <Button onClick={(e) => { e.stopPropagation(); removeCompanyLogo(); }} variant="ghost" size="icon" className="absolute top-1 right-1 no-print no-pdf-export">
                        {/* <Trash2 className="h-4 w-4 text-red-500" /> */} {/*Removed trash icon as per previous instructions */}
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
                        {isClient && orderDate !== undefined ? ( 
                            <DatePicker 
                                selected={orderDate} 
                                onChange={handleDateChange} 
                                dateFormat="dd.MM.yyyy" 
                                className="text-sm py-1 px-2 h-auto w-full border-2 border-black text-center justify-center" 
                                id="orderDate" 
                                placeholderText=""/>
                         ) : (
                            <Button
                              variant={"outline"}
                              id="orderDate"
                              className={cn(
                                "text-sm py-1 px-2 h-auto w-full border-2 border-black text-center justify-center",
                                "date-picker-trigger-button text-muted-foreground"
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
         <Table className="main-table-bordered print-table border-2 border-black">
           <TableHeader className="bg-secondary print-table-header">
             <TableRow>
               <TableHead className="w-[9%] border border-black p-1.5 text-sm font-bold text-center">Key No.</TableHead>
               <TableHead className="w-[30%] border border-black p-1.5 text-sm font-bold text-center">Publication(s)</TableHead>
               <TableHead className="w-[19%] border border-black p-1.5 text-sm font-bold text-center">Edition(s)</TableHead>
               <TableHead className="w-[14%] border border-black p-1.5 text-sm font-bold text-center">Size</TableHead>
               <TableHead className="w-[14%] border border-black p-1.5 text-sm font-bold text-center">Scheduled Date(s)</TableHead>
               <TableHead className="w-[14%] border border-black p-1.5 text-sm font-bold text-center">Position</TableHead>
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
                        className="text-xs py-0.5 px-1 h-auto w-full border-0 rounded-none no-shadow-outline print-textarea text-center justify-center"
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
                  className="stamp-container-screen w-[178px] h-[98px] flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80 relative border-0"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                >
                {stampImage && stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER ? (
                     <Image src={stampImage} alt="Stamp" layout="intrinsic" width={178} height={98} className="object-contain" data-ai-hint="signature company stamp" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 placeholder-div">
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" layout="intrinsic" width={178} height={98} className="object-contain" data-ai-hint="upload placeholder"/>
                  </div>
                )}
                <Input key={stampInputKey} type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                {stampImage !== DEFAULT_STAMP_IMAGE_PLACEHOLDER && (
                    <Button onClick={(e) => { e.stopPropagation(); removeStampImage(); }} variant="ghost" size="icon" className="absolute top-1 right-1 no-print no-pdf-export">
                        {/* <Trash2 className="h-4 w-4 text-red-500" /> */} {/* Removed trash icon */}
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
