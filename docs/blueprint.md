# **App Name**: Ad Order Form

## Core Features:

- Form Generation and Display: Generates and displays a customizable release order form for advertising, pre-filled with any data persisted from previous sessions. Fields include caption, package, schedule table, matter, and billing information.
- Dynamic Table Management: Allows users to add and delete rows in the schedule table to specify publication details, edition, size, dates and positions.
- Stamp Upload: Enables users to upload a stamp image to be displayed on the release order form.

## Style Guidelines:

- Primary color: White for clean background.
- Secondary color: Light gray (#f0f0f0) for table headers and subtle accents.
- Accent: Blue (#007BFF) for interactive elements like buttons and links.
- Use the same font as the original document, Arial.
- Maintain the original layout with clear divisions for each section: header, caption/package, schedule table, matter, billing info, and notes.
- Use simple, recognizable icons for actions like adding or deleting rows.

## Original User Request:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Release Order - Lehar Advertising</title>
  <style>
    @media print {
      #printButton, .no-print { display: none; }
      body, #application { margin: 0; padding: 0; }
    }
    body {
      font-family: Arial, sans-serif;
      font-weight: bold;
      margin: 0;
      padding: 0;
    }
    #application {
      width: 210mm;
      margin: 0 auto;
      padding: 20px;
      border: 4px solid black;
      box-sizing: border-box;
    }
    .container { display: flex; justify-content: flex-end; margin-bottom: 10px; }
    #printButton {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    #printButton:hover { background: #367c39; }
    input, textarea, select {
      border: none;
      border-bottom: 1px solid black;
      padding: 4px;
      font-size: 14px;
      font-weight: bold;
      box-sizing: border-box;
    }
    table {
      width: 100%;
      border: 2px solid black;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid black;
      padding: 6px;
      font-size: 14px;
    }
    th { background-color: #f0f0f0; }
    .matter-box {
      display: flex;
      height: 150px;
      border: 2px solid black;
      margin-top: 20px;
      border-radius: 4px;
      overflow: hidden;
    }
    .vertical-label {
      writing-mode: vertical-lr;
      text-orientation: upright;
      background: black;
      color: white;
      padding: 4px;
      font-size: 16px;
    }
    .matter-content { flex: 1; padding: 4px; }
    .notes-container {
      border: 2px solid black;
      padding: 10px 130px 10px 10px;
      border-radius: 4px;
      margin-top: 20px;
      position: relative;
    }
    .stamp-container {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 100px;
      height: 100px;
      border: 2px solid black;
      border-radius: 4px;
      background: white;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #stampPreview {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: left center;
      display: block;
    }
    .action-buttons {
      margin-top: 10px;
      display: flex;
      gap: 10px;
    }
    .action-buttons button {
      background: #007BFF;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 5px;
      font-weight: bold;
      cursor: pointer;
    }
    .action-buttons button:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container no-print">
    <button id="printButton" onclick="printApplication()">Print</button>
  </div>

  <div id="application">
    <div style="text-align:center; background:black; color:white; padding:4px; border-radius:4px;">
      <h2 style="margin:0;">RELEASE ORDER</h2>
    </div>

    <!-- Caption & Package Section -->
    <div style="display:flex; gap:12px; margin-top:20px;">
      <div style="flex:1; border:2px solid black; border-radius:4px; padding:8px;">
        <label>Heading/Caption:</label>
        <input type="text" placeholder="Enter caption here" style="width:100%;">
      </div>
      <div style="width:30%; border:2px solid black; border-radius:4px; padding:8px;">
        <label>Package:</label>
        <input type="text" placeholder="Enter package name" style="width:100%;">
      </div>
    </div>

    <!-- Schedule Table Section -->
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
      <tbody id="tableBody"></tbody>
    </table>
    <div class="action-buttons no-print">
      <button onclick="addRow()">Add Row</button>
      <button onclick="deleteRow()">Delete Row</button>
    </div>

    <!-- Matter Section -->
    <div class="matter-box">
      <div class="vertical-label">MATTER</div>
      <div class="matter-content">
        <textarea placeholder="Enter matter here..." style="width:100%; height:100%; resize:none;"></textarea>
      </div>
    </div>

    <!-- Billing Info Section -->
    <div style="margin-top:20px; border:2px solid black; border-radius:4px; padding:8px;">
      <strong>Forward all bills with relevant voucher copies to:</strong>
      <p>D-9 & D-10, 1st Floor, Pushpa Bhawan,<br>Alaknanda Commercial Complex,<br>New Delhi-110019<br>Tel: 49573333, 34, 35, 36<br>Fax: 26028101</p>
    </div>

    <!-- Notes Section with Stamp -->
    <div class="notes-container">
      <strong>Note:</strong>
      <ol style="margin-top:10px; font-size:14px;">
        <li>Space reserved vide our letter No.</li>
        <li>No two advertisements of the same client should appear in the same issue.</li>
        <li>Please quote R.O. No. in all your bills and letters.</li>
        <li>Please send two voucher copies of good reproduction within 3 days of publishing.</li>
      </ol>
      <div class="stamp-container">
        <label for="stampFile" style="cursor:pointer;">Stamp Editor</label>
        <input type="file" id="stampFile" accept="image/*" style="display:none;">
        <img id="stampPreview" alt="Stamp Preview">
      </div>
    </div>
  </div>

  <script>
    function addRow() {
      const table = document.getElementById('tableBody');
      const row = table.insertRow();
      for (let i = 0; i < 6; i++) {
        const cell = row.insertCell();
        cell.innerHTML = '<input type="text" style="width:100%; border:none; font-size:14px;">';
      }
    }

    function deleteRow() {
      const table = document.getElementById('tableBody');
      if (table.rows.length) table.deleteRow(-1);
    }

    function printApplication() {
      window.print();
    }

    document.getElementById('stampFile').addEventListener('change', function(event) {
      const preview = document.getElementById('stampPreview');
      const label = document.querySelector('.stamp-container label');
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.src = e.target.result;
          label.style.display = 'none';
        };
        reader.readAsDataURL(file);
      } else {
        preview.src = '';
        label.style.display = 'block';
      }
    });
  </script>
</body>
</html>
  