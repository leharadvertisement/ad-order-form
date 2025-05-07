"use client";

import type { ChangeEvent, FormEvent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, Printer, X, Eye, CheckCircle, FileText, Trash2, PlusCircle, Save, ImagePlus, AlertCircle, Maximize } from 'lucide-react';
import Image from 'next/image';
// html2pdf.js and FontAwesome are loaded via CDN in layout.tsx


// Helper function to prepare element for PDF/Print
const prepareElementForStaticOutput = (originalElement: HTMLElement, currentStampSrc: string | null): HTMLElement => {
    const clonedElement = originalElement.cloneNode(true) as HTMLElement;

    // Remove non-printable elements from clone
    clonedElement.querySelectorAll('.no-print, .print-icon-container, .new-row-buttons, #printPreviewButton, #downloadPdfButton, #fullScreenButton, .print-preview-close-button').forEach(el => el.remove());

    // Convert inputs/textareas to static text
    const textareas = clonedElement.querySelectorAll('textarea');
    textareas.forEach(ta => {
        const p = document.createElement('div');
        p.innerHTML = ta.value.replace(/\n/g, '<br>'); // Preserve line breaks by converting to <br>
        p.style.whiteSpace = 'pre-wrap'; // Still useful for browsers if they render this snippet
        p.style.fontWeight = window.getComputedStyle(ta).fontWeight || 'bold';
        p.style.fontSize = window.getComputedStyle(ta).fontSize || '14px';
        p.style.fontFamily = window.getComputedStyle(ta).fontFamily || 'Arial, sans-serif';
        p.style.color = window.getComputedStyle(ta).color || '#000';
        p.style.width = '100%';
        p.style.padding = window.getComputedStyle(ta).padding || '0px';
        p.style.margin = '0';
        p.style.boxSizing = 'border-box';
        p.style.verticalAlign = 'top';
        p.style.minHeight = ta.style.minHeight || 'auto';


        if (ta.classList.contains('matter-content-textarea')) {
            p.style.borderTop = "1px solid black";
            p.style.borderBottom = "1px solid black";
            p.style.padding = "8px";
            // The .matter-label-box handles vertical text, this p is for the content.
        }
         if (ta.classList.contains('table-textarea')) {
            // Ensure table cell content flows naturally
            p.style.minHeight = '60px'; // Ensure minimum height for table cells in PDF
        }
        ta.parentNode?.replaceChild(p, ta);
    });

    const inputs = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
    inputs.forEach(inp => {
        const inputElement = inp as HTMLInputElement;
        const p = document.createElement('div');
        p.textContent = inputElement.value || ''; // Ensure empty string if no value
        p.style.fontWeight = window.getComputedStyle(inputElement).fontWeight || 'bold';
        p.style.fontSize = window.getComputedStyle(inputElement).fontSize || '14px';
        p.style.fontFamily = window.getComputedStyle(inputElement).fontFamily || 'Arial, sans-serif';
        p.style.color = window.getComputedStyle(inputElement).color || '#000';
        p.style.margin = '0';
        p.style.padding = window.getComputedStyle(inputElement).padding || '6px';
        p.style.width = '100%';
        p.style.minHeight = window.getComputedStyle(inputElement).height; // Match input height
        p.style.boxSizing = 'border-box';
        p.style.display = 'flex';
        p.style.alignItems = 'center';
        inp.parentNode?.replaceChild(p, inp);
    });

    // Handle stamp image
    const stampContainerInClone = clonedElement.querySelector('.stamp-upload-container');
    if (stampContainerInClone) {
        if (currentStampSrc) {
            const img = document.createElement('img');
            img.src = currentStampSrc;
            img.alt = "Stamp";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "contain";
            stampContainerInClone.innerHTML = '';
            stampContainerInClone.appendChild(img);
            (stampContainerInClone as HTMLElement).style.border = "none"; // Remove border for actual image
        } else {
            const p = document.createElement('p');
            p.textContent = "Stamp Area";
            p.style.fontSize = "12px";
            p.style.textAlign = "center";
            p.style.fontFamily = "Arial, sans-serif";
            p.style.color = "#6c757d";
            p.style.margin = "0px";
            stampContainerInClone.innerHTML = '';
            stampContainerInClone.appendChild(p);
             // Keep border for placeholder, handled by .stamp-placeholder-print
            (stampContainerInClone as HTMLElement).classList.add('stamp-placeholder-print');
        }
    }
    
    // Ensure specific elements maintain their visual integrity
    const releaseOrderTitle = clonedElement.querySelector('.release-order-titlebar') as HTMLElement;
    if(releaseOrderTitle) {
        releaseOrderTitle.style.backgroundColor = 'black';
        releaseOrderTitle.style.color = 'white';
    }

    const matterLabel = clonedElement.querySelector('.matter-label-box') as HTMLElement;
    if(matterLabel) {
        matterLabel.style.backgroundColor = 'black';
        matterLabel.style.color = 'white';
        matterLabel.style.writingMode = 'vertical-lr';
        matterLabel.style.textOrientation = 'mixed';
    }


    return clonedElement;
};


export default function AdOrderForm() {
  const applicationRef = useRef<HTMLDivElement>(null);
  const [stampSrc, setStampSrc] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [rows, setRows] = useState<Array<Record<string, string>>>([{}]); // For table data
  const [isPreviewing, setIsPreviewing] = useState(false);
  const printPreviewContentRef = useRef<HTMLDivElement>(null);


  const handleStampFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setStampSrc(result);
        localStorage.setItem('stampImage', result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const savedStamp = localStorage.getItem('stampImage');
    if (savedStamp) {
      setStampSrc(savedStamp);
    }
    // Add initial row if rows is empty
    if (rows.length === 0) {
        setRows([{}]);
    }
  }, [rows.length]); // Depend on rows.length to re-run if rows become empty


  const addRow = useCallback(() => {
    setRows(prevRows => [...prevRows, {}]);
  }, []);

  const deleteRow = useCallback(() => {
    setRows(prevRows => (prevRows.length > 1 ? prevRows.slice(0, -1) : prevRows));
  }, []);

  const handleTableCellChange = (rowIndex: number, colName: string, value: string) => {
    setRows(prevRows =>
      prevRows.map((row, idx) =>
        idx === rowIndex ? { ...row, [colName]: value } : row
      )
    );
  };

  const autoAdjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    document.querySelectorAll('.table-textarea').forEach(textarea => {
      autoAdjustTextareaHeight(textarea as HTMLTextAreaElement);
    });
  }, [rows]);


  const generatePdf = useCallback(() => {
    if (!applicationRef.current || !(window as any).html2pdf) {
      console.error("PDF generation prerequisites not met.");
      return;
    }

    const preparedElement = prepareElementForStaticOutput(applicationRef.current, stampSrc);

    preparedElement.style.position = 'absolute';
    preparedElement.style.left = '-99999px'; 
    preparedElement.style.width = '210mm'; 
    document.body.appendChild(preparedElement);
    
    const opt = {
      margin: 10, 
      filename: 'release_order_form.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2, 
        useCORS: true,
        logging: false, 
        width: preparedElement.offsetWidth, 
        height: preparedElement.offsetHeight, 
        windowWidth: preparedElement.offsetWidth,
        windowHeight: preparedElement.offsetHeight,
         onclone: (document: Document) => { // Ensure print styles are applied in html2canvas
            // We are already applying styles in prepareElementForStaticOutput and relying on @media print.
            // This onclone can be used for last-minute DOM manipulations if needed.
        }
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4', 
        orientation: 'portrait'
      },
    };

    (window as any).html2pdf().from(preparedElement).set(opt).save()
      .catch((error: any) => {
        console.error("Error generating PDF:", error);
      })
      .finally(() => {
        if (document.body.contains(preparedElement)) {
          document.body.removeChild(preparedElement);
        }
      });
  }, [stampSrc]);


  const showPrintPreview = useCallback(() => {
    if (applicationRef.current && printPreviewContentRef.current) {
        const preparedElement = prepareElementForStaticOutput(applicationRef.current, stampSrc);
        
        // Clear previous content and append the new prepared element
        printPreviewContentRef.current.innerHTML = '';
        printPreviewContentRef.current.appendChild(preparedElement);
        
        setIsPreviewing(true); // Show the modal
    }
  }, [stampSrc]);

  const closePrintPreview = useCallback(() => {
    setIsPreviewing(false);
  }, []);

  const handlePrint = () => {
    window.print();
  };
  
  const requestFullScreen = () => {
    const element = document.documentElement; // Or applicationRef.current for specific element
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).mozRequestFullScreen) { /* Firefox */
      (element as any).mozRequestFullScreen();
    } else if ((element as any).webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) { /* IE/Edge */
      (element as any).msRequestFullscreen();
    }
  };


  return (
    <>
      <div className="p-2 bg-slate-100 flex justify-end items-center space-x-2 print:hidden no-print sticky top-0 z-50">
         <Button variant="outline" onClick={showPrintPreview} className="text-sm py-1 px-3 h-auto">
          <Eye className="mr-2 h-4 w-4" /> Print Preview
        </Button>
        <Button variant="outline" onClick={generatePdf} className="text-sm py-1 px-3 h-auto">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
         <Button variant="outline" onClick={requestFullScreen} className="text-sm py-1 px-3 h-auto">
          <Maximize className="mr-2 h-4 w-4" /> Full Screen
        </Button>
        <Button variant="default" onClick={handlePrint} className="text-sm py-1 px-3 h-auto bg-red-600 hover:bg-red-700">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      <div id="application" ref={applicationRef} className="w-full print-friendly-content bg-card text-card-foreground shadow-lg">
        {/* Release Order Title */}
        <div className="release-order-titlebar">
            <h2>RELEASE ORDER</h2>
        </div>

        {/* Top Section: Lehar Info | Details (RO, Date, Client, Ad Manager) */}
        <div className="mt-5 flex flex-col md:flex-row gap-3">
            {/* Lehar Info Box (Left) */}
            <div className="lehar-info-box md:w-[30%]">
                <h3 className="font-bold text-lg">Lehar</h3>
                <h4 className="font-semibold text-md">ADVERTISING PVT.LTD.</h4>
                <p>D-9 & D-10, 1st Floor, Pushpa Bhawan,</p>
                <p>Alaknanda Commercial complex, <br/> New Delhi-110019</p>
                <p>Tel.: 49573333, 34, 35, 36</p>
                <p>Fax: 26028101</p>
                <p className="flex items-baseline gap-1"><strong className="font-bold">GSTIN:</strong>07AABCL5406F1ZU</p>
            </div>

            {/* Details Box (Right) */}
            <div className="details-box flex-1">
                 {/* RO Number and Date */}
                <div className="detail-section flex-col sm:flex-row">
                    <div className="flex-1 flex items-center">
                        <Label htmlFor="roNumber" className="text-base font-bold mr-2 shrink-0">R.O. No. LN:</Label>
                        <Input type="number" id="roNumber" name="roNumber" placeholder="Enter Number" className="w-full text-sm p-1.5" aria-label="R.O. Number"/>
                    </div>
                    <div className="flex-1 flex items-center mt-2 sm:mt-0">
                        <Label htmlFor="orderDate" className="text-base font-bold mr-2 shrink-0">Date:</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal text-sm p-1.5 h-auto",
                                        !date && "text-muted-foreground"
                                    )}
                                    id="orderDate"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "dd.MM.yyyy") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                 {/* Client */}
                <div className="detail-section mt-0">
                    <Label htmlFor="client" className="text-base font-bold mr-2 shrink-0">Client:</Label>
                    <Input type="text" id="client" name="client" placeholder="Client Name" className="w-full text-sm p-1.5" aria-label="Client Name"/>
                </div>
                {/* Advertisement Manager */}
                <div className="advertisement-manager-box detail-section column-layout mt-0">
                    <Label className="text-base font-bold mb-1.5">The Advertisement Manager</Label>
                    <Input type="text" placeholder="Publication/Media House Name" className="w-full text-sm p-1.5 mb-1.5" aria-label="Advertisement Manager Input 1"/>
                    <Input type="text" placeholder="Address or Contact Person" className="w-full text-sm p-1.5" aria-label="Advertisement Manager Input 2"/>
                </div>
                <div className="mt-1.5 border-t border-black pt-1.5">
                    <p className="text-sm font-bold text-black m-0">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
        </div>

        {/* Heading/Caption & Package Section */}
        <div className="caption-package-container mt-5">
            <div className="flex-1">
                <Label htmlFor="caption" className="text-base font-bold block mb-1">Heading/Caption:</Label>
                <Input type="text" id="caption" name="caption" placeholder="Enter caption here" className="w-full text-sm p-1.5" aria-label="Heading Caption"/>
            </div>
            <div className="md:w-[30%]">
                <Label htmlFor="packageInput" className="text-base font-bold block mb-1">Package:</Label>
                <Input type="text" id="packageInput" name="package" placeholder="Enter package name" className="w-full text-sm p-1.5" aria-label="Package Name"/>
            </div>
        </div>
        
        {/* Schedule Table Section */}
        <div className="my-5 table-container-print">
             <Table className="print-table print-border border border-black">
              <TableHeader className="bg-secondary print-table-header">
                <TableRow>
                  <TableHead className="w-[10%] print-border-thin border border-black p-1.5 text-sm font-bold">Key No.</TableHead>
                  <TableHead className="w-[25%] print-border-thin border border-black p-1.5 text-sm font-bold">Publication(s)</TableHead>
                  <TableHead className="w-[20%] print-border-thin border border-black p-1.5 text-sm font-bold">Edition(s)</TableHead>
                  <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold">Size</TableHead>
                  <TableHead className="w-[20%] print-border-thin border border-black p-1.5 text-sm font-bold">Scheduled Date(s)</TableHead>
                  <TableHead className="w-[10%] print-border-thin border border-black p-1.5 text-sm font-bold">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {['keyNo', 'publication', 'edition', 'size', 'scheduledDates', 'position'].map(colName => (
                      <TableCell key={colName} className="print-border-thin border border-black p-0 align-top">
                        <Textarea
                          value={row[colName] || ''}
                          onChange={e => handleTableCellChange(rowIndex, colName, e.target.value)}
                          onInput={e => autoAdjustTextareaHeight(e.target as HTMLTextAreaElement)}
                          placeholder="..."
                          className="table-textarea w-full text-sm p-1.5 border-0 resize-none overflow-hidden min-h-[60px] focus:ring-0"
                          aria-label={`Table cell ${colName} row ${rowIndex + 1}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
        <div className="new-row-buttons mt-2 mb-5 no-print">
            <Button onClick={addRow} variant="outline" size="sm" className="text-xs py-1 px-2 h-auto">
                <PlusCircle className="mr-1 h-3 w-3" /> Add Row
            </Button>
            <Button onClick={deleteRow} variant="destructive" size="sm" className="text-xs py-1 px-2 h-auto">
                 <Trash2 className="mr-1 h-3 w-3" /> Delete Row
            </Button>
        </div>

        {/* Matter Section */}
        <div className="matter-container mt-5">
            <div className="matter-label-box">
                MATTER
            </div>
            <div className="flex-1">
                <Textarea
                  placeholder="Enter matter here..."
                  className="matter-content-textarea w-full text-sm p-2 border-0 border-t border-b border-black focus:ring-0 min-h-[150px] resize-y"
                  aria-label="Enter Matter"
                />
            </div>
        </div>
        
        {/* Notes & Stamp Section */}
        <div className="notes-stamp-container mt-2">
            <div className="notes-forwarding-section">
                <div className="forwarding-info">
                    <strong className="text-sm font-bold underline underline-offset-2 mb-1">Forward all bills with relevant VTS copy to :-</strong>
                    <span className="text-xs font-bold leading-snug">D-9 & D-10, 1st Floor, Pushpa Bhawan, <br/> Alaknanda Commercial complex, <br/>New Delhi-110019 <br/>Tel.: 49573333, 34, 35, 36 <br/>Fax: 26028101</span>
                </div>
                <div className="stamp-area">
                    <Label htmlFor="stampFile" className="stamp-upload-container cursor-pointer">
                        {stampSrc ? (
                             <Image src={stampSrc} alt="Stamp Preview" width={160} height={90} className="object-contain w-full h-full" data-ai-hint="signature stamp" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <ImagePlus className="h-8 w-8 mb-1" />
                                <p className="text-xs text-center">Upload Stamp</p>
                            </div>
                        )}
                    </Label>
                    <Input type="file" id="stampFile" accept="image/*" onChange={handleStampFileChange} className="hidden" />
                </div>
            </div>
            <div className="notes-section">
                <span className="text-sm font-bold underline underline-offset-2 block mb-1">Note:</span>
                <div className="pl-5 text-sm space-y-0.5">
                    <span>1. Space reserved vide our letter No.</span>
                    <span>2. No two advertisements of the same client should appear in the same issue.</span>
                    <span>3. Please quote R.O. No. in all your bills and letters.</span>
                    <span>4. Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</span>
                 </div>
            </div>
        </div>

      </div> {/* End of #application div */}
      
      {isPreviewing && (
        <div id="printPreviewContainer" className="print-preview no-print">
          <div className="print-preview-content" id="printPreviewContent" ref={printPreviewContentRef}>
            {/* Content is cloned here by showPrintPreview */}
          </div>
          <Button onClick={closePrintPreview} className="print-preview-close-button" aria-label="Close Preview">
            <X className="mr-2 h-4 w-4"/> Close
          </Button>
        </div>
      )}
    </>
  );
}
