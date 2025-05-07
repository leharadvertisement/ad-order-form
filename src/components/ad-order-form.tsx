// src/components/ad-order-form.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker'; // Assuming this is the correct path
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Download, Printer, Eye, X, Save, Trash2, UploadCloud, Search, Eraser, CheckCircle, FileText, Settings, Copy, Palette, Briefcase, Users, Building, CalendarDays, FileDown, Maximize } from 'lucide-react';
import { format } from 'date-fns';

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


  const handleDateChange = (date: Date | undefined) => {
    setOrderDate(date);
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
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
        setStampImage(e.target?.result as string);
        localStorage.setItem('uploadedStampImage', e.target?.result as string);
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
  
  // Initialize date to today
  useEffect(() => {
    setOrderDate(new Date());
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
    setRowsData([{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
    // setStampImage(null); // Optionally clear the image
    // localStorage.removeItem('uploadedStampImage'); // Optionally clear from local storage
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
      setRowsData(draftData.rowsData || [{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
      setStampImage(draftData.stampImage || null);
      alert('Draft loaded!');
    } else {
      alert('No draft found.');
    }
  };
  
  const generatePdf = useCallback(() => {
    const element = printableAreaRef.current;
    if (element && (window as any).html2pdf) {
      const buttonsToHide = element.querySelectorAll('.no-pdf-export');
      buttonsToHide.forEach(btn => (btn as HTMLElement).style.visibility = 'hidden');

      const opt = {
        margin: 10, // mm
        filename: 'application.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1, // Set scale to 1 for 1:1 pixel rendering before PDF scaling
          useCORS: true,
          logging: false, 
          scrollY: 0, // Ensure we capture from the top of the element
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['css', 'avoid-all'] } // Avoid breaking elements if possible
      };

      (window as any).html2pdf().from(element).set(opt).save()
        .then(() => {
          buttonsToHide.forEach(btn => (btn as HTMLElement).style.visibility = '');
        })
        .catch((error: any) => {
          console.error("Error generating PDF:", error);
          buttonsToHide.forEach(btn => (btn as HTMLElement).style.visibility = '');
        });
    }
  }, []);

  const handlePrintPreview = () => {
    setIsPreviewing(true);
  };

  const handleClosePrintPreview = () => {
    setIsPreviewing(false);
  };

  const handleActualPrint = () => {
    window.print();
  };

  const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  useEffect(() => {
    const applyStaticTextForPrint = () => {
      if (isPreviewing && printableAreaRef.current) {
        // For inputs
        const inputs = printableAreaRef.current.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(input => {
          const p = document.createElement('span');
          p.textContent = (input as HTMLInputElement).value || (input as HTMLInputElement).placeholder || '';
          p.className = 'static-print-text'; // Add class for styling if needed
          // Apply relevant styles from input to span for consistency
          p.style.fontWeight = input.style.fontWeight || 'bold';
          p.style.fontSize = input.style.fontSize || '14px';
          p.style.fontFamily = input.style.fontFamily || 'Arial, sans-serif';
          p.style.color = 'black';
          p.style.display = 'inline-block';
          p.style.width = input.style.width || 'auto';
          p.style.padding = '2px 0'; // Minimal padding
          p.style.borderBottom = '1px solid black'; // Mimic input field look

          if (input.id === 'orderDate' && orderDate) {
             p.textContent = format(orderDate, 'dd.MM.yyyy');
          }


          input.parentNode?.replaceChild(p, input);
        });
  
        // For textareas (main matter textarea and table textareas)
        const textareas = printableAreaRef.current.querySelectorAll('textarea');
        textareas.forEach(textarea => {
          const div = document.createElement('div');
          div.innerHTML = (textarea as HTMLTextAreaElement).value.replace(/\n/g, '<br>') || (textarea as HTMLTextAreaElement).placeholder || '';
          div.className = 'static-print-text textarea-static-print';
          div.style.fontWeight = textarea.style.fontWeight || 'bold';
          div.style.fontSize = textarea.style.fontSize || (textarea.id === 'matterTextarea' ? '16px' : '14px');
          div.style.fontFamily = textarea.style.fontFamily || 'Arial, sans-serif';
          div.style.color = 'black';
          div.style.width = textarea.style.width || '100%';
          div.style.minHeight = textarea.style.minHeight || 'auto';
          div.style.whiteSpace = 'pre-wrap';
          div.style.wordWrap = 'break-word';
          
          if (textarea.id === 'matterTextarea') {
             // For the main matter box, ensure it respects the vertical text container
            // The parent div of matterTextarea handles the vertical "MATTER" title
            // The text itself should be horizontal within its content area.
            // The styling is primarily handled by globals.css for .matter-label-print-preview
            // and the structure of the matter box in print preview.
            // The text content itself remains horizontal.
            div.style.padding = '0px'; // Match original textarea padding for content
            div.style.borderTop = '1px solid black';
            div.style.borderBottom = '1px solid black';
            div.style.backgroundColor = '#fff';
            div.style.lineHeight = textarea.style.lineHeight || 'normal';
          } else {
            // For table textareas
            div.style.padding = '0'; // Minimal padding for table cells
          }
          textarea.parentNode?.replaceChild(div, textarea);
        });
  
        // Stamp image
        const stampPlaceholder = printableAreaRef.current.querySelector('.stamp-placeholder-print-preview');
        if (stampPlaceholder) {
          if (stampImage) {
            stampPlaceholder.innerHTML = `<img src="${stampImage}" alt="Stamp" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`;
          } else {
            stampPlaceholder.textContent = 'Stamp Area';
          }
        }
      }
    };
  
    if (isPreviewing) {
      // Clone the printable area to modify it for preview
      const previewNode = printableAreaRef.current?.cloneNode(true) as HTMLElement;
      const previewContentDiv = document.getElementById('printPreviewContent');
      
      if (previewContentDiv && previewNode) {
        // Remove buttons from the clone
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());

        // Apply specific print preview classes to certain elements in the clone
        const releaseOrderTitle = previewNode.querySelector('.release-order-title-screen');
        if (releaseOrderTitle) {
            releaseOrderTitle.classList.remove('release-order-title-screen');
            releaseOrderTitle.classList.add('release-order-titlebar-print-preview');
        }

        const matterLabel = previewNode.querySelector('.matter-label-screen');
        if (matterLabel) {
            matterLabel.classList.remove('matter-label-screen');
            matterLabel.classList.add('matter-label-print-preview');
        }
        
        const stampContainer = previewNode.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.classList.remove('stamp-container-screen');
            stampContainer.classList.add('stamp-container-print-preview');
             if (stampImage) {
                stampContainer.innerHTML = `<img src="${stampImage}" alt="Stamp" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`;
            } else {
                stampContainer.textContent = 'Stamp Area';
            }
        }


        // Convert inputs/textareas in the cloned node
        // For inputs
        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            p.textContent = input.id === 'orderDate' && orderDate ? format(orderDate, 'dd.MM.yyyy') : (input.value || input.placeholder || '');
            p.className = 'static-print-text';
            p.style.cssText = getComputedStyle(input).cssText; // Copy styles
            p.style.border = 'none'; // Remove input border
            p.style.borderBottom = '1px solid black'; // Add underline
            p.style.padding = '2px 0';
            p.style.backgroundColor = 'transparent';
            input.parentNode?.replaceChild(p, input);
        });

        // For textareas
        const textareas = previewNode.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            div.innerHTML = textarea.value.replace(/\n/g, '<br>') || textarea.placeholder || '';
            div.className = 'static-print-text textarea-static-print';
            // Copy essential styles, ensure it fits
            div.style.fontFamily = getComputedStyle(textarea).fontFamily;
            div.style.fontSize = getComputedStyle(textarea).fontSize;
            div.style.fontWeight = getComputedStyle(textarea).fontWeight;
            div.style.color = getComputedStyle(textarea).color;
            div.style.width = '100%'; // Ensure it takes full width of parent cell/container
            div.style.minHeight = getComputedStyle(textarea).minHeight;
            div.style.lineHeight = getComputedStyle(textarea).lineHeight;
            div.style.padding = getComputedStyle(textarea).padding;
            div.style.margin = getComputedStyle(textarea).margin;
            div.style.boxSizing = 'border-box';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordWrap = 'break-word';
            
            if (textarea.id === 'matterTextarea') { // Special handling for main matter textarea if needed
                div.style.borderTop = '1px solid black';
                div.style.borderBottom = '1px solid black';
                div.style.backgroundColor = '#fff'; // Or transparent if preferred
            } else { // For table textareas
                div.style.border = 'none';
            }
            textarea.parentNode?.replaceChild(div, textarea);
        });


        previewContentDiv.innerHTML = ''; // Clear previous content
        previewContentDiv.appendChild(previewNode);
      }
      document.body.classList.add('print-preview-active'); // Class for body to hide main form
    } else {
      document.body.classList.remove('print-preview-active');
    }
  
    return () => {
      document.body.classList.remove('print-preview-active');
    };
  }, [isPreviewing, orderDate, stampImage]);


  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container" id="application">
      {/* Action Buttons */}
      <Card className="mb-4 shadow-lg no-print-preview">
        <CardContent className="p-4 flex flex-wrap gap-2 justify-center">
          <Button onClick={saveDraft} variant="outline"><Save className="mr-2 h-4 w-4" />Save Draft</Button>
          <Button onClick={loadDraft} variant="outline"><UploadCloud className="mr-2 h-4 w-4" />Load Draft</Button>
          <Button onClick={clearForm} variant="destructive"><Eraser className="mr-2 h-4 w-4" />Clear Form</Button>
          <Button onClick={generatePdf} variant="default"><FileDown className="mr-2 h-4 w-4" />Download PDF</Button>
          <Button onClick={handlePrintPreview} variant="outline" className="no-pdf-export"><Eye className="mr-2 h-4 w-4" />Print Preview</Button>
          <Button onClick={handleActualPrint} variant="default" className="no-pdf-export"><Printer className="mr-2 h-4 w-4"/>Print</Button>
          <Button onClick={toggleFullScreen} variant="outline" className="no-pdf-export"><Maximize className="mr-2 h-4 w-4" />Full Screen</Button>
        </CardContent>
      </Card>

      {/* Printable Form Area */}
      <div id="printable-area-pdf" ref={printableAreaRef} className="w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 rounded-lg border-4 border-black">
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
            <div className="flex gap-3 p-2 border-2 border-black rounded items-center">
              <div className="flex-1 flex items-center">
                <Label htmlFor="roNumber" className="text-sm font-bold mr-2 whitespace-nowrap">R.O. No. LN:</Label>
                <Input id="roNumber" type="number" placeholder="Enter Number" value={ron} onChange={(e) => setRon(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
              </div>
              <div className="flex-1 flex items-center">
                 <Label htmlFor="orderDate" className="text-sm font-bold mr-2 whitespace-nowrap">Date:</Label>
                 <DatePicker selected={orderDate} onChange={handleDateChange} dateFormat="dd.MM.yyyy" className="text-sm py-1 px-2 h-auto w-full" id="orderDate"/>
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
         <Table className="print-table print-border border border-black">
           <TableHeader className="bg-secondary print-table-header">
             <TableRow>
               <TableHead className="w-[10%] print-border-thin border border-black p-1.5 text-sm font-bold">Key No.</TableHead>
               <TableHead className="w-[25%] print-border-thin border border-black p-1.5 text-sm font-bold">Publication(s)</TableHead>
               <TableHead className="w-[20%] print-border-thin border border-black p-1.5 text-sm font-bold">Edition(s)</TableHead>
               <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold">Size</TableHead>
               <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold">Scheduled Date(s)</TableHead>
               <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold">Position</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {rowsData.map((row, index) => (
               <TableRow key={index} className="print-table-row">
                 <TableCell className="print-border-thin border border-black p-0 align-top">
                   <Textarea value={row.keyNo} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} placeholder="Key" className="text-xs p-1 border-0 rounded-none resize-none min-h-[60px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="print-border-thin border border-black p-0 align-top">
                   <Textarea value={row.publication} onChange={(e) => handleTextareaInput(e, index, 'publication')} placeholder="Publication" className="text-xs p-1 border-0 rounded-none resize-none min-h-[60px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="print-border-thin border border-black p-0 align-top">
                   <Textarea value={row.edition} onChange={(e) => handleTextareaInput(e, index, 'edition')} placeholder="Edition" className="text-xs p-1 border-0 rounded-none resize-none min-h-[60px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="print-border-thin border border-black p-0 align-top">
                   <Textarea value={row.size} onChange={(e) => handleTextareaInput(e, index, 'size')} placeholder="Size" className="text-xs p-1 border-0 rounded-none resize-none min-h-[60px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="print-border-thin border border-black p-0 align-top">
                   <Textarea value={row.scheduledDate} onChange={(e) => handleTextareaInput(e, index, 'scheduledDate')} placeholder="Date(s)" className="text-xs p-1 border-0 rounded-none resize-none min-h-[60px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
                 <TableCell className="print-border-thin border border-black p-0 align-top">
                   <Textarea value={row.position} onChange={(e) => handleTextareaInput(e, index, 'position')} placeholder="Position" className="text-xs p-1 border-0 rounded-none resize-none min-h-[60px] h-auto no-shadow-outline print-textarea" />
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
          <div className="flex justify-center gap-2 mt-2 no-print-preview">
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
            <div className="w-full md:w-[38%] flex justify-center md:justify-end items-start">
                <div 
                  className="stamp-container-screen w-[160px] h-[90px] border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 bg-gray-50 rounded cursor-pointer hover:border-gray-600"
                  onClick={triggerStampUpload}
                  data-ai-hint="stamp signature"
                >
                {stampImage ? (
                    <Image src={stampImage} alt="Stamp" width={156} height={86} style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} />
                ) : (
                    <span>Upload Image</span>
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
      {isPreviewing && (
        <div 
          id="printPreviewOverlay" 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 print-preview-active"
          onClick={handleClosePrintPreview} // Close on overlay click
        >
          <div 
            id="printPreviewModalContent" 
            className="bg-white w-[210mm] min-h-[297mm] h-auto max-h-[95vh] p-5 shadow-2xl overflow-auto print-preview-modal-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
             <div id="printPreviewContent" className="print-preview-inner-content">
                {/* Content is dynamically inserted here by useEffect */}
             </div>
          </div>
          <Button 
            onClick={handleClosePrintPreview} 
            variant="destructive" 
            className="fixed top-4 right-4 z-[1001] no-print-preview"
            aria-label="Close print preview"
          >
            <X className="mr-2 h-4 w-4" /> Close Preview
          </Button>
           <Button 
            onClick={handleActualPrint} 
            variant="default" 
            className="fixed top-4 right-40 z-[1001] no-print-preview" // Adjust position as needed
            aria-label="Print document"
          >
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdOrderForm;
