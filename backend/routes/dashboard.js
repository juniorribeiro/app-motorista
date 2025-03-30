
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Obter dados para o dashboard
router.get('/summary', async (req, res) => {
  const userId = req.userData.userId;
  const { period } = req.query;
  let dateFilter;
  
  // Determinar filtro de data baseado no período
  const today = new Date();
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Domingo como primeiro dia da semana
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  switch(period) {
    case 'week':
      dateFilter = `trip_date >= '${firstDayOfWeek.toISOString().split('T')[0]}'`;
      break;
    case 'month':
      dateFilter = `trip_date >= '${firstDayOfMonth.toISOString().split('T')[0]}'`;
      break;
    case 'day':
      dateFilter = `trip_date = '${today.toISOString().split('T')[0]}'`;
      break;
    default:
      dateFilter = `trip_date >= '${firstDayOfWeek.toISOString().split('T')[0]}'`; // Padrão: semana
  }
  
  try {
    // Obter resumo da atividade
    const [summary] = await db.query(
      `SELECT 
        SUM(earnings) as totalEarnings, 
        SUM(net_earnings) as totalNetEarnings,
        SUM(distance) as totalDistance, 
        SUM(time_worked_minutes) as totalMinutes,
        SUM(fuel_cost) as totalFuelCost,
        COUNT(*) as tripCount
      FROM trips 
      WHERE user_id = ? AND ${dateFilter}`,
      [userId]
    );
    
    // Obter dados para o gráfico
    const [chartData] = await db.query(
      `SELECT 
        trip_date as date, 
        SUM(earnings) as earnings, 
        SUM(fuel_cost) as expenses,
        SUM(net_earnings) as netEarnings,
        SUM(distance) as distance,
        SUM(time_worked_minutes) as minutes
      FROM trips 
      WHERE user_id = ? AND ${dateFilter}
      GROUP BY trip_date
      ORDER BY trip_date`,
      [userId]
    );
    
    // Obter viagens recentes
    const [recentTrips] = await db.query(
      `SELECT * FROM trips 
      WHERE user_id = ? 
      ORDER BY trip_date DESC, created_at DESC
      LIMIT 5`,
      [userId]
    );
    
    // Formatar dados para o frontend
    const formattedTrips = recentTrips.map(trip => {
      const hours = Math.floor(trip.time_worked_minutes / 60);
      const minutes = trip.time_worked_minutes % 60;
      
      return {
        id: trip.id,
        date: new Date(trip.trip_date).toLocaleDateString('pt-BR'),
        distance: trip.distance,
        earnings: trip.earnings,
        hours: `${hours}h ${minutes}m`,
        fuelCost: trip.fuel_cost,
        netEarnings: trip.net_earnings
      };
    });
    
    const formattedChartData = chartData.map(item => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      earnings: parseFloat(item.earnings),
      expenses: parseFloat(item.expenses),
      netEarnings: parseFloat(item.netEarnings),
      distance: parseFloat(item.distance),
      minutes: parseInt(item.minutes)
    }));
    
    // Calcular ganho por hora e por km médios
    const data = summary[0];
    const totalHours = data.totalMinutes / 60;
    const averageEarningsPerHour = totalHours > 0 ? data.totalNetEarnings / totalHours : 0;
    const averageEarningsPerKm = data.totalDistance > 0 ? data.totalNetEarnings / data.totalDistance : 0;
    
    const hours = Math.floor(data.totalMinutes / 60);
    const minutes = data.totalMinutes % 60;
    
    const dashboardData = {
      summary: {
        totalEarnings: parseFloat(data.totalEarnings || 0).toFixed(2),
        totalNetEarnings: parseFloat(data.totalNetEarnings || 0).toFixed(2),
        totalDistance: parseFloat(data.totalDistance || 0).toFixed(2),
        totalHoursWorked: `${hours}h ${minutes}m`,
        totalFuelCost: parseFloat(data.totalFuelCost || 0).toFixed(2),
        averageEarningsPerHour: averageEarningsPerHour.toFixed(2),
        averageEarningsPerKm: averageEarningsPerKm.toFixed(2),
        tripCount: data.tripCount || 0
      },
      chartData: formattedChartData,
      recentTrips: formattedTrips
    };
    
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ message: 'Erro ao buscar dados do dashboard' });
  }
});

module.exports = router;
