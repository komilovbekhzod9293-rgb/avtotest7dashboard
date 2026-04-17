export const managers = [
  {
    id: "ziyoda",
    name: "Ziyoda",
    role: "Senior sotuv menejeri",
    calls: 100,
    sales: 40,
    target: 50,
    revenue: 28_400_000,
    trend: "up" as const,
    delta: 12.4,
    weekly: [
      { day: "Du", calls: 18, sales: 7 },
      { day: "Se", calls: 22, sales: 9 },
      { day: "Ch", calls: 15, sales: 5 },
      { day: "Pa", calls: 19, sales: 8 },
      { day: "Ju", calls: 14, sales: 6 },
      { day: "Sh", calls: 8, sales: 3 },
      { day: "Ya", calls: 4, sales: 2 },
    ],
    notes: [
      { time: "10:24", text: "Mijoz narxni qimmat deb topdi — chegirma taklif qilindi." },
      { time: "12:10", text: "Ro'yxatdan o'tdi: Ali Karimov, B toifa." },
      { time: "15:48", text: "Qayta qo'ng'iroq kerak — ertaga 11:00." },
    ],
  },
  {
    id: "maxsud",
    name: "Maxsud",
    role: "Sotuv menejeri",
    calls: 86,
    sales: 28,
    target: 45,
    revenue: 19_800_000,
    trend: "down" as const,
    delta: -3.1,
    weekly: [
      { day: "Du", calls: 14, sales: 5 },
      { day: "Se", calls: 16, sales: 6 },
      { day: "Ch", calls: 12, sales: 4 },
      { day: "Pa", calls: 15, sales: 5 },
      { day: "Ju", calls: 13, sales: 3 },
      { day: "Sh", calls: 10, sales: 3 },
      { day: "Ya", calls: 6, sales: 2 },
    ],
    notes: [
      { time: "09:50", text: "Mijoz javob bermadi — keyinroq urinish." },
      { time: "14:02", text: "Yangi mijoz: Sanjar, A toifaga qiziqdi." },
    ],
  },
  {
    id: "madina",
    name: "Madina",
    role: "Sotuv menejeri",
    calls: 92,
    sales: 35,
    target: 45,
    revenue: 24_100_000,
    trend: "up" as const,
    delta: 6.8,
    weekly: [
      { day: "Du", calls: 15, sales: 6 },
      { day: "Se", calls: 18, sales: 7 },
      { day: "Ch", calls: 14, sales: 5 },
      { day: "Pa", calls: 16, sales: 6 },
      { day: "Ju", calls: 13, sales: 5 },
      { day: "Sh", calls: 9, sales: 4 },
      { day: "Ya", calls: 7, sales: 2 },
    ],
    notes: [
      { time: "11:15", text: "Mijoz to'lovni bo'lib to'lash so'radi." },
      { time: "16:30", text: "Yopildi: Dilshod Rahimov, B toifa." },
    ],
  },
  {
    id: "oysha",
    name: "Oysha",
    role: "Junior menejer",
    calls: 74,
    sales: 22,
    target: 40,
    revenue: 15_200_000,
    trend: "up" as const,
    delta: 2.3,
    weekly: [
      { day: "Du", calls: 12, sales: 4 },
      { day: "Se", calls: 14, sales: 5 },
      { day: "Ch", calls: 11, sales: 3 },
      { day: "Pa", calls: 13, sales: 4 },
      { day: "Ju", calls: 10, sales: 3 },
      { day: "Sh", calls: 8, sales: 2 },
      { day: "Ya", calls: 6, sales: 1 },
    ],
    notes: [
      { time: "10:05", text: "Yangi lid: Madina, AKP toifa." },
      { time: "13:40", text: "Mijoz keyinroq qaror qilishini aytdi." },
    ],
  },
];

export const financeMonthly = [
  { month: "Yan", revenue: 82, expenses: 41, profit: 41 },
  { month: "Fev", revenue: 91, expenses: 44, profit: 47 },
  { month: "Mar", revenue: 88, expenses: 46, profit: 42 },
  { month: "Apr", revenue: 104, expenses: 48, profit: 56 },
  { month: "May", revenue: 112, expenses: 51, profit: 61 },
  { month: "Iyn", revenue: 118, expenses: 53, profit: 65 },
  { month: "Iyl", revenue: 126, expenses: 55, profit: 71 },
  { month: "Avg", revenue: 134, expenses: 58, profit: 76 },
];

export const expenseBreakdown = [
  { name: "Maoshlar", value: 42, color: "hsl(222 47% 11%)" },
  { name: "Ijara", value: 18, color: "hsl(220 9% 46%)" },
  { name: "Marketing", value: 15, color: "hsl(230 70% 55%)" },
  { name: "Yoqilg'i", value: 12, color: "hsl(38 92% 50%)" },
  { name: "Boshqa", value: 13, color: "hsl(220 13% 78%)" },
];

export const students = [
  { id: 1, name: "Akmal Yusupov", category: "B", teacher: "Maxsud", attendance: 92, status: "active", exam: "today" },
  { id: 2, name: "Dilnoza Karimova", category: "B", teacher: "Ziyoda", attendance: 88, status: "passed", exam: null },
  { id: 3, name: "Sardor Aliev", category: "A", teacher: "Madina", attendance: 76, status: "active", exam: "today" },
  { id: 4, name: "Madina Toshpulatova", category: "B", teacher: "Oysha", attendance: 95, status: "passed", exam: null },
  { id: 5, name: "Bekzod Rahimov", category: "C", teacher: "Maxsud", attendance: 64, status: "warning", exam: null },
  { id: 6, name: "Sevara Nurmatova", category: "B", teacher: "Ziyoda", attendance: 89, status: "active", exam: "tomorrow" },
  { id: 7, name: "Jasur Kamolov", category: "B", teacher: "Madina", attendance: 81, status: "active", exam: null },
  { id: 8, name: "Nilufar Saidova", category: "A", teacher: "Ziyoda", attendance: 97, status: "passed", exam: null },
];

export const teachers = ["Hammasi", "Ziyoda", "Maxsud", "Madina", "Oysha"];

export const employees = [
  { name: "Ziyoda Karimova", role: "Senior menejer", checkIn: "08:52", checkOut: "18:10", efficiency: 94, progress: 12, sales: 40 },
  { name: "Maxsud Tursunov", role: "Menejer", checkIn: "09:05", checkOut: "18:00", efficiency: 71, progress: -3, sales: 28 },
  { name: "Madina Yo'ldosheva", role: "Menejer", checkIn: "08:48", checkOut: "18:15", efficiency: 86, progress: 7, sales: 35 },
  { name: "Oysha Soliyeva", role: "Junior menejer", checkIn: "09:12", checkOut: "17:55", efficiency: 68, progress: 2, sales: 22 },
  { name: "Bobur Ergashev", role: "Instruktor", checkIn: "07:30", checkOut: "19:20", efficiency: 89, progress: 5, sales: 0 },
  { name: "Lola Xolmatova", role: "Administrator", checkIn: "08:30", checkOut: "18:00", efficiency: 92, progress: 4, sales: 0 },
];
