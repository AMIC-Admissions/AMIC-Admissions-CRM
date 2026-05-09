import { useState, useEffect } from "react";
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

  // Fetch field configurations
  const { data: fieldsConfig, isLoading: fieldsLoading } = trpc.dynamicFields.listFieldsConfig.useQuery();

  // Fetch existing dynamic field values if editing
  const { data: existingValues, isLoading: valuesLoading } = trpc.dynamicFields.getDynamicFieldValues.useQuery(
    { studentId: studentId || 0 },
    { enabled: !!studentId }
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
                    <select
                      id={field.fieldKey}
                      value={value || ""}
                      onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                      required={isRequired}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{`Select ${field.fieldLabel.toLowerCase()}`}</option>
                      {(() => {
                        try {
                          const options = typeof field.options === 'string' ? JSON.parse(field.options) : field.options;
                          if (Array.isArray(options)) {
                            return options.map((option: any) => {
                              const optionValue = typeof option === 'string' ? option : option.value;
                              const optionLabel = typeof option === 'string' ? option : option.label || option.value;
                              return (
                                <option key={optionValue} value={optionValue}>
                                  {optionLabel}
                                </option>
                              );
                            });
                          }
                          return null;
                        } catch (e) {
                          console.error('Failed to parse options:', e);
                          return null;
                        }
                      })()}
                    </select>
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
