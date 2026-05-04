import { useState, useMemo, FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudentFormTabs } from "@/components/StudentFormTabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Lang = "en" | "ar";
type Status = "Registered" | "Assessed" | "Passed" | "Enrolled";
type PaymentStatus = "Paid" | "Pending";
type PaymentMethod = "Cash" | "Tamara" | "JeelPay";
type Gender = "Male" | "Female";
type StudentType = "New" | "Re-Registration" | "Enrollment" | "New Admission" | "Transfer";

type StudentForm = {
  id?: number;
  studentId: string;
  name: string;
  dateOfBirth?: string;
  gender: Gender;
  nationality: string;
  school: string;
  grade: string;
  section?: string;
  studentType: StudentType;
  dateOfJoin?: string;
  assessed?: boolean;
  passed?: boolean;
  reAssessment?: boolean;
  passedRe?: boolean;
  registration?: boolean;
  enrollment?: boolean;
  transfer?: boolean;
  firstInstallment?: boolean;
  secondInstallment?: boolean;
  fullPayment?: boolean;
  promissoryNote?: boolean;
  tamara?: boolean;
  jeelPay?: boolean;
  docsSigned?: boolean;
  requirementsSubmitted?: boolean;
  fatherId?: string;
  fatherMobile?: string;
  motherId?: string;
  motherMobile?: string;
  notes?: string;
  status?: Status;
  registrationDate?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  fileComplete?: boolean;
  seatReserved?: boolean;
};

const emptyForm: StudentForm = {
  studentId: "",
  name: "",
  gender: "Male",
  nationality: "Saudi",
  school: "",
  grade: "",
  section: "",
  studentType: "New Admission",
  registrationDate: new Date().toISOString().slice(0, 10),
  paymentStatus: "Pending",
  paymentMethod: "Cash",
  fileComplete: false,
  assessed: false,
  passed: false,
  reAssessment: false,
  passedRe: false,
  registration: false,
  enrollment: false,
  transfer: false,
  firstInstallment: false,
  secondInstallment: false,
  fullPayment: false,
  promissoryNote: false,
  tamara: false,
  jeelPay: false,
  docsSigned: false,
  requirementsSubmitted: false,
};

const copy = {
  en: {
    title: "Students Management",
    subtitle: "Manage student records, admissions, and enrollment",
    students: "Students",
    addStudent: "Add Student",
    editStudent: "Edit Student",
    deleteStudent: "Delete Student",
    search: "Search students",
    searchPlaceholder: "Search by ID, name, school, or grade...",
    import: "Import",
    export: "Export",
    name: "Name",
    id: "ID",
    school: "School",
    grade: "Grade",
    status: "Status",
    paymentStatus: "Payment Status",
    fileComplete: "File Complete",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    error: "Error loading data",
    noData: "No students found",
    studentCreated: "Student created successfully",
    studentUpdated: "Student updated successfully",
    studentDeleted: "Student deleted successfully",
    deleteConfirm: "Are you sure you want to delete this student?",
    yes: "Yes",
    no: "No",
  },
  ar: {
    title: "إدارة الطلاب",
    subtitle: "إدارة سجلات الطلاب والقبول والالتحاق",
    students: "الطلاب",
    addStudent: "إضافة طالب",
    editStudent: "تعديل الطالب",
    deleteStudent: "حذف الطالب",
    search: "البحث عن الطلاب",
    searchPlaceholder: "ابحث حسب الرقم أو الاسم أو المدرسة أو الصف...",
    import: "استيراد",
    export: "تصدير",
    name: "الاسم",
    id: "الرقم",
    school: "المدرسة",
    grade: "الصف",
    status: "الحالة",
    paymentStatus: "حالة الدفع",
    fileComplete: "الملف كامل",
    actions: "الإجراءات",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    loading: "جاري التحميل...",
    error: "خطأ في تحميل البيانات",
    noData: "لم يتم العثور على طلاب",
    studentCreated: "تم إنشاء الطالب بنجاح",
    studentUpdated: "تم تحديث الطالب بنجاح",
    studentDeleted: "تم حذف الطالب بنجاح",
    deleteConfirm: "هل أنت متأكد من حذف هذا الطالب؟",
    yes: "نعم",
    no: "لا",
  },
};

const statusColors = {
  Registered: "bg-blue-500/20 text-blue-200",
  Assessed: "bg-purple-500/20 text-purple-200",
  Passed: "bg-green-500/20 text-green-200",
  Enrolled: "bg-cyan-500/20 text-cyan-200",
};

const paymentStatusColors = {
  Paid: "bg-green-500/20 text-green-200",
  Pending: "bg-yellow-500/20 text-yellow-200",
};

function dateForInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function Students() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const t = copy[lang];
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const students = trpc.admissions.listStudents.useQuery({}, { enabled: isAdmin });

  const filteredStudents = useMemo(() => {
    if (!students.data) return [];
    if (!searchQuery.trim()) return students.data;
    const query = searchQuery.toLowerCase();
    return students.data.filter(
      (s: any) =>
        s.name.toLowerCase().includes(query) ||
        s.studentId.toLowerCase().includes(query) ||
        s.school.toLowerCase().includes(query) ||
        s.grade.toLowerCase().includes(query)
    );
  }, [students.data, searchQuery]);

  const createStudent = trpc.admissions.createStudent.useMutation({
    onSuccess: async () => {
      toast.success(t.studentCreated);
      setForm(emptyForm);
      setEditModalOpen(false);
      await utils.admissions.listStudents.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStudent = trpc.admissions.updateStudent.useMutation({
    onSuccess: async () => {
      toast.success(t.studentUpdated);
      setForm(emptyForm);
      setEditModalOpen(false);
      await utils.admissions.listStudents.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteStudent = trpc.admissions.deleteStudent.useMutation({
    onSuccess: async () => {
      toast.success(t.studentDeleted);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      await utils.admissions.listStudents.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleAddStudent = () => {
    setForm(emptyForm);
    setEditModalOpen(true);
  };

  const handleEditStudent = (student: any) => {
    setForm({
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      dateOfBirth: student.dateOfBirth ? dateForInput(student.dateOfBirth) : undefined,
      gender: student.gender as Gender,
      nationality: student.nationality || "",
      school: student.school,
      grade: student.grade,
      section: student.section || "",
      studentType: (student.studentType as StudentType) || "New",
      registrationDate: dateForInput(student.registrationDate),
      paymentStatus: student.paymentStatus as PaymentStatus,
      paymentMethod: student.paymentMethod as PaymentMethod,
      fileComplete: student.fileComplete,
      status: student.status as Status,
    });
    setEditModalOpen(true);
  };

  const handleDeleteStudent = (id: number) => {
    setDeleteTarget(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteStudent.mutate({ id: deleteTarget });
    }
  };

  const submitStudent = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      studentId: form.studentId,
      name: form.name,
      gender: form.gender,
      nationality: (form.nationality || "Saudi") as "Saudi" | "Non-Saudi",
      school: form.school,
      grade: form.grade,
      studentType: (form.studentType || "New Admission") as "New Admission" | "Enrollment" | "Re-Registration" | "Transfer",
      paymentStatus: form.paymentStatus,
      paymentMethod: form.paymentMethod,
    };
    if (form.id) updateStudent.mutate({ id: form.id, ...payload });
    else createStudent.mutate(payload);
  };

  if (!isAdmin) {
    return (
      <div className="blueprint-bg min-h-screen p-4 sm:p-8">
        <Card className="technical-panel mx-auto mt-16 max-w-2xl text-white dimension-frame">
          <CardHeader>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <p>Admin access required to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="blueprint-bg min-h-screen" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <div className="container space-y-6 py-6 sm:py-8">
        {/* Header */}
        <section className="technical-panel dimension-frame overflow-hidden rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">{t.title}</h1>
              <p className="mt-2 text-base font-medium text-white/75">{t.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button
                className="border border-cyan-200/40 bg-cyan-200 text-[#031844] hover:bg-white"
                onClick={() => setLang(lang === "en" ? "ar" : "en")}
              >
                {lang === "en" ? "العربية" : "English"}
              </Button>
              <Button
                className="border border-cyan-200/40 bg-cyan-200 text-[#031844] hover:bg-white"
                onClick={handleAddStudent}
              >
                <Plus className="h-4 w-4" />
                {t.addStudent}
              </Button>
            </div>
          </div>
        </section>

        {/* Search */}
        <Card className="technical-panel text-white">
          <CardContent className="p-5">
            <div className="flex gap-2">
              <Search className="h-5 w-5 text-cyan-200" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-cyan-200/30 bg-white/5 text-white placeholder:text-white/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card className="technical-panel text-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase">{t.students}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {students.isLoading ? (
              <div className="p-8 text-center text-white/75">{t.loading}</div>
            ) : students.isError ? (
              <div className="p-8 text-center text-red-200">{t.error}</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-white/75">{t.noData}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-200/20 bg-white/5">
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        {t.name}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        {t.id}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        {t.school}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        {t.grade}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        {t.status}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        {t.paymentStatus}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        {t.fileComplete}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student: any, idx: number) => (
                      <tr
                        key={student.id}
                        className="border-b border-cyan-200/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-white">{student.name}</td>
                        <td className="px-6 py-4 text-white/75">{student.studentId}</td>
                        <td className="px-6 py-4 text-white/75">{student.school}</td>
                        <td className="px-6 py-4 text-white/75">{student.grade}</td>
                        <td className="px-6 py-4">
                          <Badge className={statusColors[student.status as Status] || "bg-gray-500/20 text-gray-200"}>
                            {student.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={
                              paymentStatusColors[student.paymentStatus as PaymentStatus] || "bg-gray-500/20 text-gray-200"
                            }
                          >
                            {student.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {student.fileComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-green-200" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-200" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStudent(student)}
                              className="border-cyan-200/40 text-cyan-200 hover:bg-cyan-200/10"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteStudent(student.id)}
                              className="border-red-200/40 text-red-200 hover:bg-red-200/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-[#031844] border-cyan-200/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">
              {form.id ? t.editStudent : t.addStudent}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitStudent} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-white">Student ID *</Label>
                <Input
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="border-cyan-200/30 bg-white/5 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Student Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border-cyan-200/30 bg-white/5 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white">School *</Label>
                <Input
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className="border-cyan-200/30 bg-white/5 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Grade *</Label>
                <Input
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="border-cyan-200/30 bg-white/5 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white">Payment Status *</Label>
                <select
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
                  className="w-full border border-cyan-200/30 bg-white/5 text-white px-3 py-2 rounded"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="border-cyan-200/40 text-cyan-200 hover:bg-cyan-200/10"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                className="bg-cyan-200 text-[#031844] hover:bg-white"
                disabled={createStudent.isPending || updateStudent.isPending}
              >
                {t.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-[#031844] border-cyan-200/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">{t.deleteStudent}</DialogTitle>
          </DialogHeader>
          <p className="text-white/75">{t.deleteConfirm}</p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="border-cyan-200/40 text-cyan-200 hover:bg-cyan-200/10"
            >
              {t.no}
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={deleteStudent.isPending}
            >
              {t.yes}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
