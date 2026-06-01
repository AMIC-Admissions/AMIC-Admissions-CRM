import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DynamicFieldsSectionProps {
  studentId?: number;
  values?: Record<string, string | null>;
  onChange?: (fieldKey: string, value: string | null) => void;
}

export function DynamicFieldsSection({ studentId, values = {}, onChange }: DynamicFieldsSectionProps) {
  const [localValues, setLocalValues] = useState<Record<string, string | null>>(values);

  // field config rarely changes — cache 10 min
  const { data: fieldsConfig, isLoading: fieldsLoading } = trpc.dynamicFields.listFieldsConfig.useQuery(
    undefined,
    { staleTime: 600_000, gcTime: 1_800_000, refetchOnWindowFocus: false }
  );

  // per-student dynamic values — 30 s stale
  const { data: existingValues, isLoading: valuesLoading } = trpc.dynamicFields.getDynamicFieldValues.useQuery(
    { studentId: studentId || 0 },
    { enabled: !!studentId, staleTime: 30_000, gcTime: 300_000 }
  );

  // Update local values when existing values are loaded
  useEffect(() => {
    if (existingValues) {
      setLocalValues(existingValues);
    }
  }, [existingValues]);

  // Update local values when props change
  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleFieldChange = (fieldKey: string, value: string | null) => {
    setLocalValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    onChange?.(fieldKey, value);
  };

  if (fieldsLoading || valuesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!fieldsConfig || fieldsConfig.length === 0) {
    return null;
  }

  // Group fields by section
  const fieldsBySection = fieldsConfig.reduce(
    (acc, field) => {
      if (!acc[field.section]) {
        acc[field.section] = [];
      }
      acc[field.section].push(field);
      return acc;
    },
    {} as Record<string, typeof fieldsConfig>
  );

  return (
    <div className="space-y-6">
      {Object.entries(fieldsBySection).map(([section, fields]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="capitalize">{section} Fields</CardTitle>
            <CardDescription>Additional information for this student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field) => {
              const value = localValues[field.fieldKey] || "";
              const isRequired = field.required;

              return (
                <div key={field.fieldKey} className="space-y-2">
                  <Label htmlFor={field.fieldKey} className={isRequired ? "after:content-['*'] after:ml-1 after:text-red-500" : ""}>
                    {field.fieldLabel}
                  </Label>

                  {field.fieldType === "text" && (
                    <Input
                      id={field.fieldKey}
                      type="text"
                      placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                      value={value}
                      onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                      required={isRequired}
                    />
                  )}

                  {field.fieldType === "number" && (
                    <Input
                      id={field.fieldKey}
                      type="number"
                      placeholder={`Enter ${field.fieldLabel.toLowerCase()}`}
                      value={value}
                      onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                      required={isRequired}
                    />
                  )}

                  {field.fieldType === "date" && (
                    <Input
                      id={field.fieldKey}
                      type="date"
                      value={value}
                      onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                      required={isRequired}
                    />
                  )}

                  {field.fieldType === "checkbox" && (
                    <Select value={value || "No"} onValueChange={(v) => handleFieldChange(field.fieldKey, v)}>
                      <SelectTrigger id={field.fieldKey}>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {field.fieldType === "select" && field.options && (
                    <Select value={value || ""} onValueChange={(v) => handleFieldChange(field.fieldKey, v)}>
                      <SelectTrigger id={field.fieldKey}>
                        <SelectValue placeholder={`Select ${field.fieldLabel.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option: any) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
