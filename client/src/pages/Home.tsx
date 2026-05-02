import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Gauge,
  Languages,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

type Lang = "en" | "ar";
type Status = "Registered" | "Assessed" | "Passed" | "Enrolled";
type PaymentStatus = "Paid" | "Pending";
type PaymentMethod = "Cash" | "Tamara" | "JeelPay";
type Gender = "Male" | "Female";

type StudentType = "New" | "Re-Registration" | "Enrollment";

type StudentForm = {
  id?: number;
  studentId: string;
  name: string;
  gender: Gender;
  nationality: string;
  school: string;
  grade: string;
  section?: string;
  studentType: StudentType;
  registrationDate: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  fileComplete: boolean;
};

const statusOrder: Status[] = ["Registered", "Assessed", "Passed", "Enrolled"];
const emptyForm: StudentForm = {
  studentId: "",
  name: "",
  gender: "Male",
  nationality: "Saudi",
  school: "",
  grade: "",
  section: "",
  studentType: "New",
  registrationDate: new Date().toISOString().slice(0, 10),
  paymentStatus: "Pending",
  paymentMethod: "Cash",
  fileComplete: false,
};

const labels = {
  en: {
    gender: { Male: "Male", Female: "Female" },
    status: { Registered: "Registered", Assessed: "Assessed", Passed: "Passed", Enrolled: "Enrolled" },
    paymentStatus: { Paid: "Paid", Pending: "Pending" },
    paymentMethod: { Cash: "Cash", Tamara: "Tamara", JeelPay: "JeelPay" },
  },
  ar: {
    gender: { Male: "ذكر", Female: "أنثى" },
    status: { Registered: "مسجل", Assessed: "تم تقييمه", Passed: "ناجح", Enrolled: "ملتحق" },
    paymentStatus: { Paid: "مدفوع", Pending: "معلق" },
    paymentMethod: { Cash: "نقداً", Tamara: "تمارا", JeelPay: "جيل باي" },
  },
};

const copy = {
  en: {
    title: "School Admissions Management",
    subtitle: "Structured CRM for registration, assessment, seat control, payment tracking, and enrollment.",
    dashboard: "Dashboard",
    students: "Students",
    seats: "Seat Management",
    addStudent: "Add Student",
    updateStudent: "Update Student",
    totalStudents: "Total Students",
    registered: "Registered",
    enrolled: "Enrolled",
    seatsReserved: "Seats Reserved",
    seatsAvailable: "Seats Available",
    dailyRegistrations: "Daily registrations",
    weeklyComparison: "Weekly comparison",
    thisWeek: "This week",
    lastWeek: "Last week",
    filters: "Admin filters",
    dateFrom: "Date from",
    dateTo: "Date to",
    school: "School",
    grade: "Grade",
    allSchools: "All schools",
    allGrades: "All grades",
    name: "Name",
    id: "ID",
    gender: "Gender",
    nationality: "Nationality",
    status: "Status",
    registrationDate: "Registration Date",
    paymentStatus: "Payment Status",
    paymentMethod: "Payment Method",
    fileComplete: "File Complete",
    actions: "Actions",
    capacity: "Capacity",
    reserved: "Reserved",
    available: "Available",
    lowSeat: "Low-seat alert",
    saveSeat: "Save capacity",
    progress: "Progress",
    delete: "Delete",
    edit: "Edit",
    clear: "Clear",
    adminOnly: "Admin access is required. Your account is authenticated but does not have admin privileges.",
    signInAdmin: "Sign in as an administrator to manage admissions records.",
    protected: "Protected admin workspace",
    workflowNote: "Workflow is enforced by the server: Registered → Assessed → Passed → Enrolled, without skipping or reversal.",
    noData: "No records match the current filters.",
    loading: "Loading verified data...",
    error: "Unable to load this section.",
    yes: "Yes",
    no: "No",
    ok: "OK",
    studentCreated: "Student created",
    studentUpdated: "Student updated",
    studentDeleted: "Student deleted",
    workflowAdvanced: "Workflow advanced",
    seatSaved: "Seat capacity saved",
  },
  ar: {
    title: "نظام إدارة القبول المدرسي",
    subtitle: "نظام منظم لإدارة التسجيل والتقييم والمقاعد والمدفوعات والالتحاق.",
    dashboard: "لوحة التحكم",
    students: "الطلاب",
    seats: "إدارة المقاعد",
    addStudent: "إضافة طالب",
    updateStudent: "تحديث الطالب",
    totalStudents: "إجمالي الطلاب",
    registered: "المسجلون",
    enrolled: "الملتحقون",
    seatsReserved: "المقاعد المحجوزة",
    seatsAvailable: "المقاعد المتاحة",
    dailyRegistrations: "التسجيلات اليومية",
    weeklyComparison: "مقارنة أسبوعية",
    thisWeek: "هذا الأسبوع",
    lastWeek: "الأسبوع الماضي",
    filters: "فلاتر الإدارة",
    dateFrom: "من تاريخ",
    dateTo: "إلى تاريخ",
    school: "المدرسة",
    grade: "الصف",
    allSchools: "كل المدارس",
    allGrades: "كل الصفوف",
    name: "الاسم",
    id: "الرقم",
    gender: "الجنس",
    nationality: "الجنسية",
    status: "الحالة",
    registrationDate: "تاريخ التسجيل",
    paymentStatus: "حالة الدفع",
    paymentMethod: "طريقة الدفع",
    fileComplete: "اكتمال الملف",
    actions: "الإجراءات",
    capacity: "السعة",
    reserved: "محجوز",
    available: "متاح",
    lowSeat: "تنبيه انخفاض المقاعد",
    saveSeat: "حفظ السعة",
    progress: "تقدم",
    delete: "حذف",
    edit: "تعديل",
    clear: "مسح",
    adminOnly: "تتطلب هذه المساحة صلاحيات مدير. الحساب مسجل ولكن لا يملك صلاحيات الإدارة.",
    signInAdmin: "سجل الدخول كمدير لإدارة سجلات القبول.",
    protected: "مساحة إدارية محمية",
    workflowNote: "يتم فرض سير العمل من الخادم: مسجل ← تم تقييمه ← ناجح ← ملتحق، دون تخطي أو رجوع.",
    noData: "لا توجد سجلات مطابقة للفلاتر الحالية.",
    loading: "جاري تحميل البيانات المعتمدة...",
    error: "تعذر تحميل هذا القسم.",
    yes: "نعم",
    no: "لا",
    ok: "سليم",
    studentCreated: "تم إنشاء سجل الطالب",
    studentUpdated: "تم تحديث سجل الطالب",
    studentDeleted: "تم حذف سجل الطالب",
    workflowAdvanced: "تم تقدم مرحلة القبول",
    seatSaved: "تم حفظ سعة المقاعد",
  },
};

function dateForInput(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function nextStatus(status: Status) {
  const index = statusOrder.indexOf(status);
  return index >= 0 && index < statusOrder.length - 1 ? statusOrder[index + 1] : undefined;
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>("en");
  const [filters, setFilters] = useState({ school: "", grade: "", from: "", to: "" });
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [seatForm, setSeatForm] = useState({ id: 0, school: "", grade: "", capacity: 0 });
  const t = copy[lang];
  const label = labels[lang];
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const queryFilters = useMemo(
    () => ({
      school: filters.school || undefined,
      grade: filters.grade || undefined,
      from: filters.from ? new Date(filters.from) : undefined,
      to: filters.to ? new Date(filters.to) : undefined,
    }),
    [filters],
  );

  const dashboard = trpc.admissions.getDashboard.useQuery(queryFilters, { enabled: isAdmin });
  const students = trpc.admissions.listStudents.useQuery(queryFilters, { enabled: isAdmin });
  const seats = trpc.admissions.listSeats.useQuery(undefined as any, { enabled: isAdmin });
  const options = trpc.admissions.getFilterOptions.useQuery(undefined as any, { enabled: isAdmin });

  const invalidateAdmissions = async () => {
    await Promise.all([
      utils.admissions.getDashboard.invalidate(),
      utils.admissions.listStudents.invalidate(),
      utils.admissions.listSeats.invalidate(),
      utils.admissions.getFilterOptions.invalidate(),
    ]);
  };

  const createStudent = trpc.admissions.createStudent.useMutation({
    onSuccess: async () => {
      toast.success(t.studentCreated);
      setForm(emptyForm);
      await invalidateAdmissions();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateStudent = trpc.admissions.updateStudent.useMutation({
    onSuccess: async () => {
      toast.success(t.studentUpdated);
      setForm(emptyForm);
      await invalidateAdmissions();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteStudent = trpc.admissions.deleteStudent.useMutation({
    onSuccess: async () => {
      toast.success(t.studentDeleted);
      await invalidateAdmissions();
    },
    onError: (error) => toast.error(error.message),
  });



  const updateSeat = trpc.admissions.updateSeat.useMutation({
    onSuccess: async () => {
      toast.success(t.seatSaved);
      await invalidateAdmissions();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const submitStudent = (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      studentId: form.studentId,
      name: form.name,
      gender: form.gender,
      nationality: form.nationality,
      school: form.school,
      grade: form.grade,
      registrationDate: new Date(form.registrationDate),
      paymentStatus: form.paymentStatus,
      paymentMethod: form.paymentMethod,
      fileComplete: form.fileComplete,
    };
    if (form.id) updateStudent.mutate({ id: form.id, ...payload });
    else createStudent.mutate(payload);
  };

  const kpis = [
    { label: t.totalStudents, value: dashboard.data?.totalStudents ?? 0, icon: Users },
    { label: t.registered, value: dashboard.data?.registered ?? 0, icon: ClipboardList },
    { label: t.enrolled, value: dashboard.data?.enrolled ?? 0, icon: CheckCircle2 },
    { label: t.seatsReserved, value: dashboard.data?.seatsReserved ?? 0, icon: Gauge },
    { label: t.seatsAvailable, value: dashboard.data?.seatsAvailable ?? 0, icon: AlertTriangle },
  ];

  if (!isAdmin) {
    return (
      <div className="blueprint-bg min-h-screen p-4 sm:p-8">
        <Card className="technical-panel mx-auto mt-16 max-w-2xl text-white dimension-frame">
          <CardHeader>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">{t.protected}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-white/80">
            <p>{user ? t.adminOnly : t.signInAdmin}</p>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">RBAC / SERVER PROTECTED</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="blueprint-bg min-h-screen" dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      <div className="container space-y-6 py-6 sm:py-8">
        <section className="technical-panel dimension-frame overflow-hidden rounded-2xl p-5 sm:p-8">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="mb-3 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-cyan-100">
                <span>CAD-ADM-2026</span>
                <span className="h-1 w-1 rounded-full bg-cyan-200" />
                <span>{t.protected}</span>
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">{t.title}</h1>
              <p className="mt-4 max-w-3xl text-base font-medium text-white/75 sm:text-lg">{t.subtitle}</p>
            </div>
            <Button
              className="border border-cyan-200/40 bg-cyan-200 text-[#031844] hover:bg-white"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
            >
              <Languages className="h-4 w-4" />
              {lang === "en" ? "العربية" : "English"}
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="technical-panel text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-100/75">{kpi.label}</p>
                    {dashboard.isLoading ? (
                      <StateMini text={t.loading} />
                    ) : dashboard.isError ? (
                      <StateMini text={t.error} />
                    ) : !dashboard.data ? (
                      <StateMini text={t.noData} />
                    ) : (
                      <p className="mt-3 text-4xl font-black">{kpi.value.toLocaleString()}</p>
                    )}
                  </div>
                  <kpi.icon className="h-7 w-7 text-cyan-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Card className="technical-panel text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase">
                <Gauge className="h-5 w-5 text-cyan-200" /> {t.dailyRegistrations}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {dashboard.isLoading ? (
                <StateMessage text={t.loading} />
              ) : dashboard.isError ? (
                <StateMessage text={t.error} />
              ) : dashboard.data?.dailyRegistrations.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.data.dailyRegistrations}>
                    <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.65)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="rgba(255,255,255,0.65)" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#061f5c", border: "1px solid rgba(255,255,255,0.2)", color: "white" }} />
                    <Bar dataKey="count" fill="#9be8ff" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <StateMessage text={t.noData} />
              )}
            </CardContent>
          </Card>

          <Card className="technical-panel text-white">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase">{t.weeklyComparison}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {dashboard.isLoading ? (
                <StateMessage text={t.loading} />
              ) : dashboard.isError ? (
                <StateMessage text={t.error} />
              ) : (
                [
                  [t.thisWeek, dashboard.data?.weeklyComparison.thisWeek ?? 0],
                  [t.lastWeek, dashboard.data?.weeklyComparison.lastWeek ?? 0],
                ].map(([weeklyLabel, value]) => (
                  <div key={weeklyLabel}>
                    <div className="mb-2 flex items-center justify-between text-sm font-bold uppercase tracking-[0.18em] text-white/75">
                      <span>{weeklyLabel}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-sm border border-white/15 bg-white/10">
                      <div className="h-full bg-cyan-200" style={{ width: `${Math.min(100, Number(value) * 8)}%` }} />
                    </div>
                  </div>
                ))
              )}
              <div className="rounded-lg border border-cyan-200/25 bg-cyan-200/10 p-4 text-sm text-cyan-50">{t.workflowNote}</div>
            </CardContent>
          </Card>
        </section>

        <section className="technical-panel rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-lg font-black uppercase text-white">
            <Search className="h-5 w-5 text-cyan-200" /> {t.filters}
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label={t.dateFrom}><Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></Field>
            <Field label={t.dateTo}><Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></Field>
            <Field label={t.school}>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-white" value={filters.school || ""} onChange={(e) => setFilters({ ...filters, school: e.target.value })}>
                <option value="">{t.allSchools}</option>
                {options.data?.schools.map((school: string) => <option key={school} value={school}>{school}</option>)}
              </select>
            </Field>
            <Field label={t.grade}>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-white" value={filters.grade || ""} onChange={(e) => setFilters({ ...filters, grade: e.target.value })}>
                <option value="">{t.allGrades}</option>
                {options.data?.grades.map((grade: string) => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="grid gap-6 2xl:grid-cols-[0.9fr_1.5fr]">
          <Card className="technical-panel text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase">
                <Plus className="h-5 w-5 text-cyan-200" /> {form.id ? t.updateStudent : t.addStudent}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitStudent}>
                <Field label={t.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
                <Field label={t.id}><Input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required /></Field>
                <Field label={t.gender}>
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-white" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}>
                    <option value="Male">{label.gender.Male}</option><option value="Female">{label.gender.Female}</option>
                  </select>
                </Field>
                <Field label={t.nationality}><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} required /></Field>
                <Field label={t.school}><Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} required /></Field>
                <Field label={t.grade}><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} required /></Field>
                <Field label={t.registrationDate}><Input type="date" value={form.registrationDate} onChange={(e) => setForm({ ...form, registrationDate: e.target.value })} required /></Field>
                <Field label={t.paymentStatus}>
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-white" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}>
                    <option value="Pending">{label.paymentStatus.Pending}</option><option value="Paid">{label.paymentStatus.Paid}</option>
                  </select>
                </Field>
                <Field label={t.paymentMethod}>
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-white" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}>
                    <option value="Cash">{label.paymentMethod.Cash}</option><option value="Tamara">{label.paymentMethod.Tamara}</option><option value="JeelPay">{label.paymentMethod.JeelPay}</option>
                  </select>
                </Field>
                <label className="flex items-center gap-3 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white">
                  <Checkbox checked={form.fileComplete} onCheckedChange={(checked) => setForm({ ...form, fileComplete: checked === true })} />
                  {t.fileComplete}
                </label>
                <div className="flex gap-2 sm:col-span-2">
                  <Button className="flex-1 bg-cyan-200 text-[#031844] hover:bg-white" type="submit" disabled={createStudent.isPending || updateStudent.isPending}>
                    <Save className="h-4 w-4" /> {form.id ? t.updateStudent : t.addStudent}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>{t.clear}</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="technical-panel text-white">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase">{t.students}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse text-sm">
                  <thead className="bg-white/10 text-xs uppercase tracking-[0.18em] text-cyan-100">
                    <tr>
                      {[t.name, t.id, t.school, t.grade, t.status, t.paymentStatus, t.paymentMethod, t.fileComplete, t.actions].map((header) => (
                        <th className="border border-white/10 px-3 py-3 text-start" key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.data?.map((student) => {
                      const next = nextStatus(student.status as Status);
                      return (
                        <tr key={student.id} className="border-b border-white/10 hover:bg-white/5">
                          <td className="px-3 py-3 font-semibold">{student.name}</td>
                          <td className="px-3 py-3 text-white/70">{student.studentId}</td>
                          <td className="px-3 py-3">{student.school}</td>
                          <td className="px-3 py-3">{student.grade}</td>
                          <td className="px-3 py-3"><StatusBadge status={student.status as Status} label={label.status[student.status as Status]} /></td>
                          <td className="px-3 py-3"><Badge variant={student.paymentStatus === "Paid" ? "default" : "secondary"}>{label.paymentStatus[student.paymentStatus as PaymentStatus]}</Badge></td>
                          <td className="px-3 py-3"><span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3" /> {label.paymentMethod[student.paymentMethod as PaymentMethod]}</span></td>
                          <td className="px-3 py-3">{student.fileComplete ? t.yes : t.no}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => setForm({
                                id: student.id,
                                studentId: student.studentId,
                                name: student.name,
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
                              })}>{t.edit}</Button>
                               {next ? <Button size="sm" className="bg-cyan-200 text-[#031844] hover:bg-white" onClick={() => updateStudent.mutate({ id: student.id, status: next })}>{t.progress} <ArrowRight className="h-3 w-3" /> {label.status[next]}</Button> : null}
                              <Button size="sm" variant="destructive" onClick={() => deleteStudent.mutate({ id: student.id })}><Trash2 className="h-3 w-3" /> {t.delete}</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!students.data?.length ? <div className="p-8 text-center text-white/70">{t.noData}</div> : null}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <Card className="technical-panel text-white">
            <CardHeader><CardTitle className="text-xl font-black uppercase">{t.seats}</CardTitle></CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); updateSeat.mutate(seatForm); }}>
                <Field label={t.school}><Input value={seatForm.school} onChange={(e) => setSeatForm({ ...seatForm, school: e.target.value })} required /></Field>
                <Field label={t.grade}><Input value={seatForm.grade} onChange={(e) => setSeatForm({ ...seatForm, grade: e.target.value })} required /></Field>
                <Field label={t.capacity}><Input type="number" min="0" value={seatForm.capacity} onChange={(e) => setSeatForm({ ...seatForm, capacity: Number(e.target.value) })} required /></Field>
                <Button className="bg-cyan-200 text-[#031844] hover:bg-white" type="submit">{t.saveSeat}</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="technical-panel text-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead className="bg-white/10 text-xs uppercase tracking-[0.18em] text-cyan-100">
                    <tr>{[t.school, t.grade, t.capacity, t.reserved, t.available, t.lowSeat].map((header: string) => <th className="border border-white/10 px-3 py-3 text-start" key={header}>{header}</th>)}</tr>
                  </thead>
                  <tbody>
                    {seats.data?.map((seat) => (
                      <tr key={`${seat.school}-${seat.grade}`} className={cn("border-b border-white/10", seat.lowSeatAlert && "bg-red-500/12")}>
                        <td className="px-3 py-3 font-semibold">{seat.school}</td>
                        <td className="px-3 py-3">{seat.grade}</td>
                        <td className="px-3 py-3">{seat.capacity}</td>
                        <td className="px-3 py-3">{seat.reserved}</td>
                        <td className="px-3 py-3 font-black text-cyan-100">{seat.available}</td>
                        <td className="px-3 py-3">{seat.lowSeatAlert ? <Badge variant="destructive">≤ 3</Badge> : <Badge variant="secondary">{t.ok}</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function StateMessage({ text }: { text: string }) {
  return <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/70">{text}</div>;
}

function StateMini({ text }: { text: string }) {
  return <p className="mt-3 rounded-md border border-white/10 bg-white/5 px-2 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white/70">{text}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/80">{label}</Label>
      {children}
    </div>
  );
}

function StatusBadge({ status, label }: { status: Status; label: string }) {
  const styles: Record<Status, string> = {
    Registered: "bg-slate-200 text-slate-950",
    Assessed: "bg-blue-200 text-blue-950",
    Passed: "bg-emerald-200 text-emerald-950",
    Enrolled: "bg-cyan-200 text-cyan-950",
  };
  return <span className={cn("rounded-sm px-2 py-1 text-xs font-black uppercase", styles[status])}>{label}</span>;
}
