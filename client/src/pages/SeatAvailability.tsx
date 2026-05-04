import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    selectSchool: "All Schools",
    selectGrade: "All Grades",
    selectGender: "All Genders",
    male: "Male",
    female: "Female",
    mixed: "Mixed",
    both: "Both",
    sections: "Sections",
    section: "Section",
    totalCapacity: "Total Capacity",
    totalReserved: "Total Reserved",
    totalAvailable: "Total Available",
    alertFull: "⚠️ Seats Full",
    alertLow: "⚠️ Low Availability",
    allClasses: "All Classes",
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
    selectSchool: "جميع المدارس",
    selectGrade: "جميع الصفوف",
    selectGender: "جميع الأجناس",
    male: "ذكر",
    female: "أنثى",
    mixed: "مختلط",
    both: "كلاهما",
    sections: "الفصول",
    section: "الفصل",
    totalCapacity: "إجمالي السعة",
    totalReserved: "إجمالي المحجوز",
    totalAvailable: "إجمالي المتاح",
    alertFull: "⚠️ المقاعد ممتلئة",
    alertLow: "⚠️ توفر منخفض",
    allClasses: "جميع الفصول",
  },
};

// Fallback seat master data
const FALLBACK_SEATS = [
  { id: 1, school: "Kids Gate", grade: "Pre-KG", section: "Mixed", gender: "Mixed", capacity: 30, reservedSeats: 0 },
  { id: 2, school: "Kids Gate", grade: "KG", section: "Mixed", gender: "Mixed", capacity: 35, reservedSeats: 0 },
  { id: 3, school: "Kids Gate", grade: "Grade 1", section: "A", gender: "Mixed", capacity: 25, reservedSeats: 0 },
  { id: 4, school: "Kids Gate", grade: "Grade 1", section: "B", gender: "Mixed", capacity: 25, reservedSeats: 0 },
  { id: 5, school: "Kids Gate", grade: "Grade 2", section: "A", gender: "Mixed", capacity: 28, reservedSeats: 0 },
  { id: 6, school: "Kids Gate", grade: "Grade 2", section: "B", gender: "Mixed", capacity: 28, reservedSeats: 0 },
  { id: 7, school: "Kids Gate", grade: "Grade 3", section: "A", gender: "Mixed", capacity: 30, reservedSeats: 0 },
  { id: 8, school: "Kids Gate", grade: "Grade 3", section: "B", gender: "Mixed", capacity: 30, reservedSeats: 0 },
  { id: 9, school: "AMIS Girls", grade: "Pre-KG", section: "A", gender: "Female", capacity: 25, reservedSeats: 0 },
  { id: 10, school: "AMIS Girls", grade: "Pre-KG", section: "B", gender: "Female", capacity: 25, reservedSeats: 0 },
  { id: 11, school: "AMIS Girls", grade: "KG", section: "A", gender: "Female", capacity: 30, reservedSeats: 0 },
  { id: 12, school: "AMIS Girls", grade: "KG", section: "B", gender: "Female", capacity: 30, reservedSeats: 0 },
  { id: 13, school: "AMIS Girls", grade: "Grade 1", section: "A", gender: "Female", capacity: 28, reservedSeats: 0 },
  { id: 14, school: "AMIS Girls", grade: "Grade 1", section: "B", gender: "Female", capacity: 28, reservedSeats: 0 },
  { id: 15, school: "AMIS Girls", grade: "Grade 2", section: "A", gender: "Female", capacity: 32, reservedSeats: 0 },
  { id: 16, school: "AMIS Girls", grade: "Grade 2", section: "B", gender: "Female", capacity: 32, reservedSeats: 0 },
];

export default function SeatAvailability() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const t = translations[language];
  const isRTL = language === "ar";

  if (!user) return null;

  // Use fallback seat data
  const allSeats = FALLBACK_SEATS;

  // Get unique schools, grades, and genders
  const uniqueSchools = useMemo(() => {
    return Array.from(new Set(allSeats.map(s => s.school))).sort();
  }, []);

  const uniqueGrades = useMemo(() => {
    return Array.from(new Set(allSeats.map(s => s.grade))).sort();
  }, []);

  const uniqueGenders = useMemo(() => {
    return Array.from(new Set(allSeats.map(s => s.gender))).sort();
  }, []);

  // Filter seat data
  const filteredSeats = useMemo(() => {
    let result = [...allSeats];

    if (schoolFilter) {
      result = result.filter(s => s.school === schoolFilter);
    }
    if (gradeFilter) {
      result = result.filter(s => s.grade === gradeFilter);
    }
    if (genderFilter) {
      result = result.filter(s => s.gender === genderFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.school.toLowerCase().includes(query) ||
        s.grade.toLowerCase().includes(query) ||
        s.section.toLowerCase().includes(query)
      );
    }

    return result;
  }, [schoolFilter, gradeFilter, genderFilter, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    const capacity = filteredSeats.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const reserved = filteredSeats.reduce((sum, s) => sum + (s.reservedSeats || 0), 0);
    const available = capacity - reserved;
    return { capacity, reserved, available };
  }, [filteredSeats]);

  return (
    <div className="blueprint-bg min-h-screen">
      <div className="container space-y-6 py-6 sm:py-8">
        {/* Header */}
        <section className="technical-panel dimension-frame overflow-hidden rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                {t.seatAvailability}
              </h1>
              <p className="mt-2 text-base font-medium text-white/75">
                {t.allClasses}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
                className="border-cyan-200/40 text-white"
              >
                EN
              </Button>
              <Button
                variant={language === "ar" ? "default" : "outline"}
                onClick={() => setLanguage("ar")}
                className="border-cyan-200/40 text-white"
              >
                AR
              </Button>
            </div>
          </div>
        </section>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="technical-panel text-white">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-white/75">{t.totalCapacity}</div>
              <div className="text-3xl font-black text-cyan-200">{totals.capacity}</div>
            </CardContent>
          </Card>
          <Card className="technical-panel text-white">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-white/75">{t.totalReserved}</div>
              <div className="text-3xl font-black text-yellow-200">{totals.reserved}</div>
            </CardContent>
          </Card>
          <Card className="technical-panel text-white">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-white/75">{t.totalAvailable}</div>
              <div className="text-3xl font-black text-emerald-200">{totals.available}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="technical-panel text-white">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase">{t.filters}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-white/75">{t.school}</label>
                <Select value={schoolFilter || "all"} onValueChange={(v) => setSchoolFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="border-cyan-200/30 bg-white/5 text-white">
                    <SelectValue placeholder={t.selectSchool} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.selectSchool}</SelectItem>
                    {uniqueSchools.map((school) => (
                      <SelectItem key={school} value={school}>{school}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-white/75">{t.grade}</label>
                <Select value={gradeFilter || "all"} onValueChange={(v) => setGradeFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="border-cyan-200/30 bg-white/5 text-white">
                    <SelectValue placeholder={t.selectGrade} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.selectGrade}</SelectItem>
                    {uniqueGrades.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-white/75">{t.gender}</label>
                <Select value={genderFilter || "all"} onValueChange={(v) => setGenderFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="border-cyan-200/30 bg-white/5 text-white">
                    <SelectValue placeholder={t.selectGender} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.selectGender}</SelectItem>
                    {uniqueGenders.map((gender) => (
                      <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-white/75">{t.search}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
                  <Input
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-cyan-200/30 bg-white/5 pl-9 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes Table */}
        <Card className="technical-panel text-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase">{t.allClasses}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSeats.length === 0 ? (
              <div className="p-8 text-center text-white/75">{t.noData}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-200/20 bg-white/5">
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">{t.school}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">{t.grade}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">{t.section}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">{t.gender}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">{t.capacity}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">{t.reserved}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">{t.available}</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSeats.map((seat, idx) => {
                      const available = (seat.capacity || 0) - (seat.reservedSeats || 0);
                      const isFull = available <= 0;
                      const isLow = available > 0 && available <= 3;
                      return (
                        <tr
                          key={`${seat.school}-${seat.grade}-${seat.section}`}
                          className={`border-b border-cyan-200/10 ${idx % 2 === 0 ? "bg-white/2" : "bg-transparent"}`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-white">{seat.school}</td>
                          <td className="px-6 py-4 text-sm text-white/75">{seat.grade}</td>
                          <td className="px-6 py-4 text-sm text-white/75">{seat.section}</td>
                          <td className="px-6 py-4 text-sm text-white/75">{seat.gender}</td>
                          <td className="px-6 py-4 text-sm font-medium text-cyan-200">{seat.capacity}</td>
                          <td className="px-6 py-4 text-sm font-medium text-yellow-200">{seat.reservedSeats || 0}</td>
                          <td className="px-6 py-4 text-sm font-medium text-emerald-200">{available}</td>
                          <td className="px-6 py-4 text-sm">
                            {isFull ? (
                              <Badge className="bg-red-200/20 text-red-200">{t.full}</Badge>
                            ) : isLow ? (
                              <Badge className="bg-yellow-200/20 text-yellow-200">{t.alertLow}</Badge>
                            ) : (
                              <Badge className="bg-emerald-200/20 text-emerald-200">{t.available_seats}</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
