import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminMigration() {
  const [migrationApplied, setMigrationApplied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const checkMigration = trpc.admin.checkMigration.useQuery();
  const applyMigration = trpc.admin.applyMigration.useMutation();

  useEffect(() => {
    if (checkMigration.data?.applied) {
      setMigrationApplied(true);
    }
  }, [checkMigration.data]);

  const handleApplyMigration = async () => {
    setIsApplying(true);
    try {
      const result = await applyMigration.mutateAsync();
      if (result.success) {
        setMigrationApplied(true);
        // Refetch migration status
        await checkMigration.refetch();
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="mx-auto max-w-2xl">
        <Card className="border-slate-700 bg-slate-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Database Migration
            </CardTitle>
            <CardDescription className="text-slate-400">
              Apply schema updates for AJYAL AL-MAARIFA student data model
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Migration Status */}
            <div>
              <h3 className="mb-4 font-semibold">Migration Status</h3>
              {checkMigration.isLoading ? (
                <Alert className="border-slate-600 bg-slate-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>Checking migration status...</AlertDescription>
                </Alert>
              ) : migrationApplied || checkMigration.data?.applied ? (
                <Alert className="border-green-600 bg-green-900/20">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Migration Applied</AlertTitle>
                  <AlertDescription className="text-green-200">
                    All required columns have been added to the students table.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-600 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertTitle>Migration Pending</AlertTitle>
                  <AlertDescription className="text-red-200">
                    {checkMigration.data?.missingColumns?.length ?? 0} columns need to be added
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Missing Columns */}
            {checkMigration.data?.missingColumns && checkMigration.data.missingColumns.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Missing Columns</h3>
                <div className="rounded-lg bg-slate-700 p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                    {checkMigration.data.missingColumns.map((col) => (
                      <div key={col} className="flex items-center gap-2">
                        <span className="text-red-500">✗</span>
                        <code className="text-xs">{col}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Migration Details */}
            <div>
              <h3 className="mb-2 font-semibold">What will be added:</h3>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✓ 24 new fields for complete student data model</li>
                <li>✓ Assessment fields (assessed, passed, reAssessment, passedRe)</li>
                <li>✓ Payment fields (6 payment methods)</li>
                <li>✓ Document fields (docsSigned, requirementsSubmitted)</li>
                <li>✓ Parent/Guardian fields (fatherId, fatherMobile, motherId, motherMobile)</li>
                <li>✓ Updated enums for nationality and studentType</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              {!migrationApplied && (
                <Button
                  onClick={handleApplyMigration}
                  disabled={isApplying || checkMigration.isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying Migration...
                    </>
                  ) : (
                    "Apply Migration"
                  )}
                </Button>
              )}
              <Button
                onClick={() => checkMigration.refetch()}
                variant="outline"
                className="border-slate-600 hover:bg-slate-700"
              >
                Refresh Status
              </Button>
            </div>

            {/* Error Message */}
            {applyMigration.isError && (
              <Alert className="border-red-600 bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertTitle>Migration Failed</AlertTitle>
                <AlertDescription className="text-red-200">
                  {(applyMigration.error as any)?.message || "An error occurred during migration"}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {applyMigration.isSuccess && applyMigration.data?.success && (
              <Alert className="border-green-600 bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Migration Successful</AlertTitle>
                <AlertDescription className="text-green-200">
                  {applyMigration.data.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 border-slate-700 bg-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-base">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>• This migration is safe and non-destructive</p>
            <p>• Existing student data will be preserved</p>
            <p>• New fields will be initialized with default values</p>
            <p>• The migration can only be applied once</p>
            <p>• After migration, you can use the new student form with all fields</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
