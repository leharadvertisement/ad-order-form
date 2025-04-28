

'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, Download } from 'lucide-react';
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
  const printableAreaRef = useRef<HTMLDivElement>(null); // Ref for the printable area
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
  }, [toast]);

  // Update displayDate only when orderDate changes *after* initial load
   useEffect(() => {
    if (!isInitialLoadRef.current && isClient && orderDate) {
      if (!isNaN(orderDate.getTime())) {
        try {
          setDisplayDate(format(orderDate, "dd.MM.yyyy"));
        } catch (error) {
          console.error("Error formatting date:", error);
          setDisplayDate("Invalid Date");
        }
      } else {
        // Handle invalid date case if needed, maybe reset to today?
         const today = new Date();
         setOrderDate(today); // Optionally reset to today
         setDisplayDate(format(today, "dd.MM.yyyy"));
      }
    } else if (!isInitialLoadRef.current && isClient && !orderDate) {
        // Handle case where date is cleared
         const today = new Date();
         setOrderDate(today); // Reset to today if cleared
         setDisplayDate(format(today, "dd.MM.yyyy"));
    }
  }, [orderDate, isClient, isInitialLoadRef]);


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

  const handleDownloadPdf = useCallback(async () => {
    const printableElement = printableAreaRef.current;
    if (!printableElement) {
      toast({
        title: "Error",
        description: "Could not find the printable area.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating PDF...",
      description: "Please wait while the PDF is being created.",
    });

    try {
      // Temporarily remove no-print elements for capture
      const noPrintElements = printableElement.querySelectorAll<HTMLElement>('.no-print');
      noPrintElements.forEach(el => el.style.display = 'none');

      // Ensure print-only elements are visible for capture
      const printOnlyElements = printableElement.querySelectorAll<HTMLElement>('.print-only, .print-only-block, .print-only-inline-block');
      const originalDisplayStyles = new Map<HTMLElement, string>();
      printOnlyElements.forEach(el => {
        originalDisplayStyles.set(el, el.style.display);
        if (el.classList.contains('print-only-block')) {
           el.style.display = 'block';
        } else if (el.classList.contains('print-only-inline-block')) {
           el.style.display = 'inline-block';
        } else {
           el.style.display = 'inline';
        }
      });


      // Use html2canvas to capture the element
      const canvas = await html2canvas(printableElement, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // Important for external images like the stamp
        logging: false, // Disable logging for cleaner console
         onclone: (document) => {
            // Ensure input values are visible in the clone
            const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
            inputs.forEach(input => {
                if (input instanceof HTMLInputElement) {
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = input.value;
                    valueSpan.style.fontWeight = 'bold'; // Keep bold style if needed
                    valueSpan.style.fontSize = getComputedStyle(input).fontSize;
                    valueSpan.style.fontFamily = getComputedStyle(input).fontFamily;
                    valueSpan.style.lineHeight = getComputedStyle(input).lineHeight;
                     valueSpan.style.display = 'inline-block'; // Ensure it takes space
                     valueSpan.style.whiteSpace = 'pre-wrap'; // Handle potential line breaks in textarea
                     valueSpan.style.width = getComputedStyle(input).width; // Try to match width
                     valueSpan.style.minHeight = getComputedStyle(input).height; // Try to match height
                     valueSpan.style.verticalAlign = 'bottom'; // Align similar to input text
                     valueSpan.style.padding = '1px'; // Minimal padding like input
                     valueSpan.style.borderBottom = '1px solid black'; // Mimic underline if needed

                    input.style.display = 'none'; // Hide original input
                    input.parentNode?.insertBefore(valueSpan, input.nextSibling);
                } else if (input instanceof HTMLTextAreaElement) {
                     const valueDiv = document.createElement('div'); // Use div for multi-line
                     valueDiv.textContent = input.value;
                     valueDiv.style.fontWeight = 'bold';
                     valueDiv.style.fontSize = getComputedStyle(input).fontSize;
                     valueDiv.style.fontFamily = getComputedStyle(input).fontFamily;
                     valueDiv.style.lineHeight = getComputedStyle(input).lineHeight;
                     valueDiv.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
                     valueDiv.style.width = getComputedStyle(input).width;
                     valueDiv.style.minHeight = getComputedStyle(input).height;
                      valueDiv.style.padding = '1px'; // Minimal padding

                     input.style.display = 'none';
                     input.parentNode?.insertBefore(valueDiv, input.nextSibling);
                }
            });
             // Ensure stamp image is rendered correctly in the clone for canvas
            const stampContainer = document.getElementById('stampContainerElement');
            const stampPreviewScreen = document.getElementById('stampPreviewScreen');
             if (stampContainer && stampPreviewScreen) {
                // Hide interactive elements if needed, ensure image is visible
                 const label = stampContainer.querySelector('label');
                 if (label) label.style.display = 'none';
                 stampPreviewScreen.style.display = 'block'; // Make sure the image is visible
             }
        }
      });

       // Restore display of no-print elements
       noPrintElements.forEach(el => el.style.display = ''); // Restore original or default display
       // Restore display of print-only elements
       printOnlyElements.forEach(el => {
           el.style.display = originalDisplayStyles.get(el) || ''; // Restore original display style
       });


      const imgData = canvas.toDataURL('image/png');

      // Define A4 page size in mm
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Calculate image dimensions to fit A4, maintaining aspect ratio
      const canvasAspectRatio = canvas.width / canvas.height;
      let imgWidth = pdfWidth - 20; // A4 width in mm with 10mm margins
      let imgHeight = imgWidth / canvasAspectRatio;

      // If height exceeds A4 height with margins, scale by height instead
       const maxHeight = pdfHeight - 20; // A4 height with 10mm margins
       if (imgHeight > maxHeight) {
           imgHeight = maxHeight;
           imgWidth = imgHeight * canvasAspectRatio;
       }

       // Calculate margins to center the image
       const marginLeft = (pdfWidth - imgWidth) / 2;
       const marginTop = (pdfHeight - imgHeight) / 2;


      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add image to PDF, centered with margins
      pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);

      // Download PDF
      const fileName = `ReleaseOrder_${roNumber || 'Draft'}_${displayDate || 'DateNotSet'}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `${fileName} has been downloaded successfully.`,
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "An error occurred while creating the PDF.",
        variant: "destructive",
      });
       // Ensure elements are restored even if error occurs
       const printableElement = printableAreaRef.current;
       if (printableElement) {
           const noPrintElements = printableElement.querySelectorAll<HTMLElement>('.no-print');
           noPrintElements.forEach(el => el.style.display = '');
           const printOnlyElements = printableElement.querySelectorAll<HTMLElement>('.print-only, .print-only-block, .print-only-inline-block');
            printOnlyElements.forEach(el => {
                 // Attempt to restore, though original styles might be lost if error happened early
                 const originalDisplay = localStorage.getItem(`origDisplay_${el.id}`);
                 if (originalDisplay) el.style.display = originalDisplay;
                 else el.style.display = ''; // Fallback
            });
       }
    }
  }, [toast, roNumber, displayDate]);

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
         <Button onClick={handleDownloadPdf} variant="default">
           <Download className="mr-2 h-4 w-4" /> Download PDF
         </Button>
      </div>

      {/* Printable Area */}
      <Card id="printable-area" ref={printableAreaRef} className="w-full print-border-heavy rounded-none shadow-none p-5 border-2 border-black"> {/* Added ref */}
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center bg-black text-white p-1 mb-5 header-title">
            <h1 className="text-xl m-0 font-bold">RELEASE ORDER</h1>
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
               <div className="field-row flex items-center popover-trigger-container">
                <Label htmlFor="orderDateTrigger" className="w-20 text-sm shrink-0">Date:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none no-print",
                        !orderDate && "text-muted-foreground"
                      )}
                      id="orderDateTrigger" // Ensure ID is unique if needed elsewhere, or use date state directly
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                       <span>{isClient ? displayDate : "Loading..."}</span> {/* Use displayDate state */}
                    </Button>
                  </PopoverTrigger>
                   {/* Display Date for Print/Static view */}
                  <span className={cn(
                      "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none print-only hidden", // Hidden on screen, visible on print
                        !orderDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                       <span>{isClient ? displayDate : "Loading..."}</span> {/* Use displayDate state */}
                    </span>
                  <PopoverContent className="w-auto p-0 no-print">
                    <Calendar
                      mode="single"
                      selected={orderDate}
                      onSelect={(date) => {
                           if (date instanceof Date && !isNaN(date.getTime())) {
                               setOrderDate(date);
                           } else {
                               // Handle invalid date selection, maybe set to undefined or today
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
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[48px]"> {/* Increased height */}
                      <Input id={`keyNo-${row.id}`} type="text" value={row.keyNo} onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[48px]">
                      <Input id={`publication-${row.id}`} type="text" value={row.publication} onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[48px]">
                      <Input id={`edition-${row.id}`} type="text" value={row.edition} onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[48px]">
                      <Input id={`size-${row.id}`} type="text" value={row.size} onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[48px]">
                      <Input id={`scheduledDate-${row.id}`} type="text" value={row.scheduledDate} onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[48px]">
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
             <div className="vertical-label bg-black text-white flex items-center justify-center p-1 w-8"> {/* Adjust width as needed */}
              <span className="text-base font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>MATTER</span>
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

          {/* Notes & Stamp Container */}
           <div className="notes-stamp-container relative flex gap-3 mb-5 items-start print-border rounded p-2 border border-black min-h-[150px]">
               {/* Notes Section */}
               <div className="notes-content flex-1 pr-[190px]"> {/* Added padding to avoid overlap */}
                 <p className="font-bold mb-1 note-title-underline">Note:</p>
                <ol className="list-decimal list-inside text-sm space-y-1 pt-1 pl-4">
                  <li>Space reserved vide our letter No.</li>
                  <li>No two advertisements of the same client should appear in the same issue.</li>
                  <li>Please quote R.O. No. in all your bills and letters.</li>
                  <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
                </ol>
              </div>

               {/* Stamp Area - Positioned absolutely within the notes container */}
               <div
                  id="stampContainerElement"
                  className="stamp-container absolute top-2 right-2 w-[180px] h-[142px] flex items-center justify-center cursor-pointer overflow-hidden group" // Removed border-none, adjusted height slightly
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
                              id="stampPreviewScreen"
                              src={stampPreview}
                              alt="Stamp Preview"
                              width={180} // Explicit width
                              height={150} // Explicit height
                              style={{ objectFit: 'contain', width: '100%', height: '100%' }} // Use contain and 100%
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
                   {/* Visible Stamp Image for Print */}
                   {stampPreview && (
                     <div className="absolute inset-0 hidden print-only-block">
                       <Image
                          src={stampPreview}
                          alt="Stamp"
                          width={180}
                          height={150}
                          style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                        />
                     </div>
                   )}
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

