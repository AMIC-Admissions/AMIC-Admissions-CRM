import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function AdminSeatMaster() {
  const [isApplying, setIsApplying] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const applyMutation = trpc.admin.applySeatMasterMigration.useMutation();
  const statusQuery = trpc.admin.getSeatMasterStatus.useQuery();

  const handleApplyMigration = async () => {
    setIsApplying(true);
    try {
      const result = await applyMutation.mutateAsync();
      setStatus(result);
      toast.success("Seat Master migration applied successfully!");
      statusQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to apply migration");
      setStatus({ error: error.message });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Seat Master Management</h1>
        <p className="text-slate-400 mt-2">Manage the official seat structure across all schools</p>
      </div>

      {/* Status Card */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {statusQuery.data?.status === "populated" ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Seat Master Status
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Seat Master Status
              </>
            )}
          </CardTitle>
          <CardDescription>Current state of the Seat Master dataset</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusQuery.isLoading ? (
            <div className="flex items-center gap-2 text-slate-300">
              <Loader className="h-4 w-4 animate-spin" />
              Loading status...
            </div>
          ) : statusQuery.data ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-300">
                  <strong>Status:</strong> {statusQuery.data.status}
                </p>
                <p className="text-sm text-slate-300">
                  <strong>Records:</strong> {statusQuery.data.recordCount}
                </p>
                {statusQuery.data.totalCapacity && (
                  <p className="text-sm text-slate-300">
                    <strong>Total Capacity:</strong> {statusQuery.data.totalCapacity}
                  </p>
                )}
              </div>

              {statusQuery.data.bySchool && (
                <div className="p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm font-semibold text-slate-200 mb-2">By School:</p>
                  {Object.entries(statusQuery.data.bySchool).map(([school, data]: any) => (
                    <p key={school} className="text-sm text-slate-300">
                      • <strong>{school}:</strong> {data.count} sections, {data.capacity} capacity
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400">Unable to load status</p>
          )}
        </CardContent>
      </Card>

      {/* Migration Card */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle>Apply Seat Master Migration</CardTitle>
          <CardDescription>Create the seat_master table and populate with official seat structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-200">
              This will create the seat_master table and insert all 57 official seat records across Kids Gate, AMIS Girls, and AMIS Boys.
            </p>
          </div>

          {status && status.error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-200">
                <strong>Error:</strong> {status.error}
              </p>
            </div>
          )}

          {status && status.success && (
            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-sm text-green-200">
                <strong>Success:</strong> {status.message}
              </p>
              <p className="text-sm text-green-200 mt-2">
                Inserted {status.recordCount} / {status.expectedCount} records
              </p>
            </div>
          )}

          <Button
            onClick={handleApplyMigration}
            disabled={isApplying || applyMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isApplying || applyMutation.isPending ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Applying Migration...
              </>
            ) : (
              "Apply Seat Master Migration"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle>Seat Master Structure</CardTitle>
          <CardDescription>Official seat configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <div>
            <p className="font-semibold text-slate-200">Kids Gate</p>
            <p>Pre-KG (30), KG I (60), KG II (50), Grade 1-3 (25 each section)</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">AMIS Girls</p>
            <p>Pre-KG (20), KG I (75), KG II (108), Grade 1-12 (multiple sections)</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">AMIS Boys</p>
            <p>Grade 4-12 (sections B & D, 30 each)</p>
          </div>
          <div className="pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-400">
              Total: 57 sections | Total Capacity: 2,223 seats
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
