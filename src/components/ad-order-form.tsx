
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // Import cn utility

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
  noteInput: string;
  roNumber: string;
  orderDate: string | null;
  clientName: string;
  advertisementManagerLine1: string; // Added for Advertisement Manager
  advertisementManagerLine2: string; // Added for Advertisement Manager
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
  const [noteInput, setNoteInput] = useState('');
  const [roNumber, setRoNumber] = useState('');
  // Initialize orderDate to undefined to prevent hydration mismatch
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [clientName, setClientName] = useState('');
  const [advertisementManagerLine1, setAdvertisementManagerLine1] = useState(''); // State for Adv Manager Line 1
  const [advertisementManagerLine2, setAdvertisementManagerLine2] = useState(''); // State for Adv Manager Line 2


  const stampFileRef = useRef<HTMLInputElement>(null);
  const printableAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const [isClient, setIsClient] = useState(false); // State to track client-side mounting

  // --- Data Recovery Logic ---
  useEffect(() => {
    // Indicate client-side has mounted
    setIsClient(true);

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
        setNoteInput(parsedData.noteInput || '');
        setRoNumber(parsedData.roNumber || '');
        // Load saved date or default to today if null/invalid
        setOrderDate(parsedData.orderDate ? new Date(parsedData.orderDate) : new Date());
        setClientName(parsedData.clientName || '');
        setAdvertisementManagerLine1(parsedData.advertisementManagerLine1 || ''); // Load Adv Manager Line 1
        setAdvertisementManagerLine2(parsedData.advertisementManagerLine2 || ''); // Load Adv Manager Line 2
        toast({
          title: "Draft Recovered",
          description: "Previously entered form data has been loaded.",
        });
      } else {
        // If no saved data, ensure date is today's date
        setOrderDate(new Date());
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      // Default to today's date on error as well
      setOrderDate(new Date());
      toast({
        title: "Recovery Failed",
        description: "Could not recover previous draft data. Please check console for errors.",
        variant: "destructive",
      });
    } finally {
      isInitialLoadRef.current = false;
    }
  }, [toast]); // Runs only once on client after mount

  // Save data to localStorage with debounce
  useEffect(() => {
    // Skip saving during initial load until recovery logic finishes
    if (isInitialLoadRef.current) {
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
          noteInput,
          roNumber,
          orderDate: orderDate ? orderDate.toISOString() : null,
          clientName,
          advertisementManagerLine1, // Save Adv Manager Line 1
          advertisementManagerLine2, // Save Adv Manager Line 2
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
        // console.log("Form data saved to localStorage");
      } catch (error) {
        console.error("Failed to save data to localStorage:", error);
        // Optionally notify user
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
    // Add new state variables to dependency array
  }, [caption, packageName, matter, scheduleRows, stampPreview, noteInput, roNumber, orderDate, clientName, advertisementManagerLine1, advertisementManagerLine2]);


  // --- Form Handlers ---

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
  }, [toast]);

  const triggerStampUpload = useCallback(() => {
    stampFileRef.current?.click();
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleClearForm = useCallback(() => {
    setCaption('');
    setPackageName('');
    setMatter('');
    setScheduleRows([{ id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
    setStampPreview(null);
    setNoteInput('');
    setRoNumber('');
    setOrderDate(new Date()); // Reset date to today
    setClientName('');
    setAdvertisementManagerLine1(''); // Clear Adv Manager Line 1
    setAdvertisementManagerLine2(''); // Clear Adv Manager Line 2
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


  return (
    <div className="max-w-[210mm] mx-auto font-bold">
       <div className="flex justify-end gap-2 mb-4 no-print">
            <Button onClick={handleClearForm} variant="outline">
              <Eraser className="mr-2 h-4 w-4" /> Clear Form & Draft
            </Button>
            <Button onClick={handlePrint}>
              Print Release Order
            </Button>
        </div>

      <Card id="printable-area" ref={printableAreaRef} className="w-full print-border-heavy rounded-none shadow-none p-5">
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center bg-black text-white p-1 rounded mb-5 header-title">
            <h1 className="text-2xl m-0 font-bold">RELEASE ORDER</h1>
          </div>

           {/* Address Boxes */}
          <div className="flex justify-between gap-3 mb-5">
            {/* Left Address Box */}
            <div className="w-[48%] print-border rounded p-2">
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
            <div className="w-[48%] print-border rounded p-2 space-y-2">
                 {/* R.O. No. LN */}
                 <div className="flex items-center">
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
                 <div className="flex items-center">
                    <Label htmlFor="orderDate" className="w-20 text-sm shrink-0">Date:</Label>
                     {/* Conditionally render based on client-side mount */}
                     {isClient ? (
                         <Popover>
                             <PopoverTrigger asChild>
                             <Button
                                 variant={"outline"}
                                 className={cn(
                                 "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none",
                                 !orderDate && "text-muted-foreground"
                                 )}
                                 id="orderDate"
                             >
                                 <CalendarIcon className="mr-2 h-4 w-4" />
                                 {orderDate ? format(orderDate, "dd.MM.yyyy") : <span>Pick a date</span>}
                             </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0 no-print">
                             <Calendar
                                 mode="single"
                                 selected={orderDate}
                                 onSelect={setOrderDate}
                                 initialFocus
                             />
                             </PopoverContent>
                         </Popover>
                     ) : (
                         <Button
                             variant={"outline"}
                             className={cn(
                             "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-muted-foreground"
                             )}
                             id="orderDate"
                             disabled
                         >
                             <CalendarIcon className="mr-2 h-4 w-4" />
                             {/* Display today's date formatted, avoids hydration mismatch */}
                             <span suppressHydrationWarning>{format(new Date(), "dd.MM.yyyy")}</span> {/* Use suppressHydrationWarning here */}
                         </Button>
                     )}
                 </div>
                  {/* Client */}
                 <div className="flex items-center">
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

          {/* Advertisement Manager Section - MOVED HERE */}
            <div className="print-border rounded p-2 mb-5">
                <Label className="block mb-1">The Advertisement Manager</Label>
                <Input
                    type="text"
                    placeholder="Line 1"
                    className="w-full border-0 border-b border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto mb-1"
                    value={advertisementManagerLine1}
                    onChange={(e) => setAdvertisementManagerLine1(e.target.value)}
                />
                <Input
                    type="text"
                    placeholder="Line 2"
                    className="w-full border-0 border-b border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto"
                    value={advertisementManagerLine2}
                    onChange={(e) => setAdvertisementManagerLine2(e.target.value)}
                />
                 <p className="text-sm mt-2">Kindly insert the advertisement/s in your issue/s for the following date/s</p> {/* Added text line */}
            </div>

          {/* Caption & Package - MOVED HERE */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 print-border rounded p-2">
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
            <div className="w-[30%] print-border rounded p-2">
              <Label htmlFor="package" className="block mb-1">Package:</Label>
              <Input
                id="package"
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
            <Table className="print-border">
              <TableHeader className="bg-secondary">
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
                    <TableCell className="print-border-thin border border-black p-0">
                      <Input type="text" value={row.keyNo} onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0">
                      <Input type="text" value={row.publication} onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0">
                      <Input type="text" value={row.edition} onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0">
                      <Input type="text" value={row.size} onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0">
                      <Input type="text" value={row.scheduledDate} onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1"/>
                    </TableCell>
                     <TableCell className="print-border-thin border border-black p-0">
                      <Input type="text" value={row.position} onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)} className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1"/>
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
          <div className="flex h-[150px] print-border rounded mb-5 overflow-hidden">
            <div className="vertical-label bg-black text-white flex items-center justify-center p-1" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
              <span className="text-base font-bold transform rotate-180">MATTER</span>
            </div>
            <div className="flex-1 p-1">
              <Textarea
                placeholder="Enter matter here..."
                className="w-full h-full resize-none border-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1"
                value={matter}
                onChange={(e) => setMatter(e.target.value)}
              />
            </div>
          </div>

          {/* Billing Info */}
          <div className="print-border rounded p-2 mb-5">
            <p className="font-bold mb-1">Forward all bills with relevant voucher copies to:</p>
            <p className="text-sm leading-tight">
              D-9 & D-10, 1st Floor, Pushpa Bhawan,<br />
              Alaknanda Commercial Complex,<br />
              New Delhi-110019<br />
              Tel: 49573333, 34, 35, 36<br />
              Fax: 26028101
            </p>
          </div>

          {/* Notes & Stamp */}
          <div className="relative print-border rounded p-2 pr-[130px]">
            <p className="font-bold mb-1">Note:</p>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Space reserved vide our letter No.<Input type="text" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} className="inline-block w-24 h-5 p-0 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none font-bold" /></li>
              <li>No two advertisements of the same client should appear in the same issue.</li>
              <li>Please quote R.O. No. in all your bills and letters.</li>
              <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
            </ol>
             {/* Stamp Area */}
            <div className="stamp-container absolute top-2 right-2 w-[100px] h-[100px] rounded bg-white flex items-center justify-center cursor-pointer overflow-hidden"> {/* Removed print-border-thin */}
                <Input
                    type="file"
                    ref={stampFileRef}
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="hidden"
                    id="stampFile"
                    />
                 {stampPreview ? (
                     <div className="relative w-full h-full">
                         <Image
                            id="stampPreview"
                            src={stampPreview}
                            alt="Stamp Preview"
                            width={100} // Fixed width
                            height={100} // Fixed height
                            className="object-contain w-full h-full" // Use object-contain and full width/height
                            unoptimized
                          />
                     </div>
                ) : (
                     <Label htmlFor="stampFile" className="text-center text-xs text-muted-foreground cursor-pointer p-1">Click to Upload Stamp</Label>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
