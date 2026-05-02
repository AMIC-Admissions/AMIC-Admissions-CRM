import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Loader } from "lucide-react";

export function AdminDataFix() {
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getStatusQuery = trpc.admin.getDataStatus.useQuery();
  const fixMutation = trpc.admin.fixDataConsistency.useMutation();

  const handleFixData = async () => {
    setFixing(true);
    setError(null);
    setFixResult(null);

    try {
      const result = await fixMutation.mutateAsync();
      setFixResult(result);
      // Refetch status after fix
      await getStatusQuery.refetch();
    } catch (err: any) {
      setError(err.message || "Failed to fix data");
    } finally {
      setFixing(false);
    }
  };

  const status = getStatusQuery.data;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Data Consistency Fix</h1>
        <p className="text-muted-foreground mt-2">
          Fix data consistency issues after schema migration
        </p>
      </div>

      {/* Current Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current Data Status</h2>

        {getStatusQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        ) : status ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded">
              <div className="text-sm text-muted-foreground">Total Students</div>
              <div className="text-2xl font-bold">{status.totalStudents}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded">
              <div className="text-sm text-muted-foreground">Seats Reserved</div>
              <div className="text-2xl font-bold">{status.seatsReserved}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded">
              <div className="text-sm text-muted-foreground">Paid Students</div>
              <div className="text-2xl font-bold">{status.paidStudents}</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded">
              <div className="text-sm text-muted-foreground">File Complete</div>
              <div className="text-2xl font-bold">{status.fileCompleteStudents}</div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded">
              <div className="text-sm text-muted-foreground">Seats Table</div>
              <div className="text-2xl font-bold">{status.seatsTableCount}</div>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Issues Alert */}
      {status && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Issues Detected:</strong>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              {status.seatsReserved === 0 && <li>Seats Reserved = 0 (should be greater than 0)</li>}
              {status.seatsTableCount === 0 && <li>Seats table is empty</li>}
              {status.fileCompleteStudents === 0 && <li>No students with File Complete = TRUE</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Fix Button */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Run Data Fix</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This will:
        </p>
        <ul className="text-sm text-muted-foreground space-y-2 mb-6 ml-4 list-disc">
          <li>Set File Complete = docs_signed AND requirements_submitted</li>
          <li>Set Seat Reserved based on student_type and payment fields</li>
          <li>Recalculate Payment Status (Paid/Pending/Partial)</li>
          <li>Backfill NULL values with FALSE</li>
          <li>Rebuild seats table with correct counts</li>
        </ul>

        <Button
          onClick={handleFixData}
          disabled={fixing}
          className="w-full"
          size="lg"
        >
          {fixing ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Fixing Data...
            </>
          ) : (
            "Run Data Fix"
          )}
        </Button>
      </Card>

      {/* Results */}
      {fixResult && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>✓ Data Fix Completed Successfully!</strong>
            <div className="mt-4 space-y-2">
              <div>Total Students: {fixResult.status.totalStudents}</div>
              <div>Seats Reserved: {fixResult.status.seatsReserved}</div>
              <div>Paid Students: {fixResult.status.paidStudents}</div>
              <div>File Complete: {fixResult.status.fileCompleteStudents}</div>
              <div>Seats Table: {fixResult.status.seatsTableCount}</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
