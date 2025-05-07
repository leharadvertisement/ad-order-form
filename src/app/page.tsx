
"use client";

import React, { useEffect, useRef, useCallback } from 'react';
// html2pdf.js and FontAwesome are loaded via CDN in layout.tsx

export default function Home() {
  const applicationRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const matterTextareaRef = useRef<HTMLTextAreaElement>(null);
  const printPreviewContainerRef = useRef<HTMLDivElement>(null);
  const printPreviewContentRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    if (tableBodyRef.current) {
      const textareas = tableBodyRef.current.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    }
    if (matterTextareaRef.current) {
        matterTextareaRef.current.style.height = 'auto';
        matterTextareaRef.current.style.height = `${matterTextareaRef.current.scrollHeight}px`;
    }
  }, []);

  const addRow = useCallback(() => {
    if (tableBodyRef.current) {
      const newRow = tableBodyRef.current.insertRow();
      for (let i = 0; i < 6; i++) {
        const cell = newRow.insertCell();
        cell.style.border = '1px solid black';
        cell.style.padding = '6px';
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = 'auto';
        textarea.style.minHeight = '160px';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.fontWeight = 'bold';
        textarea.style.fontSize = '14px';
        textarea.style.color = '#000';
        textarea.style.backgroundColor = '#fff';
        textarea.style.boxSizing = 'border-box';
        textarea.style.resize = 'none';
        textarea.setAttribute('aria-label', `Enter table row data column ${i + 1}`);
        textarea.addEventListener('input', adjustTextareaHeight);
        cell.appendChild(textarea);
      }
      adjustTextareaHeight(); 
    }
  }, [adjustTextareaHeight]);

  // deleteRow function from original script - not called by any button in provided HTML
  // const deleteRow = useCallback(() => {
  //   if (tableBodyRef.current && tableBodyRef.current.rows.length > 0) {
  //     tableBodyRef.current.deleteRow(-1); 
  //   }
  // }, []);

  const generatePdf = useCallback(() => {
    const element = applicationRef.current;
    if (element && (window as any).html2pdf) {
      const opt = {
        margin:       10,
        filename:     'application.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: -window.scrollY },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().from(element).set(opt).save();
    }
  }, []);
  
  const showPrintPreview = useCallback(() => {
    if (printPreviewContainerRef.current && printPreviewContentRef.current && applicationRef.current) {
      const clonedApp = applicationRef.current.cloneNode(true) as HTMLElement;
      
      // Remove no-print elements from the clone for preview
      clonedApp.querySelectorAll('.no-print').forEach(el => el.remove());
      
      // Convert inputs/textareas to static text for preview if desired (original script doesn't do this for this specific preview)
      // For a true WYSIWYG preview of print, this step would be more complex.
      // The original script just clones the innerHTML.

      printPreviewContentRef.current.innerHTML = ''; // Clear previous
      printPreviewContentRef.current.appendChild(clonedApp); // Append the main #application content
      printPreviewContainerRef.current.style.display = 'flex';
    }
  }, []);

  const closePrintPreview = useCallback(() => {
    if (printPreviewContainerRef.current) {
      printPreviewContainerRef.current.style.display = 'none';
    }
  }, []);
  
  const printFullScreen = useCallback(() => {
    // The original script called toggleFullScreen() then window.print().
    // Fullscreen API is async and can be finicky with print.
    // window.print() itself often provides a good preview.
    window.print();
  }, []);

  useEffect(() => {
    addRow(); 

    if (dateInputRef.current) {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        dateInputRef.current.value = `${year}-${month}-${day}`;
    }

    if (matterTextareaRef.current) {
      const matterTextArea = matterTextareaRef.current;
      // Initial style from HTML is border-top and border-bottom.
      // Script's window.onload sets border to 'none', then handles focus/blur.
      matterTextArea.style.border = 'none'; 
      const handleFocus = () => {
        matterTextArea.style.border = '1px solid black';
      };
      const handleBlur = () => {
        matterTextArea.style.border = 'none';
      };
      matterTextArea.addEventListener('focus', handleFocus);
      matterTextArea.addEventListener('blur', handleBlur);
      matterTextArea.addEventListener('input', adjustTextareaHeight);

      return () => {
        matterTextArea.removeEventListener('focus', handleFocus);
        matterTextArea.removeEventListener('blur', handleBlur);
        matterTextArea.removeEventListener('input', adjustTextareaHeight);
      };
    }
  }, [addRow, adjustTextareaHeight]);

  return (
    <>
      <div id="application" ref={applicationRef}>
        <div className="button-container no-print">
            <button id="printPreviewButton" aria-label="Print Preview" onClick={showPrintPreview}>Print Preview</button>
            <button id="downloadPdfButton" aria-label="Download as PDF" onClick={generatePdf}>Download as PDF</button>
        </div>
        <div className="print-icon-container no-print">
            <i className="fas fa-print print-icon" onClick={printFullScreen} aria-label="Print"></i>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '10px', backgroundColor: 'black', color: 'white', border: '2px solid black', padding: '4px 10px', fontWeight: 'bold', width: 'fit-content', marginLeft: 'auto', marginRight: 'auto', borderRadius: '4px', position: 'relative', top: '0' }}>
            <h2 style={{ margin: '0', fontSize: '22px' }}>RELEASE ORDER</h2>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <div className="full-width" style={{ width: '30%', padding: '8px', border: '2px solid black', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', fontSize: '14px', position: 'relative', borderRadius: '4px', color: '#000' }}>
                <h3 style={{ margin: '0', textAlign: 'left', fontSize: '16px', color: '#000' }}>Lehar</h3>
                <h4 style={{ marginTop: '0', textAlign: 'left', fontSize: '15px', color: '#000' }}>ADVERTISING PVT.LTD.</h4>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', color: '#000' }}>D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', color: '#000' }}>Alaknanda Commercial complex, <br/> New Delhi-110019</p>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', color: '#000' }}>Tel.: 49573333, 34, 35, 36</p>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', color: '#000' }}>Fax: 26028101</p>
                <p style={{ textAlign: 'left', margin: '2px 0', fontSize: '14px', display: 'flex', alignItems: 'baseline', gap: '4px', color: '#000' }}><strong>GSTIN:</strong> 07AABCL5406F1ZU</p>
            </div>

            <div className="full-width" style={{ flex: 1, display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'stretch', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', border: '2px solid black', borderRadius: '4px', padding: '6px' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box', marginRight: '10px' }}>
                        <label htmlFor="roNumber" style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginRight: '8px', whiteSpace: 'nowrap' }}>R.O. No. LN:</label>
                        <input type="number" id="roNumber" name="roNumber" placeholder="Enter Number" className="full-width" aria-label="R.O. Number"/>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                        <label htmlFor="date" style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginRight: '8px', whiteSpace: 'nowrap' }}>Date:</label>
                        <input type="date" id="date" name="date" className="full-width" aria-label="Date" ref={dateInputRef} />
                    </div>
                </div>
                <div style={{ marginTop: '12px', border: '2px solid black', borderRadius: '4px', padding: '6px 10px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
                    <label htmlFor="client" style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginRight: '8px', whiteSpace: 'nowrap' }}>Client:</label>
                    <input type="text" id="client" name="client" placeholder="Client Name" className="full-width" aria-label="Client Name"/>
                </div>
                <div style={{ marginTop: '12px', border: '2px solid black', borderRadius: '4px', padding: '10px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>The Advertisement Manager</label>
                    <input type="text" placeholder="Input 1" className="full-width" aria-label="Input 1"/>
                    <input type="text" placeholder="Input 2" className="full-width" aria-label="Input 2"/>
                </div>
                <div style={{ marginTop: '10px', borderTop: '1px solid black', paddingTop: '6px' }}>
                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#000', margin: 0 }}>Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
        </div>

        <div style={{ width: '100%', marginTop: '20px', display: 'flex', gap: '12px' }}>
            <div className="full-width" style={{ flex: 1, border: '2px solid black', borderRadius: '4px', padding: '8px', boxSizing: 'border-box' }}>
                <label htmlFor="caption" style={{ fontSize: '16px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#000' }}>Heading/Caption:</label>
                <input type="text" id="caption" name="caption" placeholder="Enter caption here" className="full-width" aria-label="Heading Caption"/>
            </div>
            <div className="full-width" style={{ width: '30%', border: '2px solid black', borderRadius: '4px', padding: '8px', boxSizing: 'border-box' }}>
                <label htmlFor="package" style={{ fontSize: '16px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#000' }}>Package:</label>
                <input type="text" id="package" name="package" placeholder="Enter package name" className="full-width" aria-label="Package Name"/>
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
                <tbody id="tableBody" ref={tableBodyRef}>
                </tbody>
            </table>
        </div>
        
        {/* Add Row and Delete Row Buttons - from original HTML, not called by script, so not interactive yet in this React version */}
        {/* <div className="new-row-buttons no-print">
            <button onClick={addRow}>Add Row</button>
            <button onClick={deleteRow}>Delete Row</button>
        </div> */}

        <div style={{ width: '100%', marginTop: '20px', padding: '0px', boxSizing: 'border-box', height: 'auto', minHeight: '100px', display: 'flex', alignItems: 'stretch', color: '#000', borderRadius: '4px' }}>
            <div style={{ writingMode: 'vertical-lr', textOrientation: 'upright', padding: '2px', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', borderRight: '1px solid black', backgroundColor: 'black', color: 'white', width: '38px' }}>
                MATTER
            </div>
            <div className="full-width" style={{ flex: 1, paddingLeft: '0px', alignItems: 'flex-start' }}>
                <textarea
                  ref={matterTextareaRef}
                  placeholder="Enter matter here..."
                  className="full-width"
                  style={{ width: '100%', height: '100px', border: 'none', padding: '0px', marginTop: '0px', marginLeft: '0px', wordWrap: 'break-word', textAlign: 'left', resize: 'none', boxSizing: 'border-box', fontWeight: 'bold', fontSize: '16px', color: '#000', borderTop: '1px solid black', borderWidth: '1px', backgroundColor: '#fff', borderBottomWidth: '1px' }}
                  aria-label="Enter Matter"
                ></textarea>
            </div>
        </div>
        
        <div style={{ width: '100%', marginTop: '8px', border: '2px solid black', borderRadius: '4px', padding: '8px', boxSizing: 'border-box', height: 'auto', minHeight: '120px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <div className="full-width" style={{ width: '60%', height: '100%', margin: '0', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',  position: 'relative', flexDirection: 'column', boxSizing:'border-box', paddingRight: '0px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%', paddingLeft: '8px', boxSizing:'border-box' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'inline-block', textAlign: 'left', color: '#000', marginBottom: '8px' }}><strong>Forward all bills with relevant VTS copy to :-</strong></span><br/>
                        <div  style={{ marginLeft: '0px', marginTop: '-10px', textAlign: 'left', padding: '0px', height: '100%' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'inline-block', lineHeight: '1.5', color: '#000', height: '100%' }}>D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br/> Alaknanda Commercial complex, <br/>New Delhi-110019 <br/>Tel.: 49573333, 34, 35, 36 <br/>Fax: 26028101
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ width: '38%', height: '100%', margin: '0', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '10px', boxSizing: 'border-box', position: 'relative', alignSelf: 'flex-end' }}>
                    {/* Stamp/Image upload area from original HTML - placeholder for now */}
                    <div style={{ width: '160px', height: '90px', border: 'none',  display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0px', marginRight: '0px', position: 'absolute', top: '10px', right: '0px', backgroundColor: '#fff' }}>
                        <p style={{ fontSize: '12px', textAlign: 'center', color: '#000', margin: '0px' }}>Upload Image</p>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '10px', marginLeft: '8px', width: '98%', borderTop: '1px solid black', paddingTop: '6px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px', fontSize: '14px', fontWeight: 'bold', color:'#000', marginRight: '10px' }}>Note:</span>
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

      <div id="printPreviewContainer" className="print-preview" style={{ display: 'none' }} ref={printPreviewContainerRef}>
          <div className="print-preview-content" id="printPreviewContent" ref={printPreviewContentRef}>
              {/* Content will be cloned here by JavaScript */}
          </div>
          <button onClick={closePrintPreview} style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 20px', cursor: 'pointer', borderRadius: '5px', zIndex: 1001 }} aria-label="Close Preview">Close</button>
      </div>
    </>
  );
}

    