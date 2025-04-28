
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, FileDown } from 'lucide-react'; // Changed FileText to FileDown
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
  const [displayDate, setDisplayDate] = useState<string>(''); // State to hold formatted date string

  useEffect(() => {
    setIsClient(true); // Set client flag after mount
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

        if (savedDate && !isNaN(savedDate.getTime())) {
          setOrderDate(savedDate);
          setDisplayDate(format(savedDate, "dd.MM.yyyy"));
        } else {
           const today = new Date();
           setOrderDate(today);
           setDisplayDate(format(today, "dd.MM.yyyy"));
        }
        setClientName(parsedData.clientName || '');
        setAdvertisementManagerLine1(parsedData.advertisementManagerLine1 || '');
        setAdvertisementManagerLine2(parsedData.advertisementManagerLine2 || '');
      } else {
        const today = new Date();
        setOrderDate(today);
        setDisplayDate(format(today, "dd.MM.yyyy"));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
       const today = new Date();
       setOrderDate(today);
       setDisplayDate(format(today, "dd.MM.yyyy"));
      toast({
        title: "Recovery Failed",
        description: "Could not recover previous draft data.",
        variant: "destructive",
      });
    } finally {
      isInitialLoadRef.current = false;
    }
  }, [toast]); // Removed orderDate from dependencies to avoid infinite loops

  // Update displayDate only when orderDate changes *after* initial load
  useEffect(() => {
    if (!isInitialLoadRef.current && orderDate && !isNaN(orderDate.getTime())) {
      try {
        setDisplayDate(format(orderDate, "dd.MM.yyyy"));
      } catch (error) {
        console.error("Error formatting date:", error);
         setDisplayDate("Invalid Date");
      }
    }
  }, [orderDate]);


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

    const elementToCapture = printableAreaRef.current;
    const filenameDate = displayDate ? displayDate.replace(/\./g, '-') : 'NoDate';
    const filename = `Release_Order_${roNumber || 'NoRO'}_${filenameDate}.pdf`;

    try {
      // Temporarily remove non-printable elements for capture
      const nonPrintElements = elementToCapture.querySelectorAll('.no-print');
      nonPrintElements.forEach(el => (el as HTMLElement).style.display = 'none');

      // Temporarily style inputs and textareas to look like text
      const inputs = elementToCapture.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[type="text"], textarea');
      const originalStyles: { element: HTMLElement, style: string }[] = [];

      inputs.forEach(el => {
        originalStyles.push({ element: el, style: el.style.cssText });
        el.style.border = 'none';
        el.style.borderBottom = '1px solid black';
        el.style.padding = '1px 0';
        el.style.backgroundColor = 'transparent';
        el.style.color = 'black';
        el.style.borderRadius = '0';
        el.style.boxShadow = 'none';
        // Set the value attribute for inputs so html2canvas captures it
        if (el.tagName === 'INPUT') {
          (el as HTMLInputElement).setAttribute('value', (el as HTMLInputElement).value);
        } else if (el.tagName === 'TEXTAREA') {
            // Replace textarea with a div for better rendering
            const div = document.createElement('div');
            div.textContent = el.value;
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordWrap = 'break-word';
            div.style.width = el.style.width || '100%';
            div.style.minHeight = el.style.height || '100px';
            div.style.fontFamily = window.getComputedStyle(el).fontFamily;
            div.style.fontSize = window.getComputedStyle(el).fontSize;
            div.style.fontWeight = window.getComputedStyle(el).fontWeight;
            div.style.padding = window.getComputedStyle(el).padding;
            div.style.borderBottom = '1px solid black'; // Mimic input look
            div.style.marginBottom = '5px'; // Add some spacing
             el.parentNode?.insertBefore(div, el);
             el.style.display = 'none'; // Hide the original textarea
             originalStyles.push({ element: el, style: el.style.display }); // Store original display style
             originalStyles.push({ element: div, style: div.outerHTML }); // Store the div for removal later
        }

      });

       // Handle Date Picker Button explicitly
       const dateButtonContainer = elementToCapture.querySelector('.popover-trigger-container');
       const originalDateContent = dateButtonContainer?.innerHTML;
       if (dateButtonContainer) {
         const dateSpan = document.createElement('span');
         dateSpan.textContent = displayDate || 'N/A';
         dateSpan.style.borderBottom = '1px solid black';
         dateSpan.style.padding = '2px 0';
         dateSpan.style.display = 'inline-block';
         dateSpan.style.fontFamily = 'Arial, sans-serif';
         dateSpan.style.fontSize = '14px';
         dateSpan.style.fontWeight = 'bold';
         dateButtonContainer.innerHTML = '';
         dateButtonContainer.appendChild(dateSpan);
       }


      // Use html2canvas to capture the element
      const canvas = await html2canvas(elementToCapture, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // Important if images are from external sources
        backgroundColor: '#ffffff', // Set background to white
        logging: true, // Enable logging for debugging
        onclone: (clonedDoc) => {
             // Apply print styles within the cloned document before rendering
             const printStyle = clonedDoc.createElement('style');
             printStyle.innerHTML = `
                @media print {
                    #printable-area, #printable-area * {
                        font-family: Arial, sans-serif !important;
                        font-weight: bold !important;
                        font-size: 10px !important; /* Adjusted PDF font size */
                        box-sizing: border-box;
                    }
                     /* ... include other necessary print styles from globals.css here ... */
                     /* Ensure borders render */
                     .print-border, .print-border-heavy, .print-border-thin, table, th, td, .address-box, .ro-date-client-container, .heading-caption-box, .package-box, .advertisement-manager-section, .matter-box, .notes-container {
                         border-color: black !important;
                         border-style: solid !important;
                     }
                     .print-border-heavy { border-width: 2px !important; }
                     .print-border { border-width: 1px !important; }
                     .print-border-thin { border-width: 1px !important; }
                     table { border-width: 2px !important; }
                     th, td { border-width: 1px !important; padding: 4px !important; } /* Adjusted padding */
                     th { background-color: #f0f0f0 !important; }
                     /* Make sure input/textarea values are visible */
                     input[type="text"], div[style*="white-space: pre-wrap"] {
                        border: none !important;
                        border-bottom: 1px solid black !important;
                        padding: 1px 0 !important;
                        background: transparent !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact; print-color-adjust: exact;
                     }
                     div[style*="white-space: pre-wrap"] { min-height: 80px; } /* Adjusted min-height */
                     /* Ensure header and vertical label backgrounds render */
                     .header-title, .vertical-label {
                        background-color: black !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact; print-color-adjust: exact;
                     }
                      /* Ensure stamp image is visible */
                      #stampPreview { display: block !important; width: 150px !important; height: 120px !important; object-fit: contain !important; }
                      .stamp-container { border: none !important; }
                      /* Layout helpers */
                       .address-container, .heading-package-container { display: flex !important; }
                       .address-box, .ro-date-client-container { width: 48% !important; }
                       .heading-caption-box { flex: 1 !important; }
                       .package-box { width: 30% !important; }
                       .matter-box { display: flex !important; }
                       /* Hide hover effect */
                       .group-hover\:opacity-100 { opacity: 0 !important; }
                }
             `;
             clonedDoc.head.appendChild(printStyle);
              // Make sure the root element is visible
             clonedDoc.body.style.visibility = 'visible';
             const printableAreaClone = clonedDoc.getElementById('printable-area');
             if (printableAreaClone) {
                 printableAreaClone.style.visibility = 'visible';
             }
         }
      });

      // Restore original state
      nonPrintElements.forEach(el => (el as HTMLElement).style.display = ''); // Restore display
      inputs.forEach(el => {
        const original = originalStyles.find(o => o.element === el);
        if (original) {
          el.style.cssText = original.style; // Restore original inline styles
        }
         if (el.tagName === 'INPUT') {
           el.removeAttribute('value'); // Remove the temporary value attribute
         } else if (el.tagName === 'TEXTAREA') {
            // Remove the temporary div and restore textarea
            const tempDiv = originalStyles.find(o => o.element.tagName === 'DIV' && o.style.includes(el.value));
            if (tempDiv) {
                const divElement = elementToCapture.querySelector(`div[style*="${el.value.substring(0, 20)}"]`); // Find the div again might be tricky
                 if (divElement) divElement.remove();
             }
             el.style.display = ''; // Make textarea visible again
         }
      });

      // Restore date button
       if (dateButtonContainer && originalDateContent) {
          dateButtonContainer.innerHTML = originalDateContent;
       }


      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4', // Standard A4 size
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);

      // Calculate image dimensions maintaining aspect ratio
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;

      // Center the image on the PDF page (optional)
      const xPos = (pdfWidth - imgWidth) / 2;
      const yPos = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
      pdf.save(filename);

      toast({
        title: 'PDF Downloaded',
        description: 'The release order has been saved as a PDF file.',
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'PDF Generation Failed',
        description: `Could not generate the PDF. ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });

       // Ensure original styles are restored even on error
        nonPrintElements.forEach(el => (el as HTMLElement).style.display = '');
        inputs.forEach(el => {
            const original = originalStyles.find(o => o.element === el);
            if (original) el.style.cssText = original.style;
             if (el.tagName === 'INPUT') el.removeAttribute('value');
             else if (el.tagName === 'TEXTAREA') {
                  const tempDiv = originalStyles.find(o => o.element.tagName === 'DIV' && o.style.includes(el.value));
                  if (tempDiv) {
                      const divElement = elementToCapture.querySelector(`div[style*="${el.value.substring(0, 20)}"]`);
                      if (divElement) divElement.remove();
                  }
                 el.style.display = '';
             }
        });
         if (dateButtonContainer && originalDateContent) {
            dateButtonContainer.innerHTML = originalDateContent;
         }
    }
  }, [printableAreaRef, toast, roNumber, displayDate]);


  const handleClearForm = useCallback(() => {
    setCaption('');
    setPackageName('');
    setMatter('');
    setScheduleRows([{ id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
    setStampPreview(null);
    setRoNumber('');
    const today = new Date();
    setOrderDate(today); // Reset date to today
    setDisplayDate(format(today, "dd.MM.yyyy")); // Update display date immediately
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
            <FileDown className="mr-2 h-4 w-4" /> Download as PDF
         </Button>
      </div>

      {/* Printable Area */}
      <Card id="printable-area" ref={printableAreaRef} className="w-full print-border-heavy rounded-none shadow-none p-5 border-2 border-black">
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center bg-black text-white p-1 mb-5 header-title">
            <h1 className="text-xl m-0 font-bold">RELEASE ORDER</h1> {/* Adjusted size */}
          </div>

           {/* Address Boxes Container */}
           <div className="address-container flex justify-between gap-3 mb-5">
            {/* Left Address Box */}
             <div className="address-box w-[48%] print-border rounded p-2 border border-black">
              <p className="text-sm leading-tight">
                Lehar Advertising Agency Pvt. Ltd.<br />
                D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
                Alaknanda Commercial Complex,<br />
                New Delhi-110019<br />
                Tel: 49573333, 34, 35, 36<br />
                Fax: 26028101
              </p>
            </div>
            {/* Right Box: R.O., Date, Client */}
             <div className="ro-date-client-container w-[48%] print-border rounded p-2 space-y-2 border border-black">
              {/* R.O. No. LN */}
               <div className="field-row flex items-center">
                <Label htmlFor="roNumber" className="w-20 text-sm shrink-0">R.O.No.LN:</Label>
                <Input
                  id="roNumber"
                  type="text"
                  placeholder="Enter R.O. No."
                  className="flex-1 h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  value={roNumber}
                  onChange={(e) => setRoNumber(e.target.value)}
                />
              </div>
              {/* Date */}
               <div className="field-row flex items-center popover-trigger-container"> {/* Container for replacement */}
                <Label htmlFor="orderDateTrigger" className="w-20 text-sm shrink-0">Date:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none",
                        !orderDate && "text-muted-foreground"
                      )}
                      id="orderDateTrigger"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 no-print" />
                      {/* Display formatted date from state */}
                      <span>{isClient ? displayDate : "Loading..."}</span>
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
                               const today = new Date();
                               setOrderDate(today); // Fallback to today if invalid date selected
                           }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Client */}
               <div className="field-row flex items-center">
                <Label htmlFor="clientName" className="w-20 text-sm shrink-0">Client:</Label>
                <Input
                  id="clientName"
                  type="text"
                  placeholder="Enter Client Name"
                  className="flex-1 h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Advertisement Manager Section */}
          <div className="advertisement-manager-section print-border rounded p-2 mb-5 border border-black">
            <Label className="block mb-1">The Advertisement Manager</Label>
             <div className="relative mb-1">
              <Input
                id="adManager1"
                type="text"
                placeholder="Line 1"
                className="w-full border-0 border-b border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                value={advertisementManagerLine1}
                onChange={(e) => setAdvertisementManagerLine1(e.target.value)}
              />
             </div>
            <div className="relative">
            <Input
              id="adManager2"
              type="text"
              placeholder="Line 2"
              className="w-full border-0 border-b border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
              value={advertisementManagerLine2}
              onChange={(e) => setAdvertisementManagerLine2(e.target.value)}
            />
             </div>
            <p className="text-sm mt-2">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
          </div>

          {/* Heading & Package Section */}
           <div className="heading-package-container flex gap-3 mb-5">
             <div className="heading-caption-box flex-1 print-border-heavy rounded p-2 border-2 border-black">
              <Label htmlFor="caption" className="block mb-1">Heading/Caption:</Label>
              <Input
                id="caption"
                type="text"
                placeholder="Enter caption here"
                className="w-full border-0 border-b border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
             <div className="package-box w-[30%] print-border-heavy rounded p-2 border-2 border-black">
              <Label htmlFor="package" className="block mb-1">Package:</Label>
              <Input
                id="package" // Use unique ID
                type="text"
                placeholder="Enter package name"
                className="w-full border-0 border-b border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              />
            </div>
          </div>


          {/* Schedule Table */}
          <div className="mb-5">
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
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`keyNo-${row.id}`} type="text" value={row.keyNo} onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`publication-${row.id}`} type="text" value={row.publication} onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`edition-${row.id}`} type="text" value={row.edition} onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`size-${row.id}`} type="text" value={row.size} onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`scheduledDate-${row.id}`} type="text" value={row.scheduledDate} onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`position-${row.id}`} type="text" value={row.position} onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
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
          <div className="matter-box flex h-[150px] print-border-heavy rounded mb-5 overflow-hidden border-2 border-black">
            <div className="vertical-label bg-black text-white flex items-center justify-center p-1" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
              <span className="text-base font-bold transform rotate-180">MATTER</span>
            </div>
            <div className="matter-content flex-1 p-1">
              <Textarea
                id="matterArea"
                placeholder="Enter matter here..."
                className="w-full h-full resize-none border-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1"
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
              />
            </div>
          </div>

          {/* Billing Info */}
           <div className="billing-address-box print-border rounded p-2 mb-5 border border-black">
             <p className="font-bold mb-1 billing-title-underline">Forward all bills with relevant voucher copies to:</p>
            <p className="text-sm leading-tight pt-1">
              D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
              Alaknanda Commercial Complex,<br />
              New Delhi-110019<br />
              Tel: 49573333, 34, 35, 36<br />
              Fax: 26028101
            </p>
          </div>

          {/* Notes & Stamp */}
           <div className="notes-container relative print-border rounded p-2 pr-[200px] border border-black min-h-[170px] pb-1">
             <p className="font-bold mb-1 note-title-underline">Note:</p>
            <ol className="list-decimal list-inside text-sm space-y-1 pt-1 pl-4">
              <li>Space reserved vide our letter No.</li>
              <li>No two advertisements of the same client should appear in the same issue.</li>
              <li>Please quote R.O. No. in all your bills and letters.</li>
              <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
            </ol>
             {/* Stamp Area - No border, positioned absolutely */}
             <div
                className="stamp-container absolute top-2 right-2 w-[180px] h-[150px] bg-white flex items-center justify-center cursor-pointer overflow-hidden group print-stamp-container border-none" // Removed border-2 border-black, ensure visibility for interaction
                onClick={triggerStampUpload}
                onMouseEnter={triggerStampUpload}
                id="stampContainerElement"
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
                         {/* Use next/image for optimization, but ensure correct props for static size */}
                         <Image
                            id="stampPreview"
                            src={stampPreview}
                            alt="Stamp Preview"
                            width={180} // Static width
                            height={150} // Static height
                            style={{ objectFit: 'contain' }} // Ensure image fits within dimensions
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
