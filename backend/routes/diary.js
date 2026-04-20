const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

const VALID_RESULTS = ['worked_well', 'partially_worked', 'did_not_work'];
const VALID_TAGS = ['chuva', 'evento_na_cidade', 'tarifa_dinamica', 'horario_pico'];

const normalizeTags = (rawTags) => {
  if (!rawTags) {
    return [];
  }

  if (Array.isArray(rawTags)) {
    return rawTags;
  }

  try {
    const parsed = JSON.parse(rawTags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const validateDiaryPayload = (payload) => {
  const {
    date,
    isHoliday,
    holidayName,
    tags,
    strategyHypothesis,
    executionNotes,
    resultEvaluation,
    lessonsLearned
  } = payload;

  if (!date || Number.isNaN(Date.parse(date))) {
    return 'Data invalida.';
  }

  if (typeof isHoliday !== 'boolean') {
    return 'O campo isHoliday deve ser booleano.';
  }

  if (!strategyHypothesis || !strategyHypothesis.trim()) {
    return 'Hipotese da estrategia e obrigatoria.';
  }

  if (!executionNotes || !executionNotes.trim()) {
    return 'Notas de execucao sao obrigatorias.';
  }

  if (!VALID_RESULTS.includes(resultEvaluation)) {
    return 'Resultado invalido.';
  }

  if (!lessonsLearned || !lessonsLearned.trim()) {
    return 'Aprendizados sao obrigatorios.';
  }

  if (holidayName && holidayName.length > 100) {
    return 'Nome do feriado deve ter no maximo 100 caracteres.';
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      return 'Tags devem ser um array.';
    }

    if (tags.some((tag) => !VALID_TAGS.includes(tag))) {
      return 'Uma ou mais tags sao invalidas.';
    }
  }

  return null;
};

router.use(authMiddleware);

router.post('/', async (req, res) => {
  const validationError = validateDiaryPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const userId = req.userData.userId;
  const {
    date,
    isHoliday,
    holidayName,
    tags = [],
    strategyHypothesis,
    executionNotes,
    resultEvaluation,
    lessonsLearned
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO diary_entries
      (user_id, entry_date, is_holiday, holiday_name, tags, strategy_hypothesis, execution_notes, result_evaluation, lessons_learned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        date,
        isHoliday,
        holidayName || null,
        JSON.stringify(tags),
        strategyHypothesis.trim(),
        executionNotes.trim(),
        resultEvaluation,
        lessonsLearned.trim()
      ]
    );

    return res.status(201).json({
      message: 'Registro do diario criado com sucesso.',
      entryId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar registro do diario:', error);
    return res.status(500).json({ message: 'Erro ao criar registro do diario.' });
  }
});

router.get('/', async (req, res) => {
  const userId = req.userData.userId;
  const { result, startDate, endDate, q, tag, page, pageSize } = req.query;

  const filters = ['user_id = ?'];
  const params = [userId];
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedPageSize = parseInt(pageSize, 10) || 10;
  const safePageSize = Math.min(Math.max(parsedPageSize, 1), 100);

  if (result && VALID_RESULTS.includes(result)) {
    filters.push('result_evaluation = ?');
    params.push(result);
  }

  if (startDate) {
    filters.push('entry_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    filters.push('entry_date <= ?');
    params.push(endDate);
  }

  if (q && String(q).trim()) {
    const searchTerm = `%${String(q).trim()}%`;
    filters.push(`(
      COALESCE(holiday_name, '') LIKE ?
      OR strategy_hypothesis LIKE ?
      OR execution_notes LIKE ?
      OR lessons_learned LIKE ?
    )`);
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (tag && VALID_TAGS.includes(String(tag))) {
    filters.push('JSON_CONTAINS(tags, JSON_ARRAY(?))');
    params.push(String(tag));
  }

  try {
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
      FROM diary_entries
      WHERE ${filters.join(' AND ')}`,
      params
    );

    const total = countRows[0]?.total || 0;
    const totalPages = total > 0 ? Math.ceil(total / safePageSize) : 1;
    const currentPage = Math.min(safePage, totalPages);
    const offset = (currentPage - 1) * safePageSize;

    const [entries] = await db.query(
      `SELECT
        id,
        entry_date AS date,
        is_holiday AS isHoliday,
        holiday_name AS holidayName,
        tags,
        strategy_hypothesis AS strategyHypothesis,
        execution_notes AS executionNotes,
        result_evaluation AS resultEvaluation,
        lessons_learned AS lessonsLearned,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM diary_entries
      WHERE ${filters.join(' AND ')}
      ORDER BY entry_date DESC, created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, safePageSize, offset]
    );

    const normalizedEntries = entries.map((entry) => ({
      ...entry,
      tags: normalizeTags(entry.tags)
    }));

    return res.status(200).json({
      data: normalizedEntries,
      page: currentPage,
      pageSize: safePageSize,
      total,
      totalPages
    });
  } catch (error) {
    console.error('Erro ao listar registros do diario:', error);
    return res.status(500).json({ message: 'Erro ao listar registros do diario.' });
  }
});

router.get('/same-day-history', async (req, res) => {
  const userId = req.userData.userId;
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  try {
    const [entries] = await db.query(
      `SELECT
        id,
        entry_date AS date,
        is_holiday AS isHoliday,
        holiday_name AS holidayName,
        tags,
        strategy_hypothesis AS strategyHypothesis,
        execution_notes AS executionNotes,
        result_evaluation AS resultEvaluation,
        lessons_learned AS lessonsLearned,
        YEAR(entry_date) AS year
      FROM diary_entries
      WHERE user_id = ?
        AND DAY(entry_date) = ?
        AND MONTH(entry_date) = ?
        AND YEAR(entry_date) < ?
      ORDER BY entry_date DESC`,
      [userId, day, month, currentYear]
    );

    const normalizedEntries = entries.map((entry) => ({
      ...entry,
      tags: normalizeTags(entry.tags)
    }));

    return res.status(200).json({
      latest: normalizedEntries.length > 0 ? normalizedEntries[0] : null,
      entries: normalizedEntries
    });
  } catch (error) {
    console.error('Erro ao buscar historico do mesmo dia:', error);
    return res.status(500).json({ message: 'Erro ao buscar historico do mesmo dia.' });
  }
});

router.get('/holiday-reminders', async (req, res) => {
  const userId = req.userData.userId;
  const daysAhead = Math.max(parseInt(req.query.daysAhead, 10) || 3, 1);

  try {
    const [reminders] = await db.query(
      `SELECT
        d.id,
        d.entry_date AS originalDate,
        d.holiday_name AS holidayName,
        d.tags,
        d.strategy_hypothesis AS strategyHypothesis,
        d.execution_notes AS executionNotes,
        d.result_evaluation AS resultEvaluation,
        d.lessons_learned AS lessonsLearned,
        STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', DATE_FORMAT(d.entry_date, '%m-%d')), '%Y-%m-%d') AS upcomingDate
      FROM diary_entries d
      INNER JOIN (
        SELECT
          holiday_name,
          MAX(entry_date) AS latestDate
        FROM diary_entries
        WHERE user_id = ?
          AND is_holiday = TRUE
          AND holiday_name IS NOT NULL
          AND holiday_name <> ''
          AND YEAR(entry_date) < YEAR(CURDATE())
        GROUP BY holiday_name
      ) latest
        ON latest.holiday_name = d.holiday_name
        AND latest.latestDate = d.entry_date
      WHERE d.user_id = ?
        AND DATEDIFF(
          STR_TO_DATE(CONCAT(YEAR(CURDATE()), '-', DATE_FORMAT(d.entry_date, '%m-%d')), '%Y-%m-%d'),
          CURDATE()
        ) = ?
      ORDER BY upcomingDate ASC`,
      [userId, userId, daysAhead]
    );

    return res.status(200).json(
      reminders.map((reminder) => ({
        ...reminder,
        tags: normalizeTags(reminder.tags)
      }))
    );
  } catch (error) {
    console.error('Erro ao buscar lembretes de feriados:', error);
    return res.status(500).json({ message: 'Erro ao buscar lembretes de feriados.' });
  }
});

router.get('/:id', async (req, res) => {
  const userId = req.userData.userId;
  const entryId = req.params.id;

  try {
    const [entries] = await db.query(
      `SELECT
        id,
        entry_date AS date,
        is_holiday AS isHoliday,
        holiday_name AS holidayName,
        tags,
        strategy_hypothesis AS strategyHypothesis,
        execution_notes AS executionNotes,
        result_evaluation AS resultEvaluation,
        lessons_learned AS lessonsLearned,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM diary_entries
      WHERE id = ? AND user_id = ?`,
      [entryId, userId]
    );

    if (entries.length === 0) {
      return res.status(404).json({ message: 'Registro do diario nao encontrado.' });
    }

    return res.status(200).json({
      ...entries[0],
      tags: normalizeTags(entries[0].tags)
    });
  } catch (error) {
    console.error('Erro ao buscar registro do diario:', error);
    return res.status(500).json({ message: 'Erro ao buscar registro do diario.' });
  }
});

router.put('/:id', async (req, res) => {
  const validationError = validateDiaryPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const userId = req.userData.userId;
  const entryId = req.params.id;
  const {
    date,
    isHoliday,
    holidayName,
    tags = [],
    strategyHypothesis,
    executionNotes,
    resultEvaluation,
    lessonsLearned
  } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM diary_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Registro do diario nao encontrado.' });
    }

    await db.query(
      `UPDATE diary_entries SET
        entry_date = ?,
        is_holiday = ?,
        holiday_name = ?,
        tags = ?,
        strategy_hypothesis = ?,
        execution_notes = ?,
        result_evaluation = ?,
        lessons_learned = ?
      WHERE id = ? AND user_id = ?`,
      [
        date,
        isHoliday,
        holidayName || null,
        JSON.stringify(tags),
        strategyHypothesis.trim(),
        executionNotes.trim(),
        resultEvaluation,
        lessonsLearned.trim(),
        entryId,
        userId
      ]
    );

    return res.status(200).json({ message: 'Registro do diario atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar registro do diario:', error);
    return res.status(500).json({ message: 'Erro ao atualizar registro do diario.' });
  }
});

router.delete('/:id', async (req, res) => {
  const userId = req.userData.userId;
  const entryId = req.params.id;

  try {
    const [existing] = await db.query(
      'SELECT id FROM diary_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Registro do diario nao encontrado.' });
    }

    await db.query(
      'DELETE FROM diary_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    return res.status(200).json({ message: 'Registro do diario excluido com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir registro do diario:', error);
    return res.status(500).json({ message: 'Erro ao excluir registro do diario.' });
  }
});

module.exports = router;
