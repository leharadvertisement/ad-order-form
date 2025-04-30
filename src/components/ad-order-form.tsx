'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader, // Added missing import
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, Download } from 'lucide-react';
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
  const [caption, setCaption] = useState('');
  const [packageName, setPackageName] = useState('');
  const [matter, setMatter] = useState('');
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([
    { id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
  ]);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [roNumber, setRoNumber] = useState('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined); // Initialize as undefined
  const [clientName, setClientName] = useState('');
  const [advertisementManagerLine1, setAdvertisementManagerLine1] = useState('');
  const [advertisementManagerLine2, setAdvertisementManagerLine2] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>(''); // State to hold formatted date string for display


  // --- Ref Hooks ---
  const stampFileRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const formRef = useRef<HTMLDivElement>(null);

  // --- Custom Hooks ---
  const { toast } = useToast();

  // --- Effect Hooks ---

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize date on client-side mount
  useEffect(() => {
    if (isClient) {
      setOrderDate(new Date()); // Set to today's date once mounted on client
    }
  }, [isClient]);


  // Effect to load data
  useEffect(() => {
    // Only run on client after initial mount and after date is initialized
    if (!isClient || orderDate === undefined) return;

    let initialDate = orderDate; // Default to the initialized date (today)
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
                // If saved date is invalid, keep initialDate as today
                console.warn("Invalid date found in localStorage, using today's date instead.");
                initialDate = new Date(); // Explicitly set to today if saved date is bad
           }
        }
         // If no orderDate in saved data, initialDate remains the initialized date (today)

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
       initialDate = new Date();
    } finally {
        // Ensure orderDate state is set correctly (either loaded or default today)
        // Only update if the loaded/default date is different from the current state
        if (!orderDate || initialDate.toISOString() !== orderDate.toISOString()) {
           setOrderDate(initialDate);
        }
      // Display date formatting is handled in the next effect
      isInitialLoadRef.current = false;
    }
  // Depend on isClient, toast, and the initial setting of orderDate
  }, [isClient, toast, orderDate === undefined]); // Re-run when orderDate is first set

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
     } else if (orderDate === undefined && isClient) {
         // Handle initial undefined state on client by setting to today
         const today = new Date();
         setOrderDate(today);
     } else {
          // Handle other invalid cases if they occur
          console.warn("Order date is invalid, resetting to today.");
          const today = new Date();
          setOrderDate(today); // Reset to today
     }
   // Depend only on orderDate and isClient flag
   }, [orderDate, isClient]);


  // Effect to save data to localStorage (debounced, client-side only)
  useEffect(() => {
    if (isInitialLoadRef.current || !isClient || orderDate === undefined) {
      if (!isClient && orderDate !== undefined) isInitialLoadRef.current = false; // Ensure initial load flag is cleared even if save is skipped
      return; // Don't save during initial load, if not client-side yet, or if date is still undefined
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

  const handleScreenshot = useCallback(async () => {
    if (!formRef.current) return;

    // Temporarily remove no-print elements before taking the screenshot
    const noPrintElements = formRef.current.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.classList.add('hidden-for-screenshot'));
    // Add print-specific styles temporarily
     formRef.current.classList.add('screenshot-mode');

    try {
        const canvas = await html2canvas(formRef.current, {
            scale: 2, // Increase scale for better resolution
            useCORS: true, // If images are from external sources
            logging: false, // Disable console logs from html2canvas
            onclone: (documentClone) => {
              // Ensure print styles are applied in the cloned document
              const clonedForm = documentClone.getElementById('printable-area');
              if (clonedForm) {
                 clonedForm.classList.add('screenshot-mode-clone'); // Apply styles specifically for the clone if needed
                  // You might need to re-apply certain styles dynamically here if they don't transfer
              }
            }
        });
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = 'release-order.png';
        link.click();
        toast({
            title: "Screenshot Saved",
            description: "The release order has been saved as an image.",
        });
    } catch (error) {
        console.error("Error taking screenshot:", error);
        toast({
            title: "Screenshot Failed",
            description: "Could not save the release order as an image.",
            variant: "destructive",
        });
    } finally {
        // Restore no-print elements and remove print styles after taking the screenshot
        noPrintElements.forEach(el => el.classList.remove('hidden-for-screenshot'));
         formRef.current.classList.remove('screenshot-mode');
    }
}, [toast]);


   // Guard against hydration errors for date display
   // Render placeholder or null on server, actual date on client
   const safeDisplayDate = isClient && orderDate ? displayDate : '';


  // --- Main Render ---
  return (
    <div className="max-w-[210mm] mx-auto font-bold" ref={formRef}>
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

      {/* Printable Area */}
      <Card id="printable-area" className="w-full print-border-heavy rounded-none shadow-none p-5 border-2 border-black">
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
                 {/* Popover for Screen - Render based on client-side check */}
                 {isClient ? (
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
                         {/* Display formatted date or placeholder */}
                         <span>{safeDisplayDate || 'Pick a date'}</span>
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0 no-print">
                       <Calendar
                         mode="single"
                         selected={orderDate} // Use the Date object state
                         onSelect={(date) => {
                            // Ensure we only set a valid date or keep the existing one if undefined is selected
                            if (date instanceof Date && !isNaN(date.getTime())) {
                                setOrderDate(date);
                            } else if (date === undefined) {
                                // Optional: handle deselection, maybe reset to today or keep current
                                // setOrderDate(new Date()); // Or keep the current orderDate
                            }
                         }}
                         initialFocus
                       />
                     </PopoverContent>
                   </Popover>
                 ) : (
                   // Server-side or initial client render: Show a placeholder or static non-interactive element
                   <div className={cn(
                      "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm shadow-none",
                      "text-muted-foreground" // Indicate loading or non-interactive state
                    )}>
                      <CalendarIcon className="mr-2 h-4 w-4 inline-block" />
                      <span>Loading date...</span>
                    </div>
                 )}
                 {/* Static Display for Print/Screenshot - Always render this div but control visibility */}
                  <div className={cn(
                      "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm shadow-none print-only-inline-block hidden items-center",
                       // Use safeDisplayDate for conditional styling if needed
                       !safeDisplayDate && "text-muted-foreground"
                    )}
                  >
                    {/* Display formatted date or 'N/A' */}
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
                  <TableRow key={row.id} className="h-[150px]"> {/* Set height on TableRow */}
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                       <Textarea
                          id={`keyNo-${row.id}`}
                          value={row.keyNo}
                          onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)}
                          className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                          // style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                       />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                       <Textarea
                          id={`publication-${row.id}`}
                          value={row.publication}
                          onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)}
                          className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                           // style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                        />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                       <Textarea
                          id={`edition-${row.id}`}
                          value={row.edition}
                          onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)}
                          className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                           // style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                        />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                       <Textarea
                           id={`size-${row.id}`}
                           value={row.size}
                           onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)}
                           className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                            // style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                         />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                       <Textarea
                           id={`scheduledDate-${row.id}`}
                           value={row.scheduledDate}
                           onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)}
                           className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                           // style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                       />
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                       <Textarea
                          id={`position-${row.id}`}
                          value={row.position}
                          onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)}
                          className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none"
                          // style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
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
                <span className="text-base font-bold whitespace-nowrap matter-text-print matter-text-screen" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>MATTER</span>
             </div>
             <div className="matter-content flex-1 p-1">
               <Textarea
                 id="matterArea"
                 placeholder="Enter matter here..."
                 className="w-full h-full resize-none border-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1 align-top"
                 value={matter}
                 onChange={(e) => setMatter(e.target.value)}
                 // style={{ writingMode: 'horizontal-tb' }} // Ensure horizontal for input
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

               {/* Stamp Area - Interactive Container (Screen Only) */}
               <div
                  id="stampContainerElement"
                  className="stamp-container-interactive absolute top-2 right-2 w-[180px] h-[142px] flex items-center justify-center cursor-pointer overflow-hidden group no-print" // Hide this container for print/screenshot
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
                              width={180} // Static width for screen preview container
                              height={142} // Static height for screen preview container
                              style={{ objectFit: 'contain' }} // Fit within bounds
                              className="block max-w-full max-h-full"
                            />
                            {/* Hover effect */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-bold">Click/Hover to Change</span>
                            </div>
                       </div>
                  ) : (
                       <Label htmlFor="stampFile" className="text-center text-xs text-muted-foreground cursor-pointer p-1 group-hover:opacity-75 transition-opacity">
                           Click or Hover<br/> to Upload Stamp
                       </Label>
                  )}
              </div>
               {/* Visible Stamp Image for Print/Screenshot Only */}
                {stampPreview && (
                 <div className="stamp-container-print absolute top-2 right-2 w-[180px] h-[142px] hidden print-only-flex items-center justify-center">
                   <Image
                      src={stampPreview}
                      alt="Stamp"
                      width={180} // Explicit width for print/screenshot
                      height={142} // Explicit height for print/screenshot
                      style={{ objectFit: 'contain' }} // Fit within bounds
                      className="stamp-print-image max-w-full max-h-full" // Ensure it doesn't exceed container
                    />
                 </div>
               )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
