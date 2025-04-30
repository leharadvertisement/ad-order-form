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
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, FileDown, Eye } from 'lucide-react'; // Added Eye for preview
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [isPreviewing, setIsPreviewing] = useState(false); // State for print preview mode
  const [pdfGenerationMode, setPdfGenerationMode] = useState(false); // State for PDF generation mode


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
        // Check if orderDate is already set (e.g., from localStorage) before defaulting to today
        if (orderDate === undefined) {
            setOrderDate(new Date()); // Set to today's date only if not already set
        }
    }
  // Depend only on isClient flag. Date setting logic moved to load effect.
  }, [isClient]);


  // Effect to load data
  useEffect(() => {
    // Only run on client after initial mount
    if (!isClient) return;

    let initialDate = new Date(); // Default to today initially
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
              // Ensure an id exists for each loaded row, generate if missing
              id: row.id || Date.now() + Math.random() // Add randomness to avoid collisions if loaded fast
            }))
          : [{ id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }];
        setScheduleRows(loadedRows);
        setStampPreview(parsedData.stampPreview || null);
        setRoNumber(parsedData.roNumber || '');

        // Load and validate date
        if (parsedData.orderDate) {
           const savedDateObj = new Date(parsedData.orderDate);
           if (!isNaN(savedDateObj.getTime())) {
               initialDate = savedDateObj; // Use saved date if valid
           } else {
                console.warn("Invalid date found in localStorage, using today's date instead.");
                // initialDate remains today
           }
        }

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
       // initialDate remains today in case of error
    } finally {
        // Set orderDate state (either loaded or default today)
        setOrderDate(initialDate);
        // Display date formatting is handled in the next effect
        isInitialLoadRef.current = false;
    }
  // Depend only on isClient and toast
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
             setOrderDate(today); // This will trigger this effect again
         }
     } else if (orderDate === undefined && isClient && !isInitialLoadRef.current) {
         // Handle case where date might become undefined after initial load
         const today = new Date();
         setOrderDate(today);
     } else if (orderDate && isNaN(orderDate.getTime())) {
         // Handle invalid date object in state
          console.warn("Order date state is invalid, resetting to today.");
          const today = new Date();
          setOrderDate(today); // Reset to today
     }
   // Depend only on orderDate and isClient flag
   }, [orderDate, isClient]);


  // Effect to save data to localStorage (debounced, client-side only)
  useEffect(() => {
    if (isInitialLoadRef.current || !isClient || orderDate === undefined) {
      // Clear the flag after the initial load effect has run and potentially set orderDate
      if (!isInitialLoadRef.current && isClient && orderDate !== undefined) {
          // We are past initial load, client side, and date is set - safe to proceed with saves later
      } else {
          return; // Don't save during initial load, if not client-side yet, or if date is still undefined
      }
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

  // Apply/remove print preview class to the body
  useEffect(() => {
    if (isPreviewing) {
        document.body.classList.add('print-preview-mode');
        // Add wrapper for centering preview
        const wrapper = document.createElement('div');
        wrapper.id = 'printable-area-wrapper';
        document.body.appendChild(wrapper);
        // Move the printable area into the wrapper
        const printableArea = document.getElementById('pdf-content-area');
        if (printableArea) {
            wrapper.appendChild(printableArea);
        }
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.id = 'closePreviewButton';
        closeButton.innerText = 'Close Preview';
        closeButton.onclick = () => setIsPreviewing(false); // Use state setter
        document.body.appendChild(closeButton); // Append directly to body, position fixed
    } else {
        document.body.classList.remove('print-preview-mode');
        // Move printable area back and remove wrapper/button
        const wrapper = document.getElementById('printable-area-wrapper');
        const printableArea = document.getElementById('pdf-content-area');
        const closeButton = document.getElementById('closePreviewButton');
        if (wrapper && printableArea) {
            // Find the original container (assuming it's the direct parent of the wrapper)
             const originalContainer = wrapper.parentNode;
             if (originalContainer) {
                 originalContainer.appendChild(printableArea); // Move it back
             }
            wrapper.remove();
        }
        if (closeButton) {
            closeButton.remove();
        }
    }

    // Cleanup function
    return () => {
        if (document.body.classList.contains('print-preview-mode')) {
            document.body.classList.remove('print-preview-mode');
            const wrapper = document.getElementById('printable-area-wrapper');
            const printableArea = document.getElementById('pdf-content-area');
             const closeButton = document.getElementById('closePreviewButton');
            if (wrapper && printableArea && wrapper.parentNode) {
                 // On unmount, ensure it's moved back if still in wrapper
                 const originalContainer = wrapper.parentNode;
                 if (originalContainer) {
                    originalContainer.appendChild(printableArea);
                 }
                wrapper.remove();
            }
             if (closeButton) {
                 closeButton.remove();
             }
        }
    };
  }, [isPreviewing]);


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

 const handleDownloadPdf = useCallback(async () => {
    if (!formRef.current) return;

    setPdfGenerationMode(true); // Enable PDF mode styles

    // Need a slight delay for styles to apply before capturing
    await new Promise(resolve => setTimeout(resolve, 100));


    try {
        const canvas = await html2canvas(formRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            onclone: (documentClone) => {
                const clonedForm = documentClone.getElementById('printable-area');
                if (clonedForm) {
                    clonedForm.classList.add('pdf-generation-mode'); // Ensure styles in clone
                    // Re-apply specific print/PDF styles that might be missed
                    const textareas = clonedForm.querySelectorAll('textarea');
                    textareas.forEach(ta => {
                        (ta as HTMLElement).style.height = '145px'; // Set height explicitly for canvas
                        (ta as HTMLElement).style.minHeight = '145px';
                         (ta as HTMLElement).style.overflow = 'hidden'; // Hide potential scrollbars in canvas
                    });
                     // Ensure vertical matter text in clone
                    const matterTextClone = clonedForm.querySelector('.matter-text-pdf-clone');
                    if (matterTextClone) {
                        (matterTextClone as HTMLElement).style.writingMode = 'vertical-rl';
                        (matterTextClone as HTMLElement).style.textOrientation = 'mixed';
                        (matterTextClone as HTMLElement).style.transform = 'rotate(180deg)';
                        (matterTextClone as HTMLElement).style.display = 'block';
                        (matterTextClone as HTMLElement).style.whiteSpace = 'nowrap';
                    }

                    // Ensure stamp image is visible in clone if it exists
                     const stampImageClone = clonedForm.querySelector('.stamp-print-image');
                     const stampContainerClone = clonedForm.querySelector('.stamp-container-print');
                     if (stampImageClone && stampContainerClone) {
                          (stampContainerClone as HTMLElement).style.display = 'flex'; // Make container visible
                         (stampContainerClone as HTMLElement).style.visibility = 'visible';
                     }

                      // Hide elements specifically marked for no-print/no-pdf in the clone
                     const noPrintElementsClone = clonedForm.querySelectorAll('.no-print');
                     noPrintElementsClone.forEach(el => (el as HTMLElement).style.display = 'none');
                }
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth - 30; // Add some margin (15pt each side)
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = 15; // Top margin

        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight); // Add left margin
        heightLeft -= (pdfHeight - 30); // Account for top/bottom margins

        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 15; // Adjust position for next page, add margin
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 30);
        }

        pdf.save('release-order.pdf');
        toast({
            title: "PDF Downloaded",
            description: "The release order has been saved as a PDF.",
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            title: "PDF Generation Failed",
            description: "Could not save the release order as a PDF.",
            variant: "destructive",
        });
    } finally {
       // Use a timeout to ensure rendering completes before removing the class
       setTimeout(() => {
          setPdfGenerationMode(false); // Disable PDF mode styles
       }, 100);
    }
  }, [toast]);


   // Guard against hydration errors for date display
   // Render placeholder or null on server, actual date on client
   const safeDisplayDate = isClient && orderDate && !isNaN(orderDate.getTime()) ? displayDate : '';


  // --- Main Render ---
  return (
    <div className={cn("max-w-[210mm] mx-auto font-bold", { 'pdf-generation-mode': pdfGenerationMode })}>
       {/* Action Buttons - Hidden during preview */}
       {!isPreviewing && (
           <div className="flex justify-end gap-2 mb-4 no-print">
                <Button onClick={() => setIsPreviewing(true)} variant="outline">
                    <Eye className="mr-2 h-4 w-4" /> Preview Print
                </Button>
               <Button onClick={handleDownloadPdf} variant="outline">
                   <FileDown className="mr-2 h-4 w-4" /> Download PDF
               </Button>
               <Button onClick={handleClearForm} variant="outline">
                   <Eraser className="mr-2 h-4 w-4" /> Clear Form & Draft
               </Button>
           </div>
        )}


       {/* Printable/PDF Area - Add ref here */}
       <div id="pdf-content-area" ref={formRef}>
           {/* Conditional wrapper for print preview centering - only added when isPreviewing is true */}
            {/* The #printable-area is MOVED inside #printable-area-wrapper by the useEffect when isPreviewing */}
           <Card id="printable-area" className="w-full print-border-heavy rounded-none shadow-none p-5 border-2 border-black pdf-target-card">
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
                                                   "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none no-print", // Hide on print/pdf
                                                   !safeDisplayDate && "text-muted-foreground"
                                               )}
                                               id="orderDateTrigger"
                                           >
                                               <CalendarIcon className="h-4 w-4" />
                                                {/* Remove the date text span */}
                                           </Button>
                                       </PopoverTrigger>
                                       <PopoverContent className="w-auto p-0 no-print">
                                           <Calendar
                                               mode="single"
                                               selected={orderDate} // Use the Date object state
                                               onSelect={(date) => {
                                                   if (date instanceof Date && !isNaN(date.getTime())) {
                                                       setOrderDate(date);
                                                   } else if (date === undefined) {
                                                        const today = new Date();
                                                        setOrderDate(today); // Reset to today if cleared
                                                   }
                                               }}
                                               initialFocus
                                           />
                                       </PopoverContent>
                                   </Popover>
                               ) : (
                                    // Server-side or initial client render: Show a placeholder
                                    <div className={cn(
                                        "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm shadow-none no-print items-center", // Hide on print/pdf
                                        "text-muted-foreground"
                                    )}>
                                        <CalendarIcon className="mr-2 h-4 w-4 inline-block" />
                                        {/* <span>Loading date...</span> */}
                                    </div>
                                )}
                                {/* Static Display for PDF/Screenshot - Always render */}
                                <div className={cn(
                                    "flex-1 justify-start text-left font-bold h-6 border-0 border-b border-black rounded-none px-1 py-0.5 text-sm shadow-none items-center print-only-inline-block pdf-only-inline-block", // Show for print/pdf
                                    !safeDisplayDate && "text-muted-foreground"
                                )}>
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
                       <Table className="print-table print-border border border-black pdf-table"> {/* Add pdf-table class */}
                           <TableHeader className="bg-secondary print-table-header">
                               <TableRow>
                                   <TableHead className="w-[10%] print-border-thin border border-black p-1.5 text-sm font-bold pdf-th">Key No.</TableHead>
                                   <TableHead className="w-[25%] print-border-thin border border-black p-1.5 text-sm font-bold pdf-th">Publication(s)</TableHead>
                                   <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold pdf-th">Edition(s)</TableHead>
                                   <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold pdf-th">Size</TableHead>
                                   <TableHead className="w-[20%] print-border-thin border border-black p-1.5 text-sm font-bold pdf-th">Scheduled Date(s)</TableHead>
                                   <TableHead className="w-[15%] print-border-thin border border-black p-1.5 text-sm font-bold pdf-th">Position</TableHead>
                               </TableRow>
                           </TableHeader>
                           <TableBody>
                               {scheduleRows.map((row) => (
                                   <TableRow key={row.id} className="h-[150px] pdf-tr"> {/* Set height, add pdf-tr */}
                                       <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top pdf-td"> {/* Add pdf-td */}
                                           <Textarea
                                               value={row.keyNo}
                                                onChange={(e) => handleScheduleChange(row.id, 'keyNo', e.target.value)}
                                               className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none pdf-textarea" // Add pdf-textarea
                                           />
                                       </TableCell>
                                       <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top pdf-td">
                                           <Textarea
                                               value={row.publication}
                                               onChange={(e) => handleScheduleChange(row.id, 'publication', e.target.value)}
                                               className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none pdf-textarea"
                                           />
                                       </TableCell>
                                       <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top pdf-td">
                                           <Textarea
                                               value={row.edition}
                                                onChange={(e) => handleScheduleChange(row.id, 'edition', e.target.value)}
                                               className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none pdf-textarea"
                                           />
                                       </TableCell>
                                       <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top pdf-td">
                                           <Textarea
                                               value={row.size}
                                                onChange={(e) => handleScheduleChange(row.id, 'size', e.target.value)}
                                               className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none pdf-textarea"
                                           />
                                       </TableCell>
                                       <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top pdf-td">
                                           <Textarea
                                                value={row.scheduledDate}
                                                 onChange={(e) => handleScheduleChange(row.id, 'scheduledDate', e.target.value)}
                                                className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none pdf-textarea"
                                            />
                                       </TableCell>
                                       <TableCell className="print-border-thin border border-black p-0 print-table-cell align-top pdf-td">
                                           <Textarea
                                               value={row.position}
                                                onChange={(e) => handleScheduleChange(row.id, 'position', e.target.value)}
                                               className="w-full h-full border-none rounded-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-1.5 py-1.5 align-top resize-none pdf-textarea"
                                           />
                                       </TableCell>
                                   </TableRow>
                               ))}
                           </TableBody>
                       </Table>
                       {/* Buttons only visible when not in preview mode */}
                       {!isPreviewing && (
                            <div className="flex gap-2 mt-2 no-print">
                                <Button variant="outline" size="sm" onClick={addRow}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Row
                                </Button>
                                <Button variant="destructive" size="sm" onClick={deleteRow} disabled={scheduleRows.length <= 1}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Last Row
                                </Button>
                            </div>
                        )}
                   </div>

                   {/* Matter Section */}
                   <div className="matter-box flex h-[150px] print-border-heavy rounded mb-5 overflow-hidden border-2 border-black">
                        {/* Vertical Text Label */}
                        <div className="vertical-label bg-black text-white flex items-center justify-center p-1 w-8 flex-shrink-0 matter-pdf-label">
                            {/* Separate span for PDF clone */}
                            <span className="hidden pdf-only-inline-block matter-text-pdf-clone">MATTER</span>
                             {/* Visible text for screen and print preview */}
                            <span className="text-base font-bold whitespace-nowrap matter-text-print matter-text-screen" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                                MATTER
                            </span>
                        </div>
                       <div className="matter-content flex-1 p-1">
                           <Textarea
                               id="matterArea"
                               placeholder="Enter matter here..."
                               className="w-full h-full resize-none border-none text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1 align-top pdf-textarea" // Add pdf-textarea
                               value={matter}
                               onChange={(e) => setMatter(e.target.value)} // Allow editing
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
                       <div className="notes-content flex-1 pr-[190px]"> {/* Padding to avoid overlap */}
                           <p className="font-bold mb-1 note-title-underline">Note:</p>
                           <ol className="list-decimal list-inside text-sm space-y-1 pt-1 pl-4">
                               <li>Space reserved vide our letter No.</li>
                               <li>No two advertisements of the same client should appear in the same issue.</li>
                               <li>Please quote R.O. No. in all your bills and letters.</li>
                               <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
                           </ol>
                       </div>

                       {/* Stamp Area - Interactive Container (Screen Only, hidden in preview) */}
                       {!isPreviewing && (
                           <div
                               id="stampContainerElement"
                               className="stamp-container-interactive absolute top-2 right-2 w-[180px] h-[142px] flex items-center justify-center cursor-pointer overflow-hidden group no-print" // Hide this container for pdf/print
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
                                           width={180}
                                           height={142}
                                           style={{ objectFit: 'contain' }}
                                           className="block max-w-full max-h-full"
                                       />
                                       {/* Hover effect */}
                                       <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                           <span className="text-white text-xs font-bold">Click/Hover to Change</span>
                                       </div>
                                   </div>
                               ) : (
                                   <Label htmlFor="stampFile" className="text-center text-xs text-muted-foreground cursor-pointer p-1 group-hover:opacity-75 transition-opacity">
                                       Click or Hover<br /> to Upload Stamp
                                   </Label>
                               )}
                           </div>
                       )}
                       {/* Visible Stamp Image for PDF/Screenshot/Preview Only */}
                       {stampPreview && (
                           <div className="stamp-container-print absolute top-2 right-2 w-[180px] h-[142px] hidden print-only-flex pdf-only-flex items-center justify-center"> {/* Use pdf-only-flex */}
                               <Image
                                   src={stampPreview}
                                   alt="Stamp"
                                   width={180}
                                   height={142}
                                   style={{ objectFit: 'contain' }}
                                   className="stamp-print-image max-w-full max-h-full"
                               />
                           </div>
                       )}
                   </div>
               </CardContent>
           </Card>
       </div> {/* End of pdf-content-area */}
   </div>
);
}
