
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
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, Printer, X, Expand } from 'lucide-react';
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
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [clientName, setClientName] = useState('');
  const [advertisementManagerLine1, setAdvertisementManagerLine1] = useState('');
  const [advertisementManagerLine2, setAdvertisementManagerLine2] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [displayDate, setDisplayDate] = useState<string>('');
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false); // State for fullscreen preview


  // --- Ref Hooks ---
  const stampFileRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const formRef = useRef<HTMLDivElement>(null);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  // --- Custom Hooks ---
  const { toast } = useToast();

  // --- Effect Hooks ---

  // Set client flag after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize date on client-side mount
  useEffect(() => {
    if (isClient && orderDate === undefined) {
      setOrderDate(new Date());
    }
  }, [isClient, orderDate]);

  // Effect to load data
  useEffect(() => {
    if (!isClient) return;

    let initialDate = new Date();
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData: FormData = JSON.parse(savedData);
        setCaption(parsedData.caption || '');
        setPackageName(parsedData.packageName || '');
        setMatter(parsedData.matter || '');
        const loadedRows = Array.isArray(parsedData.scheduleRows) && parsedData.scheduleRows.length > 0
          ? parsedData.scheduleRows.map(row => ({
              ...row,
              id: row.id || Date.now() + Math.random()
            }))
          : [{ id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }];
        setScheduleRows(loadedRows);
        setStampPreview(parsedData.stampPreview || null);
        setRoNumber(parsedData.roNumber || '');

        if (parsedData.orderDate) {
           const savedDateObj = new Date(parsedData.orderDate);
           if (!isNaN(savedDateObj.getTime())) {
               initialDate = savedDateObj;
           } else {
                console.warn("Invalid date found in localStorage, using today's date instead.");
           }
        }

        setClientName(parsedData.clientName || '');
        setAdvertisementManagerLine1(parsedData.advertisementManagerLine1 || '');
        setAdvertisementManagerLine2(parsedData.advertisementManagerLine2 || '');
      } else {
           // If no saved data, set date to today
           if (orderDate === undefined) {
               setOrderDate(initialDate);
           }
      }
      // Set orderDate state (either loaded or default today) only if it's still undefined
       if (orderDate === undefined) {
         setOrderDate(initialDate);
       }

    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      toast({
        title: "Recovery Failed",
        description: "Could not recover previous draft data. Using defaults.",
        variant: "destructive",
      });
       // Ensure date is set to today even if loading fails and it wasn't set before
       if (orderDate === undefined) {
           setOrderDate(initialDate);
       }
    } finally {
        isInitialLoadRef.current = false;
    }
  }, [isClient, toast]); // Remove orderDate from deps here to avoid re-running on programmatic set


   // Effect to update displayDate whenever orderDate changes (client-side only)
   useEffect(() => {
     if (!isClient || !orderDate || isNaN(orderDate.getTime())) return;

     try {
         setDisplayDate(format(orderDate, "dd.MM.yyyy"));
     } catch (error) {
         console.error("Error formatting date:", error);
         // Re-set to ensure validity if format fails, though this shouldn't happen often
         const today = new Date();
         setOrderDate(today); // Consider if this is the desired fallback
         setDisplayDate(format(today, "dd.MM.yyyy"));
     }
   }, [orderDate, isClient]);


  // Effect to save data to localStorage (debounced, client-side only)
  useEffect(() => {
    if (isInitialLoadRef.current || !isClient) {
       // Prevent saving during initial load or if not on client
        return;
    }

    // Proceed with saving only if orderDate is defined and valid
    if (orderDate === undefined || isNaN(orderDate.getTime())) {
      // Optionally log or handle the case where date is invalid/undefined before saving attempt
      // console.warn("Attempted to save with undefined or invalid date. Skipping save.");
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
          // Ensure orderDate is valid before converting to ISO string
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

  // Effect to handle body class for fullscreen preview
  useEffect(() => {
    if (isFullScreenPreview) {
      document.body.classList.add('fullscreen-preview-mode');
    } else {
      document.body.classList.remove('fullscreen-preview-mode');
    }
    // Cleanup function
    return () => {
      document.body.classList.remove('fullscreen-preview-mode');
    };
  }, [isFullScreenPreview]);


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
    setOrderDate(today);
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

   // Function to enter fullscreen preview
   const handleFullScreenPreview = useCallback(() => {
     setIsFullScreenPreview(true);
   }, []);

   // Function to exit fullscreen preview
   const handleExitFullScreenPreview = useCallback(() => {
       setIsFullScreenPreview(false);
   }, []);

   // Function to trigger browser's print dialog
   const handlePrint = useCallback(() => {
      // Ensure fullscreen mode is exited before printing
      // handleExitFullScreenPreview(); // Keep fullscreen for printing the preview
      // Add a slight delay to allow DOM to update before printing
      setTimeout(() => {
         window.print();
      }, 100);
   }, []); // Removed handleExitFullScreenPreview dependency

   const safeDisplayDate = isClient && orderDate && !isNaN(orderDate.getTime()) ? displayDate : 'Loading...';


  // --- Main Render ---
  return (
    <div className={cn("max-w-[210mm] mx-auto font-bold", isFullScreenPreview ? 'fullscreen-container' : '')}>
      {/* Fullscreen Preview Mode */}
      {isFullScreenPreview && (
          <div className="fullscreen-overlay">
              <div className="fullscreen-content-wrapper">
                  {/* Close Button for Fullscreen */}
                   <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-4 right-4 z-50 print-hidden"
                      onClick={handleExitFullScreenPreview}
                   >
                       <X className="h-4 w-4" />
                       <span className="sr-only">Close Preview</span>
                   </Button>
                   {/* Print Button within Fullscreen */}
                  <Button
                     variant="outline"
                     className="absolute top-4 left-4 z-50 print-hidden" // Use print-hidden class
                     onClick={handlePrint}
                   >
                     <Printer className="mr-2 h-4 w-4" /> Print
                   </Button>


                  {/* Render the printable area inside the fullscreen overlay */}
                  <Card
                      id="printable-area"
                      ref={printableAreaRef}
                      className="w-full print-border-heavy rounded-none shadow-none p-5 border-2 border-black bg-white overflow-auto" // Added overflow-auto
                      style={{ height: 'calc(100vh - 4rem)' }} // Example height, adjust as needed
                  >
                      {/* Content identical to the normal view */}
                     <CardContent className="p-0 card-content-print-fix card-content-pdf-fix">
                        {/* Header */}
                        <div className="text-center bg-black text-white p-1 mb-5 header-title">
                          <h1 className="text-xl m-0 font-bold">RELEASE ORDER</h1>
                        </div>

                        {/* Advertisement Manager Section */}
                         <div className="advertisement-manager-section print-border rounded p-2 mb-5 border border-black">
                           <Label className="block mb-1 text-sm">The Advertisement Manager</Label>
                           <div className="relative mb-0.5">
                             <Input
                               id="adManager1Preview"
                               type="text"
                               placeholder="Line 1"
                               className="w-full border-0 border-b border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                               value={advertisementManagerLine1}
                               readOnly // Make inputs read-only in preview
                             />
                           </div>
                           <div className="relative">
                             <Input
                               id="adManager2Preview"
                               type="text"
                               placeholder="Line 2"
                               className="w-full border-0 border-b border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                               value={advertisementManagerLine2}
                               readOnly // Make inputs read-only in preview
                             />
                           </div>
                           <p className="text-xs mt-1">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                         </div>


                       {/* Heading & Package Section */}
                       <div className="heading-package-container flex gap-3 mb-5">
                         <div className="heading-caption-box flex-1 print-border-heavy rounded p-2 border-2 border-black">
                           <Label htmlFor="captionPreview" className="block mb-1 text-sm">Heading/Caption:</Label>
                           {/* Display value instead of input */}
                           <p id="captionPreview" className="w-full px-1 py-0.5 text-sm font-bold min-h-[1.5em] border-b border-black">{caption || <span className="text-muted-foreground italic">Not entered</span>}</p>
                         </div>
                         <div className="package-box w-[30%] print-border-heavy rounded p-2 border-2 border-black">
                           <Label htmlFor="packagePreview" className="block mb-1 text-sm">Package:</Label>
                            {/* Display value instead of input */}
                            <p id="packagePreview" className="w-full px-1 py-0.5 text-sm font-bold min-h-[1.5em] border-b border-black">{packageName || <span className="text-muted-foreground italic">Not entered</span>}</p>
                         </div>
                       </div>


                       {/* Address Boxes Container */}
                       <div className="address-container flex justify-between gap-3 mb-5">
                         {/* Left Address Box */}
                         <div className="address-box w-[48%] print-border-heavy rounded p-2 border-2 border-black">
                           <p className="text-xs leading-tight">
                             Lehar Advertising Agency Pvt. Ltd.<br />
                             D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
                             Alaknanda Commercial Complex,<br />
                             New Delhi-110019<br />
                             Tel: 49573333, 34, 35, 36<br />
                             Fax: 26028101
                           </p>
                         </div>
                          {/* Right Box: R.O., Date, Client */}
                           <div className="ro-date-client-container w-[48%] print-border-heavy rounded p-2 space-y-1 border-2 border-black">
                             {/* R.O. No. LN */}
                             <div className="field-row flex items-center">
                               <Label className="w-auto text-sm shrink-0 mr-1">R.O.No.LN:</Label>
                               <p className="flex-1 h-6 px-1 py-0.5 text-sm font-bold border-b border-black">{roNumber || <span className="text-muted-foreground italic">Not entered</span>}</p>
                             </div>
                             {/* Date */}
                             <div className="field-row flex items-center">
                               <Label className="w-auto text-sm shrink-0 mr-1">Date:</Label>
                               <p className="flex-1 h-6 px-1 py-0.5 text-sm font-bold border-b border-black text-center">{safeDisplayDate}</p>
                             </div>
                             {/* Client */}
                             <div className="field-row flex items-center">
                               <Label className="w-auto text-sm shrink-0 mr-1">Client:</Label>
                               <p className="flex-1 h-6 px-1 py-0.5 text-sm font-bold border-b border-black">{clientName || <span className="text-muted-foreground italic">Not entered</span>}</p>
                             </div>
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
                                 <TableRow key={row.id + '-preview'} className="min-h-[100px] align-top">
                                   <TableCell className="print-border-thin border border-black p-1 print-table-cell align-top">
                                     <div className="w-full h-full text-xs font-bold align-top whitespace-pre-wrap break-words min-h-[100px]">
                                       {row.keyNo}
                                     </div>
                                   </TableCell>
                                   <TableCell className="print-border-thin border border-black p-1 print-table-cell align-top">
                                     <div className="w-full h-full text-xs font-bold align-top whitespace-pre-wrap break-words min-h-[100px]">
                                       {row.publication}
                                     </div>
                                   </TableCell>
                                   <TableCell className="print-border-thin border border-black p-1 print-table-cell align-top">
                                     <div className="w-full h-full text-xs font-bold align-top whitespace-pre-wrap break-words min-h-[100px]">
                                       {row.edition}
                                     </div>
                                   </TableCell>
                                   <TableCell className="print-border-thin border border-black p-1 print-table-cell align-top">
                                     <div className="w-full h-full text-xs font-bold align-top whitespace-pre-wrap break-words min-h-[100px]">
                                       {row.size}
                                     </div>
                                   </TableCell>
                                   <TableCell className="print-border-thin border border-black p-1 print-table-cell align-top">
                                     <div className="w-full h-full text-xs font-bold align-top whitespace-pre-wrap break-words min-h-[100px]">
                                       {row.scheduledDate}
                                     </div>
                                   </TableCell>
                                   <TableCell className="print-border-thin border border-black p-1 print-table-cell align-top">
                                     <div className="w-full h-full text-xs font-bold align-top whitespace-pre-wrap break-words min-h-[100px]">
                                       {row.position}
                                     </div>
                                   </TableCell>
                                 </TableRow>
                               ))}
                             </TableBody>
                          </Table>
                        </div>

                        {/* Matter Section */}
                         <div className="matter-box flex h-[100px] print-border-heavy rounded mb-5 overflow-hidden border-2 border-black">
                           {/* Vertical Text Label */}
                           <div className="vertical-label bg-black text-white flex items-center justify-center p-1 w-6 flex-shrink-0">
                             <span className="text-sm font-bold whitespace-nowrap matter-text-print">
                               MATTER
                             </span>
                           </div>
                           {/* Display matter content */}
                           <div className="matter-content flex-1 p-1 overflow-auto">
                              <div className="whitespace-pre-wrap break-words text-sm font-bold h-full">
                                  {matter}
                              </div>
                           </div>
                         </div>


                        {/* Billing Info */}
                        <div className="billing-address-box print-border rounded p-2 mb-5 border border-black">
                           <p className="font-bold mb-1 billing-title-underline text-sm">Forward all bills with relevant voucher copies to:</p>
                           <p className="text-xs leading-tight pt-1">
                             D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
                             Alaknanda Commercial Complex,<br />
                             New Delhi-110019<br />
                             Tel: 49573333, 34, 35, 36<br />
                             Fax: 26028101
                           </p>
                         </div>


                         {/* Notes & Stamp Container */}
                          <div className="notes-stamp-container relative print-border rounded p-2 border border-black min-h-[90px]">
                            {/* Notes Section */}
                             <div className="notes-content flex-1 pr-[110px]"> {/* Ensure space for stamp */}
                               <p className="font-bold mb-1 note-title-underline text-sm">Note:</p>
                               <ol className="list-decimal list-inside text-xs space-y-0.5 pt-1 pl-3">
                                 <li>Space reserved vide our letter No.</li>
                                 <li>No two advertisements of the same client should appear in the same issue.</li>
                                 <li>Please quote R.O. No. in all your bills and letters.</li>
                                 <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
                               </ol>
                             </div>

                             {/* Visible Stamp Image for Print/PDF Only */}
                             {stampPreview && (
                               <div className="stamp-container-print absolute top-[2pt] right-[2pt] w-[100px] h-[80px] flex items-center justify-center border-none overflow-hidden">
                                 <Image
                                   src={stampPreview}
                                   alt="Stamp"
                                   width={100}
                                   height={80}
                                   style={{ objectFit: 'contain' }}
                                   className="stamp-print-image max-w-full max-h-full"
                                 />
                               </div>
                             )}
                          </div>
                      </CardContent>
                  </Card>
              </div>
          </div>
      )}

      {/* Action Buttons - Visible normally */}
      <div className="flex justify-end gap-2 mb-4 no-print">
         <Button onClick={handleFullScreenPreview} variant="outline">
             <Expand className="mr-2 h-4 w-4" /> Full Display
         </Button>
        <Button onClick={handleClearForm} variant="destructive">
          <Eraser className="mr-2 h-4 w-4" /> Clear Form & Draft
        </Button>
      </div>


      {/* Use the ref on the actual printable area */}
      <Card id="printable-area-form" ref={formRef} className="w-full print-border-heavy rounded-none shadow-none p-5 border-2 border-black bg-white">
        {/* Use correct class for CardContent */}
        <CardContent className="p-0 card-content-print-fix card-content-pdf-fix">
          {/* Header */}
          <div className="text-center bg-black text-white p-1 mb-5 header-title">
            <h1 className="text-xl m-0 font-bold">RELEASE ORDER</h1>
          </div>

           {/* Advertisement Manager Section */}
           <div className="advertisement-manager-section print-border rounded p-2 mb-5 border border-black">
             <Label className="block mb-1 text-sm">The Advertisement Manager</Label>
             <div className="relative mb-0.5">
               <Input
                 id="adManager1"
                 type="text"
                 placeholder="Line 1"
                 className="w-full border-0 border-b border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                 value={advertisementManagerLine1}
                 onChange={(e) => setAdvertisementManagerLine1(e.target.value)}
               />
             </div>
             <div className="relative">
               <Input
                 id="adManager2"
                 type="text"
                 placeholder="Line 2"
                 className="w-full border-0 border-b border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                 value={advertisementManagerLine2}
                 onChange={(e) => setAdvertisementManagerLine2(e.target.value)}
               />
             </div>
             <p className="text-xs mt-1">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
           </div>


          {/* Heading & Package Section */}
          <div className="heading-package-container flex gap-3 mb-5">
            <div className="heading-caption-box flex-1 print-border-heavy rounded p-2 border-2 border-black">
              <Label htmlFor="caption" className="block mb-1 text-sm">Heading/Caption:</Label>
              <Input
                id="caption"
                type="text"
                placeholder="Enter caption here"
                className="w-full border-0 border-b border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            <div className="package-box w-[30%] print-border-heavy rounded p-2 border-2 border-black">
              <Label htmlFor="package" className="block mb-1 text-sm">Package:</Label>
              <Input
                id="package"
                type="text"
                placeholder="Enter package name"
                className="w-full border-0 border-b border-black rounded-none px-1 py-0.5 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              />
            </div>
          </div>

          {/* Address Boxes Container */}
          <div className="address-container flex justify-between gap-3 mb-5">
            {/* Left Address Box */}
            <div className="address-box w-[48%] print-border-heavy rounded p-2 border-2 border-black">
              <p className="text-xs leading-tight">
                Lehar Advertising Agency Pvt. Ltd.<br />
                D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
                Alaknanda Commercial Complex,<br />
                New Delhi-110019<br />
                Tel: 49573333, 34, 35, 36<br />
                Fax: 26028101
              </p>
            </div>
            {/* Right Box: R.O., Date, Client */}
             <div className="ro-date-client-container w-[48%] print-border-heavy rounded p-2 space-y-1 border-2 border-black">
               {/* R.O. No. LN */}
               <div className="field-row flex items-center">
                 <Label htmlFor="roNumber" className="w-auto text-sm shrink-0 mr-1">R.O.No.LN:</Label>
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
                 <Label htmlFor="orderDateTrigger" className="w-auto text-sm shrink-0 mr-1">Date:</Label>
                 <div className={cn(
                   "flex-1 justify-center text-center font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm shadow-none items-center flex",
                   !safeDisplayDate && "text-muted-foreground"
                 )}>
                   <span id="orderDateDisplay" className="flex-1">{safeDisplayDate}</span>
                   {isClient ? (
                     <Popover>
                       <PopoverTrigger asChild>
                         <Button
                           variant={"ghost"}
                           className={cn(
                             "h-6 w-6 p-0 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none no-print ml-1",
                           )}
                           id="orderDateTrigger"
                         >
                           <CalendarIcon className="h-4 w-4" />
                           <span className="sr-only">Pick a date</span>
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0 no-print">
                         <Calendar
                           mode="single"
                           selected={orderDate}
                           onSelect={(date) => {
                             if (date instanceof Date && !isNaN(date.getTime())) {
                               setOrderDate(date);
                             } else if (date === undefined) {
                               // Keep existing date if undefined is selected (or set to today if needed)
                               // const today = new Date();
                               // setOrderDate(today);
                             }
                           }}
                           initialFocus
                         />
                       </PopoverContent>
                     </Popover>
                   ) : (
                     <Button
                       variant={"ghost"}
                       className={cn(
                         "h-6 w-6 p-0 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none no-print ml-1",
                         "text-muted-foreground"
                       )}
                       disabled
                     >
                       <CalendarIcon className="h-4 w-4" />
                       <span className="sr-only">Loading date picker...</span>
                     </Button>
                   )}
                 </div>
               </div>

               {/* Client */}
               <div className="field-row flex items-center">
                 <Label htmlFor="clientName" className="w-auto text-sm shrink-0 mr-1">Client:</Label>
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
                  <TableRow key={row.id} className="min-h-[100px] align-top">
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                      <Textarea
                        value={row.keyNo}
                        onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)}
                        className="w-full h-full border-none rounded-none text-xs font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1 py-1 align-top resize-none min-h-[100px]"
                      />
                    </TableCell>
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                      <Textarea
                        value={row.publication}
                        onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)}
                        className="w-full h-full border-none rounded-none text-xs font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1 py-1 align-top resize-none min-h-[100px]"
                      />
                    </TableCell>
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                      <Textarea
                        value={row.edition}
                        onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)}
                        className="w-full h-full border-none rounded-none text-xs font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1 py-1 align-top resize-none min-h-[100px]"
                      />
                    </TableCell>
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                      <Textarea
                        value={row.size}
                        onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)}
                        className="w-full h-full border-none rounded-none text-xs font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1 py-1 align-top resize-none min-h-[100px]"
                      />
                    </TableCell>
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                      <Textarea
                        value={row.scheduledDate}
                        onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)}
                        className="w-full h-full border-none rounded-none text-xs font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1 py-1 align-top resize-none min-h-[100px]"
                      />
                    </TableCell>
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top">
                      <Textarea
                        value={row.position}
                        onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)}
                        className="w-full h-full border-none rounded-none text-xs font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1 py-1 align-top resize-none min-h-[100px]"
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
          <div className="matter-box flex h-[100px] print-border-heavy rounded mb-5 overflow-hidden border-2 border-black">
            {/* Vertical Text Label */}
            <div className="vertical-label bg-black text-white flex items-center justify-center p-1 w-6 flex-shrink-0">
              <span className="text-sm font-bold whitespace-nowrap matter-text-print">
                MATTER
              </span>
            </div>
            <div className="matter-content flex-1 p-1">
              <Textarea
                id="matterArea"
                placeholder="Enter matter here..."
                className="w-full h-full resize-none border-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1 align-top"
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
              />
            </div>
          </div>


          {/* Billing Info */}
          <div className="billing-address-box print-border rounded p-2 mb-5 border border-black">
             <p className="font-bold mb-1 billing-title-underline text-sm">Forward all bills with relevant voucher copies to:</p>
             <p className="text-xs leading-tight pt-1">
               D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
               Alaknanda Commercial Complex,<br />
               New Delhi-110019<br />
               Tel: 49573333, 34, 35, 36<br />
               Fax: 26028101
             </p>
           </div>


           {/* Notes & Stamp Container */}
            <div className="notes-stamp-container relative print-border rounded p-2 border border-black min-h-[90px]">
              {/* Notes Section */}
               <div className="notes-content flex-1 pr-[110px]"> {/* Ensure space for stamp */}
                 <p className="font-bold mb-1 note-title-underline text-sm">Note:</p>
                 <ol className="list-decimal list-inside text-xs space-y-0.5 pt-1 pl-3">
                   <li>Space reserved vide our letter No.</li>
                   <li>No two advertisements of the same client should appear in the same issue.</li>
                   <li>Please quote R.O. No. in all your bills and letters.</li>
                   <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
                 </ol>
               </div>

              {/* Stamp Area - Interactive Container (Screen Only) */}
              <div
                id="stampContainerElement"
                className="stamp-container-interactive absolute top-1 right-1 w-[100px] h-[80px] flex items-center justify-center cursor-pointer overflow-hidden group no-print"
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
                      width={100}
                      height={80}
                      style={{ objectFit: 'contain' }}
                      className="block max-w-full max-h-full"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] font-bold text-center leading-tight">Click/Hover<br />to Change</span>
                    </div>
                  </div>
                ) : (
                  <Label htmlFor="stampFile" className="text-center text-[10px] text-muted-foreground cursor-pointer p-1 group-hover:opacity-75 transition-opacity leading-tight">
                    Click or Hover<br /> to Upload Stamp
                  </Label>
                )}
              </div>
              {/* Visible Stamp Image for Print/PDF Only */}
              {stampPreview && (
                <div className="stamp-container-print absolute top-[2pt] right-[2pt] w-[100px] h-[80px] hidden print-only-flex pdf-only-flex items-center justify-center border-none overflow-hidden">
                  <Image
                    src={stampPreview}
                    alt="Stamp"
                    width={100}
                    height={80}
                    style={{ objectFit: 'contain' }}
                    className="stamp-print-image max-w-full max-h-full"
                  />
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
