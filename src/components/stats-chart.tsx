"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsData {
    statusDistribution: { status: string; count: number }[];
    departmentIntegrity?: { department: string; integrityRate: number; totalTickets: number }[];
    monthlyTickets?: { month: string; created: number; resolved: number; disputed: number }[];
}

const COLORS = {
    OPEN: "#3b82f6",
    IN_PROGRESS: "#eab308",
    REVIEWING: "#a855f7",
    CLOSED: "#22c55e",
    DISPUTED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
    OPEN: "Menunggu",
    IN_PROGRESS: "Dalam Proses",
    REVIEWING: "Ditinjau",
    CLOSED: "Selesai",
    DISPUTED: "Disengketakan",
};

export function StatsChart({ data }: { data: StatsData }) {
    const statusData = data.statusDistribution.map((item) => ({
        ...item,
        name: STATUS_LABELS[item.status] || item.status,
        fill: COLORS[item.status as keyof typeof COLORS] || "#6b7280",
    }));

    const totalTickets = statusData.reduce((acc, item) => acc + item.count, 0);
    const closedTickets = data.statusDistribution.find((d) => d.status === "CLOSED")?.count || 0;
    const disputedTickets = data.statusDistribution.find((d) => d.status === "DISPUTED")?.count || 0;
    const integrityRate = totalTickets > 0
        ? Math.round((closedTickets / (closedTickets + disputedTickets || 1)) * 100)
        : 0;

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Overview Cards */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ringkasan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">{totalTickets}</div>
                            <div className="text-sm text-gray-600">Total Laporan</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600">{closedTickets}</div>
                            <div className="text-sm text-gray-600">Selesai</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-3xl font-bold text-red-600">{disputedTickets}</div>
                            <div className="text-sm text-gray-600">Disengketakan</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600">{integrityRate}%</div>
                            <div className="text-sm text-gray-600">Integritas</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Distribution Pie Chart */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Distribusi Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="count"
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Department Integrity Chart */}
            {data.departmentIntegrity && data.departmentIntegrity.length > 0 && (
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Integritas per Departemen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.departmentIntegrity} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis type="category" dataKey="department" width={150} />
                                    <Tooltip
                                        formatter={(value) => [`${value ?? 0}%`, "Tingkat Integritas"]}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="integrityRate"
                                        name="Tingkat Integritas"
                                        fill="#3b82f6"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
