
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Adicionar novo registro de viagem
router.post('/', async (req, res) => {
  const {
    date,
    distance,
    fuelConsumption,
    fuelPrice,
    startTime,
    endTime,
    earnings
  } = req.body;
  const userId = req.userData.userId;

  try {
    // Calcular valores adicionais
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const distanceNum = parseFloat(distance);
    const fuelConsumptionNum = parseFloat(fuelConsumption);
    const fuelPriceNum = parseFloat(fuelPrice);
    const earningsNum = parseFloat(earnings);

    // Calcular litros usados e custo combustível
    const litersUsed = distanceNum / fuelConsumptionNum;
    const fuelCost = litersUsed * fuelPriceNum;

    // Calcular tempo trabalhado em minutos
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    let workedMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (workedMinutes < 0) workedMinutes += 24 * 60; // Se passar da meia-noite

    // Calcular ganho líquido
    const netEarnings = earningsNum - fuelCost;

    // Inserir no banco de dados
    const [result] = await db.query(
      `INSERT INTO trips 
      (user_id, trip_date, distance, fuel_consumption, fuel_price, start_time, 
       end_time, earnings, liters_used, fuel_cost, time_worked_minutes, net_earnings) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, formattedDate, distanceNum, fuelConsumptionNum, fuelPriceNum, startTime, 
       endTime, earningsNum, litersUsed, fuelCost, workedMinutes, netEarnings]
    );

    res.status(201).json({
      message: 'Viagem registrada com sucesso',
      tripId: result.insertId,
      calculations: {
        litersUsed,
        fuelCost,
        timeWorked: `${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m`,
        netEarnings,
        earningsPerKm: netEarnings / distanceNum,
        earningsPerHour: netEarnings / (workedMinutes / 60)
      }
    });
  } catch (error) {
    console.error('Erro ao registrar viagem:', error);
    res.status(500).json({ message: 'Erro ao registrar viagem' });
  }
});

// Obter todas as viagens do usuário
router.get('/', async (req, res) => {
  const userId = req.userData.userId;
  
  try {
    const [trips] = await db.query(
      `SELECT * FROM trips WHERE user_id = ? ORDER BY trip_date DESC`,
      [userId]
    );
    
    // Formatar dados para o frontend
    const formattedTrips = trips.map(trip => {
      const hours = Math.floor(trip.time_worked_minutes / 60);
      const minutes = trip.time_worked_minutes % 60;
      
      return {
        id: trip.id,
        date: new Date(trip.trip_date).toLocaleDateString('pt-BR'),
        distance: trip.distance,
        fuelConsumption: trip.fuel_consumption,
        fuelPrice: trip.fuel_price,
        startTime: trip.start_time,
        endTime: trip.end_time,
        earnings: trip.earnings,
        litersUsed: trip.liters_used,
        fuelCost: trip.fuel_cost,
        netEarnings: trip.net_earnings,
        hours: `${hours}h ${minutes}m`,
        earningsPerKm: trip.net_earnings / trip.distance,
        earningsPerHour: trip.net_earnings / (trip.time_worked_minutes / 60)
      };
    });
    
    res.status(200).json(formattedTrips);
  } catch (error) {
    console.error('Erro ao buscar viagens:', error);
    res.status(500).json({ message: 'Erro ao buscar viagens' });
  }
});

// Obter uma viagem específica
router.get('/:id', async (req, res) => {
  const userId = req.userData.userId;
  const tripId = req.params.id;
  
  try {
    const [trips] = await db.query(
      `SELECT * FROM trips WHERE id = ? AND user_id = ?`,
      [tripId, userId]
    );
    
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Viagem não encontrada' });
    }
    
    const trip = trips[0];
    const hours = Math.floor(trip.time_worked_minutes / 60);
    const minutes = trip.time_worked_minutes % 60;
    
    const formattedTrip = {
      id: trip.id,
      date: new Date(trip.trip_date).toLocaleDateString('pt-BR'),
      distance: trip.distance,
      fuelConsumption: trip.fuel_consumption,
      fuelPrice: trip.fuel_price,
      startTime: trip.start_time,
      endTime: trip.end_time,
      earnings: trip.earnings,
      litersUsed: trip.liters_used,
      fuelCost: trip.fuel_cost,
      netEarnings: trip.net_earnings,
      hours: `${hours}h ${minutes}m`,
      earningsPerKm: trip.net_earnings / trip.distance,
      earningsPerHour: trip.net_earnings / (trip.time_worked_minutes / 60)
    };
    
    res.status(200).json(formattedTrip);
  } catch (error) {
    console.error('Erro ao buscar viagem:', error);
    res.status(500).json({ message: 'Erro ao buscar viagem' });
  }
});

// Atualizar uma viagem
router.put('/:id', async (req, res) => {
  const userId = req.userData.userId;
  const tripId = req.params.id;
  const {
    date,
    distance,
    fuelConsumption,
    fuelPrice,
    startTime,
    endTime,
    earnings
  } = req.body;
  
  try {
    // Verificar se a viagem existe e pertence ao usuário
    const [trips] = await db.query(
      `SELECT * FROM trips WHERE id = ? AND user_id = ?`,
      [tripId, userId]
    );
    
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Viagem não encontrada' });
    }
    
    // Calcular valores adicionais
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const distanceNum = parseFloat(distance);
    const fuelConsumptionNum = parseFloat(fuelConsumption);
    const fuelPriceNum = parseFloat(fuelPrice);
    const earningsNum = parseFloat(earnings);

    // Calcular litros usados e custo combustível
    const litersUsed = distanceNum / fuelConsumptionNum;
    const fuelCost = litersUsed * fuelPriceNum;

    // Calcular tempo trabalhado em minutos
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    let workedMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (workedMinutes < 0) workedMinutes += 24 * 60; // Se passar da meia-noite

    // Calcular ganho líquido
    const netEarnings = earningsNum - fuelCost;
    
    // Atualizar no banco de dados
    await db.query(
      `UPDATE trips SET
       trip_date = ?, distance = ?, fuel_consumption = ?, fuel_price = ?,
       start_time = ?, end_time = ?, earnings = ?, liters_used = ?,
       fuel_cost = ?, time_worked_minutes = ?, net_earnings = ?
       WHERE id = ? AND user_id = ?`,
      [formattedDate, distanceNum, fuelConsumptionNum, fuelPriceNum, 
       startTime, endTime, earningsNum, litersUsed, 
       fuelCost, workedMinutes, netEarnings, 
       tripId, userId]
    );
    
    res.status(200).json({
      message: 'Viagem atualizada com sucesso',
      calculations: {
        litersUsed,
        fuelCost,
        timeWorked: `${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m`,
        netEarnings,
        earningsPerKm: netEarnings / distanceNum,
        earningsPerHour: netEarnings / (workedMinutes / 60)
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar viagem:', error);
    res.status(500).json({ message: 'Erro ao atualizar viagem' });
  }
});

// Excluir uma viagem
router.delete('/:id', async (req, res) => {
  const userId = req.userData.userId;
  const tripId = req.params.id;
  
  try {
    // Verificar se a viagem existe e pertence ao usuário
    const [trips] = await db.query(
      `SELECT * FROM trips WHERE id = ? AND user_id = ?`,
      [tripId, userId]
    );
    
    if (trips.length === 0) {
      return res.status(404).json({ message: 'Viagem não encontrada' });
    }
    
    // Excluir do banco de dados
    await db.query(
      `DELETE FROM trips WHERE id = ? AND user_id = ?`,
      [tripId, userId]
    );
    
    res.status(200).json({ message: 'Viagem excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir viagem:', error);
    res.status(500).json({ message: 'Erro ao excluir viagem' });
  }
});

module.exports = router;
