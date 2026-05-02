import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const translations = {
  en: {
    seatAvailability: "Seat Availability",
    filters: "Filters",
    school: "School",
    grade: "Grade",
    gender: "Gender",
    search: "Search",
    capacity: "Capacity",
    reserved: "Reserved",
    available: "Available",
    occupancy: "Occupancy %",
    status: "Status",
    full: "Full",
    available_seats: "Available",
    loading: "Loading...",
    error: "Error loading data",
    noData: "No data available",
    selectSchool: "Select school",
    selectGrade: "Select grade",
    selectGender: "Select gender",
    male: "Male",
    female: "Female",
    both: "Both",
    sections: "Sections",
    section: "Section",
    totalCapacity: "Total Capacity",
    totalReserved: "Total Reserved",
    totalAvailable: "Total Available",
    alertFull: "⚠️ Seats Full",
    alertLow: "⚠️ Low Availability",
  },
  ar: {
    seatAvailability: "توفر المقاعد",
    filters: "المرشحات",
    school: "المدرسة",
    grade: "الصف",
    gender: "الجنس",
    search: "بحث",
    capacity: "السعة",
    reserved: "محجوز",
    available: "متاح",
    occupancy: "نسبة الاشغال",
    status: "الحالة",
    full: "ممتلئ",
    available_seats: "متاح",
    loading: "جاري التحميل...",
    error: "خطأ في تحميل البيانات",
    noData: "لا توجد بيانات",
    selectSchool: "اختر المدرسة",
    selectGrade: "اختر الصف",
    selectGender: "اختر الجنس",
    male: "ذكر",
    female: "أنثى",
    both: "كلاهما",
    sections: "الفصول",
    section: "الفصل",
    totalCapacity: "إجمالي السعة",
    totalReserved: "إجمالي المحجوز",
    totalAvailable: "إجمالي المتاح",
    alertFull: "⚠️ المقاعد ممتلئة",
    alertLow: "⚠️ توفر منخفض",
  },
};

export default function SeatAvailability() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [school, setSchool] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [gender, setGender] = useState<string>("");

  const t = translations[language];

  const filterOptions = trpc.admissions.getFilterOptions.useQuery(undefined);
        const seatAvailability = trpc.admissions.getSeatAvailability.useQuery(
    school && grade ? { school, grade, gender: gender === "all" ? undefined : gender } : { school: "", grade: "" }
  );

  const isRTL = language === "ar";

  if (!user) return null;

  const occupancyPercent = seatAvailability.data
    ? Math.round(((seatAvailability.data.reserved || 0) / (seatAvailability.data.capacity || 1)) * 100)
    : 0;

  const getStatusBadge = () => {
    if (!seatAvailability.data) return null;
    if (seatAvailability.data.available <= 0) {
      return <Badge variant="destructive">{t.alertFull}</Badge>;
    }
    if (seatAvailability.data.available <= 3) {
      return <Badge variant="secondary">{t.alertLow}</Badge>;
    }
    return <Badge variant="outline">{t.available_seats}</Badge>;
  };

  return (
    <div className={cn("min-h-screen p-4 md:p-6", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-black text-white uppercase">{t.seatAvailability}</h1>
          <Button
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="bg-cyan-200 text-[#031844] hover:bg-white"
          >
            {language === "en" ? "العربية" : "English"}
          </Button>
        </div>

        {/* Filters */}
        <Card className="technical-panel text-white mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase">{t.filters}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">{t.school}</label>
                <Select value={school} onValueChange={setSchool}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder={t.selectSchool} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.data?.schools.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">{t.grade}</label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder={t.selectGrade} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.data?.grades.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">{t.gender}</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder={t.selectGender} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.both}</SelectItem>
                    <SelectItem value="Male">{t.male}</SelectItem>
                    <SelectItem value="Female">{t.female}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {school && grade && (
          <>
            {seatAvailability.isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-cyan-200" size={32} />
              </div>
            ) : seatAvailability.error ? (
              <Card className="technical-panel text-white mb-6 border-red-500/30 bg-red-500/5">
                <CardContent className="pt-6 flex items-center gap-3">
                  <AlertCircle className="text-red-400" size={20} />
                  <span>{t.error}</span>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="technical-panel text-white">
                    <CardContent className="pt-6">
                      <div className="text-xs uppercase tracking-[0.15em] text-cyan-100 mb-2">{t.totalCapacity}</div>
                      <div className="text-3xl font-black text-white">{seatAvailability.data?.capacity || 0}</div>
                    </CardContent>
                  </Card>

                  <Card className="technical-panel text-white">
                    <CardContent className="pt-6">
                      <div className="text-xs uppercase tracking-[0.15em] text-cyan-100 mb-2">{t.totalReserved}</div>
                      <div className="text-3xl font-black text-white">{seatAvailability.data?.reserved || 0}</div>
                    </CardContent>
                  </Card>

                  <Card className="technical-panel text-white">
                    <CardContent className="pt-6">
                      <div className="text-xs uppercase tracking-[0.15em] text-cyan-100 mb-2">{t.totalAvailable}</div>
                      <div className="text-3xl font-black text-cyan-200">{seatAvailability.data?.available || 0}</div>
                    </CardContent>
                  </Card>

                  <Card className="technical-panel text-white">
                    <CardContent className="pt-6">
                      <div className="text-xs uppercase tracking-[0.15em] text-cyan-100 mb-2">{t.occupancy}</div>
                      <div className="text-3xl font-black text-white">{occupancyPercent}%</div>
                      <div className="mt-2">{getStatusBadge()}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sections Table */}
                {seatAvailability.data?.sections && seatAvailability.data.sections.length > 0 && (
                  <Card className="technical-panel text-white">
                    <CardHeader>
                      <CardTitle className="text-lg font-black uppercase">{t.sections}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] border-collapse text-sm">
                          <thead className="bg-white/10 text-xs uppercase tracking-[0.18em] text-cyan-100">
                            <tr>
                              <th className="border border-white/10 px-4 py-3 text-start">{t.section}</th>
                              <th className="border border-white/10 px-4 py-3 text-start">{t.capacity}</th>
                              <th className="border border-white/10 px-4 py-3 text-start">{t.reserved}</th>
                              <th className="border border-white/10 px-4 py-3 text-start">{t.available}</th>
                              <th className="border border-white/10 px-4 py-3 text-start">{t.status}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {seatAvailability.data.sections.map((section: any) => {
                              const available = (section.capacity || 0) - (section.reservedSeats || 0);
                              return (
                                <tr
                                  key={`${section.school}-${section.grade}-${section.section}`}
                                  className={cn("border-b border-white/10", available <= 3 && "bg-red-500/12")}
                                >
                                  <td className="px-4 py-3 font-semibold">{section.section}</td>
                                  <td className="px-4 py-3">{section.capacity}</td>
                                  <td className="px-4 py-3">{section.reservedSeats}</td>
                                  <td className="px-4 py-3 font-black text-cyan-100">{available}</td>
                                  <td className="px-4 py-3">
                                    {available <= 0 ? (
                                      <Badge variant="destructive">{t.full}</Badge>
                                    ) : available <= 3 ? (
                                      <Badge variant="secondary">{t.alertLow}</Badge>
                                    ) : (
                                      <Badge variant="outline">{t.available_seats}</Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {(!school || !grade) && (
          <Card className="technical-panel text-white border-cyan-200/30 bg-cyan-200/5">
            <CardContent className="pt-6 text-center">
              <p className="text-cyan-100">{t.noData}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
