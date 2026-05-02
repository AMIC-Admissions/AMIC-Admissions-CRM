/**
 * Excel Export Helper
 * Generates Excel files from filtered data
 */

import * as XLSX from "xlsx";
import { ReportFieldOption, ReportRow, FIELD_LABELS, ReportFilter } from "@shared/reportTypes";

interface ExcelExportOptions {
  title?: string;
  filters?: ReportFilter;
  selectedFields: ReportFieldOption[];
  data: ReportRow[];
}

export function exportReportToExcel(options: ExcelExportOptions) {
  const { title = "Student Report", filters = {}, selectedFields, data } = options;

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Prepare data
  const headers = selectedFields.map((field) => FIELD_LABELS[field]);
  const tableData = data.map((row) =>
    selectedFields.map((field) => {
      const value = row[field];
      if (value === null || value === undefined) return "—";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      return value;
    })
  );

  // Create worksheet with data
  const wsData = [headers, ...tableData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style header row
  const headerStyle = {
    fill: { fgColor: { rgb: "FF031844" } }, // Dark blue
    font: { bold: true, color: { rgb: "FFFFFFFF" } }, // White text
    alignment: { horizontal: "center", vertical: "center" },
  };

  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (!ws[cellRef]) ws[cellRef] = {};
    ws[cellRef].s = headerStyle;
  }

  // Auto-size columns
  const colWidths = headers.map((header) => ({
    wch: Math.max(header.length + 2, 12),
  }));
  ws["!cols"] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Report Data");

  // Create a summary sheet if filters exist
  if (Object.keys(filters).length > 0) {
    const summaryData = [
      ["Report Summary"],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Applied Filters"],
    ];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        const displayValue = Array.isArray(value) ? value.join(", ") : String(value);
        summaryData.push([key, displayValue]);
      }
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  }

  // Save file
  XLSX.writeFile(wb, `report-${new Date().toISOString().split("T")[0]}.xlsx`);
}
