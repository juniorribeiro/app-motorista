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
