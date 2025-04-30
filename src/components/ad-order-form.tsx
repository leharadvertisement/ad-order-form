'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, X, Download } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  orderDate: string | null; // Store as ISO string
  clientName: string;
  advertisementManagerLine1: string;
  advertisementManagerLine2: string;
}

const LOCAL_STORAGE_KEY = 'adOrderFormData';
const DEBOUNCE_DELAY = 500; // milliseconds

export default function AdOrderForm() {
  // --- State Hooks ---
  const [isPreviewing, setIsPreviewing] = useState(false); // State for print preview mode
  const [caption, setCaption] = useState('');
  const [packageName, setPackageName] = useState('');
  const [matter, setMatter] = useState('');
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([
    { id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
  ]);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [roNumber, setRoNumber] = useState('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date()); // Keep as Date object, initialize with today
  const [clientName, setClientName] = useState('');
  const [advertisementManagerLine1, setAdvertisementManagerLine1] = useState('');
  const [advertisementManagerLine2, setAdvertisementManagerLine2] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>(''); // State to hold formatted date string for display

  // --- Ref Hooks ---
  const stampFileRef = useRef<HTMLInputElement>(null);
  const printableAreaRef = useRef<HTMLDivElement>(null); // Ref for the printable area
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // --- Custom Hooks ---
  const { toast } = useToast();

  // --- Effect Hooks ---

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

   // Effect to apply print preview class to the body if previewing
   // Moved this effect hook to run after state declarations and before other useEffects
   // This ensures it doesn't violate the Rules of Hooks
   useEffect(() => {
     if (isPreviewing) {
         document.body.classList.add('print-preview-mode');
     } else {
         document.body.classList.remove('print-preview-mode');
     }
     // Cleanup function to remove class on component unmount or when preview mode ends
     return () => {
         document.body.classList.remove('print-preview-mode');
     };
   }, [isPreviewing]);

  // Effect to load data
  useEffect(() => {
    // Only run on client after initial mount
    if (!isClient) return;

    let initialDate = new Date(); // Default to today
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

        // Load and validate date
        if (parsedData.orderDate) {
           const savedDateObj = new Date(parsedData.orderDate);
           // Check if the parsed date is valid
           if (!isNaN(savedDateObj.getTime())) {
               initialDate = savedDateObj; // Use saved date if valid
           } else {
                // If saved date is invalid, keep initialDate as today (already set)
                console.warn("Invalid date found in localStorage, defaulting to today.");
           }
        }
         // If no orderDate in saved data, initialDate remains today (already set)

        setClientName(parsedData.clientName || '');
        setAdvertisementManagerLine1(parsedData.advertisementManagerLine1 || '');
        setAdvertisementManagerLine2(parsedData.advertisementManagerLine2 || '');
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      toast({
        title: "Recovery Failed",
        description: "Could not recover previous draft data. Using defaults.",
        variant: "destructive",
      });
       // Keep initialDate as today in case of error
    } finally {
      setOrderDate(initialDate); // Set the Date object state (defaults to today if no valid saved date)
      // Display date formatting is handled in the next effect
      isInitialLoadRef.current = false;
    }
  // Only depend on isClient and toast. Other state setters don't need to re-run this load effect.
  }, [isClient, toast]);

   // Effect to update displayDate whenever orderDate changes (client-side only)
   useEffect(() => {
     if (!isClient) return; // Don't run on server

     if (orderDate && !isNaN(orderDate.getTime())) {
         try {
             setDisplayDate(format(orderDate, "dd.MM.yyyy"));
         } catch (error) {
             console.error("Error formatting date:", error);
             // If formatting fails for some reason, reset to today
             const today = new Date();
             setOrderDate(today);
             // displayDate will update in the next render cycle
         }
     } else {
          // Handle cases where orderDate might become undefined or invalid
          const today = new Date();
          setOrderDate(today); // Reset to today
          // displayDate will update in the next render cycle
     }
   // Depend only on orderDate and isClient flag
   }, [orderDate, isClient]);


  // Effect to save data to localStorage (debounced, client-side only)
  useEffect(() => {
    if (isInitialLoadRef.current || !isClient) {
      if (!isClient) isInitialLoadRef.current = false; // Ensure initial load flag is cleared even if save is skipped
      return; // Don't save during initial load or if not client-side yet
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
          // Store date as ISO string, handle potential undefined/invalid date
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
    // Ensure all state dependencies are listed
  }, [caption, packageName, matter, scheduleRows, stampPreview, roNumber, orderDate, clientName, advertisementManagerLine1, advertisementManagerLine2, isClient]);



  // --- Callback Hooks ---
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


   // Function to toggle print preview mode
   const togglePrintPreview = useCallback(() => {
     setIsPreviewing((prev) => !prev);
   }, []);

   // Function to handle taking a screenshot
   const handleScreenshot = useCallback(async () => {
    if (!printableAreaRef.current) {
        toast({
            title: "Screenshot Error",
            description: "Could not find the printable area.",
            variant: "destructive",
        });
        return;
    }

    try {
        // Temporarily apply print styles for screenshot if not in preview mode
        const originallyInPreview = isPreviewing;
        if (!originallyInPreview) {
            document.body.classList.add('print-preview-mode');
            // Force redraw if necessary, though usually class change is enough
            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        const canvas = await html2canvas(printableAreaRef.current, {
            scale: 2, // Increase scale for better quality
            useCORS: true, // Enable cross-origin support if needed
            logging: false, // Disable logging for cleaner console
            // Ensure it captures the whole element regardless of scroll
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
            windowWidth: printableAreaRef.current.scrollWidth,
            windowHeight: printableAreaRef.current.scrollHeight,
        });

        // Revert styles if they were temporarily applied
        if (!originallyInPreview) {
            document.body.classList.remove('print-preview-mode');
        }

        const dataURL = canvas.toDataURL('image/png');

        // Create a download link
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'ad_order_form_screenshot.png'; // Set the filename
        document.body.appendChild(link); // Append to the document
        link.click();                 // Simulate a click
        document.body.removeChild(link); // Remove the link

        toast({
            title: "Screenshot Saved",
            description: "The form has been saved as a PNG image.",
        });
    } catch (error: any) {
        console.error("Screenshot failed:", error);
        // Revert styles if error occurred during screenshotting
         if (!isPreviewing) { // Check original state
             document.body.classList.remove('print-preview-mode');
         }
        toast({
            title: "Screenshot Error",
            description: `Failed to take screenshot: ${error.message || 'Unknown error'}`,
            variant: "destructive",
        });
    }
}, [toast, isPreviewing]); // Depend on isPreviewing


  const handleClearForm = useCallback(() => {
    setCaption('');
    setPackageName('');
    setMatter('');
    setScheduleRows([{ id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
    setStampPreview(null);
    setRoNumber('');
    const today = new Date();
    setOrderDate(today); // Reset date object state to today
    // displayDate will update via the useEffect dependency
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

   // Guard against hydration errors for date display
   const safeDisplayDate = isClient ? displayDate : '';


  // --- Main Render ---
  // Use 'print-preview-container' for the wrapper only when previewing
  return (
    <div className={`max-w-[210mm] mx-auto font-bold ${isPreviewing ? 'print-preview-container' : ''}`}>
       {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 no-print">
           <Button onClick={handleScreenshot} variant="outline">
               <Download className="mr-2 h-4 w-4" /> Save as Image
           </Button>
           {/* <Button onClick={togglePrintPreview} variant="outline">
               {isPreviewing ? 'Exit Preview' : 'Preview Print'}
           </Button> */}
          <Button onClick={handleClearForm} variant="outline">
              <Eraser className="mr-2 h-4 w-4" /> Clear Form & Draft
          </Button>
      </div>


      {/* Overlay and Close Button for Preview Mode */}
       {isPreviewing && (
         <>
           <div className="print-preview-overlay fixed inset-0 z-[999]" onClick={togglePrintPreview}> {/* Overlay closes preview */}
           </div>
            <button onClick={togglePrintPreview} className="close-print-preview no-print z-[1002]">
               <X size={24} /> {/* Increased size */}
            </button>
          </>
       )}

      {/* Printable Area - Apply preview class directly */}
      <Card id="printable-area" ref={printableAreaRef} className={`w-full print-border-heavy rounded-none shadow-none p-5 border-2 border-black ${isPreviewing ? 'print-preview-mode' : ''}`}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center bg-black text-white p-1 mb-5 header-title">
            <h1 className="text-xl m-0 font-bold">RELEASE ORDER</h1>
          </div>

           {/* Address Boxes Container */}
           <div className="address-container flex justify-between gap-3 mb-5">
            {/* Left Address Box */}
             <div className="address-box w-[48%] print-border-heavy rounded p-2 border-2 border-black">
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
             <div className="ro-date-client-container w-[48%] print-border-heavy rounded p-2 space-y-2 border-2 border-black">
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
                 {/* Popover for Screen */}
                 {isClient && ( // Render Popover only on client
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button
                         variant={"outline"}
                         className={cn(
                           "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none no-print",
                           !safeDisplayDate && "text-muted-foreground"
                         )}
                         id="orderDateTrigger"
                       >
                         <CalendarIcon className="mr-2 h-4 w-4" />
                         <span>{safeDisplayDate || 'Pick a date'}</span>
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
                               setOrderDate(today);
                           }
                         }}
                         initialFocus
                       />
                     </PopoverContent>
                   </Popover>
                 )}
                  {/* Static Display for Print/Preview */}
                  <div className={cn(
                      "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm shadow-none print-only-inline-block hidden items-center",
                       // Use safeDisplayDate for conditional styling if needed, but always render the span
                       !safeDisplayDate && "text-muted-foreground"
                    )}
                  >
                    <span id="orderDatePrint" className="ml-1">{safeDisplayDate || 'N/A'}</span>
                  </div>
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
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[150px] align-top">
                       <Textarea
                          id={`keyNo-${row.id}`}
                          value={row.keyNo}
                          onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)}
                          className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                          style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                       />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[150px] align-top">
                       <Textarea
                          id={`publication-${row.id}`}
                          value={row.publication}
                          onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)}
                          className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                           style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                        />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[150px] align-top">
                       <Textarea
                          id={`edition-${row.id}`}
                          value={row.edition}
                          onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)}
                          className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                           style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                        />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[150px] align-top">
                       <Textarea
                           id={`size-${row.id}`}
                           value={row.size}
                           onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)}
                           className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                            style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                         />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[150px] align-top">
                       <Textarea
                           id={`scheduledDate-${row.id}`}
                           value={row.scheduledDate}
                           onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)}
                           className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                           style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                       />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell h-[150px] align-top">
                       <Textarea
                          id={`position-${row.id}`}
                          value={row.position}
                          onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)}
                          className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                          style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                       />
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
             <div className="vertical-label bg-black text-white flex items-center justify-center p-1 w-8 flex-shrink-0">
              <span className="text-base font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>MATTER</span>
             </div>
            <div className="matter-content flex-1 p-1">
              <Textarea
                id="matterArea"
                placeholder="Enter matter here..."
                className="w-full h-full resize-none border-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1 align-top"
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
                // Removed inline style to ensure CSS controls writing-mode correctly for print/preview
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
           <div className="notes-stamp-container relative print-border rounded p-2 border border-black min-h-[150px]">
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

               {/* Stamp Area - Positioned absolutely */}
               <div
                  id="stampContainerElement"
                  className="stamp-container absolute top-2 right-2 w-[180px] h-[142px] flex items-center justify-center cursor-pointer overflow-hidden group border-0" // Ensure no border here for the interactive container
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
                           {/* Image for Screen */}
                           <Image
                              id="stampPreviewScreen"
                              src={stampPreview}
                              alt="Stamp Preview"
                              width={180} // Static width
                              height={142} // Static height
                              style={{ objectFit: 'contain' }} // Use contain to fit within bounds
                              className="block max-w-full max-h-full"
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
               {/* Visible Stamp Image for Print/Preview Only */}
                {stampPreview && (
                 <div className="stamp-container-print hidden print-only-block">
                   <Image
                      src={stampPreview}
                      alt="Stamp"
                      width={180}
                      height={142}
                      style={{ objectFit: 'contain' }}
                      className="stamp-print-image"
                    />
                 </div>
               )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}