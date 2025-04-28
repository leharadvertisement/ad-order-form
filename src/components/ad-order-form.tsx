
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, Download } from 'lucide-react'; // Re-added Download icon
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface ScheduleRow {
  id: number;
  keyNo: string;
  publication: string;
  edition: string;
  size: string;
  scheduledDate: string;
  position: string;
}

interface FormData {
  caption: string;
  packageName: string;
  matter: string;
  scheduleRows: ScheduleRow[];
  stampPreview: string | null;
  roNumber: string;
  orderDate: string | null;
  clientName: string;
  advertisementManagerLine1: string;
  advertisementManagerLine2: string;
}

const LOCAL_STORAGE_KEY = 'adOrderFormData';
const DEBOUNCE_DELAY = 500; // milliseconds

export default function AdOrderForm() {
  const [caption, setCaption] = useState('');
  const [packageName, setPackageName] = useState('');
  const [matter, setMatter] = useState('');
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([
    { id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
  ]);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [roNumber, setRoNumber] = useState('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [clientName, setClientName] = useState('');
  const [advertisementManagerLine1, setAdvertisementManagerLine1] = useState('');
  const [advertisementManagerLine2, setAdvertisementManagerLine2] = useState('');

  const stampFileRef = useRef<HTMLInputElement>(null);
  const printableAreaRef = useRef<HTMLDivElement>(null); // Ref for the area to be captured
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const [isClient, setIsClient] = useState(false);

  const [displayDate, setDisplayDate] = useState<string>(''); // Initialize as empty string


  useEffect(() => {
    setIsClient(true); // Set client flag
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData: FormData = JSON.parse(savedData);
        setCaption(parsedData.caption || '');
        setPackageName(parsedData.packageName || '');
        setMatter(parsedData.matter || '');
        const loadedRows = Array.isArray(parsedData.scheduleRows) && parsedData.scheduleRows.length > 0
          ? parsedData.scheduleRows
          : [{ id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }];
        setScheduleRows(loadedRows);
        setStampPreview(parsedData.stampPreview || null);
        setRoNumber(parsedData.roNumber || '');
        const savedDate = parsedData.orderDate ? new Date(parsedData.orderDate) : undefined;
        // Check if savedDate is valid before setting
        if (savedDate && !isNaN(savedDate.getTime())) {
            setOrderDate(savedDate);
        } else {
           setOrderDate(new Date()); // Default to today if no valid date saved
        }
        setClientName(parsedData.clientName || '');
        setAdvertisementManagerLine1(parsedData.advertisementManagerLine1 || '');
        setAdvertisementManagerLine2(parsedData.advertisementManagerLine2 || '');
      } else {
        // No saved data, default date to today
        setOrderDate(new Date());
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
       setOrderDate(new Date()); // Default to today on error
      toast({
        title: "Recovery Failed",
        description: "Could not recover previous draft data.",
        variant: "destructive",
      });
    } finally {
      isInitialLoadRef.current = false;
    }
  }, [toast]);

  // Format date whenever orderDate or isClient changes
  useEffect(() => {
    if (!isClient) return; // Only run on client
    let dateToFormat: Date | undefined = orderDate;
    if (!dateToFormat || isNaN(dateToFormat.getTime())) {
        // If orderDate is somehow invalid or undefined after load, default to today
        dateToFormat = new Date();
        if (isInitialLoadRef.current) { // Only setOrderDate if it's initial load phase
           setOrderDate(dateToFormat);
        }
    }
     try {
       setDisplayDate(format(dateToFormat, "dd.MM.yyyy"));
     } catch (error) {
       console.error("Error formatting date:", error);
       const today = new Date(); // Fallback to today if formatting fails
       try {
          setDisplayDate(format(today, "dd.MM.yyyy"));
       } catch (formatError) {
          console.error("Error formatting fallback date:", formatError);
          setDisplayDate("Invalid Date"); // Ultimate fallback
       }
     }
  }, [orderDate, isClient]);


  useEffect(() => {
    if (isInitialLoadRef.current || !isClient) {
      return;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        const dataToSave: FormData = {
          caption,
          packageName,
          matter,
          scheduleRows,
          stampPreview,
          roNumber,
          orderDate: orderDate && !isNaN(orderDate.getTime()) ? orderDate.toISOString() : null,
          clientName,
          advertisementManagerLine1,
          advertisementManagerLine2,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Failed to save data to localStorage:", error);
      }
    }, DEBOUNCE_DELAY);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [caption, packageName, matter, scheduleRows, stampPreview, roNumber, orderDate, clientName, advertisementManagerLine1, advertisementManagerLine2, isClient]);

  const addRow = useCallback(() => {
    setScheduleRows((prevRows) => [
      ...prevRows,
      { id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
    ]);
  }, []);

  const deleteRow = useCallback(() => {
    if (scheduleRows.length > 1) {
      setScheduleRows((prevRows) => prevRows.slice(0, -1));
    } else {
      toast({
        title: "Cannot delete last row",
        description: "At least one schedule row is required.",
        variant: "destructive",
      });
    }
  }, [scheduleRows.length, toast]);

  const handleScheduleChange = useCallback((id: number, field: keyof ScheduleRow, value: string) => {
    setScheduleRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }, []);

  const handleStampUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStampPreview(result);
        toast({
          title: "Stamp Uploaded",
          description: "Stamp image successfully uploaded.",
        });
      };
      reader.onerror = () => {
        toast({
          title: "Upload Error",
          description: "Failed to read the stamp image.",
          variant: "destructive",
        });
      }
      reader.readAsDataURL(file);
    } else {
      setStampPreview(null);
    }
    // Reset file input value to allow uploading the same file again
    if (stampFileRef.current) {
      stampFileRef.current.value = '';
    }
  }, [toast]);

  const triggerStampUpload = useCallback(() => {
    stampFileRef.current?.click();
  }, []);

  // --- PDF Download Logic ---
  const handleDownloadPdf = useCallback(async () => {
     if (!printableAreaRef.current) {
            toast({
                title: 'Error',
                description: 'Cannot find the form area to generate PDF.',
                variant: 'destructive',
            });
            return;
        }

        // Temporarily hide non-printable elements before capturing
        const nonPrintElements = printableAreaRef.current.querySelectorAll('.no-print');
        nonPrintElements.forEach(el => (el as HTMLElement).style.visibility = 'hidden'); // Use visibility hidden

        try {
            const canvas = await html2canvas(printableAreaRef.current, {
                scale: 2, // Increase scale for better quality
                useCORS: true, // Important for external images like the stamp
                logging: false, // Disable logging for cleaner console
                onclone: (document) => {
                     // Ensure styles are applied correctly in the cloned document
                    const style = document.createElement('style');
                    // Inject global CSS and print styles directly
                    style.innerHTML = `
                        @import url('https://fonts.googleapis.com/css2?family=Arial:wght@700&display=swap');
                        body { font-family: Arial, sans-serif !important; font-weight: bold !important; font-size: 14px !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;}
                        .print-border { border: 1px solid black !important; }
                        .print-border-thin { border: 1px solid black !important; }
                        .print-border-heavy { border: 2px solid black !important; }
                        .print-table-header th { border: 1px solid black !important; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-table-cell { border: 1px solid black !important; padding: 8px !important; /* Ensure padding for cell content */}
                        .vertical-label { background-color: black !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .header-title { background-color: black !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        input, textarea { border: none !important; border-bottom: 1px solid black !important; font-family: Arial, sans-serif !important; font-weight: bold !important; font-size: 14px !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: transparent !important; color: black !important; -webkit-text-fill-color: black !important; }
                        /* Ensure input values are rendered - Added technique */
                         input[type="text"]::placeholder, textarea::placeholder { color: transparent !important; } /* Hide placeholder for PDF */

                         /* Attempt to render input/textarea values using overlay spans */
                          ${Array.from(printableAreaRef.current?.querySelectorAll('input[type="text"], textarea') || []).map((el, index) => {
                            const input = el as HTMLInputElement | HTMLTextAreaElement;
                            const value = input.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>'); // Escape HTML chars & handle newlines
                            const id = input.id || `pdf-el-${index}`;
                            input.setAttribute('data-pdf-id', id); // Use a data attribute to track

                             // Style the input itself to be transparent but keep layout
                            return `#${id} { color: transparent !important; -webkit-text-fill-color: transparent !important; background: transparent !important; border: none !important; border-bottom: 1px solid black !important; position: relative; }
                            /* Add a span after the input to display the value */
                            #${id} + span.pdf-value-overlay { content: "${value}"; display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; white-space: pre-wrap; word-wrap: break-word; font-family: Arial, sans-serif !important; font-weight: bold !important; font-size: 14px !important; color: black !important; -webkit-text-fill-color: black !important; padding: ${input.tagName === 'TEXTAREA' ? '1px' : '0.125rem 0.25rem'}; pointer-events: none; border: none !important; background: transparent !important; box-sizing: border-box; line-height: 1.6; /* Adjust line-height to match input/textarea */ }
                           `;
                          }).join('\n')}


                         /* Ensure stamp image prints correctly */
                         #stampPreview { display: block !important; width: 180px !important; height: 150px !important; object-fit: contain !important; object-position: center center !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                         .stamp-container { border: none !important; } /* Hide stamp container border */
                         /* Hide non-printable elements for PDF generation */
                         .no-print { display: none !important; }
                    `;
                    document.head.appendChild(style);

                    // Add overlay spans after each input/textarea in the cloned document
                    const inputElements = document.querySelectorAll('input[type="text"][data-pdf-id], textarea[data-pdf-id]');
                    inputElements.forEach(input => {
                       const overlay = document.createElement('span');
                       overlay.className = 'pdf-value-overlay';
                       overlay.innerHTML = (input as HTMLInputElement | HTMLTextAreaElement).value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');
                       input.parentNode?.insertBefore(overlay, input.nextSibling);
                       // Ensure the parent has relative positioning if needed for absolute positioning of the overlay
                       (input.parentNode as HTMLElement).style.position = 'relative';
                     });
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4', // Standard A4 size
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const pageMargin = 5; // Add margin mm
            const availableWidth = pdfWidth - (pageMargin * 2);
            const availableHeight = pdfHeight - (pageMargin * 2);

            const imgRatio = imgProps.width / imgProps.height;
            let imgWidth = availableWidth;
            let imgHeight = imgWidth / imgRatio;

            // If calculated height exceeds available height, fit to height instead
             if (imgHeight > availableHeight) {
                imgHeight = availableHeight;
                imgWidth = imgHeight * imgRatio;
            }

            // Center the image on the page
             const xPos = pageMargin; // Start from left margin
             const yPos = pageMargin; // Start from top margin


             // Check if content exceeds one page (based on canvas size vs A4) - this is approximate
            const contentHeightInMm = (canvas.height * 25.4) / (96 * 2); // Convert canvas px (at scale 2) to mm (assuming 96 DPI)
            const numPages = Math.ceil(contentHeightInMm / availableHeight);

            if (numPages <= 1) {
                pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
            } else {
                // Split image across pages if needed (basic vertical split)
                let currentY = 0;
                const pageCanvasHeight = (availableHeight * 96 * 2) / 25.4; // Convert A4 height back to scaled canvas pixels

                for (let i = 0; i < numPages; i++) {
                    const sourceY = currentY;
                    const sourceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY);

                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sourceHeight;
                    const pageCtx = pageCanvas.getContext('2d');
                    if (!pageCtx) continue; // Skip if context is null

                    pageCtx?.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

                    const pageImgData = pageCanvas.toDataURL('image/png');
                    const pageImgProps = pdf.getImageProperties(pageImgData);
                    const pageImgRatio = pageImgProps.width / pageImgProps.height;
                    let pageImgWidth = availableWidth;
                    let pageImgHeight = pageImgWidth / pageImgRatio;

                    if (pageImgHeight > availableHeight) {
                       pageImgHeight = availableHeight;
                       pageImgWidth = pageImgHeight * pageImgRatio;
                    }
                     const pageXPos = pageMargin; // Start from left margin
                     const pageYPos = pageMargin; // Start from top margin

                    if (i > 0) pdf.addPage();
                    pdf.addImage(pageImgData, 'PNG', pageXPos, pageYPos, pageImgWidth, pageImgHeight);
                    currentY += sourceHeight;
                }
            }


            pdf.save(`Release_Order_${roNumber || 'NoRO'}_${displayDate}.pdf`);
             toast({
                title: 'PDF Downloaded',
                description: 'The release order has been saved as a PDF.',
            });

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast({
                title: 'PDF Generation Failed',
                description: `Could not generate the PDF. ${error instanceof Error ? error.message : ''}`,
                variant: 'destructive',
            });
        } finally {
             // Show non-printable elements again after capturing
            nonPrintElements.forEach(el => (el as HTMLElement).style.visibility = 'visible'); // Use visibility visible
        }
  }, [printableAreaRef, toast, roNumber, displayDate]);


  const handleClearForm = useCallback(() => {
    setCaption('');
    setPackageName('');
    setMatter('');
    setScheduleRows([{ id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
    setStampPreview(null);
    setRoNumber('');
    setOrderDate(new Date()); // Reset date to today
    setDisplayDate(format(new Date(), "dd.MM.yyyy")); // Update display date immediately
    setClientName('');
    setAdvertisementManagerLine1('');
    setAdvertisementManagerLine2('');
    if (stampFileRef.current) {
      stampFileRef.current.value = '';
    }
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      toast({
        title: "Draft Cleared",
        description: "Form data and saved draft have been cleared.",
      });
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
      toast({
        title: "Clear Error",
        description: "Could not clear stored draft data.",
        variant: "destructive",
      });
    }
  }, [toast]);


  if (!isClient) {
    // Render placeholder or null during SSR/initial client render mismatch phase
    return null; // Or a loading indicator
  }


  return (
    <div className="max-w-[210mm] mx-auto font-bold">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 no-print">
        <Button onClick={handleClearForm} variant="outline">
          <Eraser className="mr-2 h-4 w-4" /> Clear Form & Draft
        </Button>
         {/* PDF Download Button */}
         <Button onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" /> Download as PDF
         </Button>
      </div>

      {/* Printable Area */}
      <Card id="printable-area" ref={printableAreaRef} className="w-full print-border-heavy rounded-none shadow-none p-5 border-2 border-black">
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center bg-black text-white p-1 rounded mb-5 header-title">
            <h1 className="text-2xl m-0 font-bold">RELEASE ORDER</h1>
          </div>

          {/* Address Boxes */}
          <div className="flex justify-between gap-3 mb-5">
            {/* Left Address Box */}
            <div className="w-[48%] print-border rounded p-2 border border-black">
              <p className="text-sm leading-tight">
                Lehar Advertising Agency Pvt. Ltd.<br />
                D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
                Alaknanda Commercial Complex,<br />
                New Delhi-110019<br />
                Tel: 49573333, 34, 35, 36<br />
                Fax: 26028101
              </p>
            </div>
            {/* Right Address Box */}
            <div className="w-[48%] print-border rounded p-2 space-y-2 border border-black">
              {/* R.O. No. LN */}
              <div className="flex items-center relative">
                <Label htmlFor="roNumber" className="w-20 text-sm shrink-0">R.O.No.LN:</Label>
                <Input
                  id="roNumber"
                  type="text"
                  placeholder="Enter R.O. No."
                  className="flex-1 h-6 border-0 border-b-2 border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  value={roNumber}
                  onChange={(e) => setRoNumber(e.target.value)}
                />
                {/* Overlay span for PDF value */}
                 <span className="pdf-value-overlay" />
              </div>
              {/* Date */}
              <div className="flex items-center relative">
                <Label htmlFor="orderDate" className="w-20 text-sm shrink-0">Date:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-bold h-6 border-0 border-b-2 border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none",
                        !orderDate && "text-muted-foreground"
                      )}
                      id="orderDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {/* Display formatted date, ensure it updates */}
                      <span>{displayDate || "Pick a date"}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 no-print">
                    <Calendar
                      mode="single"
                      selected={orderDate}
                      onSelect={(date) => {
                           if (date instanceof Date && !isNaN(date.getTime())) {
                               setOrderDate(date);
                           } else {
                               // Handle case where date is undefined or invalid, maybe set to today?
                               const today = new Date();
                               setOrderDate(today);
                           }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Client */}
              <div className="flex items-center relative">
                <Label htmlFor="clientName" className="w-20 text-sm shrink-0">Client:</Label>
                <Input
                  id="clientName"
                  type="text"
                  placeholder="Enter Client Name"
                  className="flex-1 h-6 border-0 border-b-2 border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                 {/* Overlay span for PDF value */}
                 <span className="pdf-value-overlay" />
              </div>
            </div>
          </div>

           {/* Heading & Package Section - Moved before Advertisement Manager */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 print-border-heavy rounded p-2 border-2 border-black relative">
              <Label htmlFor="caption" className="block mb-1">Heading/Caption:</Label>
              <Input
                id="caption"
                type="text"
                placeholder="Enter caption here"
                className="w-full border-0 border-b-2 border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              {/* Overlay span for PDF value */}
              <span className="pdf-value-overlay" />
            </div>
            <div className="w-[30%] print-border-heavy rounded p-2 border-2 border-black relative">
              <Label htmlFor="package" className="block mb-1">Package:</Label>
              <Input
                id="package"
                type="text"
                placeholder="Enter package name"
                className="w-full border-0 border-b-2 border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              />
               {/* Overlay span for PDF value */}
               <span className="pdf-value-overlay" />
            </div>
          </div>


          {/* Advertisement Manager Section */}
          <div className="print-border rounded p-2 mb-5 border border-black">
            <Label className="block mb-1">The Advertisement Manager</Label>
             <div className="relative mb-1">
              <Input
                id="adManager1"
                type="text"
                placeholder="Line 1"
                className="w-full border-0 border-b-2 border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                value={advertisementManagerLine1}
                onChange={(e) => setAdvertisementManagerLine1(e.target.value)}
              />
               {/* Overlay span for PDF value */}
               <span className="pdf-value-overlay" />
             </div>
            <div className="relative">
            <Input
              id="adManager2"
              type="text"
              placeholder="Line 2"
              className="w-full border-0 border-b-2 border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
              value={advertisementManagerLine2}
              onChange={(e) => setAdvertisementManagerLine2(e.target.value)}
            />
             {/* Overlay span for PDF value */}
             <span className="pdf-value-overlay" />
             </div>
            <p className="text-sm mt-2">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
          </div>


          {/* Schedule Table */}
          <div className="mb-5">
             {/* Ensure table has correct classes for PDF rendering */}
            <Table className="print-border border border-black">
              <TableHeader className="bg-secondary print-table-header">
                <TableRow>
                  <TableHead className="w-[10%] print-border-thin border border-black p-1.5 text-sm font-bold">Key No.</TableHead>
                  <TableHead className="w-[25%] print-border-thin border border-black p-1.5 text-sm font-bold">Publication(s)</TableHead>
                  <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold">Edition(s)</TableHead>
                  <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold">Size</TableHead>
                  <TableHead className="w-[20%] print-border-thin border border-black p-1.5 text-sm font-bold">Scheduled Date(s)</TableHead>
                  <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell relative">
                      <Input id={`keyNo-${row.id}`} type="text" value={row.keyNo} onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       <span className="pdf-value-overlay" />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell relative">
                      <Input id={`publication-${row.id}`} type="text" value={row.publication} onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       <span className="pdf-value-overlay" />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell relative">
                      <Input id={`edition-${row.id}`} type="text" value={row.edition} onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       <span className="pdf-value-overlay" />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell relative">
                      <Input id={`size-${row.id}`} type="text" value={row.size} onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       <span className="pdf-value-overlay" />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell relative">
                      <Input id={`scheduledDate-${row.id}`} type="text" value={row.scheduledDate} onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       <span className="pdf-value-overlay" />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell relative">
                      <Input id={`position-${row.id}`} type="text" value={row.position} onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       <span className="pdf-value-overlay" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex gap-2 mt-2 no-print">
                <Button variant="outline" size="sm" onClick={addRow}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Row
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteRow} disabled={scheduleRows.length <= 1}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Last Row
                </Button>
            </div>
          </div>

          {/* Matter Section */}
          <div className="flex h-[150px] print-border rounded mb-5 overflow-hidden border border-black">
            <div className="vertical-label bg-black text-white flex items-center justify-center p-1" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
              <span className="text-base font-bold transform rotate-180">MATTER</span>
            </div>
            <div className="flex-1 p-1 relative">
              <Textarea
                id="matterArea"
                placeholder="Enter matter here..."
                className="w-full h-full resize-none border-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1"
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
              />
              {/* Overlay span for PDF value */}
              <span className="pdf-value-overlay" />
            </div>
          </div>

          {/* Billing Info */}
          <div className="print-border rounded p-2 mb-5 border border-black">
             <p className="font-bold mb-1 border-b-2 border-black inline-block pb-px">Forward all bills with relevant voucher copies to:</p>
            <p className="text-sm leading-tight pt-1">
              D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
              Alaknanda Commercial Complex,<br />
              New Delhi-110019<br />
              Tel: 49573333, 34, 35, 36<br />
              Fax: 26028101
            </p>
          </div>

          {/* Notes & Stamp */}
           <div className="relative print-border rounded p-2 pr-[200px] border border-black min-h-[170px] pb-1">
             <p className="font-bold mb-1 border-b-2 border-black inline-block pb-px">Note:</p>
            <ol className="list-decimal list-inside text-sm space-y-1 pt-1">
               <li>Space reserved vide our letter No.</li>
              <li>No two advertisements of the same client should appear in the same issue.</li>
              <li>Please quote R.O. No. in all your bills and letters.</li>
              <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
            </ol>
             {/* Stamp Area - No border, positioned absolutely */}
             <div
                className="stamp-container absolute top-2 right-2 w-[180px] h-[150px] rounded bg-white flex items-center justify-center cursor-pointer overflow-hidden group print-stamp-container" // Removed border classes
                onClick={triggerStampUpload}
                onMouseEnter={triggerStampUpload}
             >
                 <Input
                    type="file"
                    ref={stampFileRef}
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="hidden"
                    id="stampFile"
                    />
                 {stampPreview ? (
                     <div className="relative w-full h-full flex items-center justify-center">
                         <Image
                            id="stampPreview"
                            src={stampPreview}
                            alt="Stamp Preview"
                            width={180} // Static width
                            height={150} // Static height
                            style={{ objectFit: 'contain', width: '180px', height: '150px' }} // Ensure style matches
                            className="max-w-full max-h-full" // Keep these for safety
                            unoptimized
                            priority // Ensures image loads eagerly
                          />
                          {/* Hover effect - Only show when stampPreview exists */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print">
                            <span className="text-white text-xs font-bold">Click/Hover to Change</span>
                          </div>
                     </div>
                ) : (
                     <Label htmlFor="stampFile" className="text-center text-xs text-muted-foreground cursor-pointer p-1 no-print group-hover:opacity-75 transition-opacity">
                         Click or Hover<br/> to Upload Stamp
                     </Label>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
