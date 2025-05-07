
// src/components/ad-order-form.tsx
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Download, Printer, Eye, X, Save, Trash2, UploadCloud, Search, Eraser, CheckCircle, FileText, Settings, Copy, Palette, Briefcase, Users, Building, CalendarDays, FileDown, Maximize, EyeOff, Undo, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_STAMP_IMAGE_PLACEHOLDER = 'https://picsum.photos/200/120?random&data-ai-hint=signature+placeholder';


const AdOrderForm: React.FC = () => {
  const [ron, setRon] = useState<string>('');
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [clientName, setClientName] = useState<string>('');
  const [advManagerInput1, setAdvManagerInput1] = useState<string>('');
  const [advManagerInput2, setAdvManagerInput2] = useState<string>('');
  const [headingCaption, setHeadingCaption] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [matterText, setMatterText] = useState<string>('');
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [rowsData, setRowsData] = useState<Array<Record<string, string>>>([
    { keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
  ]);

  const printableAreaRef = useRef<HTMLDivElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Set initial date only once on client mount if not already set
    if (typeof window !== 'undefined' && !orderDate) {
        setOrderDate(new Date());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount


  const handleDateChange = (date: Date | undefined) => {
    setOrderDate(date);
  };

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      const isPrintingOrPdf = typeof window !== 'undefined' && (document.body.classList.contains('pdf-export-active') || window.matchMedia('print').matches || isPreviewing || isFullScreenPreview);
      if (!isPrintingOrPdf) {
        textarea.style.height = `${textarea.scrollHeight}px`;
      } else if (isPreviewing || isFullScreenPreview) {
        // For preview modes, allow scrollHeight to determine height for content visibility
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
       // For actual print via window.print(), CSS @media print handles height.
    }
  },[isPreviewing, isFullScreenPreview]);

  useEffect(() => {
    const allTextareas = document.querySelectorAll('#printable-area-pdf textarea');
    allTextareas.forEach(ta => adjustTextareaHeight(ta as HTMLTextAreaElement));
  }, [rowsData, matterText, adjustTextareaHeight]);


  const handleTextareaInput = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    index: number,
    field: string
  ) => {
    const newRowsData = [...rowsData];
    newRowsData[index][field] = e.target.value;
    setRowsData(newRowsData);
    adjustTextareaHeight(e.target);
  };

  const handleMatterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMatterText(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const addRow = useCallback(() => {
    setRowsData(prevRows => [
      ...prevRows,
      { keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' },
    ]);
  }, []);

  const deleteRow = useCallback((index: number) => {
    setRowsData(prevRows => prevRows.filter((_, i) => i !== index));
  }, []);


  const handleStampUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStampImage(result);
        localStorage.setItem('uploadedStampImage', result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const triggerStampUpload = () => {
    stampInputRef.current?.click();
  };

  useEffect(() => {
    const savedImage = localStorage.getItem('uploadedStampImage');
    if (savedImage) {
      setStampImage(savedImage);
    }
  }, []);


  const clearForm = () => {
    setRon('');
    setOrderDate(new Date());
    setClientName('');
    setAdvManagerInput1('');
    setAdvManagerInput2('');
    setHeadingCaption('');
    setPackageName('');
    setMatterText('');
    setRowsData([{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
  };

  const saveDraft = () => {
    const draftData = {
      ron,
      orderDate: orderDate?.toISOString(),
      clientName,
      advManagerInput1,
      advManagerInput2,
      headingCaption,
      packageName,
      matterText,
      rowsData,
      stampImage,
    };
    localStorage.setItem('adOrderFormDraft', JSON.stringify(draftData));
    alert('Draft saved!');
  };

  const loadDraft = () => {
    const draftString = localStorage.getItem('adOrderFormDraft');
    if (draftString) {
      const draftData = JSON.parse(draftString);
      setRon(draftData.ron || '');
      setOrderDate(draftData.orderDate ? new Date(draftData.orderDate) : new Date());
      setClientName(draftData.clientName || '');
      setAdvManagerInput1(draftData.advManagerInput1 || '');
      setAdvManagerInput2(draftData.advManagerInput2 || '');
      setHeadingCaption(draftData.headingCaption || '');
      setPackageName(draftData.packageName || '');
      setMatterText(draftData.matterText || '');
      setRowsData(draftData.rowsData && draftData.rowsData.length > 0 ? draftData.rowsData : [{ keyNo: '', publication: '', edition: '', size: '', scheduledDate: '', position: '' }]);
      setStampImage(draftData.stampImage);
      alert('Draft loaded!');
    } else {
      alert('No draft found.');
    }
  };

  const generatePdf = useCallback(async () => {
    const element = printableAreaRef.current;
    if (!element || typeof window === 'undefined' || !(window as any).html2pdf) {
        console.error('html2pdf is not loaded or element not found');
        return;
    }

    document.body.classList.add('pdf-export-active');

    const inputs = Array.from(element.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea')) as (HTMLInputElement | HTMLTextAreaElement)[];
    const originalValues: { el: HTMLElement, value: string, style?: string }[] = [];

    inputs.forEach(input => {
        originalValues.push({ el: input, value: input.value, style: input.style.cssText });
        if (input.id === 'orderDate' && orderDate) {
          (input as HTMLInputElement).value = format(orderDate, 'dd.MM.yyyy');
        }
    });

    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Apply specific styles for PDF generation to the clone
    clonedElement.style.width = '210mm';
    clonedElement.style.minHeight = '297mm'; // Ensure it tries to fit A4 height
    clonedElement.style.height = 'auto'; // Allow content to define height
    clonedElement.style.boxSizing = 'border-box';
    clonedElement.style.overflow = 'hidden'; // Clip content that overflows fixed A4 size

    const textareasInClone = clonedElement.querySelectorAll('textarea');
    textareasInClone.forEach(ta => {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
        ta.style.overflow = 'hidden';
        ta.style.boxSizing = 'border-box'; // Ensure padding/border are included in height
    });

    const inputsToConvert = clonedElement.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
    inputsToConvert.forEach(inputEl => {
        const p = document.createElement('span');
        const input = inputEl as HTMLInputElement;
        let value = input.value;
        if (input.id === 'orderDate' && orderDate) {
             value = format(orderDate, 'dd.MM.yyyy');
        } else if (input.type === 'date' && !input.value && input.placeholder) {
            value = '';
        }
        p.textContent = value || '';
        p.className = 'static-print-text'; // Ensure this class applies styles for PDF
        p.style.display = 'inline-block';
        p.style.width = getComputedStyle(input).width;
        p.style.fontFamily = getComputedStyle(input).fontFamily;
        p.style.fontSize = getComputedStyle(input).fontSize;
        p.style.fontWeight = getComputedStyle(input).fontWeight;
        p.style.lineHeight = getComputedStyle(input).lineHeight;
        p.style.color = 'black';
        p.style.borderBottom = '1px solid black';
        p.style.padding = '2px 0'; // Consistent padding
        p.style.backgroundColor = 'transparent'; // Ensure no background color
        input.parentNode?.replaceChild(p, input);
    });

    const textareasToConvert = clonedElement.querySelectorAll('textarea');
    textareasToConvert.forEach(textareaEl => {
        const div = document.createElement('div');
        const textarea = textareaEl as HTMLTextAreaElement;
        div.innerHTML = textarea.value.replace(/\n/g, '<br>') || '';
        div.className = 'static-print-text textarea-static-print'; // Ensure this class applies styles for PDF
         if (textarea.id === 'matterTextarea') {
             div.classList.add('matter-container-print');
        }
        div.style.cssText = getComputedStyle(textarea).cssText; // Copy all computed styles
        div.style.border = 'none'; // Remove textarea border
         if (textarea.id === 'matterTextarea') {
            div.style.borderTop = '1px solid black';
            div.style.borderBottom = '1px solid black';
        }
        div.style.height = 'auto';
        div.style.minHeight = 'unset'; // Remove min-height for PDF version
        div.style.overflow = 'visible'; // Show all content
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.backgroundColor = 'transparent'; // Ensure no background color
        textarea.parentNode?.replaceChild(div, textarea);
    });

    const releaseOrderTitleClone = clonedElement.querySelector('.release-order-title-screen') as HTMLElement;
    if (releaseOrderTitleClone) {
        releaseOrderTitleClone.className = 'release-order-titlebar-print-preview';
    }
    const matterLabelClone = clonedElement.querySelector('.matter-label-screen') as HTMLElement;
    if (matterLabelClone) {
        matterLabelClone.className = 'matter-label-print-preview';
    }
    const stampContainerClone = clonedElement.querySelector('.stamp-container-screen') as HTMLElement;
    if(stampContainerClone) {
        stampContainerClone.className = 'stamp-container-print-preview';
        if (stampImage) {
            const img = document.createElement('img');
            img.src = stampImage;
            img.alt = "Stamp";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.objectFit = "contain";
            stampContainerClone.innerHTML = '';
            stampContainerClone.appendChild(img);
        } else {
            stampContainerClone.textContent = 'Stamp Area';
        }
    }

    const tableClone = clonedElement.querySelector('.main-table-bordered');
    if (tableClone) {
        tableClone.classList.add('print-table');
        const tableHeaders = tableClone.querySelectorAll('th');
        tableHeaders.forEach(th => th.classList.add('print-table-header'));
    }

    const opt = {
        margin: [5, 5, 5, 5], // top, left, bottom, right in mm
        filename: 'application_form.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            scrollY: -window.scrollY,
            windowWidth: clonedElement.scrollWidth, // Use clonedElement's width
            windowHeight: clonedElement.scrollHeight, // Use clonedElement's height
            onclone: (document: Document) => {
                const clonedBody = document.body;
                clonedBody.classList.add('pdf-export-active'); // Apply the special class for PDF context
                // Ensure all styles are applied in the clone
                const styles = document.createElement('style');
                styles.innerHTML = `
                    @media print {
                        .static-print-text { display: inline-block !important; padding: 2px 0 !important; margin: 0 !important; font-weight: bold !important; font-size: 14px !important; color: black !important; background-color: transparent !important; border: none !important; border-bottom: 1px solid black !important; width: auto !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; white-space: pre-wrap !important; word-wrap: break-word !important; }
                        .textarea-static-print { border-bottom: none !important; height: auto !important; min-height: initial !important; resize: none !important; overflow: visible !important; white-space: pre-wrap !important; word-wrap: break-word !important; }
                        .matter-container-print .textarea-static-print { border-top: 1px solid black !important; border-bottom: 1px solid black !important; padding: 2px !important; }
                        .release-order-titlebar-print-preview { text-align: center !important; margin-top: 0px !important; margin-bottom: 10px !important; background-color: black !important; color: white !important; border: 2px solid black !important; padding: 4px 10px !important; font-weight: bold !important; width: fit-content !important; margin-left: auto !important; margin-right: auto !important; border-radius: 4px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .matter-label-print-preview { writing-mode: vertical-lr !important; text-orientation: mixed !important; transform: rotate(180deg); padding: 2px !important; font-size: 14px !important; font-weight: bold !important; text-align: center !important; border-right: 1px solid black !important; background-color: black !important; color: white !important; width: 38px !important; height: auto !important; display: flex !important; align-items: center !important; justify-content: center !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .stamp-container-print-preview { width: 160px !important; height: 90px !important; border: 1px dashed #ccc !important; display: flex !important; justify-content: center !important; align-items: center !important; background-color: #f9f9f9 !important; font-size: 10px !important; color: #555 !important; text-align: center !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .print-table { width: 100% !important; border-collapse: collapse !important; border: 2px solid black !important; font-size: 12px !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .print-table th, .print-table td { border: 1px solid black !important; padding: 4px !important; text-align: left !important; vertical-align: top !important; word-wrap: break-word !important; color: black !important; background-color: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .print-table th.print-table-header { background-color: #f0f0f0 !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                    body.pdf-export-active #printable-area-pdf { padding: 10mm !important; border: 4px solid black !important; }
                    body.pdf-export-active * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                `;
                document.head.appendChild(styles);

                // Force reflow
                clonedBody.style.display = 'none';
                clonedBody.offsetHeight; 
                clonedBody.style.display = '';
            }
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
        },
        pagebreak: { mode: ['css', 'avoid-all'], before: '.page-break-before' }
    };


    (window as any).html2pdf().from(clonedElement).set(opt).save()
    .then(() => {
        inputs.forEach(input => {
            const original = originalValues.find(ov => ov.el === input);
            if (original) {
                (input as HTMLInputElement).value = original.value;
                if(original.style) input.style.cssText = original.style;
                else input.removeAttribute('style');
            }
            if (input.tagName.toLowerCase() === 'textarea') {
                adjustTextareaHeight(input as HTMLTextAreaElement);
            }
        });
        document.body.classList.remove('pdf-export-active');
    })
    .catch((error: any) => {
        console.error("Error generating PDF:", error);
        inputs.forEach(input => {
            const original = originalValues.find(ov => ov.el === input);
            if (original) {
                (input as HTMLInputElement).value = original.value;
                if(original.style) input.style.cssText = original.style;
                 else input.removeAttribute('style');
            }
             if (input.tagName.toLowerCase() === 'textarea') {
                adjustTextareaHeight(input as HTMLTextAreaElement);
            }
        });
        document.body.classList.remove('pdf-export-active');
    });


  }, [orderDate, stampImage, adjustTextareaHeight]);


  const handlePrintPreview = useCallback(() => {
    setIsPreviewing(true);
    if (typeof window !== 'undefined') document.body.classList.add('print-preview-active');
  }, []);

  const handleClosePrintPreview = useCallback(() => {
    setIsPreviewing(false);
    if (typeof window !== 'undefined') document.body.classList.remove('print-preview-active');
    const previewContentDiv = typeof window !== 'undefined' ? document.getElementById('printPreviewContent') : null;
    if (previewContentDiv) {
        previewContentDiv.innerHTML = '';
    }
  }, []);

  const handleActualPrint = useCallback(() => {
    if (typeof window !== 'undefined') window.print();
  }, []);

  const handleFullScreenPreview = useCallback(() => {
    const element = printableAreaRef.current;
    if (!element || typeof window === 'undefined') return;

    if (!document.fullscreenElement) {
        element.requestFullscreen().then(() => {
          setIsFullScreenPreview(true);
          document.body.classList.add('fullscreen-body-active');
          element.classList.add('fullscreen-preview-active');
        }).catch(err => {
          alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    }
  }, []);

  const handleExitFullScreenPreview = useCallback(() => {
    const element = printableAreaRef.current;
    if (typeof window === 'undefined') return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    // Fullscreen change handler below will set isFullScreenPreview to false
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fullscreenChangeHandler = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      setIsFullScreenPreview(isCurrentlyFullScreen);
      const element = printableAreaRef.current;
      if (!isCurrentlyFullScreen) {
          document.body.classList.remove('fullscreen-body-active');
           if (element) {
                element.classList.remove('fullscreen-preview-active');
           }
      } else {
          document.body.classList.add('fullscreen-body-active');
          if (element) {
                element.classList.add('fullscreen-preview-active');
           }
      }
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    };
  }, []);


  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPreviewing && !isFullScreenPreview) {
      const previewNode = printableAreaRef.current?.cloneNode(true) as HTMLElement | null;
      const previewContentDiv = document.getElementById('printPreviewContent');

      if (previewContentDiv && previewNode) {
        previewNode.querySelectorAll('.no-print-preview').forEach(el => el.remove());

        const releaseOrderTitle = previewNode.querySelector('.release-order-title-screen');
        if (releaseOrderTitle) {
            releaseOrderTitle.className = 'release-order-titlebar-print-preview';
        }

        const matterLabel = previewNode.querySelector('.matter-label-screen');
        if (matterLabel) {
            matterLabel.className = 'matter-label-print-preview';
        }

        const stampContainer = previewNode.querySelector('.stamp-container-screen');
        if(stampContainer) {
            stampContainer.className = 'stamp-container-print-preview';
            if (stampImage) {
                 const img = document.createElement('img');
                 img.src = stampImage;
                 img.alt = "Stamp";
                 img.style.maxWidth = "100%";
                 img.style.maxHeight = "100%";
                 img.style.objectFit = "contain";
                 stampContainer.innerHTML = '';
                 stampContainer.appendChild(img);
            } else {
                stampContainer.textContent = 'Stamp Area';
            }
        }

        const inputs = previewNode.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputs.forEach(inputEl => {
            const p = document.createElement('span');
            const input = inputEl as HTMLInputElement;
            let value = input.value || '';
            if (input.id === 'orderDate' && orderDate) {
                 value = format(orderDate, 'dd.MM.yyyy');
            } else if (!input.value && input.placeholder && input.type !== 'date') {
                value = '';
            } else if (input.type === 'date' && !input.value) {
                 value = '';
            }
            p.textContent = value;
            p.className = 'static-print-text'; // Use class for styling
            input.parentNode?.replaceChild(p, input);
        });

        const textareas = previewNode.querySelectorAll('textarea');
        textareas.forEach(textareaEl => {
            const div = document.createElement('div');
            const textarea = textareaEl as HTMLTextAreaElement;
            let value = textarea.value.replace(/\n/g, '<br>') || '';
            if (!textarea.value && textarea.placeholder) {
                value = '';
            }
            div.innerHTML = value;
            div.className = 'static-print-text textarea-static-print'; // Use class for styling
            if (textarea.id === 'matterTextarea') {
                 div.classList.add('matter-container-print');
            }
            // Copy relevant styles if needed, but prefer class-based styling
            div.style.fontFamily = getComputedStyle(textarea).fontFamily;
            div.style.fontSize = getComputedStyle(textarea).fontSize;
            div.style.fontWeight = getComputedStyle(textarea).fontWeight;
            div.style.lineHeight = getComputedStyle(textarea).lineHeight;
            div.style.color = 'black';
            div.style.backgroundColor = 'transparent';
            div.style.height = 'auto';
            div.style.minHeight = 'unset';
            div.style.overflow = 'visible';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordWrap = 'break-word';

            textarea.parentNode?.replaceChild(div, textarea);
        });

        const tableInPreview = previewNode.querySelector('.main-table-bordered');
        if (tableInPreview) {
            tableInPreview.classList.add('print-table');
            const tableHeaders = tableInPreview.querySelectorAll('th');
            tableHeaders.forEach(th => th.classList.add('print-table-header'));
        }


        previewContentDiv.innerHTML = '';
        previewContentDiv.appendChild(previewNode);

        const textareasInPreview = previewContentDiv.querySelectorAll('.textarea-static-print');
        textareasInPreview.forEach(ta => {
            const htmlTa = ta as HTMLElement;
            htmlTa.style.height = 'auto'; // Ensure auto height for content fitting
            htmlTa.style.height = `${htmlTa.scrollHeight}px`; // Set to scrollHeight
        });

      }
    } else if (!isPreviewing && !isFullScreenPreview) {
        const previewContentDiv = document.getElementById('printPreviewContent');
        if (previewContentDiv) previewContentDiv.innerHTML = '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewing, isFullScreenPreview, orderDate, stampImage, rowsData, matterText, clientName, advManagerInput1, advManagerInput2, headingCaption, packageName, ron, adjustTextareaHeight ]);

  if (!isClient) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-[210mm] mx-auto p-1 print-root-container bg-background" id="main-application-container">
      <Card className="mb-4 shadow-lg no-print">
        <CardContent className="p-4 flex flex-wrap gap-2 justify-center">
          <Button onClick={saveDraft} variant="outline"><Save className="mr-2 h-4 w-4" />Save Draft</Button>
          <Button onClick={loadDraft} variant="outline"><UploadCloud className="mr-2 h-4 w-4" />Load Draft</Button>
          <Button onClick={clearForm} variant="destructive"><Eraser className="mr-2 h-4 w-4" />Clear Form</Button>
          <Button onClick={generatePdf} variant="default"><FileDown className="mr-2 h-4 w-4" />Download PDF</Button>
          <Button onClick={handlePrintPreview} variant="outline" className="no-pdf-export"><Eye className="mr-2 h-4 w-4" />Print Preview</Button>
          <Button onClick={isFullScreenPreview ? handleExitFullScreenPreview : handleFullScreenPreview} variant="outline" className="no-pdf-export">
            {isFullScreenPreview ? <EyeOff className="mr-2 h-4 w-4" /> : <Maximize className="mr-2 h-4 w-4" />}
            {isFullScreenPreview ? 'Exit Full Screen' : 'Full Screen View'}
          </Button>
        </CardContent>
      </Card>

      <div id="printable-area-pdf" ref={printableAreaRef} className={`w-full print-target bg-card text-card-foreground shadow-sm p-2 md:p-4 rounded-lg border-4 border-black ${isFullScreenPreview ? 'fullscreen-preview-active' : ''}`}>
        <div className="text-center mt-2 mb-4 release-order-title-screen">
             <h2 className="text-2xl font-bold inline-block px-3 py-1 bg-black text-white border-2 border-black rounded">RELEASE ORDER</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-5">
          <div className="w-full md:w-[35%] p-3 border-2 border-black rounded box-decoration-clone">
            <h3 className="text-lg font-bold">Lehar</h3>
            <h4 className="text-md font-semibold">ADVERTISING PVT.LTD.</h4>
            <p className="text-xs mt-1 leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
            <p className="text-xs leading-snug">Alaknanda Commercial complex, <br /> New Delhi-110019</p>
            <p className="text-xs mt-1 leading-snug">Tel.: 49573333, 34, 35, 36</p>
            <p className="text-xs leading-snug">Fax: 26028101</p>
            <p className="text-xs mt-1 leading-snug"><strong>GSTIN:</strong> 07AABCL5406F1ZU</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 p-3 border-2 border-black rounded">
            <div className="flex gap-3 items-center">
              <div className="flex-1 flex items-center">
                <Label htmlFor="roNumber" className="text-sm font-bold mr-2 whitespace-nowrap">R.O. No. LN:</Label>
                <Input id="roNumber" type="number" placeholder="Enter Number" value={ron} onChange={(e) => setRon(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
              </div>
              <div className="flex-1 flex items-center">
                 <Label htmlFor="orderDate" className="text-sm font-bold mr-2 whitespace-nowrap">Date:</Label>
                 <DatePicker selected={orderDate} onChange={handleDateChange} dateFormat="dd.MM.yyyy" className="text-sm py-1 px-2 h-auto w-full" id="orderDate" placeholder="Select Date" />
              </div>
            </div>
            <div className="flex items-center">
              <Label htmlFor="clientName" className="text-sm font-bold mr-2 whitespace-nowrap">Client:</Label>
              <Input id="clientName" placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
            </div>
             <div>
              <Label className="text-sm font-bold">The Advertisement Manager</Label>
              <Input placeholder="Publication Name / Address Line 1" value={advManagerInput1} onChange={(e) => setAdvManagerInput1(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1" />
              <Input placeholder="Address Line 2 / City" value={advManagerInput2} onChange={(e) => setAdvManagerInput2(e.target.value)} className="text-sm py-1 px-2 h-auto mt-1" />
            </div>
            <div className="mt-2 pt-2 border-t border-black">
              <p className="text-sm font-bold">Kindly insert the advertisement/s in your issue/s for the following date/s</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-5">
            <div className="flex-1 p-3 border-2 border-black rounded">
                <Label htmlFor="headingCaption" className="text-sm font-bold block mb-1">Heading/Caption:</Label>
                <Input id="headingCaption" placeholder="Enter caption here" value={headingCaption} onChange={(e) => setHeadingCaption(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
            </div>
            <div className="w-full md:w-[35%] p-3 border-2 border-black rounded">
                <Label htmlFor="packageName" className="text-sm font-bold block mb-1">Package:</Label>
                <Input id="packageName" placeholder="Enter package name" value={packageName} onChange={(e) => setPackageName(e.target.value)} className="text-sm py-1 px-2 h-auto"/>
            </div>
        </div>

        <div className="mb-5 table-container-print">
         <Table className="print-table main-table-bordered">
           <TableHeader className="print-table-header">
             <TableRow>
               <TableHead className="w-[10%] main-table-bordered p-1.5 text-sm font-bold">Key No.</TableHead>
               <TableHead className="w-[25%] main-table-bordered p-1.5 text-sm font-bold">Publication(s)</TableHead>
               <TableHead className="w-[20%] main-table-bordered p-1.5 text-sm font-bold">Edition(s)</TableHead>
               <TableHead className="w-[15%] main-table-bordered p-1.5 text-sm font-bold">Size</TableHead>
               <TableHead className="w-[15%] main-table-bordered p-1.5 text-sm font-bold">Scheduled Date(s)</TableHead>
               <TableHead className="w-[15%] main-table-bordered p-1.5 text-sm font-bold">Position</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {rowsData.map((row, index) => (
               <TableRow key={index} className="print-table-row">
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.keyNo} onChange={(e) => handleTextareaInput(e, index, 'keyNo')} placeholder="Key" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.publication} onChange={(e) => handleTextareaInput(e, index, 'publication')} placeholder="Publication" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.edition} onChange={(e) => handleTextareaInput(e, index, 'edition')} placeholder="Edition" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.size} onChange={(e) => handleTextareaInput(e, index, 'size')} placeholder="Size" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.scheduledDate} onChange={(e) => handleTextareaInput(e, index, 'scheduledDate')} placeholder="Date(s)" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
                 <TableCell className="main-table-bordered p-0 align-top">
                   <Textarea value={row.position} onChange={(e) => handleTextareaInput(e, index, 'position')} placeholder="Position" className="text-xs p-1 border-0 rounded-none resize-none min-h-[70px] h-auto no-shadow-outline print-textarea textarea-align-top" />
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
          <div className="flex justify-center gap-2 mt-2 no-print no-pdf-export no-print-preview">
            <Button onClick={addRow} size="sm" variant="outline">Add Row</Button>
            {rowsData.length > 1 && <Button onClick={() => deleteRow(rowsData.length -1)} size="sm" variant="destructive">Delete Last Row</Button>}
          </div>
        </div>

        <div className="flex mb-3 min-h-[100px] items-stretch matter-container-print">
            <div className="matter-label-screen flex items-center justify-center p-1 w-[38px]">
                <span className="text-sm font-bold">MATTER</span>
            </div>
            <Textarea
              id="matterTextarea"
              placeholder="Enter matter here..."
              value={matterText}
              onChange={handleMatterChange}
              className="flex-1 text-sm p-2 border border-black border-l-0 rounded-none resize-none min-h-[100px] h-auto no-shadow-outline focus:border-black matter-content-screen"
            />
        </div>

        <div className="p-3 border-2 border-black rounded flex flex-col print-footer-box">
          <div className="flex flex-col md:flex-row justify-between gap-4 pb-2">
            <div className="w-full md:w-[58%]">
              <p className="text-xs font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Forward all bills with relevant VTS copy to :-</p>
              <p className="text-xs leading-snug">D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101</p>
            </div>
            <div className="w-full md:w-[38%] flex justify-center md:justify-end items-start stamp-parent-container">
                <div
                  className="stamp-container-screen w-[180px] h-[100px] flex items-center justify-center text-xs text-gray-500 bg-transparent rounded cursor-pointer hover:opacity-80"
                  onClick={triggerStampUpload}
                  title="Click to upload stamp image"
                >
                {stampImage ? (
                     <Image src={stampImage} alt="Stamp" width={180} height={100} style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} data-ai-hint="signature company stamp" className="border border-dashed border-gray-300"/>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-50">
                    <Image src={DEFAULT_STAMP_IMAGE_PLACEHOLDER} alt="Upload Stamp Placeholder" width={176} height={96} style={{ objectFit: 'contain' }} data-ai-hint="upload placeholder"/>
                  </div>
                )}
                <Input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-black">
            <p className="text-xs font-bold underline decoration-black decoration-2 underline-offset-2 mb-1">Note:</p>
            <ol className="list-decimal list-inside text-xs space-y-0.5">
              <li>Space reserved vide our letter No. </li>
              <li>No two advertisements of the same client should appear in the same issue.</li>
              <li>Please quote R.O. No. in all your bills and letters.</li>
              <li>Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</li>
            </ol>
          </div>
        </div>
      </div>

      {isPreviewing && !isFullScreenPreview && (
        <div
          id="printPreviewOverlay"
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4 no-print"
          onClick={(e) => {
             if (e.target === e.currentTarget) {
                handleClosePrintPreview();
            }
          }}
        >
          <div
            id="printPreviewModalContentContainer"
            className="bg-white w-auto max-w-[210mm] min-h-[297mm] h-auto max-h-[95vh] p-0 shadow-2xl overflow-y-auto print-preview-modal-content no-print"
            onClick={(e) => e.stopPropagation()}
          >
             <div id="printPreviewContent" className="print-preview-inner-content">
                 {/* Preview content will be injected here by useEffect */}
             </div>
          </div>
          <Button
            onClick={handleClosePrintPreview}
            variant="destructive"
            className="fixed top-4 right-4 z-[1001] no-print no-pdf-export"
            aria-label="Close print preview"
          >
            <X className="mr-2 h-4 w-4" /> Close Preview
          </Button>
           <Button
            onClick={handleActualPrint}
            variant="default"
            className="fixed top-4 right-48 z-[1001] no-print no-pdf-export"
            aria-label="Print document"
          >
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      )}

      {isFullScreenPreview && (
         <div id="fullscreen-content-host" className="fixed inset-0 bg-white z-[2000] overflow-auto p-4 no-print">
            {/* This div is mainly for the exit button when printableAreaRef itself is fullscreen.
                The actual content is within printableAreaRef. */}
            <Button
                onClick={handleExitFullScreenPreview}
                variant="destructive"
                className="fixed top-4 right-4 z-[2001] no-print no-pdf-export"
                aria-label="Exit Full Screen Preview"
            >
                <X className="mr-2 h-4 w-4" /> Exit Full Screen
            </Button>
            <Button
                onClick={handleActualPrint}
                variant="default"
                className="fixed top-4 right-56 z-[2001] no-print no-pdf-export"
                aria-label="Print document from fullscreen"
            >
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
         </div>
      )}
    </div>
  );
};

export default AdOrderForm;
