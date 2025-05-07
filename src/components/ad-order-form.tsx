"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Download, Trash2, UploadCloud, Save, FolderOpen, Printer, XCircle, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const formSchema = z.object({
  heading: z.string().optional(),
  packageDeal: z.string().optional(),
  roNoLn: z.string().optional(),
  orderDate: z.date().optional(),
  clientName: z.string().optional(),
  advertisementManagerLine1: z.string().optional(),
  advertisementManagerLine2: z.string().optional(),
  tableData: z.array(z.object({
    keyNo: z.string().optional(),
    publication: z.string().optional(),
    size: z.string().optional(),
    position: z.string().optional(),
    premium: z.string().optional(),
    rate: z.string().optional(),
    insertionDate: z.string().optional(),
    amount: z.string().optional(),
  })).optional(),
  matter: z.string().optional(),
  billingAddress: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const initialTableData = Array(5).fill({}).map(() => ({
  keyNo: '', publication: '', size: '', position: '', premium: '', rate: '', insertionDate: '', amount: ''
}));

export default function AdOrderForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    heading: '',
    packageDeal: '',
    roNoLn: '',
    orderDate: new Date(),
    clientName: '',
    advertisementManagerLine1: '',
    advertisementManagerLine2: '',
    tableData: initialTableData,
    matter: '',
    billingAddress: '',
    notes: '',
  });

  const [stampImage, setStampImage] = useState<string | null>(null);
  const [stampFileName, setStampFileName] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [orderDateForDisplay, setOrderDateForDisplay] = useState(format(new Date(), "dd.MM.yyyy"));

  const formRef = useRef<HTMLDivElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);


  const { control, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
  });

  const watchedOrderDate = watch("orderDate");

  useEffect(() => {
    if (watchedOrderDate) {
      setOrderDateForDisplay(format(watchedOrderDate, "dd.MM.yyyy"));
      setFormData(prev => ({...prev, orderDate: watchedOrderDate}));
    }
  }, [watchedOrderDate]);
  
  useEffect(() => {
    const today = new Date();
    setValue('orderDate', today);
    setFormData(prev => ({ ...prev, orderDate: today }));
    setOrderDateForDisplay(format(today, "dd.MM.yyyy"));
  }, [setValue]);


  useEffect(() => {
    const savedStamp = localStorage.getItem('leharStamp');
    const savedStampFileName = localStorage.getItem('leharStampFileName');
    if (savedStamp) {
      setStampImage(savedStamp);
    }
    if (savedStampFileName) {
      setStampFileName(savedStampFileName);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValue(name as keyof FormData, value);
  }, [setValue]);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, orderDate: date }));
      setValue('orderDate', date);
      setOrderDateForDisplay(format(date, "dd.MM.yyyy"));
    }
  }, [setValue]);

  const handleTableChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedTableData = formData.tableData ? [...formData.tableData] : [];
    if(updatedTableData[index]){
        updatedTableData[index] = { ...updatedTableData[index], [name]: value };
    }
    setFormData(prev => ({ ...prev, tableData: updatedTableData }));
    setValue('tableData', updatedTableData);
  }, [formData.tableData, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setStampImage(base64String);
        setStampFileName(file.name);
        localStorage.setItem('leharStamp', base64String);
        localStorage.setItem('leharStampFileName', file.name);
        toast({ title: "Stamp Uploaded", description: `${file.name} has been uploaded and saved.` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearForm = useCallback(() => {
    setFormData({
      heading: '',
      packageDeal: '',
      roNoLn: '',
      orderDate: new Date(),
      clientName: '',
      advertisementManagerLine1: '',
      advertisementManagerLine2: '',
      tableData: initialTableData,
      matter: '',
      billingAddress: '',
      notes: '',
    });
    initialTableData.forEach((row, idx) => {
        Object.keys(row).forEach(key => {
            setValue(`tableData.${idx}.${key as keyof typeof row}` as any, '');
        });
    });
    ['heading', 'packageDeal', 'roNoLn', 'clientName', 'advertisementManagerLine1', 'advertisementManagerLine2', 'matter', 'billingAddress', 'notes'].forEach(field => setValue(field as keyof FormData, ''));
    const today = new Date();
    setValue('orderDate', today);
    setOrderDateForDisplay(format(today, "dd.MM.yyyy"));
    toast({ title: "Form Cleared", description: "All fields have been reset." });
  }, [setValue, toast]);

  const handleSaveDraft = useCallback(() => {
    localStorage.setItem('leharAdFormDraft', JSON.stringify(formData));
    toast({ title: "Draft Saved", description: "Your form data has been saved as a draft." });
  }, [formData, toast]);

  const handleLoadDraft = useCallback(() => {
    const draft = localStorage.getItem('leharAdFormDraft');
    if (draft) {
      const parsedDraft = JSON.parse(draft) as FormData;
      // Ensure date is correctly parsed
      if (parsedDraft.orderDate && typeof parsedDraft.orderDate === 'string') {
        parsedDraft.orderDate = new Date(parsedDraft.orderDate);
      } else if (!parsedDraft.orderDate) {
        parsedDraft.orderDate = new Date();
      }
      
      setFormData(parsedDraft);
      Object.keys(parsedDraft).forEach(key => {
        setValue(key as keyof FormData, parsedDraft[key as keyof FormData]);
      });
      if(parsedDraft.orderDate) {
          setOrderDateForDisplay(format(parsedDraft.orderDate, "dd.MM.yyyy"));
      } else {
          setOrderDateForDisplay(format(new Date(), "dd.MM.yyyy"));
      }
      toast({ title: "Draft Loaded", description: "Your saved draft has been loaded." });
    } else {
      toast({ title: "No Draft Found", description: "There is no saved draft to load.", variant: "destructive" });
    }
  }, [setValue, toast]);

  const togglePrintPreview = useCallback(() => {
    setIsPreviewing(prev => !prev);
  }, []);

  useEffect(() => {
    if (isPreviewing) {
      document.body.classList.add('fullscreen-preview-mode');
    } else {
      document.body.classList.remove('fullscreen-preview-mode');
    }
    // Cleanup function to remove the class if the component unmounts while previewing
    return () => {
      document.body.classList.remove('fullscreen-preview-mode');
    };
  }, [isPreviewing]);


  const PrintableContent = React.forwardRef<HTMLDivElement>((props, ref) => (
    <div ref={ref} id="printable-area" className="w-full print-border border-black bg-card text-card-foreground shadow-sm rounded-lg p-4 mx-auto">
        <CardHeader className="header-title p-2 mb-4 bg-black text-white text-center rounded-t-md">
          <h1 className="text-xl font-bold">RELEASE ORDER</h1>
        </CardHeader>

        <CardContent className="p-0 card-content-print-fix">
          <div className="grid grid-cols-2 gap-4 mb-4 heading-package-container">
            <div className="print-border border border-black p-2 rounded-md">
              <Label htmlFor="heading" className="block text-sm font-bold mb-1">Heading:</Label>
              <p id="headingDisplay" className="min-h-[1.2em] text-sm">{formData.heading || ''}</p>
            </div>
            <div className="print-border border border-black p-2 rounded-md">
              <Label htmlFor="packageDeal" className="block text-sm font-bold mb-1">Package/Deal:</Label>
              <p id="packageDealDisplay" className="min-h-[1.2em] text-sm">{formData.packageDeal || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 address-container">
            <div className="print-border border border-black p-2 rounded-md ro-date-client-container form-active">
              <div className="field-row flex items-center mb-1">
                <Label htmlFor="roNoLnDisplay" className="w-28 text-sm font-bold mr-2">R.O.No.LN:</Label>
                <p id="roNoLnDisplay" className="min-h-[1.2em] flex-1 text-sm">{formData.roNoLn || ''}</p>
              </div>
              <div className="field-row flex items-center mb-1">
                <Label htmlFor="orderDateDisplay" className="w-28 text-sm font-bold mr-2">Date:</Label>
                <p id="orderDateDisplay" className="min-h-[1.2em] flex-1 text-sm">
                  {formData.orderDate ? format(new Date(formData.orderDate), 'dd.MM.yyyy') : ''}
                </p>
              </div>
              <div className="field-row flex items-center">
                <Label htmlFor="clientNameDisplay" className="w-28 text-sm font-bold mr-2">Client:</Label>
                <p id="clientNameDisplay" className="min-h-[1.2em] flex-1 text-sm">{formData.clientName || ''}</p>
              </div>
            </div>

            <div className="print-border border border-black p-2 rounded-md advertisement-manager-section">
              <Label className="block text-sm font-bold underline-black mb-1">The Advertisement Manager,</Label>
              <p id="advManagerLine1Display" className="min-h-[1.2em] text-sm mb-1">{formData.advertisementManagerLine1 || ''}</p>
              <p id="advManagerLine2Display" className="min-h-[1.2em] text-sm">{formData.advertisementManagerLine2 || ''}</p>
              <p className="text-xs mt-2">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
            </div>
          </div>

          <div className="mb-4 table-container-print">
            <Table className="print-table print-border border border-black">
              <TableHeader className="print-table-header bg-secondary">
                <TableRow>
                  <TableHead className="w-[8%] print-border-thin border border-black p-1 text-xs font-bold">Key No.</TableHead>
                  <TableHead className="w-[20%] print-border-thin border border-black p-1 text-xs font-bold">Publication(s)</TableHead>
                  <TableHead className="w-[12%] print-border-thin border border-black p-1 text-xs font-bold">Size</TableHead>
                  <TableHead className="w-[15%] print-border-thin border border-black p-1 text-xs font-bold">Position</TableHead>
                  <TableHead className="w-[10%] print-border-thin border border-black p-1 text-xs font-bold">Premium%</TableHead>
                  <TableHead className="w-[10%] print-border-thin border border-black p-1 text-xs font-bold">Rate</TableHead>
                  <TableHead className="w-[15%] print-border-thin border border-black p-1 text-xs font-bold">Insertion Date(s)</TableHead>
                  <TableHead className="w-[10%] print-border-thin border border-black p-1 text-xs font-bold">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(formData.tableData || []).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="print-border-thin border border-black p-1 text-xs min-h-[60px] align-top"><div className="print-table-cell">{row.keyNo || ''}</div></TableCell>
                    <TableCell className="print-border-thin border border-black p-1 text-xs min-h-[60px] align-top"><div className="print-table-cell">{row.publication || ''}</div></TableCell>
                    <TableCell className="print-border-thin border border-black p-1 text-xs min-h-[60px] align-top"><div className="print-table-cell">{row.size || ''}</div></TableCell>
                    <TableCell className="print-border-thin border border-black p-1 text-xs min-h-[60px] align-top"><div className="print-table-cell">{row.position || ''}</div></TableCell>
                    <TableCell className="print-border-thin border border-black p-1 text-xs min-h-[60px] align-top"><div className="print-table-cell">{row.premium || ''}</div></TableCell>
                    <TableCell className="print-border-thin border border-black p-1 text-xs min-h-[60px] align-top"><div className="print-table-cell">{row.rate || ''}</div></TableCell>
                    <TableCell className="print-border-thin border border-black p-1 text-xs min-h-[60px] align-top"><div className="print-table-cell">{row.insertionDate || ''}</div></TableCell>
                    <TableCell className="print-border-thin border border-black p-1 text-xs min-h-[60px] align-top"><div className="print-table-cell">{row.amount || ''}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mb-4 matter-box flex print-border border border-black rounded-md h-[100px] overflow-hidden">
            <div className="matter-label bg-black text-white flex items-center justify-center p-2 w-[25px]">
                <span className="transform rotate-180" style={{ writingMode: 'vertical-lr' }}>MATTER</span>
            </div>
            <div className="matter-content p-2 flex-1">
                 <div className="text-sm whitespace-pre-wrap break-words h-full overflow-y-auto">{formData.matter || ''}</div>
            </div>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div className="print-border border border-black p-2 rounded-md billing-address-box">
              <p className="billing-title-underline text-sm font-bold mb-1">Forward all bills with relevant voucher copies to:-</p>
              <div className="text-xs whitespace-pre-wrap break-words min-h-[60px]">{formData.billingAddress || ''}</div>
            </div>

            <div className="print-border border border-black p-2 rounded-md notes-stamp-container relative">
              <div className="notes-content">
                <p className="note-title-underline text-sm font-bold mb-1">Note:</p>
                <ol className="list-decimal list-inside text-xs whitespace-pre-wrap break-words min-h-[40px]">
                  {(formData.notes || '').split('\n').map((note, index) => note.trim() && <li key={index}>{note}</li>)}
                </ol>
              </div>
              {stampImage && (
                <div className="stamp-container-print absolute top-1 right-1 w-[85px] h-[65px]">
                  <Image src={stampImage} alt="Stamp" layout="fill" objectFit="contain" className="stamp-print-image" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </div>
  ));
  PrintableContent.displayName = "PrintableContent";


  if (isPreviewing) {
    return (
      <div className="fullscreen-overlay">
        <div className="fullscreen-content-wrapper">
          <PrintableContent />
          <Button
            onClick={togglePrintPreview}
            variant="destructive"
            className="absolute top-4 right-4 z-20 fullscreen-preview-button print-hidden"
          >
            <XCircle className="mr-2" /> Close Preview
          </Button>
          <Button
            onClick={() => window.print()}
            variant="default"
            className="absolute top-4 right-40 z-20 fullscreen-preview-button print-hidden"
          >
            <Printer className="mr-2" /> Print
          </Button>
        </div>
      </div>
    );
  }


  return (
    <Card ref={formRef} id="printable-area-form" className="w-full max-w-5xl mx-auto shadow-2xl print-border border-black">
      <CardHeader className="bg-black text-white text-center p-3 rounded-t-md header-title">
        <CardTitle className="text-2xl">RELEASE ORDER</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6 card-content-pdf-fix">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 heading-package-container">
          <div className="space-y-2 print-border border border-black p-3 rounded-md">
            <Label htmlFor="heading" className="font-semibold text-md">Heading:</Label>
            <Input id="heading" name="heading" value={formData.heading} onChange={handleChange} className="text-sm" />
          </div>
          <div className="space-y-2 print-border border border-black p-3 rounded-md">
            <Label htmlFor="packageDeal" className="font-semibold text-md">Package/Deal:</Label>
            <Input id="packageDeal" name="packageDeal" value={formData.packageDeal} onChange={handleChange} className="text-sm" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 address-container">
          <div className="space-y-1 print-border border border-black p-3 rounded-md ro-date-client-container form-active">
            <div className="flex items-center field-row">
              <Label htmlFor="roNoLn" className="w-24 font-semibold text-md">R.O.No.LN:</Label>
              <Input id="roNoLn" name="roNoLn" value={formData.roNoLn} onChange={handleChange} className="flex-1 text-sm" />
            </div>
            <div className="flex items-center field-row">
                <Label htmlFor="orderDate" className="w-24 font-semibold text-md">Date:</Label>
                 <Controller
                    name="orderDate"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "flex-1 justify-start text-left font-normal h-10 text-sm",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {orderDateForDisplay || <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                        field.onChange(date);
                                        handleDateChange(date);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
            </div>
            <div className="flex items-center field-row">
              <Label htmlFor="clientName" className="w-24 font-semibold text-md">Client:</Label>
              <Input id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} className="flex-1 text-sm" />
            </div>
          </div>

          <div className="space-y-2 print-border border border-black p-3 rounded-md advertisement-manager-section">
            <Label className="block font-semibold text-md underline-black">The Advertisement Manager,</Label>
            <Input name="advertisementManagerLine1" value={formData.advertisementManagerLine1} onChange={handleChange} placeholder="Newspaper/Agency Name" className="text-sm" />
            <Input name="advertisementManagerLine2" value={formData.advertisementManagerLine2} onChange={handleChange} placeholder="City/Address" className="text-sm" />
            <p className="text-xs pt-2">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
          </div>
        </div>

        <div className="overflow-x-auto table-container-print">
          <Table className="min-w-full print-table print-border border-black">
            <TableHeader className="bg-secondary print-table-header">
              <TableRow>
                <TableHead className="w-[8%] p-1.5 text-xs font-bold print-border-thin border border-black">Key No.</TableHead>
                <TableHead className="w-[20%] p-1.5 text-xs font-bold print-border-thin border border-black">Publication(s)</TableHead>
                <TableHead className="w-[12%] p-1.5 text-xs font-bold print-border-thin border border-black">Size</TableHead>
                <TableHead className="w-[15%] p-1.5 text-xs font-bold print-border-thin border border-black">Position</TableHead>
                <TableHead className="w-[10%] p-1.5 text-xs font-bold print-border-thin border border-black">Premium%</TableHead>
                <TableHead className="w-[10%] p-1.5 text-xs font-bold print-border-thin border border-black">Rate</TableHead>
                <TableHead className="w-[15%] p-1.5 text-xs font-bold print-border-thin border border-black">Insertion Date(s)</TableHead>
                <TableHead className="w-[10%] p-1.5 text-xs font-bold print-border-thin border border-black">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(formData.tableData || []).map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="p-1 print-border-thin border border-black min-h-[80px] h-auto align-top">
                    <Textarea name="keyNo" value={row.keyNo} onChange={(e) => handleTableChange(index, e)} className="text-xs min-h-[80px] h-auto print-table-cell" />
                  </TableCell>
                  <TableCell className="p-1 print-border-thin border border-black min-h-[80px] h-auto align-top">
                    <Textarea name="publication" value={row.publication} onChange={(e) => handleTableChange(index, e)} className="text-xs min-h-[80px] h-auto print-table-cell" />
                  </TableCell>
                  <TableCell className="p-1 print-border-thin border border-black min-h-[80px] h-auto align-top">
                    <Textarea name="size" value={row.size} onChange={(e) => handleTableChange(index, e)} className="text-xs min-h-[80px] h-auto print-table-cell" />
                  </TableCell>
                  <TableCell className="p-1 print-border-thin border border-black min-h-[80px] h-auto align-top">
                    <Textarea name="position" value={row.position} onChange={(e) => handleTableChange(index, e)} className="text-xs min-h-[80px] h-auto print-table-cell" />
                  </TableCell>
                  <TableCell className="p-1 print-border-thin border border-black min-h-[80px] h-auto align-top">
                    <Textarea name="premium" value={row.premium} onChange={(e) => handleTableChange(index, e)} className="text-xs min-h-[80px] h-auto print-table-cell" />
                  </TableCell>
                  <TableCell className="p-1 print-border-thin border border-black min-h-[80px] h-auto align-top">
                    <Textarea name="rate" value={row.rate} onChange={(e) => handleTableChange(index, e)} className="text-xs min-h-[80px] h-auto print-table-cell" />
                  </TableCell>
                  <TableCell className="p-1 print-border-thin border border-black min-h-[80px] h-auto align-top">
                    <Textarea name="insertionDate" value={row.insertionDate} onChange={(e) => handleTableChange(index, e)} className="text-xs min-h-[80px] h-auto print-table-cell" />
                  </TableCell>
                  <TableCell className="p-1 print-border-thin border border-black min-h-[80px] h-auto align-top">
                    <Textarea name="amount" value={row.amount} onChange={(e) => handleTableChange(index, e)} className="text-xs min-h-[80px] h-auto print-table-cell" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="matter-box flex print-border border border-black rounded-md h-[100px] overflow-hidden">
          <div className="matter-label bg-black text-white flex items-center justify-center p-2 w-[25px] flex-shrink-0">
            <span className="transform rotate-180 select-none" style={{ writingMode: 'vertical-lr' }}>MATTER</span>
          </div>
          <div className="matter-content p-0 flex-1">
            <Textarea
              id="matter"
              name="matter"
              value={formData.matter}
              onChange={handleChange}
              placeholder="Enter the matter here"
              className="h-full w-full text-sm border-0 resize-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 print-border border border-black p-3 rounded-md billing-address-box">
            <Label htmlFor="billingAddress" className="font-semibold text-md billing-title-underline">Forward all bills with relevant voucher copies to:-</Label>
            <Textarea id="billingAddress" name="billingAddress" value={formData.billingAddress} onChange={handleChange} className="text-xs min-h-[80px]" />
          </div>

          <div className="space-y-2 print-border border border-black p-3 rounded-md notes-stamp-container relative">
            <div className="notes-content">
                <Label htmlFor="notes" className="font-semibold text-md note-title-underline">Note:</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="1. First note..." className="text-xs min-h-[60px]" />
            </div>
            <div 
                className="stamp-container-interactive absolute top-1 right-1 w-[100px] h-[75px] border-dashed border-2 border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer rounded-md"
                onClick={() => stampInputRef.current?.click()}
                data-ai-hint="stamp seal"
            >
                {stampImage ? (
                    <Image src={stampImage} alt="Stamp Preview" layout="fill" objectFit="contain" className="rounded-md"/>
                ) : (
                    <div className="text-center text-xs p-1">
                        <UploadCloud size={24} className="mx-auto mb-1"/>
                        <span>Upload Stamp</span>
                    </div>
                )}
            </div>
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={stampInputRef}
                onChange={handleImageChange}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 p-4 border-t print-hidden">
        <Button onClick={togglePrintPreview} variant="outline"><Eye className="mr-2" />Preview Print</Button>
        <Button onClick={handleClearForm} variant="destructive"><Trash2 className="mr-2"/>Clear Form</Button>
        <Button onClick={handleLoadDraft}><FolderOpen className="mr-2"/>Load Draft</Button>
        <Button onClick={handleSaveDraft} variant="secondary"><Save className="mr-2"/>Save Draft</Button>
      </CardFooter>
    </Card>
  );
}
