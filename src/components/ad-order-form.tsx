// src/components/ad-order-form.tsx
"use client";
import type { ChangeEvent, FormEvent } from 'react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Download, Printer, Trash2, PlusCircle, UploadCloud, XCircle, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


// Define types for form data and row structure
interface FormData {
  roNumber: string;
  orderDate: string;
  clientName: string;
  advertisementManagerInput1: string;
  advertisementManagerInput2: string;
  headingCaption: string;
  packageName: string;
  matterContent: string;
  gstin: string;
  forwardAddressLine1: string;
  forwardAddressLine2: string;
  forwardAddressLine3: string;
  forwardAddressLine4: string;
  forwardAddressLine5: string;
  noteLine1: string;
  noteLine2: string;
  noteLine3: string;
  noteLine4: string;
}

interface TableRowData {
  id: string;
  keyNo: string;
  publication: string;
  edition: string;
  size: string;
  scheduledDate: string;
  position: string;
}

const initialFormData: FormData = {
  roNumber: '',
  orderDate: format(new Date(), 'yyyy-MM-dd'),
  clientName: '',
  advertisementManagerInput1: '',
  advertisementManagerInput2: '',
  headingCaption: '',
  packageName: '',
  matterContent: '',
  gstin: '07AABCL5406F1ZU',
  forwardAddressLine1: 'D-9 & D-10, 1st Floor, Pushpa Bhawan,',
  forwardAddressLine2: 'Alaknanda Commercial complex,',
  forwardAddressLine3: 'New Delhi-110019',
  forwardAddressLine4: 'Tel.: 49573333, 34, 35, 36',
  forwardAddressLine5: 'Fax: 26028101',
  noteLine1: '1. Space reserved vide our letter No. _________________',
  noteLine2: '2. No two advertisements of the same client should appear in the same issue.',
  noteLine3: '3. Please quote R.O. No. in all your bills and letters.',
  noteLine4: '4. Please send two voucher copies of the good reproduction to us within 3 days of the publishing.',
};

const AdOrderForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [rows, setRows] = useState<TableRowData[]>([]);
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentRoNumber, setCurrentRoNumber] = useState<string>('');
  const [isPrintPreview, setIsPrintPreview] = useState(false);


  const formRef = useRef<HTMLDivElement>(null);
  const matterTextareaRef = useRef<HTMLTextAreaElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    // Load data from localStorage
    const savedFormData = localStorage.getItem('adOrderFormData');
    const savedRows = localStorage.getItem('adOrderTableRows');
    const savedStampImage = localStorage.getItem('adOrderStampImage');
    const savedRoNumber = localStorage.getItem('currentRoNumber');

    if (savedFormData) setFormData(JSON.parse(savedFormData));
    if (savedRows) setRows(JSON.parse(savedRows));
    if (savedStampImage) setStampImage(savedStampImage);
    if (savedRoNumber) setCurrentRoNumber(savedRoNumber);
    else {
        // Add one default row if no saved rows
        addNewRow();
    }
  }, []);

  useEffect(() => {
    // Save data to localStorage whenever it changes
    if(isClient) {
        localStorage.setItem('adOrderFormData', JSON.stringify(formData));
        localStorage.setItem('adOrderTableRows', JSON.stringify(rows));
        if (stampImage) localStorage.setItem('adOrderStampImage', stampImage);
        else localStorage.removeItem('adOrderStampImage');
        localStorage.setItem('currentRoNumber', currentRoNumber);
    }
  }, [formData, rows, stampImage, currentRoNumber, isClient]);

  useEffect(() => {
    const textareas = document.querySelectorAll('.table-cell-textarea');
    textareas.forEach(textarea => {
      const textAreaElement = textarea as HTMLTextAreaElement;
      textAreaElement.style.height = 'auto';
      textAreaElement.style.height = `${textAreaElement.scrollHeight}px`;
    });
    if (matterTextareaRef.current) {
      matterTextareaRef.current.style.height = 'auto';
      matterTextareaRef.current.style.height = `${matterTextareaRef.current.scrollHeight}px`;
    }
  }, [rows, formData.matterContent]);


  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, orderDate: format(date, 'yyyy-MM-dd') }));
    }
  }, []);

  const handleTableRowChange = useCallback((index: number, field: keyof Omit<TableRowData, 'id'>, value: string) => {
    setRows(prevRows =>
      prevRows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }, []);

  const addNewRow = useCallback(() => {
    setRows(prevRows => [
      ...prevRows,
      {
        id: Date.now().toString(), // Unique ID for the row
        keyNo: '',
        publication: '',
        edition: '',
        size: '',
        scheduledDate: '',
        position: '',
      },
    ]);
  }, []);

  const deleteRow = useCallback((index: number) => {
    setRows(prevRows => prevRows.filter((_, i) => i !== index));
  }, []);

  const handleStampUpload = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setStampImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const triggerStampUpload = useCallback(() => {
    stampInputRef.current?.click();
  }, []);

  const removeStampImage = useCallback(() => {
    setStampImage(null);
    if (stampInputRef.current) {
      stampInputRef.current.value = ''; // Reset file input
    }
  }, []);
  
  const handleClearForm = useCallback(() => {
    setFormData(initialFormData);
    setRows([]);
    addNewRow(); // Add one blank row after clearing
    setStampImage(null);
    setCurrentRoNumber('');
    if (stampInputRef.current) {
      stampInputRef.current.value = '';
    }
    // Clear localStorage
    localStorage.removeItem('adOrderFormData');
    localStorage.removeItem('adOrderTableRows');
    localStorage.removeItem('adOrderStampImage');
    localStorage.removeItem('currentRoNumber');

  }, [addNewRow]);

  const handleSaveDraft = useCallback(() => {
    // Data is already saved on change by useEffect. This button can provide user feedback.
    // For now, it acts as a psychological save button.
    alert('Draft saved locally in your browser!');
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (formRef.current && typeof window !== 'undefined' && (window as any).html2pdf) {
      const originalElement = formRef.current;
      const elementToPrint = originalElement.cloneNode(true) as HTMLElement;

      // Remove buttons and other non-printable elements from the clone
      elementToPrint.querySelectorAll('.no-print-pdf').forEach(el => el.remove());
      
      // Ensure inputs/textareas in the clone show their values statically for PDF
        const inputs = elementToPrint.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            const el = input as HTMLInputElement | HTMLTextAreaElement;
            if (el.tagName.toLowerCase() === 'textarea') {
                 const p = document.createElement('div');
                 p.className = 'static-text-replacement matter-content-textarea'; // Add specific class for matter
                 p.innerHTML = el.value.replace(/\n/g, '<br>');
                 // Copy relevant styles that affect layout and appearance
                 p.style.minHeight = el.style.minHeight || 'auto'; // Keep min-height for PDF consistency
                 p.style.width = el.style.width || '100%';
                 p.style.fontFamily = window.getComputedStyle(el).fontFamily;
                 p.style.fontSize = window.getComputedStyle(el).fontSize;
                 p.style.fontWeight = window.getComputedStyle(el).fontWeight;
                 p.style.color = window.getComputedStyle(el).color;
                 p.style.textAlign = window.getComputedStyle(el).textAlign as any;
                 p.style.padding = window.getComputedStyle(el).padding;
                 p.style.boxSizing = 'border-box';
                 p.style.wordWrap = 'break-word';
                 p.style.whiteSpace = 'pre-wrap';

                if (el.classList.contains('table-cell-textarea')) {
                     p.classList.add('table-textarea'); // for specific print styles on table textareas
                }


                 el.parentNode?.replaceChild(p, el);
            } else if (el.type === 'date') {
                const p = document.createElement('span');
                p.className = 'static-text-replacement';
                p.textContent = format(parseISO(el.value), 'dd.MM.yyyy');
                 el.parentNode?.replaceChild(p, el);
            } else if (el.type !== 'file') { // Don't replace file inputs
                const p = document.createElement('span');
                p.className = 'static-text-replacement';
                p.textContent = el.value;
                 el.parentNode?.replaceChild(p, el);
            }
        });

        // Handle stamp image for PDF
        const stampContainerInClone = elementToPrint.querySelector('.stamp-upload-container-actual');
        if (stampContainerInClone) {
            if (stampImage) {
                const img = document.createElement('img');
                img.src = stampImage;
                img.alt = "Stamp";
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.objectFit = 'contain';
                stampContainerInClone.innerHTML = ''; // Clear "Upload Image" text/button
                stampContainerInClone.appendChild(img);
            } else {
                // If no stamp image, ensure the placeholder text is styled for PDF
                const p = document.createElement('p');
                p.textContent = "Stamp/Signature";
                p.style.textAlign = "center";
                p.style.fontSize = "10pt";
                p.style.color = "#555";
                stampContainerInClone.innerHTML = '';
                stampContainerInClone.appendChild(p);
            }
        }


      // Temporarily append the clone to the body for style computation if needed, then remove
      elementToPrint.style.position = 'absolute';
      elementToPrint.style.left = '-99999px'; // Position off-screen
      elementToPrint.style.top = '0px';
      // Apply A4 dimensions to the clone for html2canvas to capture accurately
      // elementToPrint.style.width = '210mm'; 
      // elementToPrint.style.height = '297mm';
      // elementToPrint.style.overflow = 'hidden';


      document.body.appendChild(elementToPrint);


      const opt = {
        margin: 10, // 10mm margin for the PDF page on all sides
        filename: 'release_order_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1.5, // Start with 1.5. Lower (e.g., 1.2) for smaller output, higher (e.g., 2) for better quality if it fits.
          useCORS: true,
          scrollY: 0, 
          logging: true,
          // width: elementToPrint.offsetWidth, // Use offsetWidth for better accuracy with CSS transforms/scaling
          // windowWidth: elementToPrint.scrollWidth,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as any } // Try to keep content on a single page
      };
      
      try {
        await (window as any).html2pdf().from(elementToPrint).set(opt).save();
      } catch (error) {
         console.error("Error generating PDF:", error);
      } finally {
        document.body.removeChild(elementToPrint); // Clean up the appended clone
      }

    } else {
      console.error('html2pdf.js not loaded or formRef not available');
    }
  }, [formRef, formData, rows, stampImage, currentRoNumber]);

  const handlePrintPreview = useCallback(() => {
    setIsPrintPreview(true);
  }, []);

  const handleClosePrintPreview = useCallback(() => {
    setIsPrintPreview(false);
  }, []);

  const handleActualPrint = () => {
    window.print();
  };


  if (!isClient) {
    // Optional: Render a loading state or null during SSR/initial client render phase
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading form...</p>
        </div>
    );
  }
  
  const renderPrintPreview = () => {
    if (!formRef.current) return null;

    // Create a deep clone of the form to modify for preview
    const previewNode = formRef.current.cloneNode(true) as HTMLElement;

    // Remove interactive elements not needed for preview
    previewNode.querySelectorAll('button, .no-print-preview, .print-icon-container, .action-buttons-container').forEach(el => el.remove());
    
    // Replace input fields and textareas with static text for preview
    previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea').forEach(el => {
      const inputElement = el as HTMLInputElement | HTMLTextAreaElement;
      const p = document.createElement('div'); // Use div for better block-level rendering like textareas
      
      // Apply a class for common static text styling in print preview
      p.className = 'static-text-replacement'; 

      if (inputElement.tagName.toLowerCase() === 'textarea') {
        p.innerHTML = inputElement.value.replace(/\n/g, '<br>'); // Preserve line breaks
        p.style.minHeight = inputElement.style.minHeight || 'auto'; // Preserve min-height for layout
        // Add specific class for matter content if applicable, to inherit print styles
        if (inputElement.id === 'matterContent' || inputElement.classList.contains('matter-content-textarea')) {
            p.classList.add('matter-content-textarea');
        }
        if (inputElement.classList.contains('table-cell-textarea')) {
            p.classList.add('table-textarea');
        }

      } else if (inputElement.type === 'date') {
        p.textContent = inputElement.value ? format(parseISO(inputElement.value), 'dd.MM.yyyy') : '';
      } else {
        p.textContent = inputElement.value;
      }
      
      // Copy essential styles from the original element to the static replacement
      p.style.fontWeight = window.getComputedStyle(inputElement).fontWeight;
      p.style.fontSize = window.getComputedStyle(inputElement).fontSize;
      p.style.fontFamily = window.getComputedStyle(inputElement).fontFamily;
      p.style.color = window.getComputedStyle(inputElement).color;
      p.style.padding = window.getComputedStyle(inputElement).padding;
      p.style.margin = window.getComputedStyle(inputElement).margin; // Preserve margins
      p.style.border = 'none'; // Static text should not have input borders
      p.style.width = '100%'; // Ensure it takes full width of its container
      p.style.boxSizing = 'border-box';
      p.style.wordWrap = 'break-word'; // Ensure long text wraps
      p.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks

      inputElement.parentNode?.replaceChild(p, inputElement);
    });

    // Handle stamp image in preview
    const stampContainerInPreview = previewNode.querySelector('.stamp-upload-container-actual');
    if (stampContainerInPreview) {
        stampContainerInPreview.classList.add('stamp-upload-container-print'); // Add print class
        if (stampImage) {
            const img = document.createElement('img');
            img.src = stampImage;
            img.alt = "Stamp Preview";
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            stampContainerInPreview.innerHTML = ''; // Clear "Upload Image" text
            stampContainerInPreview.appendChild(img);
        } else {
            // If no stamp image, ensure the placeholder text is styled for print preview
            const p = document.createElement('p');
            p.textContent = "Stamp/Signature";
            p.style.textAlign = "center";
            p.style.fontSize = "10pt"; // Match print styles if any
            p.style.color = "#555";
            stampContainerInPreview.innerHTML = '';
            stampContainerInPreview.appendChild(p);
        }
    }
    
    // Apply specific print classes to elements for consistent styling
    const releaseOrderTitlebar = previewNode.querySelector('.release-order-titlebar-screen');
    if(releaseOrderTitlebar) releaseOrderTitlebar.classList.add('release-order-titlebar-print');

    const matterLabel = previewNode.querySelector('.matter-label-screen');
    if(matterLabel) matterLabel.classList.add('matter-label-print');


    return <div dangerouslySetInnerHTML={{ __html: previewNode.outerHTML }} />;
  };


  return (
    <div className="max-w-[210mm] mx-auto p-1 print-shadow">
      <Card id="printable-content" ref={formRef} className="w-full print-a4-page print-border-thick">
        <CardHeader className="p-0">
          <div className="action-buttons-container bg-background p-2 flex justify-end items-center space-x-2 no-print no-print-pdf sticky top-0 z-10 border-b">
            <Button variant="outline" onClick={handlePrintPreview} size="sm" className="text-xs">
              <Eye className="mr-1 h-3 w-3" /> Print Preview
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} size="sm" className="text-xs">
              <Download className="mr-1 h-3 w-3" /> Download PDF
            </Button>
             <Button variant="outline" onClick={handleActualPrint} size="sm" className="text-xs">
                <Printer className="mr-1 h-3 w-3" /> Print
            </Button>
            <Button variant="destructive" onClick={handleClearForm} size="sm" className="text-xs">
              <Trash2 className="mr-1 h-3 w-3" /> Clear Form
            </Button>
            <Button onClick={handleSaveDraft} size="sm" className="text-xs">
              Save Draft
            </Button>
          </div>
          <div className="release-order-titlebar-screen text-center my-2 bg-black text-white border-2 border-black py-1 px-2.5 font-bold w-fit mx-auto rounded relative">
            <h2 className="m-0 text-lg">RELEASE ORDER</h2>
          </div>
        </CardHeader>
        <CardContent className="p-2 print-content-padding">
          {/* Top Section: GSTIN, RO No, Date, Client */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            {/* Left Column: GSTIN and Company Info */}
            <div className="md:col-span-1 print-border-thick border-2 border-black rounded p-1.5 text-xs">
              <h3 className="font-bold text-sm">Lehar</h3>
              <h4 className="font-bold text-xs">ADVERTISING PVT.LTD.</h4>
              <p>D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
              <p>Alaknanda Commercial complex, <br /> New Delhi-110019</p>
              <p>Tel.: 49573333, 34, 35, 36</p>
              <p>Fax: 26028101</p>
              <div className="flex items-center">
                <Label htmlFor="gstin" className="font-bold mr-1 whitespace-nowrap">GSTIN:</Label>
                <Input
                  id="gstin"
                  name="gstin"
                  type="text"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  className="h-6 p-1 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="GSTIN"
                />
              </div>
            </div>

            {/* Right Column: RO No, Date, Client, Ad Manager */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print-border-thick border-2 border-black rounded p-1.5 items-center">
                <div className="flex items-center">
                  <Label htmlFor="roNumber" className="font-bold mr-1 whitespace-nowrap text-sm">R.O. No. LN:</Label>
                  <Input
                    id="roNumber"
                    name="roNumber"
                    type="text" // Changed to text to allow non-numeric input if needed
                    value={formData.roNumber}
                    onChange={handleInputChange}
                    placeholder="Enter Number"
                    className="h-7 p-1 text-sm border-0 font-bold flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="R.O. Number"
                  />
                </div>
                <div className="flex items-center">
                  <Label htmlFor="orderDate" className="font-bold mr-1 whitespace-nowrap text-sm">Date:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-7 p-1 text-sm font-bold flex-1 justify-start text-left border-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
                        id="orderDate"
                      >
                        <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                        {formData.orderDate ? format(parseISO(formData.orderDate), 'dd.MM.yyyy') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 no-print-pdf" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.orderDate ? parseISO(formData.orderDate) : undefined}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="print-border-thick border-2 border-black rounded p-1.5 flex items-center">
                <Label htmlFor="clientName" className="font-bold mr-1 whitespace-nowrap text-sm">Client:</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  placeholder="Client Name"
                  className="h-7 p-1 text-sm border-0 font-bold flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="Client Name"
                />
              </div>
               {/* Advertisement Manager Section */}
                <div className="print-border-thick border-2 border-black rounded p-2 text-xs">
                    <Label className="font-bold text-sm block mb-1">The Advertisement Manager</Label>
                    <Input
                    name="advertisementManagerInput1"
                    value={formData.advertisementManagerInput1}
                    onChange={handleInputChange}
                    placeholder="Publication/Media House Name"
                    className="h-6 p-1 text-xs border-0 font-bold mb-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Advertisement Manager Input 1"
                    />
                    <Input
                    name="advertisementManagerInput2"
                    value={formData.advertisementManagerInput2}
                    onChange={handleInputChange}
                    placeholder="Address or Department"
                    className="h-6 p-1 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label="Advertisement Manager Input 2"
                    />
                </div>


                 <div className="mt-1 pt-1 border-t border-black">
                    <p className="text-xs font-bold m-0">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
          </div>


          {/* Heading/Caption and Package Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <div className="md:col-span-2 print-border-thick border-2 border-black rounded p-1.5">
              <Label htmlFor="headingCaption" className="font-bold text-sm block mb-0.5">Heading/Caption:</Label>
              <Input
                id="headingCaption"
                name="headingCaption"
                type="text"
                value={formData.headingCaption}
                onChange={handleInputChange}
                placeholder="Enter caption here"
                className="h-7 p-1 text-sm border-0 font-bold w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Heading Caption"
              />
            </div>
            <div className="md:col-span-1 print-border-thick border-2 border-black rounded p-1.5">
              <Label htmlFor="packageName" className="font-bold text-sm block mb-0.5">Package:</Label>
              <Input
                id="packageName"
                name="packageName"
                type="text"
                value={formData.packageName}
                onChange={handleInputChange}
                placeholder="Enter package name"
                className="h-7 p-1 text-sm border-0 font-bold w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Package Name"
              />
            </div>
          </div>
          

          {/* Table Section */}
           <div className="mb-2 table-container-print">
             <Table className="print-table print-border-thick border border-black">
              <TableHeader className="bg-secondary print-table-header">
                <TableRow>
                  <TableHead className="w-[10%] print-border-thin border border-black p-1 text-xs font-bold">Key No.</TableHead>
                  <TableHead className="w-[25%] print-border-thin border border-black p-1 text-xs font-bold">Publication(s)</TableHead>
                  <TableHead className="w-[20%] print-border-thin border border-black p-1 text-xs font-bold">Edition(s)</TableHead>
                  <TableHead className="w-[15%] print-border-thin border border-black p-1 text-xs font-bold">Size</TableHead>
                  <TableHead className="w-[20%] print-border-thin border border-black p-1 text-xs font-bold">Scheduled Date(s)</TableHead>
                  <TableHead className="w-[10%] print-border-thin border border-black p-1 text-xs font-bold">Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id}>
                    {(Object.keys(row) as Array<keyof TableRowData>).filter(key => key !== 'id').map(field => (
                      <TableCell key={field} className="p-0 print-border-thin border border-black align-top">
                        <Textarea
                          value={row[field]}
                          onChange={(e) => handleTableRowChange(index, field as keyof Omit<TableRowData, 'id'>, e.target.value)}
                          className="table-cell-textarea text-xs p-1 border-0 font-bold resize-none overflow-hidden min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0 whitespace-pre-wrap"
                          aria-label={`${field} for row ${index + 1}`}
                          rows={3} // Initial rows, will auto-adjust
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-center space-x-2 my-1 no-print no-print-pdf">
            <Button onClick={addNewRow} variant="outline" size="sm" className="text-xs">
              <PlusCircle className="mr-1 h-3 w-3" /> Add Row
            </Button>
            {rows.length > 0 && (
              <Button onClick={() => deleteRow(rows.length - 1)} variant="destructive" size="sm" className="text-xs">
                <Trash2 className="mr-1 h-3 w-3" /> Delete Last Row
              </Button>
            )}
          </div>

          {/* Matter Section */}
          <div className="mb-2 flex items-stretch print-border-thick border-black">
            <div className="matter-label-screen writing-mode-v-rl text-orientation-upright p-0.5 text-sm font-bold text-center bg-black text-white border-r border-black print-matter-label" style={{ width: '30px' }}>
              MATTER
            </div>
            <Textarea
              id="matterContent"
              name="matterContent"
              value={formData.matterContent}
              onChange={handleInputChange}
              ref={matterTextareaRef}
              placeholder="Enter matter here..."
              className="matter-content-textarea flex-1 text-sm p-1 border-t border-b border-r-0 border-l-0 border-black font-bold resize-none overflow-hidden min-h-[80px] focus-visible:ring-0 focus-visible:ring-offset-0 whitespace-pre-wrap"
              aria-label="Matter Content"
            />
          </div>

          {/* Bottom Section: Forwarding Address, Stamp, Notes */}
          <div className="print-border-thick border-2 border-black rounded p-1.5 text-xs">
            <div className="flex flex-col md:flex-row justify-between gap-2">
              {/* Left part: Forwarding Address */}
              <div className="w-full md:w-3/5">
                <p className="font-bold underline underline-offset-2 mb-1">Forward all bills with relevant VTS copy to :-</p>
                 <Input name="forwardAddressLine1" value={formData.forwardAddressLine1} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
                 <Input name="forwardAddressLine2" value={formData.forwardAddressLine2} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
                 <Input name="forwardAddressLine3" value={formData.forwardAddressLine3} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
                 <Input name="forwardAddressLine4" value={formData.forwardAddressLine4} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
                 <Input name="forwardAddressLine5" value={formData.forwardAddressLine5} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
              {/* Right part: Stamp Area */}
              <div className="w-full md:w-2/5 flex justify-center items-center">
                <div
                  onClick={triggerStampUpload}
                  className="stamp-upload-container-actual w-[150px] h-[90px] border-2 border-dashed border-gray-400 flex flex-col justify-center items-center cursor-pointer bg-gray-50 hover:bg-gray-100 rounded relative no-print-pdf"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && triggerStampUpload()}
                  aria-label="Upload stamp image"
                >
                  {stampImage ? (
                    <>
                      <Image src={stampImage} alt="Stamp" layout="fill" objectFit="contain" data-ai-hint="signature stamp"/>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); removeStampImage(); }}
                        className="absolute top-0 right-0 h-5 w-5 p-0.5 text-red-500 hover:text-red-700 no-print no-print-pdf bg-white rounded-full"
                        aria-label="Remove stamp image"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-6 w-6 text-gray-500 mb-1" />
                      <p className="text-[10px] text-gray-500 text-center">Upload Stamp/Sign</p>
                    </>
                  )}
                </div>
                 <div className="stamp-upload-container-actual stamp-upload-container-print w-[150px] h-[90px] border-2 border-dashed border-gray-300 hidden justify-center items-center print-only-flex"> {/* For Print Preview and PDF */}
                    {stampImage ? (
                        <Image src={stampImage} alt="Stamp" layout="fill" objectFit="contain" data-ai-hint="signature stamp"/>
                    ) : (
                        <p className="text-[10px] text-gray-500 text-center">Stamp/Signature</p>
                    )}
                </div>
                <Input
                  type="file"
                  ref={stampInputRef}
                  onChange={handleStampUpload}
                  className="hidden"
                  accept="image/*"
                  aria-hidden="true"
                />
              </div>
            </div>
            {/* Notes Section */}
            <div className="mt-2 pt-1 border-t border-black">
              <p className="font-bold underline underline-offset-2 mb-0.5">Note:</p>
              <Input name="noteLine1" value={formData.noteLine1} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
              <Input name="noteLine2" value={formData.noteLine2} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
              <Input name="noteLine3" value={formData.noteLine3} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
              <Input name="noteLine4" value={formData.noteLine4} onChange={handleInputChange} className="h-5 p-0.5 text-xs border-0 font-bold focus-visible:ring-0 focus-visible:ring-offset-0" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isPrintPreview && (
         <div className="print-preview-overlay no-print-pdf">
            <div className="print-preview-modal">
                <div className="print-preview-toolbar">
                    <Button onClick={handleClosePrintPreview} variant="destructive" size="sm">Close Preview</Button>
                    <Button onClick={handleActualPrint} size="sm">Print</Button>
                </div>
                <div className="print-preview-content-area">
                    {renderPrintPreview()}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdOrderForm;
