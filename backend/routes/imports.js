const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

// Configuração do multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos.'), false);
    }
  }
});

// Middleware de autenticação
router.use(authMiddleware);

// ============================================================
// PDF Parser - Extrai dados estruturados do texto do PDF Uber
// ============================================================

const MONTH_MAP = {
  'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
  'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
  'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

/**
 * Converte "Mar 30, 2026" para "2026-03-30"
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (!match) return null;
  const month = MONTH_MAP[match[1]];
  const day = match[2].padStart(2, '0');
  const year = match[3];
  return month ? `${year}-${month}-${day}` : null;
}

/**
 * Converte "11:26 AM" para "11:26:00" (formato 24h)
 */
function parseTime(timeStr) {
  if (!timeStr) return null;
  // Remove caracteres especiais (null bytes que aparecem no PDF)
  const cleaned = timeStr.replace(/[\x00-\x1F]/g, ':').replace(/:+/g, ':');
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3];

  if (period) {
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

/**
 * Extrai valor monetário de string "R$257.64"
 */
function parseMoney(str) {
  if (!str) return 0;
  const match = str.replace(/[^\d.,\-]/g, '').replace(',', '.');
  const val = parseFloat(match);
  return isNaN(val) ? 0 : val;
}

/**
 * Parser principal: extrai todos os dados do texto do PDF
 */
function parseUberStatement(rawText) {
  // Normalização: PDF da Uber costuma usar null bytes \x00 no lugar de dois pontos :
  const fullText = rawText.replace(/\x00/g, ':');

  const result = {
    periodStart: null,
    periodEnd: null,
    totalEarnings: 0,
    fareBase: 0,
    fareSurge: 0,
    farePriority: 0,
    fareWaitTime: 0,
    totalPayouts: 0,
    startingBalance: 0,
    endingBalance: 0,
    trips: []
  };

  // ---- Período ----
  const periodMatch = fullText.match(
    /([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s+\d+\s*(?:AM|PM)\s*-\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/
  );
  if (periodMatch) {
    result.periodStart = parseDate(periodMatch[1]);
    result.periodEnd = parseDate(periodMatch[2]);
  }

  // ---- Your earnings (total) ----
  // Tenta múltiplos padrões pois o texto pode estar colado
  const earningsMatch = fullText.match(/Your earnings\s*R?\$?([0-9.,]+)/i) || 
                       fullText.match(/Your earnings\s*\n?\s*R\$([0-9.,]+)/i);
  if (earningsMatch) {
    result.totalEarnings = parseMoney(earningsMatch[1]);
  }

  // ---- Breakdown ----
  // Usamos \n ou início de linha para evitar pegar valores de dentro de frases
  const baseMatch = fullText.match(/(?:Fare|Base)\s*R\$([0-9.,]+)/i) || fullText.match(/\nBase\s*R\$([0-9.,]+)/i);
  if (baseMatch) result.fareBase = parseMoney(baseMatch[1]);

  const surgeMatch = fullText.match(/Surge\s*R\$([0-9.,]+)/i);
  if (surgeMatch) result.fareSurge = parseMoney(surgeMatch[1]);

  const priorityMatch = fullText.match(/(?:UberX\s+)?Priority\s*R\$([0-9.,]+)/i);
  if (priorityMatch) result.farePriority = parseMoney(priorityMatch[1]);

  const waitMatch = fullText.match(/Wait\s+Time\s+at\s+Pickup\s*R\$([0-9.,]+)/i);
  if (waitMatch) result.fareWaitTime = parseMoney(waitMatch[1]);

  // ---- Payouts ----
  const payoutsMatch = fullText.match(/Payouts\s*R\$([0-9.,]+)/i);
  if (payoutsMatch) result.totalPayouts = parseMoney(payoutsMatch[1]);

  // ---- Balances ----
  const startBalMatch = fullText.match(/Starting balance.*?R\$([0-9.,]+)/i);
  if (startBalMatch) result.startingBalance = parseMoney(startBalMatch[1]);

  const endBalMatch = fullText.match(/Ending balance.*?R\$([0-9.,]+)/i);
  if (endBalMatch) result.endingBalance = parseMoney(endBalMatch[1]);

  // ---- Transações (viagens individuais) ----
  // Padrão identificado no PDF:
  // "Thu, Apr 2\n11:26 AM\nUberX\nApr 2 11:12 AM\nR$9.43R$9.43\nR$257.64"
  const txPattern = /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+([A-Za-z]+\s+\d{1,2})\s*\n\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*\n\s*(UberX|Comfort|Priority|UberX Priority|Flash|Pet|Black|Green|Moto|Direct|Package)\s*\n\s*([A-Za-z]+\s+\d{1,2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*\n\s*R\$([0-9.,]+)R\$([0-9.,]+)/gi;

  let match;
  while ((match = txPattern.exec(fullText)) !== null) {
    const tripDateStr = match[1]; // "Apr 2"
    const processedTime = match[2]; // "11:26 AM"
    const serviceType = match[3].trim(); // "UberX"
    const startTimeStr = match[5]; // "11:12 AM"
    const earnings = parseMoney(match[6]);
    const balance = parseMoney(match[7]);

    // Determinar o ano a partir do período (ou ano atual se falhar)
    const year = result.periodStart ? result.periodStart.substring(0, 4) : new Date().getFullYear().toString();

    // Parsear a data da viagem
    const dateMonthMatch = tripDateStr.match(/([A-Za-z]+)\s+(\d{1,2})/);
    let tripDate = null;
    if (dateMonthMatch) {
      const month = MONTH_MAP[dateMonthMatch[1]];
      const day = dateMonthMatch[2].padStart(2, '0');
      if (month) tripDate = `${year}-${month}-${day}`;
    }

    result.trips.push({
      tripDate: tripDate || result.periodStart,
      tripTime: parseTime(processedTime),
      startTime: parseTime(startTimeStr),
      serviceType: serviceType === 'UberX Priority' ? 'Priority' : serviceType,
      earnings,
      balanceAfter: balance
    });
  }

  // Se não encontrou viagens com o padrão acima, tenta um padrão alternativo sem quebras de linha
  if (result.trips.length === 0) {
    const altPattern = /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+([A-Za-z]+\s+\d{1,2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*(UberX|Comfort|Priority|Flash|Pet|Black|Green|Moto)\s+([A-Za-z]+\s+\d{1,2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*R\$([0-9.,]+)/gi;
    while ((match = altPattern.exec(fullText)) !== null) {
      const year = result.periodStart ? result.periodStart.substring(0, 4) : new Date().getFullYear().toString();
      const month = MONTH_MAP[match[1].split(' ')[0]];
      const day = match[1].split(' ')[1].padStart(2, '0');
      
      result.trips.push({
        tripDate: month ? `${year}-${month}-${day}` : result.periodStart,
        tripTime: parseTime(match[2]),
        startTime: parseTime(match[5]),
        serviceType: match[3],
        earnings: parseMoney(match[6]),
        balanceAfter: 0
      });
    }
  }

  return result;
}

// ============================================================
// API Endpoints
// ============================================================

// POST /api/imports/upload — Upload e processamento de PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo PDF enviado.' });
  }

  const userId = req.userData.userId;
  const originalFilename = req.file.originalname;

  let statementId = null;

  try {
    // 1. Criar registro do statement com status "processing"
    const [insertResult] = await db.query(
      `INSERT INTO imported_statements 
       (user_id, period_start, period_end, original_filename, import_status)
       VALUES (?, CURDATE(), CURDATE(), ?, 'processing')`,
      [userId, originalFilename]
    );
    statementId = insertResult.insertId;

    // 2. Extrair texto do PDF
    const pdfData = await pdf(req.file.buffer);
    const fullText = pdfData.text;

    // 3. Parsear dados
    const parsed = parseUberStatement(fullText);

    if (!parsed.periodStart || !parsed.periodEnd) {
      throw new Error('Não foi possível identificar o período do extrato. Verifique se o PDF é um extrato semanal da Uber.');
    }

    // 4. Verificar duplicata
    const [existing] = await db.query(
      `SELECT id FROM imported_statements 
       WHERE user_id = ? AND period_start = ? AND period_end = ? AND id != ? AND import_status = 'completed'`,
      [userId, parsed.periodStart, parsed.periodEnd, statementId]
    );

    if (existing.length > 0) {
      // Remover o statement que acabamos de criar
      await db.query('DELETE FROM imported_statements WHERE id = ?', [statementId]);
      return res.status(409).json({
        message: `Já existe um extrato importado para o período ${parsed.periodStart} a ${parsed.periodEnd}.`,
        existingId: existing[0].id
      });
    }

    // 5. Atualizar o statement com os dados extraídos
    await db.query(
      `UPDATE imported_statements SET
        period_start = ?, period_end = ?, total_earnings = ?,
        fare_base = ?, fare_surge = ?, fare_priority = ?, fare_wait_time = ?,
        total_payouts = ?, starting_balance = ?, ending_balance = ?,
        import_status = 'completed'
       WHERE id = ?`,
      [
        parsed.periodStart, parsed.periodEnd, parsed.totalEarnings,
        parsed.fareBase, parsed.fareSurge, parsed.farePriority, parsed.fareWaitTime,
        parsed.totalPayouts, parsed.startingBalance, parsed.endingBalance,
        statementId
      ]
    );

    // 6. Inserir viagens importadas
    if (parsed.trips.length > 0) {
      const tripValues = parsed.trips.map(trip => [
        statementId,
        userId,
        trip.tripDate || parsed.periodStart,
        trip.tripTime,
        trip.startTime,
        trip.serviceType,
        trip.earnings,
        trip.balanceAfter
      ]);

      const placeholders = tripValues.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = tripValues.flat();

      await db.query(
        `INSERT INTO imported_trips 
         (statement_id, user_id, trip_date, trip_time, start_time, service_type, earnings, balance_after)
         VALUES ${placeholders}`,
        flatValues
      );
    }

    return res.status(201).json({
      message: 'Extrato importado com sucesso!',
      statementId,
      summary: {
        period: `${parsed.periodStart} a ${parsed.periodEnd}`,
        totalEarnings: parsed.totalEarnings,
        tripsCount: parsed.trips.length,
        breakdown: {
          base: parsed.fareBase,
          surge: parsed.fareSurge,
          priority: parsed.farePriority,
          waitTime: parsed.fareWaitTime
        }
      }
    });

  } catch (error) {
    console.error('Erro ao processar PDF:', error);

    // Atualizar status para erro se já temos o statement criado
    if (statementId) {
      await db.query(
        `UPDATE imported_statements SET import_status = 'error', error_message = ? WHERE id = ?`,
        [error.message, statementId]
      ).catch(() => {});
    }

    return res.status(500).json({
      message: 'Erro ao processar o PDF.',
      error: error.message
    });
  }
});

// GET /api/imports — Lista extratos importados
router.get('/', async (req, res) => {
  const userId = req.userData.userId;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 50);
  const offset = (page - 1) * pageSize;

  try {
    // Contar total
    const [countResult] = await db.query(
      'SELECT COUNT(*) AS total FROM imported_statements WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Buscar extratos com contagem de viagens
    const [statements] = await db.query(
      `SELECT 
        s.id, s.period_start AS periodStart, s.period_end AS periodEnd,
        s.total_earnings AS totalEarnings, s.fare_base AS fareBase,
        s.fare_surge AS fareSurge, s.fare_priority AS farePriority,
        s.fare_wait_time AS fareWaitTime, s.total_payouts AS totalPayouts,
        s.starting_balance AS startingBalance, s.ending_balance AS endingBalance,
        s.original_filename AS originalFilename,
        s.import_status AS importStatus, s.error_message AS errorMessage,
        s.created_at AS createdAt,
        COUNT(t.id) AS tripsCount
       FROM imported_statements s
       LEFT JOIN imported_trips t ON t.statement_id = s.id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY s.period_start DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    return res.status(200).json({
      data: statements,
      page,
      pageSize,
      total,
      totalPages
    });
  } catch (error) {
    console.error('Erro ao listar importações:', error);
    return res.status(500).json({ message: 'Erro ao listar importações.' });
  }
});

// GET /api/imports/:id — Detalhes de um extrato com viagens
router.get('/:id', async (req, res) => {
  const userId = req.userData.userId;
  const statementId = req.params.id;

  try {
    // Buscar extrato
    const [statements] = await db.query(
      `SELECT 
        id, period_start AS periodStart, period_end AS periodEnd,
        total_earnings AS totalEarnings, fare_base AS fareBase,
        fare_surge AS fareSurge, fare_priority AS farePriority,
        fare_wait_time AS fareWaitTime, total_payouts AS totalPayouts,
        starting_balance AS startingBalance, ending_balance AS endingBalance,
        original_filename AS originalFilename,
        import_status AS importStatus, error_message AS errorMessage,
        created_at AS createdAt
       FROM imported_statements
       WHERE id = ? AND user_id = ?`,
      [statementId, userId]
    );

    if (statements.length === 0) {
      return res.status(404).json({ message: 'Extrato não encontrado.' });
    }

    // Buscar viagens do extrato
    const [trips] = await db.query(
      `SELECT 
        id, trip_date AS tripDate, trip_time AS tripTime,
        start_time AS startTime, service_type AS serviceType,
        earnings, balance_after AS balanceAfter
       FROM imported_trips
       WHERE statement_id = ? AND user_id = ?
       ORDER BY trip_date DESC, trip_time DESC`,
      [statementId, userId]
    );

    return res.status(200).json({
      ...statements[0],
      trips
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da importação:', error);
    return res.status(500).json({ message: 'Erro ao buscar detalhes da importação.' });
  }
});

// DELETE /api/imports/:id — Remove extrato e viagens
router.delete('/:id', async (req, res) => {
  const userId = req.userData.userId;
  const statementId = req.params.id;

  try {
    const [existing] = await db.query(
      'SELECT id FROM imported_statements WHERE id = ? AND user_id = ?',
      [statementId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Extrato não encontrado.' });
    }

    // CASCADE deleta as viagens automaticamente
    await db.query(
      'DELETE FROM imported_statements WHERE id = ? AND user_id = ?',
      [statementId, userId]
    );

    return res.status(200).json({ message: 'Extrato excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir importação:', error);
    return res.status(500).json({ message: 'Erro ao excluir importação.' });
  }
});

module.exports = router;
