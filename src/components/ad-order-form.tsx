
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, FileDown } from 'lucide-react';
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

    // Temporarily add print-specific elements
    const inputs = elementToCapture.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[type="text"], textarea');
    inputs.forEach(el => {
      const valueDiv = document.createElement('div');
      valueDiv.className = el.tagName === 'TEXTAREA' ? 'print-textarea-value' : 'print-input-value';
      valueDiv.textContent = el.value;
      el.parentNode?.insertBefore(valueDiv, el.nextSibling); // Insert the div after the input/textarea
    });

     // Handle Date Picker Button explicitly for print
     const dateButtonContainer = elementToCapture.querySelector('.popover-trigger-container');
     const dateSpan = document.createElement('span');
     dateSpan.className = 'print-date-span'; // Add class for print styling
     dateSpan.textContent = displayDate || 'N/A';
     if (dateButtonContainer) {
        dateButtonContainer.appendChild(dateSpan); // Add the span for printing
     }

     // Handle Stamp Image for print
     const stampContainer = elementToCapture.querySelector('#stampContainerElement');
     const stampImagePrint = document.createElement('img');
     stampImagePrint.id = "stampPreviewPrint"; // Use different ID for print image
     if (stampPreview) {
       stampImagePrint.src = stampPreview;
       stampImagePrint.alt = "Stamp Preview";
     }
     const stampPlaceholder = document.createElement('div');
     stampPlaceholder.className = 'print-stamp-placeholder';
     stampPlaceholder.textContent = 'No Stamp Uploaded';

      // Find the dedicated print stamp container and append the image or placeholder
     const printStampContainer = elementToCapture.querySelector('.print-stamp-container');
     if (printStampContainer) {
        printStampContainer.innerHTML = ''; // Clear previous content
        if (stampPreview) {
          printStampContainer.appendChild(stampImagePrint);
        } else {
          printStampContainer.appendChild(stampPlaceholder);
        }
     }


    try {
      // Use html2canvas to capture the element
      const canvas = await html2canvas(elementToCapture, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // Important if images are from external sources
        backgroundColor: '#ffffff', // Set background to white
        logging: true, // Enable logging for debugging
        scrollX: 0, // Prevent horizontal scrolling issues
        scrollY: -window.scrollY, // Adjust for vertical scroll position
        windowWidth: elementToCapture.scrollWidth,
        windowHeight: elementToCapture.scrollHeight,
        onclone: (clonedDoc) => {
             // Apply print styles specifically for html2canvas rendering
             const printStyle = clonedDoc.createElement('style');
             printStyle.innerHTML = `
                 @media print {
                   /* Include all refined print styles from globals.css here */
                   body, html { margin: 0 !important; padding: 0 !important; width: 210mm !important; background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                   #printable-area, #printable-area * { font-family: Arial, sans-serif !important; font-weight: bold !important; font-size: 10pt !important; line-height: 1.2 !important; box-sizing: border-box !important; color: black !important; border-color: black !important; background-color: transparent !important; }
                   #printable-area .text-sm { font-size: 9pt !important; } #printable-area .text-xs { font-size: 8pt !important; } #printable-area .font-normal { font-weight: normal !important; }
                   .no-print, .no-print *, input[type="text"], textarea, .popover-trigger-container button, #stampContainerElement > *:not(#stampPreviewPrint) { display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; overflow: hidden !important; position: absolute !important; left: -9999px !important; }
                   .print-input-value, .print-textarea-value, .print-date-span, #stampPreviewPrint, .print-stamp-placeholder { display: block !important; visibility: visible !important; width: auto !important; height: auto !important; overflow: visible !important; position: static !important; }
                   #printable-area { width: 100% !important; max-width: 100% !important; border: 2px solid black !important; padding: 15px !important; margin: 0 !important; box-shadow: none !important; page-break-inside: avoid !important; }
                   #printable-area > .p-0 { padding: 0 !important; }
                   .header-title { background-color: black !important; color: white !important; padding: 4px 0 !important; margin-bottom: 15px !important; text-align: center !important; font-size: 14pt !important; font-weight: bold !important; }
                   .address-container { display: flex !important; justify-content: space-between !important; gap: 10px !important; margin-bottom: 15px !important; width: 100% !important; }
                   .address-box, .ro-date-client-container { width: 48% !important; border: 1px solid black !important; padding: 8px !important; vertical-align: top !important; min-height: 100px !important; }
                   .address-box p { margin: 0 0 2px 0 !important; font-size: 9pt !important; line-height: 1.3 !important; }
                   .ro-date-client-container .field-row { display: flex !important; align-items: baseline !important; margin-bottom: 8px !important; min-height: 1.5em; }
                   .ro-date-client-container label { width: 70px !important; flex-shrink: 0 !important; margin-right: 5px !important; font-size: 9pt !important; }
                   .print-date-span { border-bottom: 1px solid black !important; padding: 1px 0 !important; min-width: 100px !important; display: inline-block !important; }
                   .advertisement-manager-section { border: 1px solid black !important; padding: 8px !important; margin-bottom: 15px !important; }
                   .advertisement-manager-section label { display: block !important; margin-bottom: 5px !important; font-size: 10pt !important; }
                   .advertisement-manager-section p { margin-top: 10px !important; font-size: 9pt !important; }
                   .heading-package-container { display: flex !important; gap: 10px !important; margin-bottom: 15px !important; width: 100% !important; }
                   .heading-caption-box { flex: 1 !important; border: 2px solid black !important; padding: 8px !important; vertical-align: top !important; min-height: 50px !important; }
                   .package-box { width: 30% !important; border: 2px solid black !important; padding: 8px !important; vertical-align: top !important; min-height: 50px !important; }
                   .heading-caption-box label, .package-box label { display: block !important; margin-bottom: 4px !important; font-size: 10pt !important; }
                   .print-input-value, .print-textarea-value { border: none !important; border-bottom: 1px solid black !important; padding: 2px 0 !important; background: transparent !important; color: black !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; border-radius: 0 !important; box-shadow: none !important; height: auto !important; min-height: 1.4em !important; width: 100% !important; font-size: 10pt !important; font-weight: bold !important; display: block !important; white-space: pre-wrap !important; word-wrap: break-word !important; }
                   .print-textarea-value { min-height: 100px !important; }
                   .table-container-print { margin-bottom: 15px !important; }
                   table.print-table { width: 100% !important; border-collapse: collapse !important; border: 2px solid black !important; table-layout: fixed !important; page-break-inside: auto !important; }
                   table.print-table thead.print-table-header th { border: 1px solid black !important; padding: 4px !important; font-size: 9pt !important; font-weight: bold !important; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; text-align: left !important; }
                   table.print-table tbody tr { page-break-inside: avoid !important; }
                   table.print-table td.print-table-cell { border: 1px solid black !important; padding: 0 !important; vertical-align: top !important; height: auto !important; }
                   .print-table-cell .print-input-value { padding: 4px !important; border: none !important; min-height: 2.5em !important; height: 100% !important; font-size: 10pt !important; font-weight: bold !important; }
                   .matter-box { display: flex !important; min-height: 150px !important; border: 2px solid black !important; margin-bottom: 15px !important; width: 100% !important; overflow: hidden !important; }
                   .vertical-label { background-color: black !important; color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; writing-mode: vertical-lr !important; text-orientation: mixed !important; transform: rotate(180deg) !important; width: 30px !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 4px !important; font-size: 12pt !important; font-weight: bold !important; flex-shrink: 0 !important; }
                   .matter-content { flex: 1 !important; padding: 5px !important; position: relative; }
                   .matter-content .print-textarea-value { min-height: 140px !important; height: 100% !important; border: none !important; padding: 0 !important; }
                   .billing-address-box { border: 1px solid black !important; padding: 8px !important; margin-bottom: 15px !important; }
                   .billing-title-underline { border-bottom: 2px solid black !important; display: inline-block !important; padding-bottom: 1px !important; margin-bottom: 5px !important; }
                   .billing-address-box p { margin: 0 0 2px 0 !important; font-size: 9pt !important; line-height: 1.3 !important; padding-top: 5px !important; }
                    .notes-stamp-container { display: flex !important; justify-content: space-between !important; gap: 10px !important; width: 100% !important; }
                   .notes-container { flex: 1 !important; border: 1px solid black !important; padding: 8px !important; min-height: 150px !important; position: relative; }
                   .note-title-underline { border-bottom: 2px solid black !important; display: inline-block !important; padding-bottom: 1px !important; margin-bottom: 5px !important; }
                   .notes-container ol { padding-left: 25px !important; margin-top: 5px !important; list-style-position: outside !important; font-size: 9pt !important; }
                   .notes-container li { margin-bottom: 3px !important; page-break-inside: avoid !important; }
                   .print-stamp-container { width: 180px !important; height: 150px !important; border: none !important; flex-shrink: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; overflow: hidden !important; background-color: white !important; }
                   #stampPreviewPrint { display: block !important; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; object-fit: contain !important; object-position: center center !important; border: none !important; }
                   .print-stamp-placeholder { width: 100% !important; height: 100% !important; border: 1px dashed #ccc !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 9pt !important; color: #aaa !important; }
                   table { page-break-inside: auto; } tr { page-break-inside: avoid; page-break-after: auto; } thead { display: table-header-group; } tfoot { display: table-footer-group; }
                   .underline-black { border-bottom: 2px solid black !important; }
                }
             `;
             clonedDoc.head.appendChild(printStyle);
              // Ensure the root element is visible for rendering
             clonedDoc.body.style.visibility = 'visible';
             const printableAreaClone = clonedDoc.getElementById('printable-area');
             if (printableAreaClone) {
                 printableAreaClone.style.visibility = 'visible';
             }
         }
      });

      // Remove temporary print elements after canvas generation
      elementToCapture.querySelectorAll('.print-input-value, .print-textarea-value, .print-date-span').forEach(el => el.remove());
       if (printStampContainer) printStampContainer.innerHTML = ''; // Clear print stamp container


      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4', // Standard A4 size
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;

      // Calculate the ratio to fit the image within the A4 page dimensions
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      // Calculate the scaled dimensions
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

       // Calculate position to center the image (optional, can set xPos, yPos to 0 for top-left)
      const xPos = (pdfWidth - scaledWidth) / 2;
      const yPos = (pdfHeight - scaledHeight) / 2 > 0 ? (pdfHeight - scaledHeight) / 2 : 0; // Ensure yPos is not negative

      // Add the image to the PDF, ensuring it fits the page
      pdf.addImage(imgData, 'PNG', xPos, yPos, scaledWidth, scaledHeight);

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

       // Clean up temporary elements even on error
        elementToCapture.querySelectorAll('.print-input-value, .print-textarea-value, .print-date-span').forEach(el => el.remove());
        if (printStampContainer) printStampContainer.innerHTML = '';

    }
  }, [printableAreaRef, toast, roNumber, displayDate, stampPreview, isClient]); // Added dependencies


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
                        "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none no-print", // Hide button itself in print
                        !orderDate && "text-muted-foreground"
                      )}
                      id="orderDateTrigger"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                 {/* Span is added dynamically for print */}
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
          <div className="mb-5 table-container-print">
             <Table className="print-table print-border border border-black">
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
                      {/* Div for print */}
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`publication-${row.id}`} type="text" value={row.publication} onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       {/* Div for print */}
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`edition-${row.id}`} type="text" value={row.edition} onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       {/* Div for print */}
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`size-${row.id}`} type="text" value={row.size} onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       {/* Div for print */}
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`scheduledDate-${row.id}`} type="text" value={row.scheduledDate} onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       {/* Div for print */}
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell">
                      <Input id={`position-${row.id}`} type="text" value={row.position} onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                       {/* Div for print */}
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
            <div className="vertical-label bg-black text-white flex items-center justify-center p-1">
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
               {/* Div for print */}
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

          {/* Notes & Stamp Container */}
           <div className="notes-stamp-container flex gap-3 mb-5">
               {/* Notes Section */}
               <div className="notes-container flex-1 print-border rounded p-2 border border-black min-h-[150px]">
                 <p className="font-bold mb-1 note-title-underline">Note:</p>
                <ol className="list-decimal list-inside text-sm space-y-1 pt-1 pl-4">
                  <li>Space reserved vide our letter No.</li>
                  <li>No two advertisements of the same client should appear in the same issue.</li>
                  <li>Please quote R.O. No. in all your bills and letters.</li>
                  <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
                </ol>
              </div>

               {/* Stamp Area for Screen */}
               <div
                  id="stampContainerElement"
                  className="stamp-container w-[180px] h-[150px] bg-white flex items-center justify-center cursor-pointer overflow-hidden group border-dashed border-gray-300 no-print" // Dashed border for screen, hidden in print
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
                              id="stampPreviewScreen" // Different ID for screen image
                              src={stampPreview}
                              alt="Stamp Preview"
                              width={180} // Fixed width for screen display
                              height={150} // Fixed height for screen display
                              style={{ objectFit: 'contain' }}
                            />
                            {/* Hover effect */}
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
              {/* Dedicated Stamp Container for Print (Populated dynamically) */}
              <div className="print-stamp-container w-[180px] h-[150px] hidden">
                 {/* Content added by handleDownloadPdf */}
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
