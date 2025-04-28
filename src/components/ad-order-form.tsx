'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ScheduleRow {
  id: number;
  keyNo: string;
  publication: string;
  edition: string;
  size: string;
  scheduledDate: string;
  position: string;
}

export default function AdOrderForm() {
  const [caption, setCaption] = useState('');
  const [packageName, setPackageName] = useState('');
  const [matter, setMatter] = useState('');
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([
    { id: Date.now(), keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
  ]);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const stampFileRef = useRef<HTMLInputElement>(null);
  const printableAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        setStampPreview(e.target?.result as string);
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

  return (
    <div className="max-w-[210mm] mx-auto font-bold">
       <div className="flex justify-end mb-4 no-print">
            <Button onClick={handlePrint}>
              Print Release Order
            </Button>
        </div>

      <Card id="printable-area" ref={printableAreaRef} className="w-full print-border-heavy border-4 border-black rounded-none shadow-none p-5">
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center bg-black text-white p-1 rounded mb-5 header-title">
            <h1 className="text-2xl m-0 font-bold">RELEASE ORDER</h1>
          </div>

          {/* Caption & Package */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 print-border border-2 border-black rounded p-2">
              <Label htmlFor="caption" className="block mb-1">Heading/Caption:</Label>
              <Input
                id="caption"
                type="text"
                placeholder="Enter caption here"
                className="w-full border-0 border-b border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            <div className="w-[30%] print-border border-2 border-black rounded p-2">
              <Label htmlFor="package" className="block mb-1">Package:</Label>
              <Input
                id="package"
                type="text"
                placeholder="Enter package name"
                className="w-full border-0 border-b border-black rounded-none px-1 py-1 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
              />
            </div>
          </div>

          {/* Schedule Table */}
          <div className="mb-5">
            <Table className="print-border border-2 border-black">
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
          <div className="flex h-[150px] print-border border-2 border-black rounded mb-5 overflow-hidden">
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
          <div className="print-border border-2 border-black rounded p-2 mb-5">
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
          <div className="relative print-border border-2 border-black rounded p-2 pr-[130px]">
            <p className="font-bold mb-1">Note:</p>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Space reserved vide our letter No. <Input type="text" className="inline-block w-24 h-5 p-0 border-0 border-b border-black rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none font-bold" /></li>
              <li>No two advertisements of the same client should appear in the same issue.</li>
              <li>Please quote R.O. No. in all your bills and letters.</li>
              <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
            </ol>
             {/* Stamp Area */}
            <div className="stamp-container absolute top-2 right-2 w-[100px] h-[100px] print-border-thin border border-black rounded bg-white flex items-center justify-center cursor-pointer" onClick={triggerStampUpload}>
                <Input
                    type="file"
                    ref={stampFileRef}
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="hidden"
                    id="stampFile"
                    />
                 {stampPreview ? (
                     <Image
                        id="stampPreview"
                        src={stampPreview}
                        alt="Stamp Preview"
                        width={100}
                        height={100}
                        className="object-contain max-w-[100px] max-h-[100px]"
                      />
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
