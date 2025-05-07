"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
// Note: html2pdf.js and FontAwesome are loaded via CDN in layout.tsx

export default function ApplicationFormPage() {
  const applicationRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const matterTextareaRef = useRef<HTMLTextAreaElement>(null);
  const printPreviewContentRef = useRef<HTMLDivElement>(null);
  const printPreviewContainerRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [stampSrc, setStampSrc] = useState<string | null>(null);

  const adjustTextareaHeightInTable = useCallback(() => {
    if (tableBodyRef.current) {
      const textareas = tableBodyRef.current.querySelectorAll('textarea.table-textarea');
      textareas.forEach(textarea => {
        const ta = textarea as HTMLTextAreaElement;
        ta.style.height = 'auto'; // Reset height
        ta.style.height = `${ta.scrollHeight}px`; // Set to scroll height
      });
    }
  }, []);

  const addRow = useCallback(() => {
    if (tableBodyRef.current) {
      const newRow = tableBodyRef.current.insertRow();
      for (let i = 0; i < 6; i++) {
        const cell = newRow.insertCell();
        cell.style.border = '1px solid black';
        cell.style.padding = '6px';
        cell.style.verticalAlign = 'top';
        const textarea = document.createElement('textarea');
        textarea.className = 'table-textarea'; // Add class for styling and selection
        textarea.setAttribute('aria-label', `Enter table row data column ${i+1}`);
        textarea.addEventListener('input', () => adjustTextareaHeightInTable());
        cell.appendChild(textarea);
      }
      adjustTextareaHeightInTable(); // Adjust height after adding new row
    }
  }, [adjustTextareaHeightInTable]);

  const deleteRow = useCallback(() => {
    if (tableBodyRef.current && tableBodyRef.current.rows.length > 0) {
      tableBodyRef.current.deleteRow(-1); // Delete last row
    }
  }, []);

  const generatePdf = useCallback(() => {
    const element = applicationRef.current;
    if (element && (window as any).html2pdf) {
      // Temporarily hide buttons for PDF generation
      const buttonsToHide = element.querySelectorAll('.button-container, .print-icon-container, .new-row-buttons');
      buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = 'none');
      
      const opt = {
        margin: 10,
        filename: 'application.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: -window.scrollY }, // scrollY: -window.scrollY to capture from top
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      (window as any).html2pdf().from(element).set(opt).save().then(() => {
        // Restore button visibility
        buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = '');
      }).catch((error: any) => {
        console.error("Error generating PDF:", error);
        buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = '');
      });
    }
  }, []);

  const printApplication = useCallback(() => {
    window.print();
  }, []);

  const showPrintPreview = useCallback(() => {
    if (printPreviewContainerRef.current && printPreviewContentRef.current && applicationRef.current) {
      const clonedApp = applicationRef.current.cloneNode(true) as HTMLElement;
      
      // Remove non-printable elements from clone
      clonedApp.querySelectorAll('.button-container, .print-icon-container, .new-row-buttons, #printPreviewButton, #downloadPdfButton, #fullScreenButton').forEach(el => el.remove());
      
      // Convert inputs/textareas to static text for preview
      const textareas = clonedApp.querySelectorAll('textarea');
      textareas.forEach(ta => {
        const p = document.createElement('div');
        p.textContent = ta.value;
        p.style.whiteSpace = 'pre-wrap';
        p.style.fontWeight = ta.style.fontWeight || 'bold';
        p.style.fontSize = ta.style.fontSize || '14px';
        p.style.color = ta.style.color || '#000';
        p.style.width = '100%';
        p.style.minHeight = ta.style.minHeight || (ta.classList.contains('table-textarea') ? '160px' : '100px');
        p.style.padding = ta.style.padding || '0px';
        p.style.boxSizing = 'border-box';
        p.style.verticalAlign = 'top';

        if(ta.placeholder === "Enter matter here..."){
            p.style.borderTop = "1px solid black";
            p.style.borderBottom = "1px solid black";
            p.style.padding = "8px"; // Match screen style for matter textarea padding
        }
        ta.parentNode?.replaceChild(p, ta);
      });

      const inputs = clonedApp.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
      inputs.forEach(inp => {
        const inputElement = inp as HTMLInputElement;
        const p = document.createElement('p');
        p.textContent = inputElement.value;
        p.style.fontWeight = 'bold';
        p.style.fontSize = '14px';
        p.style.color = '#000';
        p.style.margin = '0'; // Reset margin
        p.style.padding = '6px'; // Match input padding
        inp.parentNode?.replaceChild(p, inp);
      });
      
      // Handle stamp image in preview
      const stampContainerPreview = clonedApp.querySelector('.stamp-upload-container');
      if (stampContainerPreview) {
        if (stampSrc) {
          const img = document.createElement('img');
          img.src = stampSrc;
          img.alt = "Stamp Preview";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "contain";
          stampContainerPreview.innerHTML = ''; // Clear "Upload Image" text
          stampContainerPreview.appendChild(img);
        } else {
          // Keep "Upload Image" text if no image
           const p = document.createElement('p');
           p.textContent = "Upload Image";
           p.style.fontSize = "12px";
           p.style.textAlign = "center";
           p.style.color = "#6c757d";
           p.style.margin = "0px";
           stampContainerPreview.innerHTML = '';
           stampContainerPreview.appendChild(p);
        }
        (stampContainerPreview as HTMLElement).classList.add('stamp-placeholder-print');
      }


      printPreviewContentRef.current.innerHTML = '';
      printPreviewContentRef.current.appendChild(clonedApp);
      printPreviewContainerRef.current.style.display = 'flex';
    }
  }, [stampSrc]);

  const closePrintPreview = useCallback(() => {
    if (printPreviewContainerRef.current) {
      printPreviewContainerRef.current.style.display = 'none';
    }
  }, []);
  
  const printFullScreen = useCallback(() => {
    window.print(); // This will trigger the browser's print dialog in full screen if browser supports it
  }, []);

  const handleStampFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStampSrc(reader.result as string);
        localStorage.setItem('stampImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  useEffect(() => {
    addRow(); // Add initial row

    if (matterTextareaRef.current) {
      const matterTextArea = matterTextareaRef.current;
      // Styles are applied via CSS classes now mostly
      const handleFocus = () => {
        // matterTextArea.style.border = '1px solid black'; // Example: can be handled by :focus in CSS
      };
      const handleBlur = () => {
        // matterTextArea.style.border = 'none'; // Example: can be handled by default state in CSS
      };
      matterTextArea.addEventListener('focus', handleFocus);
      matterTextArea.addEventListener('blur', handleBlur);
      
      // Initial adjustment for matter textarea
      matterTextArea.style.height = 'auto';
      matterTextArea.style.height = `${matterTextArea.scrollHeight}px`;
      matterTextArea.addEventListener('input', () => {
        matterTextArea.style.height = 'auto';
        matterTextArea.style.height = `${matterTextArea.scrollHeight}px`;
      });

      return () => {
        matterTextArea.removeEventListener('focus', handleFocus);
        matterTextArea.removeEventListener('blur', handleBlur);
      };
    }
  }, [addRow]);

  useEffect(() => {
    const savedStamp = localStorage.getItem('stampImage');
    if (savedStamp) {
      setStampSrc(savedStamp);
    }

    if (dateInputRef.current) {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        dateInputRef.current.value = `${year}-${month}-${day}`;
    }
  }, []);


  return (
    <>
      <div id="application" ref={applicationRef}>
        <div className="button-container no-print">
          <button id="printPreviewButton" aria-label="Print Preview" onClick={showPrintPreview}>Print Preview</button>
          <button id="downloadPdfButton" aria-label="Download as PDF" onClick={generatePdf}>Download as PDF</button>
          {/* Replaced FontAwesome icon with a button for printFullScreen */}
          <button id="fullScreenButton" aria-label="Print" onClick={printFullScreen}>Print</button>
        </div>
        
        {/* Release Order Title */}
        <div className="release-order-titlebar">
            <h2>RELEASE ORDER</h2>
        </div>

        {/* Top Section: Lehar Info | Details (RO, Date, Client, Ad Manager) */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            {/* Lehar Info Box */}
            <div className="lehar-info-box">
                <h3>Lehar</h3>
                <h4>ADVERTISING PVT.LTD.</h4>
                <p>D-9 &amp; D-10, 1st Floor, Pushpa Bhawan,</p>
                <p>Alaknanda Commercial complex, <br/> New Delhi-110019</p>
                <p>Tel.: 49573333, 34, 35, 36</p>
                <p>Fax: 26028101</p>
                <p style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}><strong>GSTIN:</strong>07AABCL5406F1ZU</p>
            </div>

            {/* Details Box */}
            <div className="details-box">
                <div className="detail-section">
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: '10px' }}>
                        <label htmlFor="roNumber">R.O. No. LN:</label>
                        <input type="number" id="roNumber" name="roNumber" placeholder="Enter Number" className="full-width" aria-label="R.O. Number"/>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label htmlFor="date">Date:</label>
                        <input type="date" id="date" name="date" className="full-width" aria-label="Date" ref={dateInputRef} />
                    </div>
                </div>
                <div className="detail-section" style={{marginTop: '0px'}}> {/* Adjusted margin */}
                    <label htmlFor="client">Client:</label>
                    <input type="text" id="client" name="client" placeholder="Client Name" className="full-width" aria-label="Client Name"/>
                </div>
                <div className="detail-section column-layout" style={{marginTop: '0px'}}> {/* Adjusted margin */}
                    <label style={{marginBottom: '6px'}}>The Advertisement Manager</label>
                    <input type="text" placeholder="Input 1" className="full-width" aria-label="Input 1" style={{marginBottom:'6px'}}/>
                    <input type="text" placeholder="Input 2" className="full-width" aria-label="Input 2"/>
                </div>
                <div style={{ marginTop: '0px', borderTop: '1px solid black', paddingTop: '6px' }}> {/* Adjusted margin */}
                    <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#000', margin: 0 }}>Kindly insert the advertisement/s in your issue/s for the following date/s</p>
                </div>
            </div>
        </div>

        {/* Heading/Caption & Package Section */}
        <div className="caption-package-container">
            <div>
                <label htmlFor="caption">Heading/Caption:</label>
                <input type="text" id="caption" name="caption" placeholder="Enter caption here" className="full-width" aria-label="Heading Caption"/>
            </div>
            <div>
                <label htmlFor="packageInput">Package:</label> {/* Changed id to packageInput to avoid conflict */}
                <input type="text" id="packageInput" name="package" placeholder="Enter package name" className="full-width" aria-label="Package Name"/>
            </div>
        </div>
        
        {/* Schedule Table Section */}
        <div style={{ width: '100%', marginTop: '20px' }}>
            <table>
                <thead>
                    <tr>
                        <th>Key No.</th>
                        <th>Publication(s)</th>
                        <th>Edition(s)</th>
                        <th>Size</th>
                        <th>Scheduled Date(s)</th>
                        <th>Position</th>
                    </tr>
                </thead>
                <tbody id="tableBody" ref={tableBodyRef}>
                  {/* Rows will be added here by JavaScript */}
                </tbody>
            </table>
        </div>
        <div className="new-row-buttons no-print">
            <button onClick={addRow}>Add Row</button>
            <button onClick={deleteRow} className="delete-button">Delete Row</button>
        </div>

        {/* Matter Section */}
        <div className="matter-container" style={{ width: '100%', marginTop: '20px' }}>
            <div className="matter-label-box">
                MATTER
            </div>
            <div className="full-width" style={{ flex: 1, display: 'flex' }}> {/* Added display:flex here */}
                <textarea
                  ref={matterTextareaRef}
                  placeholder="Enter matter here..."
                  className="matter-content-textarea"
                  aria-label="Enter Matter"
                ></textarea>
            </div>
        </div>
        
        {/* Notes & Stamp Section */}
        <div className="notes-stamp-container">
            <div className="notes-forwarding-section">
                <div className="forwarding-info">
                    <strong>Forward all bills with relevant VTS copy to :-</strong>
                    <span>D-9 &amp; D-10, 1st Floor, Pushpa Bhawan, <br/> Alaknanda Commercial complex, <br/>New Delhi-110019 <br/>Tel.: 49573333, 34, 35, 36 <br/>Fax: 26028101</span>
                </div>
                <div className="stamp-area">
                    <label htmlFor="stampFile" className="stamp-upload-container">
                        {stampSrc ? (
                            <img src={stampSrc} alt="Stamp Preview" />
                        ) : (
                            <p>Upload Image</p>
                        )}
                    </label>
                    <input type="file" id="stampFile" accept="image/*" onChange={handleStampFileChange} />
                </div>
            </div>
            <div className="notes-section">
                <span>Note:</span>
                <div>
                    <span>1. Space reserved vide our letter No.</span>
                    <span>2. No two advertisements of the same client should appear in the same issue.</span>
                    <span>3. Please quote R.O. No. in all your bills and letters.</span>
                    <span>4. Please send two voucher copies of the good reproduction to us within 3 days of the publishing.</span>
                 </div>
            </div>
        </div>

      </div> {/* End of #application div */}

      {/* Print Preview Modal */}
      <div id="printPreviewContainer" className="print-preview no-print" style={{ display: 'none' }} ref={printPreviewContainerRef}>
          <div className="print-preview-content" id="printPreviewContent" ref={printPreviewContentRef}>
              {/* Content will be cloned here by JavaScript */}
          </div>
          <button onClick={closePrintPreview} className="print-preview-close-button" aria-label="Close Preview">Close</button>
      </div>
    </>
  );
}
