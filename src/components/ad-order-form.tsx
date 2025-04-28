
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Eraser, Calendar as CalendarIcon, FileText } from 'lucide-react';
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
        // Check if savedDate is valid before setting
        if (savedDate && !isNaN(savedDate.getTime())) {
            setOrderDate(savedDate);
            setDisplayDate(format(savedDate, "dd.MM.yyyy")); // Also set display date
        } else {
           const today = new Date();
           setOrderDate(today); // Default to today if no valid date saved
           setDisplayDate(format(today, "dd.MM.yyyy")); // Set display date for today
        }
        setClientName(parsedData.clientName || '');
        setAdvertisementManagerLine1(parsedData.advertisementManagerLine1 || '');
        setAdvertisementManagerLine2(parsedData.advertisementManagerLine2 || '');
      } else {
        // No saved data, default date to today
        const today = new Date();
        setOrderDate(today);
        setDisplayDate(format(today, "dd.MM.yyyy")); // Set display date for today
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
       const today = new Date();
       setOrderDate(today); // Default to today on error
       setDisplayDate(format(today, "dd.MM.yyyy")); // Set display date for today
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

  // --- Word Document Download Logic (Enhanced for better layout preservation) ---
  const handleDownloadDoc = useCallback(() => {
     if (!printableAreaRef.current) {
            toast({
                title: 'Error',
                description: 'Cannot find the form area to generate document.',
                variant: 'destructive',
            });
            return;
        }

       try {
            // 1. Clone the printable area
            const printableElement = printableAreaRef.current.cloneNode(true) as HTMLElement;

            // 2. Remove non-printable elements from the clone
            const nonPrintElements = printableElement.querySelectorAll('.no-print');
            nonPrintElements.forEach(el => el.remove());

            // --- 3. Capture Input & Textarea Values in the Clone ---
            const inputs = printableElement.querySelectorAll('input[type="text"], textarea');
            inputs.forEach(el => {
                // Find the corresponding live element by ID (assuming IDs are unique)
                const liveElement = document.getElementById(el.id) as HTMLInputElement | HTMLTextAreaElement | null;
                 if (!liveElement) return; // Skip if live element not found

                 const value = liveElement.value;

                if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text') {
                    const inputClone = el as HTMLInputElement;
                    inputClone.setAttribute('value', value); // Set value attribute for Word
                    // Apply inline styles for better consistency in Word
                    inputClone.style.border = 'none';
                    inputClone.style.borderBottom = '1px solid black';
                    inputClone.style.padding = '1px 0';
                    inputClone.style.fontSize = '14px';
                    inputClone.style.fontWeight = 'bold';
                    inputClone.style.fontFamily = 'Arial, sans-serif';
                    inputClone.style.width = '100%'; // Ensure width is maintained
                    inputClone.style.backgroundColor = 'transparent'; // Prevent grey background in Word
                    // Remove potentially problematic classes
                    inputClone.classList.remove('focus-visible:ring-0', 'focus-visible:ring-offset-0', 'shadow-none');
                } else if (el.tagName === 'TEXTAREA') {
                    const textareaClone = el as HTMLTextAreaElement;
                    const div = document.createElement('div');
                    // Preserve whitespace and newlines
                    div.style.whiteSpace = 'pre-wrap';
                    div.style.wordWrap = 'break-word';
                    div.style.width = '100%'; // Take full width
                    div.style.minHeight = '100px'; // Ensure minimum height
                    div.style.fontSize = '14px';
                    div.style.fontWeight = 'bold';
                    div.style.fontFamily = 'Arial, sans-serif';
                    div.style.padding = '4px'; // Add some padding
                    div.textContent = value;
                    // Replace textarea with the styled div
                    textareaClone.parentNode?.replaceChild(div, textareaClone);
                }
            });

            // --- 4. Handle Date Picker Button in the Clone ---
             const dateButtonContainer = printableElement.querySelector('.popover-trigger-container');
             if (dateButtonContainer) {
                 const dateSpan = document.createElement('span');
                 dateSpan.textContent = displayDate || 'N/A'; // Use the formatted displayDate
                 dateSpan.style.fontSize = '14px';
                 dateSpan.style.fontWeight = 'bold';
                 dateSpan.style.fontFamily = 'Arial, sans-serif';
                 dateSpan.style.borderBottom = '1px solid black';
                 dateSpan.style.padding = '2px 0';
                 dateSpan.style.display = 'inline-block'; // To hold the border
                 dateButtonContainer.innerHTML = ''; // Clear existing button content
                 dateButtonContainer.appendChild(dateSpan);
             }

            // --- 5. Handle Stamp Image in the Clone ---
            const stampContainerClone = printableElement.querySelector('.stamp-container');
            if (stampContainerClone) {
                stampContainerClone.innerHTML = ''; // Clear any placeholder text/icons
                if (stampPreview) {
                    // Ensure the base64 string is valid and complete
                    const validBase64 = stampPreview.startsWith('data:image') ? stampPreview : `data:image/png;base64,${stampPreview}`; // Add prefix if missing
                    const img = document.createElement('img');
                    img.src = validBase64;
                    img.alt = 'Stamp';
                    // Apply precise styles for Word rendering - STATIC SIZE
                    img.style.width = '180px'; // Fixed width
                    img.style.height = '150px'; // Fixed height
                    img.style.objectFit = 'contain'; // Ensure image fits without distortion
                    img.style.display = 'block'; // Crucial for Word
                    img.id = 'stampPreview'; // Keep ID if needed
                    stampContainerClone.appendChild(img);
                }
                 // Apply container styles directly for Word - NO BORDER
                (stampContainerClone as HTMLElement).style.position = 'absolute';
                (stampContainerClone as HTMLElement).style.top = '10px';
                (stampContainerClone as HTMLElement).style.right = '10px';
                (stampContainerClone as HTMLElement).style.width = '180px'; // Match image width
                (stampContainerClone as HTMLElement).style.height = '150px'; // Match image height
                (stampContainerClone as HTMLElement).style.display = 'flex';
                (stampContainerClone as HTMLElement).style.alignItems = 'center';
                (stampContainerClone as HTMLElement).style.justifyContent = 'center';
                (stampContainerClone as HTMLElement).style.overflow = 'hidden';
                (stampContainerClone as HTMLElement).style.border = 'none'; // Ensure no border on container
                (stampContainerClone as HTMLElement).style.backgroundColor = 'white'; // Explicit background

            }


            // --- 6. Get the modified HTML of the clone ---
            let htmlContent = printableElement.outerHTML; // Use outerHTML to include the Card itself

            // --- 7. Define CSS for Word (prioritize inline styles where possible, basic CSS as fallback) ---
            // Keep this minimal and focused on structural elements Word understands.
            // Use !important sparingly, rely more on inline styles set above.
            const styles = `
                <style>
                    body { font-family: Arial, sans-serif; font-weight: bold; font-size: 14px; margin: 20px; /* Add margins for Word page layout */ }
                    /* Ensure the main card container has a border */
                    .print-border-heavy { border: 2px solid black !important; padding: 20px; }

                    table { border-collapse: collapse; width: 100%; border: 2px solid black; margin-top: 20px; }
                    th, td { border: 1px solid black !important; padding: 6px !important; font-size: 14px !important; vertical-align: top; font-weight: bold; font-family: Arial, sans-serif; }
                    th { background-color: #f0f0f0 !important; } /* Use standard color */
                    input[type="text"] { /* Already styled inline, this is a fallback */
                        border: none !important;
                        border-bottom: 1px solid black !important;
                        padding: 1px 0 !important;
                        font-size: 14px !important;
                        font-weight: bold !important;
                        font-family: Arial, sans-serif !important;
                        width: 100%;
                        background-color: transparent !important;
                    }
                     /* Ensure the div replacing textarea keeps styles */
                    div[style*="white-space: pre-wrap"] {
                        font-size: 14px !important;
                        font-weight: bold !important;
                        font-family: Arial, sans-serif !important;
                        padding: 4px !important;
                        width: 100%;
                        min-height: 100px; /* Ensure height */
                    }

                    .header-title { background-color: black !important; color: white !important; padding: 4px !important; text-align: center !important; margin-bottom: 20px; font-size: 20px; }
                    .vertical-label { writing-mode: tb-rl; /* Standard property */ transform: rotate(180deg); background: black !important; color: white !important; padding: 4px !important; font-size: 16px; text-align: center; vertical-align: middle; font-weight: bold; display: flex; align-items: center; justify-content: center; width: 30px; /* Give it a fixed width */ }
                    .matter-box { display: flex; height: 150px; border: 2px solid black !important; margin-top: 20px; border-radius: 0px; /* Word might ignore radius */ overflow: hidden; }
                    .matter-content { flex: 1; padding: 4px !important; }
                    .notes-container { border: 1px solid black !important; /* Standard border */ padding: 10px 200px 10px 10px !important; /* Keep padding */ margin-top: 20px; position: relative; min-height: 170px !important; }
                     /* Stamp container styling (already inline, this is fallback) */
                     .stamp-container { position: absolute; top: 10px; right: 10px; width: 180px; height: 150px; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; border: none !important; }
                     #stampPreview { width: 180px; height: 150px; object-fit: contain; display: block; } /* Ensure image displays */

                    ol { margin-top: 10px; font-size: 14px !important; padding-left: 40px !important; /* Word needs more padding */ list-style-position: outside !important; }
                    li { margin-bottom: 5px; /* Spacing for list items */ }
                    .underline-black { border-bottom: 2px solid black; display: inline-block; padding-bottom: 1px; }
                    .note-title-underline, .billing-title-underline {
                        border-bottom: 2px solid black !important;
                        display: inline-block;
                        padding-bottom: 1px;
                        margin-bottom: 8px !important; /* Increased margin */
                        font-weight: bold !important;
                        font-size: 14px !important;
                     }
                     /* Address layout using simple divs or paragraphs */
                     .address-container { display: table; width: 100%; border-spacing: 10px 0; /* Simulate gap */ margin-bottom: 20px; }
                     .address-box { display: table-cell; width: 48%; border: 1px solid black !important; padding: 8px !important; font-size: 12px !important; line-height: 1.4 !important; vertical-align: top; }
                     .address-box p { margin: 0; padding: 0; font-size: 12px !important; line-height: 1.4 !important; font-weight: bold; font-family: Arial, sans-serif; }

                     /* RO/Date/Client layout */
                     .ro-date-client-container { border: 1px solid black !important; padding: 8px !important; width: 48%; display: table-cell; vertical-align: top; }
                     .ro-date-client-container .field-row { margin-bottom: 8px !important; display: flex; align-items: baseline; }
                     .ro-date-client-container label { width: 80px; flex-shrink: 0; margin-right: 5px; font-weight: bold !important; font-size: 14px !important; font-family: Arial, sans-serif; }
                      /* Span for date, input for others */
                     .ro-date-client-container span,
                     .ro-date-client-container input[type="text"] {
                          flex-grow: 1;
                          border: none !important;
                          border-bottom: 1px solid black !important;
                          font-weight: bold !important;
                          font-size: 14px !important;
                          padding: 2px 0 !important;
                          font-family: Arial, sans-serif;
                          background-color: transparent !important;
                     }

                     /* Advertisement Manager specific styles */
                      .advertisement-manager-section { border: 1px solid black !important; padding: 8px !important; margin-bottom: 20px; }
                      .advertisement-manager-section label { display: block; margin-bottom: 4px; font-weight: bold; }
                      .advertisement-manager-section input[type="text"] { margin-bottom: 8px; }
                      .advertisement-manager-section p { font-size: 14px !important; font-weight: bold; margin-top: 10px; }

                      /* Heading/Package specific styles */
                      .heading-package-container { display: table; width: 100%; border-spacing: 10px 0; margin-bottom: 20px; }
                      .heading-caption-box { display: table-cell; width: 68%; border: 2px solid black !important; padding: 8px !important; vertical-align: top; }
                      .package-box { display: table-cell; width: 30%; border: 2px solid black !important; padding: 8px !important; vertical-align: top; }
                      .heading-caption-box label, .package-box label { display: block; margin-bottom: 4px; font-weight: bold; }


                </style>
            `;

            // --- 8. Combine styles and HTML ---
            const fullHtml = `
                <!DOCTYPE html>
                <html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="UTF-8">
                    <title>Release Order - ${roNumber || 'NoRO'}</title>
                    <!--[if gte mso 9]>
                    <xml>
                        <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>90</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                        </w:WordDocument>
                    </xml>
                    <![endif]-->
                    ${styles}
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;

            // --- 9. Create Blob and Download Link ---
            const blob = new Blob([fullHtml], { type: 'application/msword' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const filenameDate = displayDate ? displayDate.replace(/\./g, '-') : 'NoDate';
            link.download = `Release_Order_${roNumber || 'NoRO'}_${filenameDate}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: 'Word Document Downloaded',
                description: 'The release order has been saved as a .doc file.',
            });

       } catch (error) {
         console.error('Error generating Word document:', error);
            toast({
                title: 'Word Generation Failed',
                description: `Could not generate the document. ${error instanceof Error ? error.message : String(error)}`,
                variant: 'destructive',
            });
        }
  }, [printableAreaRef, toast, roNumber, displayDate, stampPreview, caption, packageName, matter, scheduleRows, clientName, advertisementManagerLine1, advertisementManagerLine2]); // Include all relevant state


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
         {/* Word Download Button */}
         <Button onClick={handleDownloadDoc}>
            <FileText className="mr-2 h-4 w-4" /> Download as Word (.doc)
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
           <div className="print-border rounded p-2 mb-5 border border-black">
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
                className="stamp-container absolute top-2 right-2 w-[180px] h-[150px] bg-white flex items-center justify-center cursor-pointer overflow-hidden group print-stamp-container border-none" // No border, ensure visibility for interaction
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
                         <img
                            id="stampPreview"
                            src={stampPreview}
                            alt="Stamp Preview"
                            style={{ objectFit: 'contain', width: '180px', height: '150px', display: 'block' }} // Static dimensions
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
