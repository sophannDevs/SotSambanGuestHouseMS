-- =============================================================================
--  V004 — Property Details, System Settings, Taxes & Onboarding Progress
-- =============================================================================

-- Property Details table (Extends properties table with B8 specifications)
CREATE TABLE property_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
    address_line TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Cambodia',
    postal_code VARCHAR(20),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    default_check_in_time TIME NOT NULL DEFAULT '14:00:00',
    default_check_out_time TIME NOT NULL DEFAULT '12:00:00',
    tax_id_number VARCHAR(50),
    business_registration_number VARCHAR(50),
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    legal_name VARCHAR(150),
    billing_address TEXT,
    bank_details TEXT,
    invoice_footer_note TEXT,
    terms_and_conditions TEXT,
    cancellation_policy TEXT,
    house_rules TEXT,
    wifi_name VARCHAR(100),
    wifi_password VARCHAR(100),
    emergency_contact VARCHAR(100),
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    onboarding_current_step INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System Settings table (Key-Value settings per property)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    value_type VARCHAR(20) NOT NULL DEFAULT 'STRING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_system_settings__property_key UNIQUE (property_id, setting_key)
);

CREATE INDEX ix_system_settings__property_category ON system_settings (property_id, category);

-- Taxes table
CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    rate_percentage NUMERIC(9, 4) NOT NULL DEFAULT 0.0000,
    applies_to_service_charge BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_taxes__property_id ON taxes (property_id);

-- Seed Property Details for Demo Property
INSERT INTO property_details (property_id, address_line, city, province, country, default_check_in_time, default_check_out_time, wifi_name, wifi_password, emergency_contact, onboarding_completed, onboarding_current_step)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Street 05, Wat Bo Village', 'Siem Reap', 'Siem Reap', 'Cambodia', '14:00:00', '12:00:00', 'SotSamban_Guest_WiFi', 'Welcome2026', '+85512345678', true, 14);

-- Seed Default Taxes
INSERT INTO taxes (property_id, name, rate_percentage, applies_to_service_charge, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'VAT', 10.0000, true, true);
