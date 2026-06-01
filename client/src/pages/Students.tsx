import { useState, useMemo, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StudentFormTabs } from "@/components/StudentFormTabs";
import { ImportStudentsDialog } from "@/components/ImportStudentsDialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, ChevronLeft,
  Columns3, Download, Edit2, Plus, Trash2, Upload, X,
  User, GraduationCap, CreditCard, FileText, Phone, Calendar, Armchair,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";

/* ─────────────────── types ─────────────────── */
type Lang = "en" | "ar";
type Status = "Registered" | "Assessed" | "Passed" | "Enrolled" | "Withdrawn";
type PaymentStatus = "Paid" | "Pending" | "Partial";
type PaymentMethod = "Cash" | "Bank Transfer" | "Card" | "Tamara" | "JeelPay" | "Promissory Note";
type Gender = "Male" | "Female";
type StudentType = "New" | "Re-Registration" | "Enrollment" | "New Admission" | "Transfer";

type StudentForm = {
  id?: number;
  studentId: string; name: string; dateOfBirth?: string;
  gender: Gender; nationality: string;
  school: string; grade: string; section?: string;
  studentType: StudentType; dateOfJoin?: string;
  assessed?: boolean; passed?: boolean; reAssessment?: boolean; passedRe?: boolean;
  registration?: boolean; enrollment?: boolean; transfer?: boolean;
  firstInstallment?: boolean; secondInstallment?: boolean; fullPayment?: boolean;
  promissoryNote?: boolean; tamara?: boolean; jeelPay?: boolean;
  docsSigned?: boolean; requirementsSubmitted?: boolean;
  fatherId?: string; fatherMobile?: string; motherId?: string; motherMobile?: string;
  notes?: string; status?: Status; registrationDate?: string;
  paymentStatus: PaymentStatus; paymentMethod?: PaymentMethod;
  fileComplete?: boolean; seatReserved?: boolean;
};

/* ─────────────────── column definitions ─────────────────── */
type ColKey =
  | "name" | "studentId" | "gender" | "nationality"
  | "school" | "grade" | "section" | "studentType"
  | "status" | "paymentStatus" | "fileComplete" | "seatReserved";

type ColDef = { key: ColKey; label: string; labelAr: string; defaultVisible: boolean };

const COLUMNS: ColDef[] = [
  { key: "name",          label: "Name",       labelAr: "الاسم",    defaultVisible: true  },
  { key: "studentId",     label: "ID",         labelAr: "الرقم",    defaultVisible: true  },
  { key: "gender",        label: "Gender",     labelAr: "الجنس",    defaultVisible: false },
  { key: "nationality",   label: "Nationality",labelAr: "الجنسية",  defaultVisible: false },
  { key: "school",        label: "School",     labelAr: "المدرسة",  defaultVisible: true  },
  { key: "grade",         label: "Grade",      labelAr: "الصف",     defaultVisible: true  },
  { key: "section",       label: "Section",    labelAr: "الفصل",    defaultVisible: false },
  { key: "studentType",   label: "Type",       labelAr: "النوع",    defaultVisible: false },
  { key: "status",        label: "Status",     labelAr: "الحالة",   defaultVisible: true  },
  { key: "paymentStatus", label: "Payment",    labelAr: "الدفع",    defaultVisible: true  },
  { key: "fileComplete",  label: "File",       labelAr: "الملف",    defaultVisible: true  },
  { key: "seatReserved",  label: "Seat",       labelAr: "المقعد",   defaultVisible: false },
];

/* ─────────────────── helpers ─────────────────── */
const emptyForm: StudentForm = {
  studentId: "", name: "", gender: "Male", nationality: "Saudi",
  school: "", grade: "", section: "", studentType: "New Admission",
  registrationDate: new Date().toISOString().slice(0, 10),
  paymentStatus: "Pending", paymentMethod: "Cash",
  fileComplete: false, assessed: false, passed: false,
  reAssessment: false, passedRe: false, registration: false,
  enrollment: false, transfer: false, firstInstallment: false,
  secondInstallment: false, fullPayment: false, promissoryNote: false,
  tamara: false, jeelPay: false, docsSigned: false, requirementsSubmitted: false,
};

function dateForInput(v: string | Date) {
  return new Date(v).toISOString().slice(0, 10);
}

const STATUS_STYLE: Record<string, string> = {
  Registered: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Assessed:   "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Passed:     "bg-green-500/20 text-green-300 border-green-500/30",
  Enrolled:   "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Withdrawn:  "bg-red-500/20 text-red-300 border-red-500/30",
};
const PAYMENT_STYLE: Record<string, string> = {
  Paid:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Partial: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

/* ─────────────────── Pill ─────────────────── */
function Pill({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
      active
        ? "bg-green-500/15 text-green-300 border-green-500/25"
        : "bg-white/5 text-white/30 border-white/10"
    }`}>
      {active ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  );
}

/* ─────────────────── ExpandedRow ─────────────────── */
function ExpandedRow({ student, colSpan }: { student: any; colSpan: number }) {
  const regDate = student.registrationDate
    ? new Date(student.registrationDate).toLocaleDateString("en-GB") : "—";
  const dob = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString("en-GB") : "—";

  return (
    <tr className="bg-white/[0.025] border-b border-cyan-200/10">
      <td colSpan={colSpan} className="px-4 pb-5 pt-2">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Personal */}
          <section>
            <header className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300/50">
              <User className="h-3 w-3" /> Personal
            </header>
            <dl className="space-y-1.5 text-xs">
              {[
                ["Date of birth", dob],
                ["Gender",        student.gender      || "—"],
                ["Nationality",   student.nationality || "—"],
                ["Section",       student.section     || "—"],
                ["Student type",  student.studentType || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-white/45">{k}</dt>
                  <dd className="text-white/80 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Assessment */}
          <section>
            <header className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300/50">
              <GraduationCap className="h-3 w-3" /> Assessment & Status
            </header>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={!!student.assessed}     label="Assessed"   />
              <Pill active={!!student.passed}       label="Passed"     />
              <Pill active={!!student.reAssessment} label="Re-assess"  />
              <Pill active={!!student.passedRe}     label="Passed Re"  />
              <Pill active={!!student.registration} label="Registered" />
              <Pill active={!!student.enrollment}   label="Enrolled"   />
              <Pill active={!!student.transfer}     label="Transfer"   />
            </div>
          </section>

          {/* Payment */}
          <section>
            <header className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300/50">
              <CreditCard className="h-3 w-3" /> Payment
            </header>
            <p className="text-xs text-white/50 mb-2">
              Method: <span className="text-white/70">{student.paymentMethod || "—"}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Pill active={!!student.firstInstallment}  label="1st Install."  />
              <Pill active={!!student.secondInstallment} label="2nd Install."  />
              <Pill active={!!student.fullPayment}       label="Full Payment"  />
              <Pill active={!!student.promissoryNote}    label="Promissory"    />
              <Pill active={!!student.tamara}            label="Tamara"        />
              <Pill active={!!student.jeelPay}           label="JeelPay"       />
            </div>
          </section>

          {/* Docs & Admin */}
          <section>
            <header className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300/50">
              <FileText className="h-3 w-3" /> Docs & Admin
            </header>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Pill active={!!student.docsSigned}            label="Docs Signed"    />
              <Pill active={!!student.requirementsSubmitted} label="Req. Submitted" />
              <Pill active={!!student.fileComplete}          label="File Complete"  />
              <Pill active={!!student.seatReserved}          label="Seat Reserved"  />
            </div>
            <div className="space-y-1 text-xs text-white/50">
              {student.fatherMobile && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Father: {student.fatherMobile}
                </div>
              )}
              {student.motherMobile && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Mother: {student.motherMobile}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Registered: {regDate}
              </div>
              {student.notes && (
                <p className="italic text-white/40 pt-1">{student.notes}</p>
              )}
            </div>
          </section>

        </div>
      </td>
    </tr>
  );
}

/* ─────────────────── ColumnToggle ─────────────────── */
function ColumnToggle({
  cols, visible, onChange, lang,
}: {
  cols: ColDef[]; visible: Set<ColKey>;
  onChange: (k: ColKey) => void; lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="border border-white/20 bg-white/10 text-white hover:bg-white/20 gap-2 h-9"
      >
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline text-sm">Columns</span>
        <span className="text-white/50 text-xs ml-0.5">{visible.size}</span>
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-cyan-200/20 bg-[#0b2458] shadow-2xl p-2">
            <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300/50">
              Show / hide columns
            </p>
            {cols.map(col => (
              <label
                key={col.key}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-white/75 hover:bg-white/5 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={visible.has(col.key)}
                  onChange={() => onChange(col.key)}
                  className="h-3.5 w-3.5 accent-cyan-400"
                />
                {lang === "ar" ? col.labelAr : col.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────── pagination ─────────────────── */
const PAGE_SIZE = 25;

/* ─────────────────── main page ─────────────────── */
export default function Students() {
  const { user }      = useAuth();
  const [location]    = useLocation();
  const [lang, setLang] = useState<Lang>("en");
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string | null>>({});
  const [editOpen, setEditOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [importOpen, setImportOpen]   = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  /* ── pagination & search ── */
  const [page, setPage]               = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* debounce search → reset to page 0 */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* column visibility */
  const defaultVisible = useMemo(
    () => new Set(COLUMNS.filter(c => c.defaultVisible).map(c => c.key) as ColKey[]),
    []
  );
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(defaultVisible);
  const toggleCol = useCallback((key: ColKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  /* highlight from global search ?highlight=ID */
  const highlightId = useMemo(() => {
    const qs  = location.split("?")[1] ?? "";
    const val = new URLSearchParams(qs).get("highlight");
    return val ? parseInt(val, 10) : null;
  }, [location]);

  const isAdmin = user?.role === "admin";
  const utils   = trpc.useUtils();

  const { data: studentsResp, isLoading, isError } =
    trpc.admissions.listStudents.useQuery(
      { limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch || undefined },
      { enabled: isAdmin }
    );

  const studentsData    = studentsResp?.data   ?? [];
  const totalCount      = studentsResp?.total  ?? 0;
  const totalPages      = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const filteredStudents = studentsData;

  const saveDynMutation = trpc.dynamicFields.saveDynamicFieldValue.useMutation();
  const saveDynFields   = (dbId: number) =>
    Object.entries(dynamicValues).forEach(([fieldKey, value]) =>
      saveDynMutation.mutate({ studentId: dbId, fieldKey, value })
    );

  const createMutation = trpc.admissions.createStudent.useMutation({
    onSuccess: async () => {
      toast.success("Student created");
      setForm(emptyForm); setDynamicValues({}); setEditOpen(false);
      setPage(0);
      await utils.admissions.listStudents.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const updateMutation = trpc.admissions.updateStudent.useMutation({
    onSuccess: async () => {
      toast.success("Student updated");
      if (form.id) saveDynFields(form.id);
      setForm(emptyForm); setDynamicValues({}); setEditOpen(false);
      await utils.admissions.listStudents.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const deleteMutation = trpc.admissions.deleteStudent.useMutation({
    onSuccess: async () => {
      toast.success("Student deleted");
      setDeleteOpen(false); setDeleteTarget(null);
      await utils.admissions.listStudents.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const openAdd  = () => { setForm(emptyForm); setDynamicValues({}); setEditOpen(true); };
  const openEdit = (s: any) => {
    setForm({
      id: s.id, studentId: s.studentId, name: s.name,
      dateOfBirth:       s.dateOfBirth  ? dateForInput(s.dateOfBirth)  : undefined,
      gender:            s.gender       as Gender,
      nationality:       s.nationality  || "",
      school:            s.school,       grade: s.grade,
      section:           s.section      || "",
      studentType:       ((s.studentType === "New" ? "New Admission" : s.studentType) || "New Admission") as StudentType,
      registrationDate:  dateForInput(s.registrationDate),
      paymentStatus:     s.paymentStatus as PaymentStatus,
      paymentMethod:     s.paymentMethod as PaymentMethod,
      status:            s.status        as Status,
      assessed:          s.assessed,     passed: s.passed,
      reAssessment:      s.reAssessment, passedRe: s.passedRe,
      registration:      s.registration, enrollment: s.enrollment, transfer: s.transfer,
      firstInstallment:  s.firstInstallment,
      secondInstallment: s.secondInstallment,
      fullPayment:       s.fullPayment,  promissoryNote: s.promissoryNote,
      tamara:            s.tamara,       jeelPay: s.jeelPay,
      docsSigned:        s.docsSigned,   requirementsSubmitted: s.requirementsSubmitted,
      fatherId:          s.fatherId,     fatherMobile: s.fatherMobile,
      motherId:          s.motherId,     motherMobile: s.motherMobile,
      notes:             s.notes,        fileComplete: s.fileComplete,
      seatReserved:      s.seatReserved,
    });
    setEditOpen(true);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload = {
      studentId: form.studentId, name: form.name, gender: form.gender,
      nationality:  (form.nationality || "Saudi") as "Saudi" | "Non-Saudi",
      school: form.school, grade: form.grade,
      studentType:  (form.studentType || "New Admission") as any,
      status: form.status,
      paymentStatus: form.paymentStatus, paymentMethod: form.paymentMethod,
      dateOfBirth: form.dateOfBirth, section: form.section, dateOfJoin: form.dateOfJoin,
      fileComplete: form.fileComplete,
      assessed: form.assessed, passed: form.passed,
      reAssessment: form.reAssessment, passedRe: form.passedRe,
      registration: form.registration, enrollment: form.enrollment, transfer: form.transfer,
      firstInstallment: form.firstInstallment, secondInstallment: form.secondInstallment,
      fullPayment: form.fullPayment, promissoryNote: form.promissoryNote,
      tamara: form.tamara, jeelPay: form.jeelPay,
      docsSigned: form.docsSigned, requirementsSubmitted: form.requirementsSubmitted,
      fatherId: form.fatherId, fatherMobile: form.fatherMobile,
      motherId: form.motherId, motherMobile: form.motherMobile, notes: form.notes,
    };
    form.id
      ? updateMutation.mutate({ id: form.id, ...payload })
      : createMutation.mutate(payload);
  };

  const handleExport = () => {
    if (!studentsData?.length) { toast.error("No students to export"); return; }
    const rows = studentsData.map((s: any) => ({
      Name: s.name,
      ID: s.studentId,
      School: s.school,
      Grade: s.grade,
      Status: s.status,
      "Payment Status": s.paymentStatus,
      "Payment Method": s.paymentMethod || "",
      "File Complete": s.fileComplete ? "Yes" : "No",
      "Father Mobile": s.fatherMobile || "",
      "Mother Mobile": s.motherMobile || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([output], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })),
      download: `students_${new Date().toISOString().slice(0,10)}.xlsx`,
    });
    a.click(); URL.revokeObjectURL(a.href);
    toast.success("Excel exported");
  };

  const toggleExpand = (id: number) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const activeCols  = COLUMNS.filter(c => visibleCols.has(c.key));
  const totalCols   = activeCols.length + 2; // chevron + actions

  if (!isAdmin) return (
    <div className="blueprint-bg min-h-screen p-8">
      <Card className="technical-panel mx-auto mt-16 max-w-md text-white">
        <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
        <CardContent><p className="text-white/70">Admin access required.</p></CardContent>
      </Card>
    </div>
  );

  return (
    <div className="blueprint-bg min-h-screen" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <ImportStudentsDialog
        open={importOpen} onOpenChange={setImportOpen}
        onSuccess={async () => {
          setImportOpen(false);
          await utils.admissions.listStudents.invalidate();
        }}
      />

      <div className="container space-y-5 py-6 sm:py-8">

        {/* Header */}
        <section className="technical-panel dimension-frame rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">Students</h1>
              <p className="mt-1.5 text-sm text-white/60">
                {totalCount.toLocaleString()} records
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setLang(l => l === "en" ? "ar" : "en")}
                className="border border-white/20 bg-white/10 text-white hover:bg-white/20">
                {lang === "en" ? "العربية" : "English"}
              </Button>
              <Button onClick={() => setImportOpen(true)}
                className="border border-emerald-200/40 bg-emerald-200 text-[#031844] hover:bg-white">
                <Upload className="h-4 w-4" /> Import
              </Button>
              <Button onClick={handleExport}
                className="border border-blue-200/40 bg-blue-200 text-[#031844] hover:bg-white">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button onClick={openAdd}
                className="border border-cyan-200/40 bg-cyan-200 text-[#031844] hover:bg-white">
                <Plus className="h-4 w-4" /> Add Student
              </Button>
            </div>
          </div>
        </section>

        {/* Table */}
        <Card className="technical-panel text-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <CardTitle className="text-lg font-black uppercase shrink-0">Students</CardTitle>
              {/* inline search */}
              <div className="relative flex-1 max-w-xs">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name, ID, mobile, grade..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <ColumnToggle cols={COLUMNS} visible={visibleCols} onChange={toggleCol} lang={lang} />
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-px">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
                ))}
              </div>
            ) : isError ? (
              <p className="p-8 text-center text-red-300">Error loading students</p>
            ) : filteredStudents.length === 0 ? (
              <p className="p-8 text-center text-white/50">No students found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyan-200/20 bg-white/5">
                      <th className="w-8 px-2" />
                      {activeCols.map(col => (
                        <th key={col.key}
                          className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-cyan-100/60 whitespace-nowrap">
                          {lang === "ar" ? col.labelAr : col.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-cyan-100/60">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student: any) => {
                      const isExpanded    = expandedIds.has(student.id);
                      const isHighlighted = student.id === highlightId;
                      return (
                        <>
                          <tr
                            key={student.id}
                            onClick={() => toggleExpand(student.id)}
                            className={`border-b border-cyan-200/10 cursor-pointer transition-colors
                              ${isHighlighted ? "bg-cyan-500/10 ring-1 ring-inset ring-cyan-400/30" : "hover:bg-white/[0.04]"}
                              ${isExpanded    ? "bg-white/[0.05]" : ""}
                            `}
                          >
                            {/* chevron */}
                            <td className="w-8 px-2 text-white/30">
                              {isExpanded
                                ? <ChevronDown  className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />}
                            </td>

                            {/* dynamic columns */}
                            {activeCols.map(col => (
                              <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                                {col.key === "name"          && <span className="font-medium text-white">{student.name}</span>}
                                {col.key === "studentId"     && <span className="font-mono text-xs text-white/55">{student.studentId}</span>}
                                {col.key === "gender"        && <span className="text-white/65">{student.gender}</span>}
                                {col.key === "nationality"   && <span className="text-white/65">{student.nationality}</span>}
                                {col.key === "school"        && <span className="text-white/65 max-w-[140px] truncate block">{student.school}</span>}
                                {col.key === "grade"         && <span className="text-white/65">{student.grade}</span>}
                                {col.key === "section"       && <span className="text-white/65">{student.section || "—"}</span>}
                                {col.key === "studentType"   && <span className="text-white/65 text-xs">{student.studentType}</span>}
                                {col.key === "status"        && (
                                  <Badge className={`text-[11px] border ${STATUS_STYLE[student.status] ?? "bg-gray-500/20 text-gray-300"}`}>
                                    {student.status}
                                  </Badge>
                                )}
                                {col.key === "paymentStatus" && (
                                  <Badge className={`text-[11px] border ${PAYMENT_STYLE[student.paymentStatus] ?? "bg-gray-500/20 text-gray-300"}`}>
                                    {student.paymentStatus}
                                  </Badge>
                                )}
                                {col.key === "fileComplete"  && (
                                  student.fileComplete
                                    ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                    : <AlertTriangle className="h-4 w-4 text-amber-400" />
                                )}
                                {col.key === "seatReserved"  && (
                                  student.seatReserved
                                    ? <Armchair className="h-4 w-4 text-cyan-400" />
                                    : <span className="text-white/30 text-xs">—</span>
                                )}
                              </td>
                            ))}

                            {/* actions */}
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => openEdit(student)}
                                  className="h-7 w-7 flex items-center justify-center rounded-md border border-cyan-200/30 text-cyan-300 hover:bg-cyan-200/10 transition-colors"
                                  aria-label="Edit">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => { setDeleteTarget(student.id); setDeleteOpen(true); }}
                                  className="h-7 w-7 flex items-center justify-center rounded-md border border-red-200/30 text-red-300 hover:bg-red-200/10 transition-colors"
                                  aria-label="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <ExpandedRow key={`${student.id}-exp`} student={student} colSpan={totalCols} />
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {/* ── Pagination bar ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              {/* info */}
              <p className="text-xs text-white/40 tabular-nums">
                {(page * PAGE_SIZE + 1).toLocaleString()}–{Math.min((page + 1) * PAGE_SIZE, totalCount).toLocaleString()} of {totalCount.toLocaleString()}
              </p>

              {/* controls */}
              <div className="flex items-center gap-1">
                {/* prev */}
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-white/15 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {/* page pills */}
                {Array.from({ length: totalPages }).map((_, i) => {
                  const isActive = i === page;
                  const near = Math.abs(i - page) <= 2 || i === 0 || i === totalPages - 1;
                  if (!near) {
                    const isEdge = (i === 1 && page > 3) || (i === totalPages - 2 && page < totalPages - 4);
                    if (isEdge) return <span key={i} className="text-white/25 text-xs px-0.5">…</span>;
                    return null;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`h-7 min-w-[28px] px-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
                          : "text-white/50 hover:text-white hover:bg-white/10 border border-transparent"
                      }`}
                      aria-label={`Page ${i + 1}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {i + 1}
                    </button>
                  );
                })}

                {/* next */}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-7 w-7 flex items-center justify-center rounded-md border border-white/15 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* page size info */}
              <p className="text-xs text-white/30 hidden sm:block">
                {PAGE_SIZE} per page
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Edit / Add Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-[#031844] border-cyan-200/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">
              {form.id ? "Edit Student" : "Add Student"}
            </DialogTitle>
          </DialogHeader>
          <StudentFormTabs
            formData={form}
            onFormChange={(field, value) => setForm(prev => ({ ...prev, [field]: value }))}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            isEditing={!!form.id}
            studentId={form.id}
            dynamicValues={dynamicValues}
            onDynamicChange={(fieldKey, value) => setDynamicValues(prev => ({ ...prev, [fieldKey]: value }))}
          />
          <div className="mt-5 flex justify-end gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="border-white/20 text-white/70 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-cyan-200 text-[#031844] hover:bg-white"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-[#031844] border-cyan-200/30 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase">Delete Student</DialogTitle>
          </DialogHeader>
          <p className="text-white/70 text-sm">This action cannot be undone.</p>
          <div className="flex gap-3 justify-end mt-3">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}
              className="border-white/20 text-white/70 hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget })}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
