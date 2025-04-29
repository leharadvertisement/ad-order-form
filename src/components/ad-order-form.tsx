

'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
        // Set default date to today if no saved data
        const today = new Date();
        setOrderDate(today);
        setDisplayDate(format(today, "dd.MM.yyyy"));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
       // Fallback to today's date on error
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
    if (!isInitialLoadRef.current && isClient) {
        if (orderDate && !isNaN(orderDate.getTime())) {
            try {
                setDisplayDate(format(orderDate, "dd.MM.yyyy"));
            } catch (error) {
                console.error("Error formatting date:", error);
                setDisplayDate("Invalid Date");
                 // Optionally reset to today if format fails
                 const today = new Date();
                 setOrderDate(today);
                 setDisplayDate(format(today, "dd.MM.yyyy"));
            }
        } else if (!orderDate) {
            // Handle case where date is cleared or becomes invalid
             const today = new Date();
             setOrderDate(today); // Reset to today if cleared or invalid
             setDisplayDate(format(today, "dd.MM.yyyy"));
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

  // Function to trigger the browser's print dialog
  const handlePrint = useCallback(() => {
      // Directly call window.print() to open the print preview dialog
      window.print();
  }, []);


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
    // Basic structure to avoid major layout shifts
    return (
        <div className="max-w-[210mm] mx-auto font-bold p-5 space-y-5">
            <div className="h-10 bg-muted rounded animate-pulse"></div> {/* Header placeholder */}
            <div className="flex justify-between gap-3">
                <div className="w-[48%] h-24 bg-muted rounded animate-pulse"></div> {/* Left Address placeholder */}
                <div className="w-[48%] h-24 bg-muted rounded animate-pulse"></div> {/* Right Box placeholder */}
            </div>
             <div className="h-16 bg-muted rounded animate-pulse"></div> {/* Ad Manager placeholder */}
            <div className="h-16 bg-muted rounded animate-pulse"></div> {/* Heading placeholder */}
            <div className="h-16 bg-muted rounded animate-pulse"></div> {/* Package placeholder */}
            <div className="h-48 bg-muted rounded animate-pulse"></div> {/* Table placeholder */}
            <div className="h-36 bg-muted rounded animate-pulse"></div> {/* Matter placeholder */}
            <div className="h-24 bg-muted rounded animate-pulse"></div> {/* Billing placeholder */}
            <div className="h-36 bg-muted rounded animate-pulse"></div> {/* Notes/Stamp placeholder */}
        </div>
    );
  }


  return (
    <div className="max-w-[210mm] mx-auto font-bold">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-4 no-print">
        <Button onClick={handleClearForm} variant="outline">
          <Eraser className="mr-2 h-4 w-4" /> Clear Form & Draft
        </Button>
         <Button onClick={handlePrint} variant="default">
           <Printer className="mr-2 h-4 w-4" /> Print Release Order
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
                 {/* Popover for Screen */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none no-print",
                        !orderDate && "text-muted-foreground"
                      )}
                      id="orderDateTrigger" // Use a different ID for the trigger if needed
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                       <span>{displayDate || 'Pick a date'}</span> {/* Ensure fallback text */}
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
                               // Handle invalid date selection, reset to today
                               const today = new Date();
                               setOrderDate(today);
                           }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                 {/* Static Display for Print */}
                 <div className={cn(
                     "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm shadow-none print-only-inline-block hidden items-center", // Use print-only-inline-block, initially hidden
                       !orderDate && "text-muted-foreground"
                     )}
                   >
                     <CalendarIcon className="mr-2 h-4 w-4" />
                      <span id="orderDatePrint">{displayDate || 'N/A'}</span> {/* Ensure fallback text and unique ID for print */}
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
                    {/* Adjusted height using min-h class and h-20 */}
                    <TableCell className="print-border-thin border border-black p-0 print-table-cell min-h-[100px] h-[100px] align-top">
                      <Input id={`keyNo-${row.id}`} type="text" value={row.keyNo} onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3 align-top"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell min-h-[100px] h-[100px] align-top">
                      <Input id={`publication-${row.id}`} type="text" value={row.publication} onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3 align-top"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell min-h-[100px] h-[100px] align-top">
                      <Input id={`edition-${row.id}`} type="text" value={row.edition} onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3 align-top"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell min-h-[100px] h-[100px] align-top">
                      <Input id={`size-${row.id}`} type="text" value={row.size} onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3 align-top"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell min-h-[100px] h-[100px] align-top">
                      <Input id={`scheduledDate-${row.id}`} type="text" value={row.scheduledDate} onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3 align-top"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0 print-table-cell min-h-[100px] h-[100px] align-top">
                      <Input id={`position-${row.id}`} type="text" value={row.position} onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-3 align-top"/>
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
             <div className="vertical-label bg-black text-white flex items-center justify-center p-1 w-8">
              <span className="text-base font-bold whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>MATTER</span>
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

               {/* Stamp Area - Positioned absolutely within the notes container */}
               <div
                  id="stampContainerElement"
                  className="stamp-container absolute top-2 right-2 w-[180px] h-[142px] flex items-center justify-center cursor-pointer overflow-hidden group" // Removed border-none
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
                              style={{ objectFit: 'contain' }} // Changed to contain to prevent stretching
                              className="block"
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
                          width={180} // Static width for print
                          height={142} // Static height for print
                          style={{ objectFit: 'contain' }} // Ensure it contains for print
                          className="block"
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

