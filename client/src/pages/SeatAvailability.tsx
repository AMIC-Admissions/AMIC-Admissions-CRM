"use client";

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeatAvailabilitySkeleton } from "@/components/PageSkeletons";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

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

export default function SeatAvailability() {
  const user = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const t = translations[language];
  const isRTL = language === "ar";

  if (!user) return null;

  // Fetch real seat availability data from backend (using public procedure with fallback)
  const { data: seatData, isLoading, isError } = trpc.admin.getSeatAvailability.useQuery(
    undefined,
    { staleTime: 120_000, gcTime: 600_000 }
  );

  // Use real data from backend, or empty array if loading/error
  const allSeats = useMemo(() => {
    if (!seatData?.seats) return [];
    return (seatData.seats as any[]).map((seat: any) => ({
      school: seat.school,
      grade: seat.grade,
      section: seat.section || "Mixed",
      gender: seat.gender || "Mixed",
      capacity: seat.capacity || 0,
      reservedSeats: seat.reserved || 0,
      availableSeats: seat.available || 0,
      occupancyPercent: seat.occupancyPercent || 0,
    }));
  }, [seatData]);

  // Get unique schools, grades, and genders
  const uniqueSchools = useMemo(() => {
    return Array.from(new Set(allSeats.map(s => s.school))).sort();
  }, [allSeats]);

  const uniqueGrades = useMemo(() => {
    return Array.from(new Set(allSeats.map(s => s.grade))).sort();
  }, [allSeats]);

  const uniqueGenders = useMemo(() => {
    return Array.from(new Set(allSeats.map(s => s.gender))).sort();
  }, [allSeats]);

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
  }, [schoolFilter, gradeFilter, genderFilter, searchQuery, allSeats]);

  // Calculate totals from filtered data
  const totals = useMemo(() => {
    const capacity = filteredSeats.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const reserved = filteredSeats.reduce((sum, s) => sum + (s.reservedSeats || 0), 0);
    const available = capacity - reserved;
    return { capacity, reserved, available };
  }, [filteredSeats]);

  // Get status for a seat
  const getStatus = (seat: any) => {
    const occupancy = seat.capacity > 0 ? (seat.reservedSeats / seat.capacity) * 100 : 0;
    if (occupancy >= 100) return { label: t.full, color: "bg-red-500" };
    if (occupancy >= 80) return { label: t.alertLow, color: "bg-yellow-500" };
    return { label: t.available_seats, color: "bg-emerald-500" };
  };

  if (isLoading) {
    return <SeatAvailabilitySkeleton />;
  }

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

        {/* Seats Table */}
        <Card className="technical-panel text-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase">{t.sections}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isError ? (
              <div className="p-6 text-center text-red-400">
                <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
                <p>{t.error}</p>
              </div>
            ) : filteredSeats.length === 0 ? (
              <div className="p-6 text-center text-white/50">
                <p>{t.noData}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-t border-cyan-200/20 bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left font-black text-cyan-200">{t.school}</th>
                      <th className="px-4 py-3 text-left font-black text-cyan-200">{t.grade}</th>
                      <th className="px-4 py-3 text-left font-black text-cyan-200">{t.section}</th>
                      <th className="px-4 py-3 text-center font-black text-cyan-200">{t.capacity}</th>
                      <th className="px-4 py-3 text-center font-black text-yellow-200">{t.reserved}</th>
                      <th className="px-4 py-3 text-center font-black text-emerald-200">{t.available}</th>
                      <th className="px-4 py-3 text-center font-black text-white/75">{t.occupancy}</th>
                      <th className="px-4 py-3 text-center font-black text-white/75">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredSeats as any[]).map((seat: any, idx: number) => {
                      const status = getStatus(seat);
                      return (
                        <tr key={`${seat.school}-${seat.grade}-${idx}`} className="border-t border-cyan-200/10 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white font-medium">{String(seat.school)}</td>
                          <td className="px-4 py-3 text-white font-medium">{String(seat.grade)}</td>
                          <td className="px-4 py-3 text-white/75">{String(seat.section)}</td>
                          <td className="px-4 py-3 text-center text-cyan-200 font-bold">{Number(seat.capacity)}</td>
                          <td className="px-4 py-3 text-center text-yellow-200 font-bold">{Number(seat.reservedSeats)}</td>
                          <td className="px-4 py-3 text-center text-emerald-200 font-bold">{Number(seat.availableSeats)}</td>
                          <td className="px-4 py-3 text-center text-white/75">{Math.round(Number(seat.occupancyPercent))}%</td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`${status.color} text-white font-black`}>
                              {status.label}
                            </Badge>
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
