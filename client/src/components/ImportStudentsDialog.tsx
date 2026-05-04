import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";

interface ImportRow {
  name?: string;
  studentId?: string;
  gender?: string;
  nationality?: string;
  school?: string;
  grade?: string;
  studentType?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  error?: string;
  rowNumber?: number;
}

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportStudentsDialog({ open, onOpenChange, onSuccess }: ImportStudentsDialogProps) {
  const [importedRows, setImportedRows] = useState<ImportRow[]>([]);
  const [validRows, setValidRows] = useState<ImportRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"upload" | "review" | "result">("upload");

  const createStudent = trpc.admissions.createStudent.useMutation();
  const utils = trpc.useUtils();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

      // Validate rows
      const validated: ImportRow[] = [];
      const invalid: ImportRow[] = [];

      data.forEach((row, index) => {
        const importRow: ImportRow = {
          name: row.Name || row.name || "",
          studentId: row["Student ID"] || row.studentId || "",
          gender: row.Gender || row.gender || "Male",
          nationality: row.Nationality || row.nationality || "Saudi",
          school: row.School || row.school || "",
          grade: row.Grade || row.grade || "",
          studentType: row["Student Type"] || row.studentType || "New Admission",
          paymentStatus: row["Payment Status"] || row.paymentStatus || "Pending",
          paymentMethod: row["Payment Method"] || row.paymentMethod || "Cash",
          rowNumber: index + 2,
        };

        // Validate required fields
        const errors: string[] = [];
        if (!importRow.name?.trim()) errors.push("Name required");
        if (!importRow.studentId?.trim()) errors.push("Student ID required");
        if (!importRow.school?.trim()) errors.push("School required");
        if (!importRow.grade?.trim()) errors.push("Grade required");

        if (errors.length > 0) {
          importRow.error = errors.join("; ");
          invalid.push(importRow);
        } else {
          validated.push(importRow);
        }
      });

      setValidRows(validated);
      setInvalidRows(invalid);
      setImportedRows([...validated, ...invalid]);
      setStep("review");
      toast.success(`Loaded ${validated.length} valid rows, ${invalid.length} invalid rows`);
    } catch (error) {
      toast.error("Failed to parse Excel file");
      console.error(error);
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      for (const row of validRows) {
        try {
          await createStudent.mutateAsync({
            studentId: row.studentId!,
            name: row.name!,
            gender: (row.gender as "Male" | "Female") || "Male",
            nationality: (row.nationality as "Saudi" | "Non-Saudi") || "Saudi",
            school: row.school!,
            grade: row.grade!,
            studentType: (row.studentType as any) || "New Admission",
            paymentStatus: (row.paymentStatus as "Paid" | "Pending") || "Pending",
            paymentMethod: (row.paymentMethod as any) || "Cash",
          });
          successCount++;
        } catch (error) {
          failureCount++;
          console.error("Failed to create student:", error);
        }
      }

      await utils.admissions.listStudents.invalidate();
      setStep("result");
      toast.success(`Imported ${successCount} students successfully`);
      if (failureCount > 0) {
        toast.error(`Failed to import ${failureCount} students`);
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Import process failed");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setImportedRows([]);
    setValidRows([]);
    setInvalidRows([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Students from Excel</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-cyan-200/30 p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-cyan-200/60" />
              <p className="mt-2 text-sm text-white/75">
                Upload an Excel file (.xlsx) with student data
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="mt-4 hidden"
                id="file-input"
              />
              <Button
                onClick={() => document.getElementById("file-input")?.click()}
                className="mt-4 bg-cyan-200 text-[#031844] hover:bg-white"
              >
                Choose File
              </Button>
            </div>
            <p className="text-xs text-white/50">
              Required columns: Name, Student ID, School, Grade. Optional: Gender, Nationality,
              Student Type, Payment Status, Payment Method
            </p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/5 border-emerald-200/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-emerald-200">Valid Rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{validRows.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-red-200/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-200">Invalid Rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{invalidRows.length}</div>
                </CardContent>
              </Card>
            </div>

            {invalidRows.length > 0 && (
              <Card className="bg-white/5 border-red-200/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    Invalid Rows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {invalidRows.map((row, idx) => (
                      <div key={idx} className="text-xs text-red-200/75">
                        Row {row.rowNumber}: {row.error}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setStep("upload")}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || isProcessing}
                className="flex-1 bg-emerald-200 text-[#031844] hover:bg-white"
              >
                {isProcessing ? "Importing..." : `Import ${validRows.length} Students`}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-200" />
            <div>
              <p className="text-lg font-semibold text-white">Import Complete</p>
              <p className="text-sm text-white/75">
                Successfully imported {validRows.length} students
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="w-full bg-cyan-200 text-[#031844] hover:bg-white"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
