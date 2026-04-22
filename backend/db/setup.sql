
-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS driver_dash;
USE driver_dash;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de viagens
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  trip_date DATE NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  fuel_consumption DECIMAL(10, 2) NOT NULL,
  fuel_price DECIMAL(10, 2) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  earnings DECIMAL(10, 2) NOT NULL,
  liters_used DECIMAL(10, 2) NOT NULL,
  fuel_cost DECIMAL(10, 2) NOT NULL,
  time_worked_minutes INT NOT NULL,
  net_earnings DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_trips_user_date ON trips(user_id, trip_date);

-- Tabela de diário de estratégias
CREATE TABLE IF NOT EXISTS diary_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  entry_date DATE NOT NULL,
  is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
  holiday_name VARCHAR(100) NULL,
  tags JSON NULL,
  strategy_hypothesis TEXT NOT NULL,
  execution_notes TEXT NOT NULL,
  result_evaluation ENUM('worked_well', 'partially_worked', 'did_not_work') NOT NULL,
  lessons_learned TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_diary_user_date ON diary_entries(user_id, entry_date);

-- Tabela de extratos importados (cabeçalho do PDF)
CREATE TABLE IF NOT EXISTS imported_statements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  fare_base DECIMAL(10,2) DEFAULT 0,
  fare_surge DECIMAL(10,2) DEFAULT 0,
  fare_priority DECIMAL(10,2) DEFAULT 0,
  fare_wait_time DECIMAL(10,2) DEFAULT 0,
  total_payouts DECIMAL(10,2) DEFAULT 0,
  starting_balance DECIMAL(10,2) DEFAULT 0,
  ending_balance DECIMAL(10,2) DEFAULT 0,
  original_filename VARCHAR(255),
  import_status ENUM('processing', 'completed', 'error') DEFAULT 'processing',
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de viagens importadas (transações individuais do PDF)
CREATE TABLE IF NOT EXISTS imported_trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  statement_id INT NOT NULL,
  user_id INT NOT NULL,
  trip_date DATE NOT NULL,
  trip_time TIME NULL,
  start_time TIME NULL,
  service_type VARCHAR(50) NOT NULL,
  earnings DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (statement_id) REFERENCES imported_statements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_imported_statements_user ON imported_statements(user_id, period_start);
CREATE INDEX idx_imported_trips_statement ON imported_trips(statement_id);
CREATE INDEX idx_imported_trips_user_date ON imported_trips(user_id, trip_date);
