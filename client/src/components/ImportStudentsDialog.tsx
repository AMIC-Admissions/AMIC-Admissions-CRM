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
          // Map studentType to valid enum values
          let studentTypeValue = "New Admission";
          if (row.studentType) {
            const type = String(row.studentType).trim().toLowerCase();
            if (type.includes("enrollment")) studentTypeValue = "Enrollment";
            else if (type.includes("re-registration") || type.includes("reregistration")) studentTypeValue = "Re-Registration";
            else if (type.includes("transfer")) studentTypeValue = "Transfer";
          }

          // Map paymentMethod to valid values
          let paymentMethodValue = "Cash";
          if (row.paymentMethod) {
            const method = String(row.paymentMethod).trim();
            if (["Bank Transfer", "Card", "Tamara", "JeelPay"].includes(method)) {
              paymentMethodValue = method;
            }
          }

          await createStudent.mutateAsync({
            studentId: row.studentId!,
            name: row.name!,
            gender: (row.gender as "Male" | "Female") || "Male",
            nationality: (row.nationality as "Saudi" | "Non-Saudi") || "Saudi",
            school: row.school!,
            grade: row.grade!,
            studentType: studentTypeValue as any,
            paymentStatus: (row.paymentStatus as "Paid" | "Pending") || "Pending",
            paymentMethod: paymentMethodValue as any,
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
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild variant="default" className="mt-4">
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
            <div className="text-xs text-white/50">
              <p className="font-semibold">Required columns: Name, Student ID, School, Grade</p>
              <p>Optional: Gender, Nationality, Student Type, Payment Status, Payment Method</p>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-900/50 bg-green-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-200">Valid Rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-400">{validRows.length}</p>
                </CardContent>
              </Card>
              <Card className="border-red-900/50 bg-red-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-200">Invalid Rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-400">{invalidRows.length}</p>
                </CardContent>
              </Card>
            </div>

            {invalidRows.length > 0 && (
              <Card className="border-yellow-900/50 bg-yellow-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    Invalid Rows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-xs text-yellow-300">
                    {invalidRows.map((row, idx) => (
                      <p key={idx}>
                        Row {row.rowNumber}: {row.error}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || validRows.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Importing..." : `Import ${validRows.length} Students`}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
            <div>
              <p className="text-lg font-semibold text-white">Import Complete!</p>
              <p className="text-sm text-white/75">Students have been successfully imported</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
