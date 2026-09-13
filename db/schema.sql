-- Smart Health & Supply Chain Resilience — Database Schema
-- Matches the data model in the project plan doc (Section 13)

CREATE TABLE phc (
    phc_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    subdistrict VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    beds INTEGER NOT NULL DEFAULT 0,
    doctors INTEGER NOT NULL DEFAULT 0,
    nurses INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE medicine (
    medicine_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50)
);

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    phc_id VARCHAR(10) NOT NULL REFERENCES phc(phc_id),
    medicine_id VARCHAR(10) NOT NULL REFERENCES medicine(medicine_id),
    date DATE NOT NULL,
    current_stock INTEGER NOT NULL,
    minimum_stock INTEGER NOT NULL,
    maximum_stock INTEGER NOT NULL,
    UNIQUE (phc_id, medicine_id, date)
);

CREATE TABLE consumption (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    phc_id VARCHAR(10) NOT NULL REFERENCES phc(phc_id),
    medicine_id VARCHAR(10) NOT NULL REFERENCES medicine(medicine_id),
    quantity_used INTEGER NOT NULL,
    UNIQUE (phc_id, medicine_id, date)
);

CREATE TABLE patient_visit (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    phc_id VARCHAR(10) NOT NULL REFERENCES phc(phc_id),
    patient_count INTEGER NOT NULL,
    beds_occupied INTEGER NOT NULL DEFAULT 0,
    disease_category VARCHAR(100),
    UNIQUE (phc_id, date)
);

CREATE TABLE prediction (
    id SERIAL PRIMARY KEY,
    phc_id VARCHAR(10) NOT NULL REFERENCES phc(phc_id),
    medicine_id VARCHAR(10) NOT NULL REFERENCES medicine(medicine_id),
    forecast_date DATE NOT NULL,
    predicted_demand NUMERIC,
    stockout_probability NUMERIC,
    risk_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alert (
    alert_id SERIAL PRIMARY KEY,
    phc_id VARCHAR(10) NOT NULL REFERENCES phc(phc_id),
    medicine_id VARCHAR(10) REFERENCES medicine(medicine_id),
    risk_level VARCHAR(20) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transfer (
    transfer_id SERIAL PRIMARY KEY,
    source_phc VARCHAR(10) NOT NULL REFERENCES phc(phc_id),
    destination_phc VARCHAR(10) NOT NULL REFERENCES phc(phc_id),
    medicine_id VARCHAR(10) NOT NULL REFERENCES medicine(medicine_id),
    quantity INTEGER NOT NULL,
    distance_km NUMERIC,
    status VARCHAR(20) DEFAULT 'pending', -- pending | approved | rejected | completed
    explanation TEXT, -- Gemini-generated reasoning
    created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes for the queries the dashboard will run most
CREATE INDEX idx_inventory_phc_date ON inventory(phc_id, date);
CREATE INDEX idx_consumption_phc_med ON consumption(phc_id, medicine_id);
CREATE INDEX idx_patient_visit_phc_date ON patient_visit(phc_id, date);
CREATE INDEX idx_alert_phc ON alert(phc_id);
