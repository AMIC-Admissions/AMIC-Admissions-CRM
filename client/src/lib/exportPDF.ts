/**
 * PDF Export Helper
 * Generates PDF reports from filtered data
 */

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ReportFieldOption, ReportRow, FIELD_LABELS, ReportFilter } from "@shared/reportTypes";

interface PDFExportOptions {
  title?: string;
  filters?: ReportFilter;
  selectedFields: ReportFieldOption[];
  data: ReportRow[];
}

export function exportReportToPDF(options: PDFExportOptions) {
  const { title = "Student Report", filters = {}, selectedFields, data } = options;

  // Create PDF document
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  let yPosition = margin;

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(3, 24, 68); // Dark blue
  doc.text(title, margin, yPosition);
  yPosition += 10;

  // Add timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 8;

  // Add filter summary if filters exist
  if (Object.keys(filters).length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text("Applied Filters:", margin, yPosition);
    yPosition += 5;

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const filterTexts = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => {
        const displayValue = Array.isArray(value) ? value.join(", ") : String(value);
        return `${key}: ${displayValue}`;
      });

    filterTexts.forEach((text) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(text, margin + 5, yPosition);
      yPosition += 4;
    });

    yPosition += 4;
  }

  // Prepare table data
  const headers = selectedFields.map((field) => FIELD_LABELS[field]);
  const tableData = data.map((row) =>
    selectedFields.map((field) => {
      const value = row[field];
      if (value === null || value === undefined) return "—";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      return String(value);
    })
  );

  // Add table
  (doc as any).autoTable({
    head: [headers],
    body: tableData,
    startY: yPosition,
    margin: margin,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      halign: "left",
      valign: "middle",
    },
    headStyles: {
      fillColor: [3, 24, 68],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [240, 245, 250],
    },
    didDrawPage: (data: any) => {
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight();
      const pageWidth = pageSize.getWidth();

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );
    },
  });

  // Save PDF
  doc.save(`report-${new Date().toISOString().split("T")[0]}.pdf`);
}
