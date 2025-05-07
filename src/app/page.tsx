
"use client";

import React, { useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    html2pdf: any;
  }
}

export default function ApplicationFormPage() {
  const applicationRef = useRef<HTMLDivElement>(null);
  const printPreviewContentRef = useRef<HTMLDivElement>(null);
  const printPreviewContainerRef = useRef<HTMLDivElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textareas = document.querySelectorAll('#tableBody textarea');
    textareas.forEach(textarea => {
      const ta = textarea as HTMLTextAreaElement;
      ta.style.height = 'auto'; // Reset height to shrink if text is deleted
      ta.style.height = `${ta.scrollHeight}px`; // Set to scroll height
    });
  }, []);

  const addRow = useCallback(() => {
    const table = document.getElementById('tableBody');
    if (table) {
      const newRow = document.createElement('tr');
      for (let i = 0; i < 6; i++) {
        const cell = document.createElement('td');
        cell.style.border = '1px solid black';
        cell.style.padding = '6px';
        cell.style.verticalAlign = 'top'; // Align text to the top
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = 'auto';
        textarea.style.minHeight = '160px'; // Increased min-height
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.fontWeight = 'bold';
        textarea.style.fontSize = '14px';
        textarea.style.color = '#000';
        textarea.style.backgroundColor = '#fff';
        textarea.style.boxSizing = 'border-box';
        textarea.style.resize = 'none';
        textarea.setAttribute('aria-label', 'Enter table row');
        textarea.addEventListener('input', adjustTextareaHeight); // Adjust height on input
        cell.appendChild(textarea);
        newRow.appendChild(cell);
      }
      table.appendChild(newRow);
      // No need to call adjustTextareaHeight here as individual textareas will adjust on input or initial load if they have content
    }
  }, [adjustTextareaHeight]);


  const deleteRow = useCallback(() => {
    const table = document.getElementById('tableBody');
    if (table && table.rows.length > 0) {
      table.deleteRow(-1);
    }
  }, []);

  const generatePdf = useCallback(() => {
    const element = applicationRef.current;
    if (element && window.html2pdf) {
      const buttonsToHide = element.querySelectorAll('.button-container, .print-icon-container, .new-row-buttons');
      buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = 'none');

      const opt = {
        margin: 10,
        filename: 'application.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, windowWidth: element.scrollWidth, windowHeight: element.scrollHeight },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save().then(() => {
        buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = '');
      });
    }
  }, []);

  const showPrintPreview = useCallback(() => {
    if (printPreviewContainerRef.current && printPreviewContentRef.current && applicationRef.current) {
      const clonedApp = applicationRef.current.cloneNode(true) as HTMLElement;
      clonedApp.querySelectorAll('.button-container, .print-icon-container, .new-row-buttons, #printPreviewButton, #downloadPdfButton, #fullScreenButton, .no-print-in-preview').forEach(el => el.remove());
      
      // Ensure styles for print preview are applied, especially for matter and release order
      const matterDivPreview = clonedApp.querySelector('[data-ai-id="matter-text-container"]');
      if (matterDivPreview) {
        (matterDivPreview as HTMLElement).style.backgroundColor = 'black';
        (matterDivPreview as HTMLElement).style.color = 'white';
      }
      const releaseOrderDivPreview = clonedApp.querySelector('[data-ai-id="release-order-title"]');
      if (releaseOrderDivPreview) {
        (releaseOrderDivPreview as HTMLElement).style.backgroundColor = 'black';
        (releaseOrderDivPreview as HTMLElement).style.color = 'white';
      }
      
      const textareasPreview = clonedApp.querySelectorAll('textarea');
        textareasPreview.forEach(ta => {
            const p = document.createElement('p');
            p.textContent = ta.value;
            p.style.whiteSpace = 'pre-wrap'; // Preserve line breaks and spaces
            p.style.fontWeight = 'bold';
            p.style.fontSize = '14px';
            p.style.margin = '0';
            p.style.padding = '0';
            p.style.minHeight = ta.style.minHeight; // Keep min height for layout
            if(ta.parentElement && ta.parentElement.style.verticalAlign === 'top'){
                 p.style.verticalAlign = 'top';
            }
            ta.parentNode?.replaceChild(p, ta);
        });

        const inputsPreview = clonedApp.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
        inputsPreview.forEach(inp => {
            const inputElement = inp as HTMLInputElement;
            const p = document.createElement('p');
            if (inputElement.type === 'date') {
                p.textContent = inputElement.value ? new Date(inputElement.value).toLocaleDateString('en-GB') : ''; // Format date as dd/mm/yyyy
            } else {
                p.textContent = inputElement.value;
            }
            p.style.fontWeight = 'bold';
            p.style.fontSize = '14px';
            p.style.margin = '0';
            p.style.padding = inputElement.style.padding || '0';
            p.style.width = '100%';
            p.style.boxSizing = 'border-box';
            if (inputElement.placeholder && !inputElement.value) {
              // Optionally show placeholder if value is empty, or leave it blank
              // p.textContent = inputElement.placeholder;
              // p.style.color = '#aaa'; // Placeholder color
            }
            inp.parentNode?.replaceChild(p, inp);
        });


      printPreviewContentRef.current.innerHTML = ''; 
      printPreviewContentRef.current.appendChild(clonedApp);
      printPreviewContainerRef.current.style.display = 'flex';
    }
  }, []);

  const closePrintPreview = useCallback(() => {
    if (printPreviewContainerRef.current) {
      printPreviewContainerRef.current.style.display = 'none';
    }
  }, []);

  const printFullScreen = useCallback(() => {
    window.print();
  }, []);
  
  const [currentDate, setCurrentDate] = React.useState('');

  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();
    setCurrentDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    const dateInput = document.getElementById('date') as HTMLInputElement | null;
    if (dateInput && currentDate) {
      dateInput.value = currentDate;
    }
  }, [currentDate]);


  useEffect(() => {
    addRow(); 

    const matterTextArea = document.querySelector('#application textarea[placeholder="Enter matter here..."]') as HTMLTextAreaElement | null;
    if (matterTextArea) {
      matterTextArea.style.borderTop = '1px solid black'; 
      matterTextArea.style.borderBottom = '1px solid black'; 
      const handleFocus = () => { 
          if(matterTextArea) {
            matterTextArea.style.borderTop = '1px solid black';
            matterTextArea.style.borderBottom = '1px solid black';
          }
      };
      const handleBlur = () => { 
          if(matterTextArea) {
            matterTextArea.style.borderTop = '1px solid black';
            matterTextArea.style.borderBottom = '1px solid black';
          }
      };
      matterTextArea.addEventListener('focus', handleFocus);
      matterTextArea.addEventListener('blur', handleBlur);
      
      return () => {
        matterTextArea.removeEventListener('focus', handleFocus);
        matterTextArea.removeEventListener('blur', handleBlur);
      };
    }
  }, [addRow]);

  useEffect(() => {
    const downloadPdfButton = document.getElementById('downloadPdfButton');
    const printPreviewButton = document.getElementById('printPreviewButton');
    const fullScreenButton = document.getElementById('fullScreenButton');


    if (downloadPdfButton) downloadPdfButton.addEventListener('click', generatePdf);
    if (printPreviewButton) printPreviewButton.addEventListener('click', showPrintPreview);
    if (fullScreenButton) fullScreenButton.addEventListener('click', printFullScreen);
    
    // Set initial height for textareas in existing rows (if any)
    adjustTextareaHeight();

    return () => {
      if (downloadPdfButton) downloadPdfButton.removeEventListener('click', generatePdf);
      if (printPreviewButton) printPreviewButton.removeEventListener('click', showPrintPreview);
      if (fullScreenButton) fullScreenButton.removeEventListener('click', printFullScreen);
    };
  }, [generatePdf, showPrintPreview, printFullScreen, adjustTextareaHeight]);


  return (
    <>
      <div id="application" ref={applicationRef}>
        <div className="button-container no-print">
          <button id="printPreviewButton" aria-label="Print Preview">Print Preview</button>
          <button id="downloadPdfButton" aria-label="Download as PDF">Download as PDF</button>
          <button id="fullScreenButton" aria-label="Full Screen Print">Print</button>
        </div>
        
        <div data-ai-id="release-order-title" style={{ textAlign: 'center', marginTop: '10px', backgroundColor: 'black', color: 'white', border: '2px solid black', padding: '4px 10px', fontWeight: 'bold', width: 'fit-content', marginLeft: 'auto', marginRight: 'auto', borderRadius: '4px', position: 'relative', top: '0' }}>
            <h2 style={{ margin: '0', fontSize: '22px' }}>RELEASE ORDER</h2>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <div className="full-width" style={{ width: '30%', padding: '8px', border: '2px solid black', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', fontSize: '14px', position: 'relative', borderRadius: '4px', color: '#000' }}>
                <h3 style={{ margin: '0', textAlign: 'left', fontSize: '16px', color: '#000' }}>Lehar</h3>
                <h4 style={{ marginTop: '0', textAlign: 'left', fontSize: '15px', color: '#000' }}>ADVERTISING PVT.LTD.</h4>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', color: '#000' }}>D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', color: '#000' }}>Alaknanda Commercial complex, <br /> New Delhi-110019</p>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', color: '#000' }}>Tel.: 49573333, 34, 35, 36</p>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', color: '#000' }}>Fax: 26028101</p>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', display: 'flex', alignItems: 'baseline', gap: '4px', color: '#000' }}><strong>GSTIN:</strong> 07AABCL5406F1ZU</p>
            </div>
            <div className="full-width" style={{ flex: '1', display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', border: '2px solid black', borderRadius: '4px', padding: '6px' }}>
                    <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box', marginRight: '10px' }}>
                        <label htmlFor="roNumber" style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginRight: '8px', whiteSpace: 'nowrap' }}>R.O. No. LN:</label>
                        <input type="number" id="roNumber" name="roNumber" placeholder="Enter Number" className="full-width" aria-label="R.O. Number" style={{padding: '4px'}}/>
                    </div>
                    <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                        <label htmlFor="date" style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginRight: '8px', whiteSpace: 'nowrap' }}>Date:</label>
                        <input type="date" id="date" name="date" className="full-width" aria-label="Date" style={{padding: '3px'}}/>
                    </div>
                </div>
                <div style={{ marginTop: '12px', border: '2px solid black', borderRadius: '4px', padding: '6px 10px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
                    <label htmlFor="client" style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginRight: '8px', whiteSpace: 'nowrap' }}>Client:</label>
                    <input type="text" id="client" name="client" placeholder="Client Name" className="full-width" aria-label="Client Name" style={{padding: '4px'}}/>
                </div>
                <div style={{ marginTop: '12px', border: '2px solid black', borderRadius: '4px', padding: '10px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>The Advertisement Manager</label>
                    <input type="text" placeholder="Input 1" className="full-width" aria-label="Input 1" style={{padding: '4px'}}/>
                    <input type="text" placeholder="Input 2" className="full-width" aria-label="Input 2" style={{padding: '4px'}}/>
                </div>
                <div style={{ marginTop: '10px', borderTop: '1px solid black', paddingTop: '6px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#000', margin: '0' }}>Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
        </div>

        <div style={{ width: '100%', marginTop: '20px', display: 'flex', gap: '12px' }}>
            <div className="full-width" style={{ flex: '1', border: '2px solid black', borderRadius: '4px', padding: '8px', boxSizing: 'border-box' }}>
                <label htmlFor="caption" style={{ fontSize: '16px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#000' }}>Heading/Caption:</label>
                <input type="text" id="caption" name="caption" placeholder="Enter caption here" className="full-width" aria-label="Heading Caption" style={{padding: '4px'}}/>
            </div>
            <div className="full-width" style={{ width: '30%', border: '2px solid black', borderRadius: '4px', padding: '8px', boxSizing: 'border-box' }}>
                <label htmlFor="package" style={{ fontSize: '16px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#000' }}>Package:</label>
                <input type="text" id="package" name="package" placeholder="Enter package name" className="full-width" aria-label="Package Name" style={{padding: '4px'}}/>
            </div>
        </div>

        <div style={{ width: '100%', marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', fontSize: '14px', textAlign: 'left', borderRadius: '4px', color: '#000' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ border: '1px solid black', padding: '6px', width: '16.66%', fontSize: '14px', color: '#000' }}>Key No.</th>
                        <th style={{ border: '1px solid black', padding: '6px', width: '16.66%', fontSize: '14px', color: '#000' }}>Publication(s)</th>
                        <th style={{ border: '1px solid black', padding: '6px', width: '16.66%', fontSize: '14px', color: '#000' }}>Edition(s)</th>
                        <th style={{ border: '1px solid black', padding: '6px', width: '16.66%', fontSize: '14px', color: '#000' }}>Size</th>
                        <th style={{ border: '1px solid black', padding: '6px', width: '16.66%', fontSize: '14px', color: '#000' }}>Scheduled Date(s)</th>
                        <th style={{ border: '1px solid black', padding: '6px', width: '16.66%', fontSize: '14px', color: '#000' }}>Position</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                </tbody>
            </table>
             <div className="new-row-buttons no-print">
                <button onClick={addRow}>Add Row</button>
                <button onClick={deleteRow}>Delete Row</button>
            </div>
        </div>
        
        <div style={{ width: '100%', marginTop: '20px', padding: '0px', boxSizing: 'border-box', height: 'auto', minHeight: '100px', display: 'flex', alignItems: 'stretch', color: '#000', borderRadius: '4px', border: '2px solid black' }}>
            <div data-ai-id="matter-text-container" style={{ writingMode: 'vertical-lr', textOrientation: 'mixed', alignItems:'center', justifyContent:'center', display:'flex', padding: '2px', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', borderRight: '1px solid black', backgroundColor: 'black', color: 'white', width: '38px' }}>
                MATTER
            </div>
            <div className="full-width" style={{ flex: '1', paddingLeft: '0px', alignItems: 'flex-start' }}>
                <textarea placeholder="Enter matter here..." className="full-width" style={{ width: '100%', height: '100px', border: 'none', padding: '8px', marginTop: '0px', marginLeft: '0px', wordWrap: 'break-word', textAlign: 'left', resize: 'none', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '16px', color: '#000', backgroundColor: '#fff' }} aria-label="Enter Matter"></textarea>
            </div>
        </div>
        
        <div style={{ width: '100%', marginTop: '8px', border: '2px solid black', borderRadius: '4px', padding: '8px', boxSizing: 'border-box', height: 'auto', minHeight: '120px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <div className="full-width" style={{ width: '60%', height: '100%', margin: '0', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', position: 'relative', flexDirection: 'column', boxSizing: 'border-box', paddingRight: '0px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'inline-block', textAlign: 'left', color: '#000', marginBottom: '8px' }}><strong>Forward all bills with relevant VTS copy to :-</strong></span><br />
                        <div style={{ marginLeft: '0px', marginTop: '-10px', textAlign: 'left', padding: '0px', height: '100%' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'inline-block', lineHeight: '1.5', color: '#000', height: '100%' }}>D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br /> Alaknanda Commercial complex, <br />New Delhi-110019 <br />Tel.: 49573333, 34, 35, 36 <br />Fax: 26028101
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ width: '38%', height: '100%', margin: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '10px', boxSizing: 'border-box', position: 'relative', alignSelf: 'flex-end' }}>
                    <div 
                        style={{ 
                            width: '180px', // Adjusted width
                            height: '100px', // Adjusted height
                            border: '2px dashed #ccc', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            marginBottom: '0px', 
                            marginRight: '0px', 
                            position: 'absolute', 
                            top: '10px', 
                            right: '0px', 
                            backgroundColor: '#f9f9f9', 
                            cursor: 'pointer',
                            borderRadius: '4px',
                            overflow: 'hidden' // Ensures image stays within bounds
                        }} 
                        onClick={() => { const uploader = document.getElementById('stampUploader') as HTMLInputElement; if(uploader) uploader.click();}}
                        data-ai-hint="stamp placeholder"
                    >
                        <p style={{ fontSize: '12px', textAlign: 'center', color: '#aaa', margin: '0px' }}>Upload Image</p>
                        <input type="file" id="stampUploader" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const imgContainer = e.target.previousElementSibling?.parentElement;
                                    if(imgContainer && event.target?.result){
                                        imgContainer.innerHTML = `<img src="${event.target.result}" alt="Stamp Preview" style="width: 100%; height: 100%; object-fit: contain;" />`;
                                        (imgContainer as HTMLElement).style.border = 'none'; // Remove border after image upload
                                        (imgContainer as HTMLElement).style.backgroundColor = 'transparent'; // Make background transparent
                                    }
                                }
                                reader.readAsDataURL(file);
                            }
                        }} />
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '10px', marginLeft: '8px', width: '98%', borderTop: '1px solid black', paddingTop: '6px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px', fontSize: '14px', fontWeight: 'bold', color: '#000', marginRight: '10px' }}>Note:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#000' }}>  1. Space reserved vide our letter No.  </span>
                    <span style={{ fontSize: '14px', color: '#000' }}> 2. No two advertisements of the same client should appear in the same issue.  </span>
                    <span style={{ fontSize: '14px', color: '#000' }}> 3. Please quote R.O. No. in all your bills and letters. </span>
                    <span style={{ fontSize: '14px', color: '#000', display: 'inline-block', width: '100%' }}> 4. Please send two voucher copies of the good reproduction to us within 3 days of the publishing.
                    </span>
                 </div>
            </div>
        </div>
      </div>

      <div id="printPreviewContainer" className="print-preview no-print-in-preview" style={{ display: 'none' }} ref={printPreviewContainerRef}>
        <div className="print-preview-content" id="printPreviewContent" ref={printPreviewContentRef}>
            {/* Content will be cloned here by JavaScript */}
        </div>
        <button onClick={closePrintPreview} style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', zIndex: '1001' }} aria-label="Close Preview">Close</button>
      </div>
    </>
  );
}
