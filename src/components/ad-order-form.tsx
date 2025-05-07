// src/components/ad-order-form.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Download, Printer, Eye, X, Save, Trash2, UploadCloud, Search, Eraser, CheckCircle, FileText, Settings, Copy, Palette, Briefcase, Users, Building, CalendarDays, FileDown, Maximize, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

// Default image, replace with your actual default image path or remove if not needed
const DEFAULT_STAMP_IMAGE = 'https://picsum.photos/160/90?random&data-ai-hint=stamp+signature';


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

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };
  
  useEffect(() => {
    // Adjust height for all textareas on initial load and when rowsData changes
    const allTextareas = document.querySelectorAll('#printable-area-pdf textarea');
    allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
  }, [rowsData, matterText]);


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
    } else {
      // setStampImage(DEFAULT_STAMP_IMAGE); // Set default image if no saved image
    }
  }, []);
  
  // Initialize date to today
  useEffect(() => {
    if(!orderDate){ // only set if not already set e.g. by loading draft
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
    // Do not clear stamp image on form clear, user might want to reuse it.
    // setStampImage(DEFAULT_STAMP_IMAGE);
    // localStorage.removeItem('uploadedStampImage'); 
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
      stampImage, // save current stampImage (could be null, default, or uploaded)
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
      setStampImage(draftData.stampImage); // Load saved image, could be null
      alert('Draft loaded!');
    } else {
      alert('No draft found.');
    }
  };
  
  const generatePdf = useCallback(() => {
    const element = printableAreaRef.current;
    if (element && (window as any).html2pdf) {
      // Temporarily remove buttons or elements not desired in PDF
      const buttonsToHide = element.querySelectorAll('.no-pdf-export');
      buttonsToHide.forEach(btn => (btn as HTMLElement).style.visibility = 'hidden');
      
      // Clone the element to modify for PDF generation without affecting the screen
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Apply transformations for PDF
      // Convert inputs/textareas to static text for PDF
        const inputs = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
             if (input.id === 'orderDate' && orderDate) {
                 p.textContent = format(orderDate, 'dd.MM.yyyy');
             } else {
                p.textContent = input.value || input.placeholder || '';
             }
            p.className = 'static-print-text'; // For global print styles
            // Copy relevant styles for visual consistency in PDF
            p.style.cssText = getComputedStyle(input).cssText;
            p.style.border = 'none'; // Remove input borders
            p.style.borderBottom = '1px solid black'; // Mimic underline
            p.style.padding = '2px 0';
            p.style.backgroundColor = 'transparent';
            p.style.display = 'inline-block'; // Ensure it flows like text
            p.style.width = input.style.width || 'auto'; // Retain width
            input.parentNode?.replaceChild(p, input);
        });

        const textareas = clonedElement.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            div.innerHTML = textarea.value.replace(/\n/g, '<br>') || textarea.placeholder || '';
            div.className = 'static-print-text textarea-static-print';
            // Copy styles
            div.style.cssText = getComputedStyle(textarea).cssText;
            div.style.border = 'none'; // Remove textarea borders generally for PDF
             if (textarea.id === 'matterTextarea') { // Matter textarea specifics
                div.style.borderTop = '1px solid black';
                div.style.borderBottom = '1px solid black';
            }
            div.style.overflow = 'visible'; // Ensure all content is visible
            div.style.height = 'auto'; // Adjust height to content
            div.style.minHeight = 'unset'; // Remove min-height for PDF version
            textarea.parentNode?.replaceChild(div, textarea);
        });
      
      // Ensure Release Order and Matter titles are styled correctly for PDF
        const releaseOrderTitle = clonedElement.querySelector('.release-order-title-screen');
        if (releaseOrderTitle) {
            releaseOrderTitle.classList.remove('release-order-title-screen');
            releaseOrderTitle.classList.add('release-order-titlebar-print-preview'); // Use print preview class
        }

        const matterLabel = clonedElement.querySelector('.matter-label-screen');
        if (matterLabel) {
            matterLabel.classList.remove('matter-label-screen');
            matterLabel.classList.add('matter-label-print-preview'); // Use print preview class
        }

        // Handle stamp image for PDF
        const stampContainer = clonedElement.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.classList.remove('stamp-container-screen');
            stampContainer.classList.add('stamp-container-print-preview'); // Use print preview class
             if (stampImage) {
                stampContainer.innerHTML = `<img src="${stampImage}" alt="Stamp" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`;
            } else {
                stampContainer.textContent = 'Stamp Area'; // Placeholder text if no image
            }
        }


      const opt = {
        margin: 23.8125, // 90px converted to mm (90px / 96DPI * 25.4mm/inch)
        filename: 'application_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, // Use a higher scale for better image quality in PDF
          useCORS: true,
          logging: false, 
          scrollY: 0, // Ensure we capture from the top of the element
          windowWidth: clonedElement.scrollWidth, // Use scrollWidth of the cloned element
          windowHeight: clonedElement.scrollHeight, // Use scrollHeight for full content
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
          buttonsToHide.forEach(btn => (btn as HTMLElement).style.visibility = '');
        })
        .catch((error: any) => {
          console.error("Error generating PDF:", error);
          buttonsToHide.forEach(btn => (btn as HTMLElement).style.visibility = '');
        });
    }
  }, [orderDate, stampImage]); // Add dependencies if they affect PDF content

  const handlePrintPreview = () => {
    setIsPreviewing(true);
    document.body.classList.add('print-preview-active'); 
  };

  const handleClosePrintPreview = () => {
    setIsPreviewing(false);
    document.body.classList.remove('print-preview-active');
    const previewContentDiv = document.getElementById('printPreviewContent');
    if (previewContentDiv) {
        previewContentDiv.innerHTML = ''; // Clear content
    }
  };

  const handleActualPrint = () => {
    window.print();
  };

  const handleFullScreenPreview = () => {
    setIsFullScreenPreview(true);
    // Request fullscreen on the #printable-area-pdf element
    printableAreaRef.current?.requestFullscreen().catch(err => {
      alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  };

  const handleExitFullScreenPreview = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullScreenPreview(false);
  };
  
  useEffect(() => {
    const fullscreenChangeHandler = () => {
      if (!document.fullscreenElement) {
        setIsFullScreenPreview(false);
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  }, []);


  // Effect for Print Preview Modal Content
  useEffect(() => {
    if (isPreviewing && !isFullScreenPreview) {
      const previewNode = printableAreaRef.current?.cloneNode(true) as HTMLElement | null;
      const previewContentDiv = document.getElementById('printPreviewContent');
      
      if (previewContentDiv && previewNode) {
        // Remove elements not needed in preview
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());

        // Apply specific print preview classes
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
                stampContainer.innerHTML = `<img src="${stampImage}" alt="Stamp" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`;
            } else {
                stampContainer.textContent = 'Stamp Area';
            }
        }

        // Convert inputs/textareas to static text
        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            let value = input.value || '';
            if (input.id === 'orderDate' && orderDate) {
                 value = format(orderDate, 'dd.MM.yyyy');
            } else if (!input.value && input.placeholder) {
                value = ''; // Show empty for placeholder if no value
            }
            p.textContent = value;
            p.className = 'static-print-text';
            // Basic styling for PDF, can be expanded in globals.css @media print
            p.style.display = 'inline-block';
            p.style.width = getComputedStyle(input).width;
            p.style.fontFamily = getComputedStyle(input).fontFamily;
            p.style.fontSize = getComputedStyle(input).fontSize;
            p.style.fontWeight = getComputedStyle(input).fontWeight;
            p.style.lineHeight = getComputedStyle(input).lineHeight;
            p.style.color = 'black';
            if (input.type !== 'date') { // Avoid double border for date
                p.style.borderBottom = '1px solid black';
            }
            p.style.padding = '2px 0';
            input.parentNode?.replaceChild(p, input);
        });

        const textareas = previewNode.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            let value = textarea.value.replace(/\n/g, '<br>') || '';
            if (!textarea.value && textarea.placeholder) {
                value = ''; // Show empty for placeholder if no value
            }
            div.innerHTML = value;
            div.className = 'static-print-text textarea-static-print';
            div.style.cssText = getComputedStyle(textarea).cssText;
            div.style.border = 'none';
            div.style.backgroundColor = 'transparent';
            div.style.height = 'auto'; // Let content define height
            div.style.minHeight = 'unset';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordWrap = 'break-word';
             if (textarea.id === 'matterTextarea') {
                div.style.borderTop = '1px solid black';
                div.style.borderBottom = '1px solid black';
            }
            textarea.parentNode?.replaceChild(div, textarea);
        });

        previewContentDiv.innerHTML = ''; 
        previewContentDiv.appendChild(previewNode);
      }
    } else if (!isPreviewing && !isFullScreenPreview) {
        const previewContentDiv = document.getElementById('printPreviewContent');
        if (previewContentDiv) previewContentDiv.innerHTML = ''; // Clear on close
    }
  }, [isPreviewing, isFullScreenPreview, orderDate, stampImage, rowsData, matterText, clientName, advManagerInput1, advManagerInput2, headingCaption, packageName, ron ]);


  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">
      {/* Action Buttons */}
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

      {/* Printable Form Area - This is what gets printed or PDF'd or Fullscreened */}
      <div id="printable-area-pdf" ref={printableAreaRef} className={`w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 rounded-lg border-4 border-black ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
        {/* Release Order Title */}
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        {/* Top Section: Company Info & Order Details */}
        <div className="flex flex-col md:flex-row gap-4 mb-5">
          {/* Left Box: Company Info */}
          <div className="w-full md:w-[35%] p-3 border-2 border-black rounded box-decoration-break-clone">
            <h3 className="text-lg font-bold">Lehar</h3>
            <h4 className="text-md font-semibold">ADVERTISING PVT.LTD.</h4>
            <p className="text-xs mt-1">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
            <p className="text-xs">Alaknanda Commercial complex, <br /> New Delhi-110019</p>
            <p className="text-xs mt-1">Tel.: 49573333, 34, 35, 36</p>
            <p className="text-xs">Fax: 26028101</p>
            <p className="text-xs mt-1"><strong>GSTIN:</strong> 07AABCL5406F1ZU</p>
          </div>

          {/* Right Box: Order Details */}
          <div className="flex-1 flex flex-col gap-3">
             {/* RO Number and Date */}
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
            {/* Client Name */}
            <div className="p-2 border-2 border-black rounded flex items-center">
              <Label htmlFor="clientName" className="text-sm font-bold mr-2 whitespace-nowrap">Client:</Label>
              <Input id="clientName" placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
            </div>
             {/* Advertisement Manager */}
            <div className="p-3 border-2 border-black rounded flex flex-col gap-2">
              <Label className="text-sm font-bold">The Advertisement Manager</Label>
              <Input placeholder="Publication Name / Address Line 1" value={advManagerInput1} onChange={(e) => setAdvManagerInput1(e.target.value)} className="text-sm py-1 px-2 h-auto" />
              <Input placeholder="Address Line 2 / City" value={advManagerInput2} onChange={(e) => setAdvManagerInput2(e.target.value)} className="text-sm py-1 px-2 h-auto" />
            </div>
            {/* Insertion Instructions */}
            <div className="mt-2 pt-2 border-t border-black">
              <p className="text-sm font-bold">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
            </div>
          </div>
        </div>
        
        {/* Heading/Caption and Package Section */}
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


        {/* Table for Ad Details */}
        <div className="mb-5 table-container-print">
         <Table className="print-table main-table-bordered">
           <TableHeader className="bg-secondary print-table-header">
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
                   <Textarea value={row.keyNo} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} placeholder="Key" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.publication} onChange={(e) => handleTextareaInput(e, index, 'publication')} placeholder="Publication" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.edition} onChange={(e) => handleTextareaInput(e, index, 'edition')} placeholder="Edition" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.size} onChange={(e) => handleTextareaInput(e, index, 'size')} placeholder="Size" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.scheduledDate} onChange={(e) => handleTextareaInput(e, index, 'scheduledDate')} placeholder="Date(s)" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.position} onChange={(e) => handleTextareaInput(e, index, 'position')} placeholder="Position" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea" />
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
        
        {/* Matter Section */}
        <div className="flex mb-3 min-h-[100px] items-stretch matter-container-print">
            <div className="matter-label-screen bg-black text-white flex items-center justify-center p-1 w-[38px] print-matter-label">
                <span className="[writing-mode:vertical-lr] rotate-180 text-sm font-bold">MATTER</span>
            </div>
            <Textarea
              id="matterTextarea"
              placeholder="Enter matter here..."
              value={matterText}
              onChange={handleMatterChange}
              className="flex-1 text-sm p-2 border border-black border-l-0 rounded-none resize-none min-h-[100px] h-auto no-shadow-outline focus:border-black print-matter-content"
            />
        </div>
        
        {/* Footer Section: Forwarding Address, Stamp, Notes */}
        <div className="p-3 border-2 border-black rounded flex flex-col print-footer-box">
          <div className="flex flex-col md:flex-row justify-between gap-4 pb-2">
            {/* Left: Forwarding Address */}
            <div className="w-full md:w-[58%]">
              <p className="text-xs font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Forward all bills with relevant VTS copy to :-</p>
              <p className="text-xs leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101</p>
            </div>
            {/* Right: Stamp Area */}
            <div className="w-full md:w-[38%] flex justify-center md:justify-end items-start stamp-parent-container">
                <div 
                  className="stamp-container-screen w-[180px] h-[100px] border-0 flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                  data-ai-hint="signature company"
                >
                {stampImage ? (
                    <Image src={stampImage} alt="Stamp" width={176} height={96} style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%'}} className="border border-dashed border-gray-300" />
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-50">
                    <span>Upload Image</span>
                  </div>
                )}
                <Input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                </div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="mt-2 pt-2 border-t border-black">
            <p className="text-xs font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Note:</p>
            <ol className="list-decimal list-inside text-xs space-y-0.5">
              <li>Space reserved vide our letter No.</li>
              <li>No two advertisements of the same client should appear in the same issue.</li>
              <li>Please quote R.O. No. in all your bills and letters.</li>
              <li>Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</li>
            </ol>
          </div>
        </div>
      </div>
      
      {/* Print Preview Modal */}
      {isPreviewing && !isFullScreenPreview && (
        <div 
          id="printPreviewOverlay" 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 no-print"
          onClick={handleClosePrintPreview}
        >
          <div 
            id="printPreviewModalContentContainer" 
            className="bg-white w-[210mm] min-h-[297mm] h-auto max-h-[95vh] p-5 shadow-2xl overflow-auto print-preview-modal-content no-print"
            onClick={(e) => e.stopPropagation()} 
          >
             <div id="printPreviewContent" className="print-preview-inner-content">
                {/* Content is dynamically inserted here by useEffect */}
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

      {/* Full Screen Preview content (rendered directly for fullscreen, hidden otherwise) */}
      {isFullScreenPreview && (
         <div id="fullscreen-content-host" className="fixed inset-0 bg-white z-[2000] overflow-auto p-4">
            {/* Content will be cloned here if printableAreaRef.current exists, or shown directly */}
            {/* This is a simplified approach. For complex cases, cloning into this div might be better. */}
            {/* For now, CSS will target #printable-area-pdf.fullscreen-preview-active */}
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
                className="fixed top-4 right-56 z-[2001] no-print no-pdf-export" // Adjusted position
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

```