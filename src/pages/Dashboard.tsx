import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import supabase from '../supabase';

interface Report {
  id: string;
  service_name: string;
  car_removals: number;
  motorcycle_removals: number;
  total_approaches: number;
  created_at: string;
}

interface Infraction {
  quantity: number;
  report_uid: string;
}

type ServiceType = 'ordinario' | 'operacao' | 'ras' | 'all';

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType>('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      let reportsQuery = supabase
        .from('geotranote_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedService !== 'all') {
        reportsQuery = reportsQuery.eq('service_name', selectedService);
      }

      if (dateRange.start) {
        reportsQuery = reportsQuery.gte('created_at', dateRange.start);
      }

      if (dateRange.end) {
        reportsQuery = reportsQuery.lte('created_at', dateRange.end + 'T23:59:59');
      }

      const { data: reportsData, error: reportsError } = await reportsQuery;

      if (reportsError) throw reportsError;
      
      if (reportsData) {
        setReports(reportsData);
        
        // Get all report UIDs for the filtered reports
        const reportUids = reportsData.map(report => report.id).filter(id => id !== undefined);
        
        // Only fetch infractions if there are matching reports
        if (reportUids.length > 0) {
          const { data: infractionsData, error: infractionsError } = await supabase
            .from('infractions')
            .select('quantity, report_uid')
            .in('report_uid', reportUids);

          if (infractionsError) throw infractionsError;
          if (infractionsData) setInfractions(infractionsData);
        } else {
          // If no reports found, set infractions to empty array
          setInfractions([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedService, dateRange]);

  const totalInfractions = infractions.reduce((sum, inf) => sum + inf.quantity, 0);
  const totalRemovals = reports.reduce((sum, report) => sum + report.car_removals + report.motorcycle_removals, 0);
  const totalCarRemovals = reports.reduce((sum, report) => sum + report.car_removals, 0);
  const totalMotorcycleRemovals = reports.reduce((sum, report) => sum + report.motorcycle_removals, 0);
  const totalApproaches = reports.reduce((sum, report) => sum + report.total_approaches, 0);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Serviço
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value as ServiceType)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos</option>
              <option value="ordinario">Ordinário</option>
              <option value="operacao">Operação</option>
              <option value="ras">RAS</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Abordagens</CardTitle>
            <CardDescription>Número total de abordagens realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-indigo-600">{totalApproaches}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Infrações</CardTitle>
            <CardDescription>Quantidade total de infrações registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{totalInfractions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Remoções</CardTitle>
            <CardDescription>Soma de todas as remoções</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{totalRemovals}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remoções de Carros</CardTitle>
            <CardDescription>Total de carros removidos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">{totalCarRemovals}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remoções de Motos</CardTitle>
            <CardDescription>Total de motos removidas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-600">{totalMotorcycleRemovals}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}