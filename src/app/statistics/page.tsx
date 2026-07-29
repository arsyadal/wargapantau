import { prisma } from "@/lib/prisma";
import { StatsChart } from "@/components/stats-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Shield, TrendingUp } from "lucide-react";

async function getStatistics() {
    try {
        // Get status distribution
        const statusCounts = await prisma.ticket.groupBy({
            by: ["status"],
            _count: { status: true },
        });

        const statusDistribution = statusCounts.map((item) => ({
            status: item.status,
            count: item._count.status,
        }));

        // Get department integrity (for government users)
        const departmentStats = await prisma.user.findMany({
            where: { role: "GOVERNMENT", department: { not: null } },
            select: {
                department: true,
                _count: {
                    select: {
                        statusChanges: true,
                    },
                },
            },
        });

        // Calculate basic metrics
        const totalTickets = await prisma.ticket.count();
        const closedTickets = await prisma.ticket.count({ where: { status: "CLOSED" } });
        const disputedTickets = await prisma.ticket.count({ where: { status: "DISPUTED" } });
        const totalVerifications = await prisma.verification.count();
        const satisfiedVerifications = await prisma.verification.count({
            where: { isSatisfied: true },
        });

        const overallIntegrityRate = (closedTickets + disputedTickets) > 0
            ? Math.round((closedTickets / (closedTickets + disputedTickets)) * 100)
            : 100;

        const verificationSatisfactionRate = totalVerifications > 0
            ? Math.round((satisfiedVerifications / totalVerifications) * 100)
            : 100;

        return {
            statusDistribution,
            totalTickets,
            closedTickets,
            disputedTickets,
            totalVerifications,
            overallIntegrityRate,
            verificationSatisfactionRate,
            departmentStats,
        };
    } catch (error) {
        console.error("Error fetching statistics:", error);
        return {
            statusDistribution: [],
            totalTickets: 0,
            closedTickets: 0,
            disputedTickets: 0,
            totalVerifications: 0,
            overallIntegrityRate: 0,
            verificationSatisfactionRate: 0,
            departmentStats: [],
        };
    }
}

export default async function StatisticsPage() {
    const stats = await getStatistics();

    return (
        <div className="min-h-screen py-8 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                        Dashboard Transparansi
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Pantau tingkat integritas dan kinerja penyelesaian laporan secara publik
                    </p>
                </div>

                {/* Key Metrics */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Laporan</p>
                                    <p className="text-4xl font-bold">{stats.totalTickets}</p>
                                </div>
                                <BarChart3 className="h-12 w-12 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Tingkat Integritas</p>
                                    <p className="text-4xl font-bold">{stats.overallIntegrityRate}%</p>
                                </div>
                                <Shield className="h-12 w-12 text-green-200" />
                            </div>
                            <p className="text-green-100 text-xs mt-2">
                                {stats.closedTickets} selesai vs {stats.disputedTickets} sengketa
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Kepuasan Verifikasi</p>
                                    <p className="text-4xl font-bold">{stats.verificationSatisfactionRate}%</p>
                                </div>
                                <TrendingUp className="h-12 w-12 text-purple-200" />
                            </div>
                            <p className="text-purple-100 text-xs mt-2">
                                Dari {stats.totalVerifications} verifikasi
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <StatsChart data={stats} />

                {/* Transparency Notice */}
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Tentang Transparansi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-700">
                        <p className="mb-2">
                            <strong>Tingkat Integritas</strong> dihitung dari rasio laporan yang ditutup dengan puas
                            dibandingkan total laporan yang sudah diverifikasi (selesai + sengketa).
                        </p>
                        <p>
                            <strong>Kepuasan Verifikasi</strong> menunjukkan persentase warga yang puas dengan
                            penyelesaian masalah mereka berdasarkan verifikasi yang diberikan.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
