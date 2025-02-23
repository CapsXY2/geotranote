import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import supabase from '../supabase';

interface Report {
  id: string;
  responsible_name: string;
  service_name: string;
  sector: string;
  car_removals: number;
  motorcycle_removals: number;
  created_at: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: reportsData, error: reportsError } = await supabase
          .from('geotranote_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (reportsError) throw reportsError;
        if (reportsData) setReports(reportsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Prepare data for service type distribution
  const serviceTypeData = reports.reduce((acc: { name: string; value: number }[], report) => {
    const existingService = acc.find(item => item.name === report.service_name);
    if (existingService) {
      existingService.value++;
    } else {
      acc.push({ name: report.service_name, value: 1 });
    }
    return acc;
  }, []);

  // Prepare data for removals by sector
  const removalsBySector = reports.reduce((acc: { sector: string; cars: number; motorcycles: number }[], report) => {
    const existingEntry = acc.find(item => item.sector === report.sector);
    if (existingEntry) {
      existingEntry.cars += report.car_removals;
      existingEntry.motorcycles += report.motorcycle_removals;
    } else {
      acc.push({
        sector: report.sector,
        cars: report.car_removals,
        motorcycles: report.motorcycle_removals,
      });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>Erro ao carregar os dados: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Serviço</CardTitle>
            <CardDescription>Quantidade de ocorrências por tipo de serviço</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remoções por Setor</CardTitle>
            <CardDescription>Quantidade de remoções de carros e motos por setor</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={removalsBySector}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="sector" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cars" name="Carros" fill="#0088FE" />
                <Bar dataKey="motorcycles" name="Motos" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Registros</CardTitle>
          <CardDescription>Registros mais recentes no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Responsável</th>
                  <th className="text-left p-2">Serviço</th>
                  <th className="text-left p-2">Setor</th>
                  <th className="text-right p-2">Carros</th>
                  <th className="text-right p-2">Motos</th>
                  <th className="text-right p-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map((report) => (
                  <tr key={report.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{report.responsible_name}</td>
                    <td className="p-2">{report.service_name}</td>
                    <td className="p-2">{report.sector}</td>
                    <td className="text-right p-2">{report.car_removals}</td>
                    <td className="text-right p-2">{report.motorcycle_removals}</td>
                    <td className="text-right p-2">{formatDate(report.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
