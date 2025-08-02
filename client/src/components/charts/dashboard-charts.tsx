import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardMetrics {
  completedInstallations: number;
  pendingInstallations: number;
  openTickets: number;
  totalBudget: number;
  monthlyInstallations: number[];
  ticketsByStatus: { open: number; resolved: number };
}

interface DashboardChartsProps {
  metrics: DashboardMetrics;
}

export default function DashboardCharts({ metrics }: DashboardChartsProps) {
  const monthlyData = [
    { month: "Jan", installations: metrics.monthlyInstallations[0] || 0 },
    { month: "Fev", installations: metrics.monthlyInstallations[1] || 0 },
    { month: "Mar", installations: metrics.monthlyInstallations[2] || 0 },
    { month: "Abr", installations: metrics.monthlyInstallations[3] || 0 },
    { month: "Mai", installations: metrics.monthlyInstallations[4] || 0 },
    { month: "Jun", installations: metrics.monthlyInstallations[5] || 0 },
  ];

  const ticketData = [
    { name: "Abertos", value: metrics.ticketsByStatus.open, color: "#FF9800" },
    { name: "Resolvidos", value: metrics.ticketsByStatus.resolved, color: "#4CAF50" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Instalações por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="installations" 
                stroke="hsl(207, 90%, 54%)" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Status dos Chamados</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
