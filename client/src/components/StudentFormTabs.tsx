import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, BookOpen, ClipboardCheck, CreditCard, FileText, Users } from "lucide-react";

interface StudentFormTabsProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function StudentFormTabs({ formData, onFormChange, onSubmit, isLoading = false, isEditing = false }: StudentFormTabsProps) {
  const [activeTab, setActiveTab] = useState("student-info");

  const handleInputChange = (field: string, value: any) => {
    onFormChange(field, value);
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    onFormChange(field, checked);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-slate-700">
          <TabsTrigger value="student-info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Student</span>
          </TabsTrigger>
          <TabsTrigger value="enrollment" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Enrollment</span>
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Assessment</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="parent" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Parent</span>
          </TabsTrigger>
        </TabsList>

        {/* STUDENT INFORMATION */}
        <TabsContent value="student-info" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Basic student details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentId" className="text-slate-300">Student ID *</Label>
                  <Input
                    id="studentId"
                    value={formData.studentId || ""}
                    onChange={(e) => handleInputChange("studentId", e.target.value)}
                    disabled={isEditing}
                    className="border-slate-600 bg-slate-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-slate-300">Student Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="border-slate-600 bg-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth" className="text-slate-300">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-slate-300">Gender *</Label>
                  <Select value={formData.gender || ""} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-700">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="nationality" className="text-slate-300">Nationality</Label>
                <Select value={formData.nationality || "Saudi"} onValueChange={(value) => handleInputChange("nationality", value)}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-700">
                    <SelectItem value="Saudi">Saudi</SelectItem>
                    <SelectItem value="Non-Saudi">Non-Saudi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENROLLMENT */}
        <TabsContent value="enrollment" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle>Enrollment Details</CardTitle>
              <CardDescription>School and grade information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school" className="text-slate-300">School *</Label>
                  <Select value={formData.school || ""} onValueChange={(value) => handleInputChange("school", value)}>
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-700">
                      <SelectItem value="AMIS Girls">AMIS Girls</SelectItem>
                      <SelectItem value="AMIS Boys">AMIS Boys</SelectItem>
                      <SelectItem value="Kids Gate">Kids Gate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="grade" className="text-slate-300">Grade *</Label>
                  <Select value={formData.grade || ""} onValueChange={(value) => handleInputChange("grade", value)}>
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-700">
                      <SelectItem value="Pre-KG">Pre-KG</SelectItem>
                      <SelectItem value="KG I">KG I</SelectItem>
                      <SelectItem value="KG II">KG II</SelectItem>
                      <SelectItem value="Grade 1">Grade 1</SelectItem>
                      <SelectItem value="Grade 2">Grade 2</SelectItem>
                      <SelectItem value="Grade 3">Grade 3</SelectItem>
                      <SelectItem value="Grade 4">Grade 4</SelectItem>
                      <SelectItem value="Grade 5">Grade 5</SelectItem>
                      <SelectItem value="Grade 6">Grade 6</SelectItem>
                      <SelectItem value="Grade 7">Grade 7</SelectItem>
                      <SelectItem value="Grade 8">Grade 8</SelectItem>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                      <SelectItem value="Grade 11">Grade 11</SelectItem>
                      <SelectItem value="Grade 12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentType" className="text-slate-300">Student Type *</Label>
                  <Select value={formData.studentType || "New Admission"} onValueChange={(value) => handleInputChange("studentType", value)}>
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-700">
                      <SelectItem value="New Admission">New Admission</SelectItem>
                      <SelectItem value="Enrollment">Enrollment</SelectItem>
                      <SelectItem value="Re-Registration">Re-Registration</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateOfJoin" className="text-slate-300">Date of Join</Label>
                  <Input
                    id="dateOfJoin"
                    type="date"
                    value={formData.dateOfJoin || ""}
                    onChange={(e) => handleInputChange("dateOfJoin", e.target.value)}
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ASSESSMENT */}
        <TabsContent value="assessment" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle>Assessment Status</CardTitle>
              <CardDescription>Academic assessment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assessed"
                    checked={formData.assessed || false}
                    onCheckedChange={(checked) => handleCheckboxChange("assessed", checked as boolean)}
                  />
                  <Label htmlFor="assessed" className="text-slate-300 cursor-pointer">Assessed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passed"
                    checked={formData.passed || false}
                    onCheckedChange={(checked) => handleCheckboxChange("passed", checked as boolean)}
                  />
                  <Label htmlFor="passed" className="text-slate-300 cursor-pointer">Passed</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reAssessment"
                    checked={formData.reAssessment || false}
                    onCheckedChange={(checked) => handleCheckboxChange("reAssessment", checked as boolean)}
                  />
                  <Label htmlFor="reAssessment" className="text-slate-300 cursor-pointer">Re-Assessment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passedRe"
                    checked={formData.passedRe || false}
                    onCheckedChange={(checked) => handleCheckboxChange("passedRe", checked as boolean)}
                  />
                  <Label htmlFor="passedRe" className="text-slate-300 cursor-pointer">Passed (Re)</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENT */}
        <TabsContent value="payment" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Payment methods and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="firstInstallment"
                    checked={formData.firstInstallment || false}
                    onCheckedChange={(checked) => handleCheckboxChange("firstInstallment", checked as boolean)}
                  />
                  <Label htmlFor="firstInstallment" className="text-slate-300 cursor-pointer">1st Installment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="secondInstallment"
                    checked={formData.secondInstallment || false}
                    onCheckedChange={(checked) => handleCheckboxChange("secondInstallment", checked as boolean)}
                  />
                  <Label htmlFor="secondInstallment" className="text-slate-300 cursor-pointer">2nd Installment</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fullPayment"
                    checked={formData.fullPayment || false}
                    onCheckedChange={(checked) => handleCheckboxChange("fullPayment", checked as boolean)}
                  />
                  <Label htmlFor="fullPayment" className="text-slate-300 cursor-pointer">Full Payment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="promissoryNote"
                    checked={formData.promissoryNote || false}
                    onCheckedChange={(checked) => handleCheckboxChange("promissoryNote", checked as boolean)}
                  />
                  <Label htmlFor="promissoryNote" className="text-slate-300 cursor-pointer">Promissory Note</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tamara"
                    checked={formData.tamara || false}
                    onCheckedChange={(checked) => handleCheckboxChange("tamara", checked as boolean)}
                  />
                  <Label htmlFor="tamara" className="text-slate-300 cursor-pointer">Tamara</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="jeelPay"
                    checked={formData.jeelPay || false}
                    onCheckedChange={(checked) => handleCheckboxChange("jeelPay", checked as boolean)}
                  />
                  <Label htmlFor="jeelPay" className="text-slate-300 cursor-pointer">JeelPay</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentStatus" className="text-slate-300">Payment Status</Label>
                  <Select value={formData.paymentStatus || "Pending"} onValueChange={(value) => handleInputChange("paymentStatus", value)}>
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-700">
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentMethod" className="text-slate-300">Payment Method</Label>
                  <Select value={formData.paymentMethod || ""} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-700">
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Tamara">Tamara</SelectItem>
                      <SelectItem value="JeelPay">JeelPay</SelectItem>
                      <SelectItem value="Promissory Note">Promissory Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle>Document Status</CardTitle>
              <CardDescription>
                {formData.studentType === "New Admission" 
                  ? "Document submission and signing (REQUIRED for new students)" 
                  : "Document status (optional for this type)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="docsSigned"
                    checked={formData.docsSigned || false}
                    onCheckedChange={(checked) => handleCheckboxChange("docsSigned", checked as boolean)}
                  />
                  <Label htmlFor="docsSigned" className="text-slate-300 cursor-pointer">Documents Signed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requirementsSubmitted"
                    checked={formData.requirementsSubmitted || false}
                    onCheckedChange={(checked) => handleCheckboxChange("requirementsSubmitted", checked as boolean)}
                  />
                  <Label htmlFor="requirementsSubmitted" className="text-slate-300 cursor-pointer">Requirements Submitted</Label>
                </div>
              </div>

              {formData.studentType === "New Admission" && (
                <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg mb-4">
                  <p className="text-xs text-yellow-200">
                    ⚠️ Documents are REQUIRED for new admissions.
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                <p className="text-sm text-slate-300">
                  <strong>File Complete:</strong>
                  {formData.studentType === "New Admission" ? (
                    <span className="ml-2">{(formData.docsSigned && formData.requirementsSubmitted) ? "✓ Yes" : "✗ No (requires both)"}</span>
                  ) : (
                    <span className="ml-2">✓ Auto (this type)</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {formData.studentType === "New Admission" 
                    ? "New Admission: File complete when BOTH documents are signed AND requirements are submitted."
                    : "Other types: File automatically marked complete."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PARENT/GUARDIAN */}
        <TabsContent value="parent" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle>Parent/Guardian Information</CardTitle>
              <CardDescription>Contact details for parents/guardians</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fatherId" className="text-slate-300">Father ID</Label>
                  <Input
                    id="fatherId"
                    value={formData.fatherId || ""}
                    onChange={(e) => handleInputChange("fatherId", e.target.value)}
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="fatherMobile" className="text-slate-300">Father Mobile</Label>
                  <Input
                    id="fatherMobile"
                    value={formData.fatherMobile || ""}
                    onChange={(e) => handleInputChange("fatherMobile", e.target.value)}
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="motherId" className="text-slate-300">Mother ID</Label>
                  <Input
                    id="motherId"
                    value={formData.motherId || ""}
                    onChange={(e) => handleInputChange("motherId", e.target.value)}
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="motherMobile" className="text-slate-300">Mother Mobile</Label>
                  <Input
                    id="motherMobile"
                    value={formData.motherMobile || ""}
                    onChange={(e) => handleInputChange("motherMobile", e.target.value)}
                    className="border-slate-600 bg-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-slate-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="border-slate-600 bg-slate-700 text-white"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex gap-4 justify-end pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Saving..." : isEditing ? "Update Student" : "Create Student"}
        </Button>
      </div>
    </form>
  );
}
