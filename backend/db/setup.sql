
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
