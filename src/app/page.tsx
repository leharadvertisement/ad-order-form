
"use client";

import React, { useEffect, useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


declare global {
  interface Window {
    html2pdf: any;
  }
}

export default function ApplicationFormPage() {
  const applicationRef = useRef<HTMLDivElement>(null);
  const printPreviewContentRef = useRef<HTMLDivElement>(null);
  const printPreviewContainerRef = useRef<HTMLDivElement>(null);
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [stampImage, setStampImage] = useState<string | null>(null);


  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
      textarea.style.height = 'auto'; 
      textarea.style.height = `${textarea.scrollHeight}px`; 
  }, []);

  const handleTextareaInput = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustTextareaHeight(event.target);
  }, [adjustTextareaHeight]);


  const addRow = useCallback(() => {
    const table = document.getElementById('tableBody');
    if (table) {
      const newRow = document.createElement('tr');
      newRow.className = "print-table-row";
      for (let i = 0; i < 6; i++) {
        const cell = document.createElement('td');
        cell.style.border = '1px solid black';
        cell.style.padding = '6px';
        cell.style.verticalAlign = 'top'; 
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = 'auto';
        textarea.style.minHeight = '160px'; 
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.fontWeight = 'bold';
        textarea.style.fontSize = '14px';
        textarea.style.color = '#000';
        textarea.style.backgroundColor = '#fff';
        textarea.style.boxSizing = 'border-box';
        textarea.style.resize = 'none';
        textarea.setAttribute('aria-label', `Enter table row data column ${i+1}`);
        textarea.addEventListener('input', (e) => adjustTextareaHeight(e.target as HTMLTextAreaElement)); 
        cell.appendChild(textarea);
        newRow.appendChild(cell);
      }
      table.appendChild(newRow);
       // Adjust height for all textareas in the new row if needed, or rely on input event
      const textareasInNewRow = newRow.querySelectorAll('textarea');
      textareasInNewRow.forEach(ta => adjustTextareaHeight(ta));
    }
  }, [adjustTextareaHeight]);


  const deleteRow = useCallback(() => {
    const table = document.getElementById('tableBody');
    if (table && table.rows.length > 0) {
      table.deleteRow(-1);
    }
  }, []);

  const generatePdf = useCallback(() => {
    const element = applicationRef.current;
    if (element && window.html2pdf) {
      const buttonsToHide = element.querySelectorAll('.button-container, .print-icon-container, .new-row-buttons');
      buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = 'none');

      const opt = {
        margin: 10,
        filename: 'application.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, windowWidth: element.scrollWidth, windowHeight: element.scrollHeight },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save().then(() => {
        buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = '');
      });
    } else if (element) { // Fallback to html2canvas and jsPDF if html2pdf.js is not available or fails
        html2canvas(element, {
            scale: 2,
            useCORS: true,
            scrollX: 0,
            scrollY: 0,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const pdf = new jsPDF({
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            let newCanvasWidth = pdfWidth;
            let newCanvasHeight = newCanvasWidth / ratio;

            if (newCanvasHeight > pdfHeight) {
                newCanvasHeight = pdfHeight;
                newCanvasWidth = newCanvasHeight * ratio;
            }
            
            const xOffset = (pdfWidth - newCanvasWidth) / 2;
            const yOffset = (pdfHeight - newCanvasHeight) / 2;

            pdf.addImage(imgData, 'JPEG', xOffset, yOffset, newCanvasWidth, newCanvasHeight);
            pdf.save('application.pdf');
            buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = '');
        }).catch(err => {
            console.error("Error generating PDF with fallback: ", err);
            buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = '');
        });
    }
  }, []);

  const showPrintPreview = useCallback(() => {
    if (printPreviewContainerRef.current && printPreviewContentRef.current && applicationRef.current) {
      const clonedApp = applicationRef.current.cloneNode(true) as HTMLElement;
      clonedApp.querySelectorAll('.button-container, .print-icon-container, .new-row-buttons, #printPreviewButton, #downloadPdfButton, #fullScreenButton, .no-print-in-preview').forEach(el => el.remove());
      
      const matterDivPreview = clonedApp.querySelector('[data-ai-id="matter-text-container"]');
      if (matterDivPreview) {
        (matterDivPreview as HTMLElement).style.backgroundColor = 'black';
        (matterDivPreview as HTMLElement).style.color = 'white';
        // Ensure writing mode is preserved for "MATTER" text
        (matterDivPreview as HTMLElement).style.writingMode = 'vertical-lr';
        (matterDivPreview as HTMLElement).style.textOrientation = 'mixed';
         (matterDivPreview as HTMLElement).style.alignItems = 'center';
        (matterDivPreview as HTMLElement).style.justifyContent = 'center';
        (matterDivPreview as HTMLElement).style.display = 'flex';

      }
      const releaseOrderDivPreview = clonedApp.querySelector('[data-ai-id="release-order-title"]');
      if (releaseOrderDivPreview) {
        (releaseOrderDivPreview as HTMLElement).style.backgroundColor = 'black';
        (releaseOrderDivPreview as HTMLElement).style.color = 'white';
      }
      
      const textareasPreview = clonedApp.querySelectorAll('textarea');
        textareasPreview.forEach(ta => {
            const p = document.createElement('div'); // Use div for better control over height
            p.textContent = ta.value;
            p.style.whiteSpace = 'pre-wrap'; 
            p.style.fontWeight = 'bold';
            p.style.fontSize = '14px';
            p.style.margin = '0';
            p.style.padding = '0px'; // Match textarea padding
            p.style.width = '100%';
            p.style.minHeight = ta.style.minHeight || '160px'; // Keep min height for layout
            p.style.boxSizing = 'border-box';
            p.style.overflowWrap = 'break-word';
            if(ta.parentElement && ta.parentElement.style.verticalAlign === 'top'){
                 p.style.verticalAlign = 'top'; // This might not have a direct effect on div, layout is more CSS position based
            }
             if (ta.getAttribute('placeholder') === 'Enter matter here...') {
                p.style.height = ta.style.height; // Preserve height for matter textarea
            }
            ta.parentNode?.replaceChild(p, ta);
        });

        const inputsPreview = clonedApp.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputsPreview.forEach(inp => {
            const inputElement = inp as HTMLInputElement;
            const p = document.createElement('p');
            if (inputElement.type === 'date') {
                 p.textContent = inputElement.value ? format(new Date(inputElement.value), "dd.MM.yyyy") : '';
            } else {
                p.textContent = inputElement.value;
            }
            p.style.fontWeight = 'bold';
            p.style.fontSize = '14px';
            p.style.margin = '0';
            p.style.padding = inputElement.style.padding || '4px';
            p.style.width = '100%';
            p.style.boxSizing = 'border-box';
            inp.parentNode?.replaceChild(p, inp);
        });
        
      const imageContainerPreview = clonedApp.querySelector('[data-ai-hint="stamp placeholder"]');
      if (imageContainerPreview && stampImage) {
          const img = document.createElement('img');
          img.src = stampImage;
          img.alt = "Stamp Preview";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";
          imageContainerPreview.innerHTML = ''; // Clear existing content (e.g., "Upload Image" text)
          imageContainerPreview.appendChild(img);
          (imageContainerPreview as HTMLElement).style.border = '2px dashed #ccc'; 
          (imageContainerPreview as HTMLElement).style.backgroundColor = 'transparent';
      }


      printPreviewContentRef.current.innerHTML = ''; 
      printPreviewContentRef.current.appendChild(clonedApp);
      printPreviewContainerRef.current.style.display = 'flex';
    }
  }, [stampImage]);

  const closePrintPreview = useCallback(() => {
    if (printPreviewContainerRef.current) {
      printPreviewContainerRef.current.style.display = 'none';
    }
  }, []);

  const printFullScreen = useCallback(() => {
    window.print();
  }, []);
  
  const [currentDateString, setCurrentDateString] = React.useState('');

  useEffect(() => {
    const today = new Date();
    setOrderDate(today); // Set the Date object for the picker
    setCurrentDateString(format(today, "yyyy-MM-dd")); // Set the string for input value if needed
  }, []);


  useEffect(() => {
    addRow(); 

    const matterTextArea = document.querySelector('#application textarea[placeholder="Enter matter here..."]') as HTMLTextAreaElement | null;
    if (matterTextArea) {
      matterTextArea.style.borderTop = '1px solid black'; 
      matterTextArea.style.borderBottom = '1px solid black'; 
      const handleFocus = () => { 
          if(matterTextArea) {
            matterTextArea.style.borderTop = '1px solid black';
            matterTextArea.style.borderBottom = '1px solid black';
          }
      };
      const handleBlur = () => { 
          if(matterTextArea) {
            matterTextArea.style.borderTop = '1px solid black';
            matterTextArea.style.borderBottom = '1px solid black';
          }
      };
      matterTextArea.addEventListener('focus', handleFocus);
      matterTextArea.addEventListener('blur', handleBlur);
      
      // Initial adjustment
      adjustTextareaHeight(matterTextArea);


      return () => {
        matterTextArea.removeEventListener('focus', handleFocus);
        matterTextArea.removeEventListener('blur', handleBlur);
      };
    }
  }, [addRow, adjustTextareaHeight]);

  useEffect(() => {
    const downloadPdfButtonElement = document.getElementById('downloadPdfButton');
    const printPreviewButtonElement = document.getElementById('printPreviewButton');
    const fullScreenButtonElement = document.getElementById('fullScreenButton');


    if (downloadPdfButtonElement) downloadPdfButtonElement.addEventListener('click', generatePdf);
    if (printPreviewButtonElement) printPreviewButtonElement.addEventListener('click', showPrintPreview);
    if (fullScreenButtonElement) fullScreenButtonElement.addEventListener('click', printFullScreen);
    
    const allTextareas = document.querySelectorAll('#application textarea');
    allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));


    return () => {
      if (downloadPdfButtonElement) downloadPdfButtonElement.removeEventListener('click', generatePdf);
      if (printPreviewButtonElement) printPreviewButtonElement.removeEventListener('click', showPrintPreview);
      if (fullScreenButtonElement) fullScreenButtonElement.removeEventListener('click', printFullScreen);
    };
  }, [generatePdf, showPrintPreview, printFullScreen, adjustTextareaHeight]);

  useEffect(() => {
    // Load stamp image from local storage
    const savedImage = localStorage.getItem('stampImage');
    if (savedImage) {
      setStampImage(savedImage);
    }
  }, []);

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageUrl = event.target.result as string;
          setStampImage(imageUrl);
          localStorage.setItem('stampImage', imageUrl); // Save to local storage
        }
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <>
      <div id="application" ref={applicationRef} className="font-arial bg-background text-foreground">
        <div className="button-container no-print print-icon-container">
          <Button id="printPreviewButton" aria-label="Print Preview" variant="destructive" size="sm">Print Preview</Button>
          <Button id="downloadPdfButton" aria-label="Download as PDF" variant="destructive" size="sm">Download as PDF</Button>
          <Button id="fullScreenButton" aria-label="Full Screen Print" variant="destructive" size="sm">Print</Button>
        </div>
        
        <div data-ai-id="release-order-title" className="text-center mt-[10px] bg-black text-white border-2 border-black py-1 px-2.5 font-bold w-fit mx-auto rounded relative top-0">
            <h2 className="m-0 text-xl">RELEASE ORDER</h2>
        </div>

        <div className="mt-5 flex gap-3">
            <div className="w-[30%] p-2 border-2 border-black box-border flex flex-col justify-start text-sm relative rounded text-black">
                <h3 className="m-0 text-left text-base font-semibold text-black">Lehar</h3>
                <h4 className="mt-0 text-left text-[15px] font-semibold text-black">ADVERTISING PVT.LTD.</h4>
                <p className="text-left m-[2px_0] text-sm text-black">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
                <p className="text-left m-[2px_0] text-sm text-black">Alaknanda Commercial complex, <br /> New Delhi-110019</p>
                <p className="text-left m-[2px_0] text-sm text-black">Tel.: 49573333, 34, 35, 36</p>
                <p className="text-left m-[2px_0] text-sm text-black">Fax: 26028101</p>
                <p className="text-left m-[2px_0] text-sm flex items-baseline gap-1 text-black"><strong>GSTIN:</strong> 07AABCL5406F1ZU</p>
            </div>
            <div className="flex-1 flex flex-col gap-3 items-stretch box-border">
                <div className="flex gap-3 items-center border-2 border-black rounded p-1.5">
                    <div className="flex-1 flex items-center justify-between box-border mr-2.5">
                        <label htmlFor="roNumber" className="text-base font-bold text-black mr-2 whitespace-nowrap">R.O. No. LN:</label>
                        <Input type="number" id="roNumber" name="roNumber" placeholder="Enter Number" className="w-full p-1 text-sm" aria-label="R.O. Number" />
                    </div>
                     <div className="flex-1 flex items-center justify-between box-border">
                        <label htmlFor="orderDate" className="text-base font-bold text-black mr-2 whitespace-nowrap">Date:</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal p-1 h-auto text-sm",
                                !orderDate && "text-muted-foreground"
                              )}
                              id="orderDateTrigger"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {orderDate ? format(orderDate, "dd.MM.yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={orderDate}
                              onSelect={setOrderDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="mt-3 border-2 border-black rounded p-[6px_10px] flex items-center box-border">
                    <label htmlFor="client" className="text-base font-bold text-black mr-2 whitespace-nowrap">Client:</label>
                    <Input type="text" id="client" name="client" placeholder="Client Name" className="w-full p-1 text-sm" aria-label="Client Name" />
                </div>
                 <div className="mt-3 border-2 border-black rounded p-2.5 box-border flex flex-col gap-1.5">
                    <label className="text-base font-bold text-black">The Advertisement Manager</label>
                    <Input type="text" placeholder="Input 1" className="w-full p-1 text-sm" aria-label="Input 1"/>
                    <Input type="text" placeholder="Input 2" className="w-full p-1 text-sm" aria-label="Input 2"/>
                </div>
                <div className="mt-2.5 border-t border-black pt-1.5">
                    <p className="text-[15px] font-bold text-black m-0">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
        </div>

        <div className="w-full mt-5 flex gap-3">
            <div className="flex-1 border-2 border-black rounded p-2 box-border">
                <label htmlFor="caption" className="text-base font-bold block mb-1 text-black">Heading/Caption:</label>
                <Input type="text" id="caption" name="caption" placeholder="Enter caption here" className="w-full p-1 text-sm" aria-label="Heading Caption"/>
            </div>
            <div className="w-[30%] border-2 border-black rounded p-2 box-border">
                <label htmlFor="packageInput" className="text-base font-bold block mb-1 text-black">Package:</label> {/* Changed id to packageInput to avoid conflict with main package keyword */}
                <Input type="text" id="packageInput" name="package" placeholder="Enter package name" className="w-full p-1 text-sm" aria-label="Package Name"/>
            </div>
        </div>

        <div className="w-full mt-5">
            <Table className="w-full border-collapse border-2 border-black text-sm text-left rounded text-black print-table">
                <TableHeader className="bg-gray-100 print-table-header">
                    <TableRow className="print-table-row">
                        <TableHead className="border border-black p-1.5 w-[16.66%] text-sm font-bold text-black">Key No.</TableHead>
                        <TableHead className="border border-black p-1.5 w-[16.66%] text-sm font-bold text-black">Publication(s)</TableHead>
                        <TableHead className="border border-black p-1.5 w-[16.66%] text-sm font-bold text-black">Edition(s)</TableHead>
                        <TableHead className="border border-black p-1.5 w-[16.66%] text-sm font-bold text-black">Size</TableHead>
                        <TableHead className="border border-black p-1.5 w-[16.66%] text-sm font-bold text-black">Scheduled Date(s)</TableHead>
                        <TableHead className="border border-black p-1.5 w-[16.66%] text-sm font-bold text-black">Position</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody id="tableBody">
                </TableBody>
            </Table>
             <div className="new-row-buttons no-print">
                <Button onClick={addRow} size="sm" variant="default">Add Row</Button>
                <Button onClick={deleteRow} size="sm" variant="destructive">Delete Row</Button>
            </div>
        </div>
        
        <div className="w-full mt-5 p-0 box-border h-auto min-h-[100px] flex items-stretch text-black rounded border-2 border-black">
            <div data-ai-id="matter-text-container" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', alignItems:'center', justifyContent:'center', display:'flex' }} className="p-[2px] text-base font-bold text-center border-r border-black bg-black text-white w-[38px]">
                MATTER
            </div>
            <div className="w-full flex-1 p-0 items-start">
                <Textarea placeholder="Enter matter here..." className="w-full h-[100px] border-none p-2 mt-0 ml-0 break-words text-left resize-none box-border font-bold text-base text-black bg-white border-t border-b border-black" aria-label="Enter Matter" onInput={handleTextareaInput} />
            </div>
        </div>
        
        <div className="w-full mt-2 border-2 border-black rounded p-2 box-border h-auto min-h-[120px] relative flex flex-col">
            <div className="flex justify-between pb-2">
                <div className="w-[60%] h-full m-0 flex items-start justify-start relative flex-col box-border pr-0">
                    <div className="flex flex-col items-start justify-start h-full pl-2 box-border">
                        <span className="text-sm font-bold inline-block text-left text-black mb-2 underline underline-offset-[3px] decoration-black"><strong>Forward all bills with relevant VTS copy to :-</strong></span>
                        <div  className="ml-0 -mt-2.5 text-left p-0 h-full">
                            <span className="text-xs font-bold inline-block leading-normal text-black h-full">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101
                            </span>
                        </div>
                    </div>
                </div>
                <div className="w-[38%] h-full m-0 flex items-end justify-end p-2.5 box-border relative self-end">
                    <div 
                        className="border-2 border-dashed border-gray-300 flex justify-center items-center absolute top-2.5 right-0 bg-gray-50 cursor-pointer rounded overflow-hidden"
                        style={{ width: '200px', height: '120px' }} // Adjusted size for better aspect ratio
                        onClick={() => { const uploader = document.getElementById('stampUploader') as HTMLInputElement; if(uploader) uploader.click();}}
                        data-ai-hint="stamp placeholder"
                    >
                        {stampImage ? (
                             <Image src={stampImage} alt="Stamp Preview" layout="responsive" width={200} height={120} objectFit="contain" />
                        ) : (
                            <p className="text-xs text-center text-gray-400 m-0 p-2">Upload Image</p>
                        )}
                        <Input type="file" id="stampUploader" accept="image/*" className="hidden" onChange={handleStampUpload} />
                    </div>
                </div>
            </div>
            <div className="mt-0 ml-2 w-[calc(98%-8px)] pt-1.5 flex flex-col border-t border-black"> {/* Added border-t here */}
                <span className="underline underline-offset-[3px] text-sm font-bold text-black mr-2.5 decoration-black">Note:</span>
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-black"> 1. Space reserved vide our letter No. </span>
                    <span className="text-sm text-black"> 2. No two advertisements of the same client should appear in the same issue.  </span>
                    <span className="text-sm text-black"> 3. Please quote R.O. No. in all your bills and letters. </span>
                    <span className="text-sm text-black inline-block w-full"> 4. Please send two voucher copies of the good reproduction to us within 3 days of the publishing.
                    </span>
                 </div>
            </div>
        </div>
      </div>

      <div id="printPreviewContainer" className="print-preview no-print-in-preview" style={{ display: 'none' }} ref={printPreviewContainerRef}>
        <div className="print-preview-content" id="printPreviewContent" ref={printPreviewContentRef}>
            {/* Content will be cloned here by JavaScript */}
        </div>
        <button onClick={closePrintPreview} style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', zIndex: '1001' }} aria-label="Close Preview">Close</button>
      </div>
    </>
  );
}
