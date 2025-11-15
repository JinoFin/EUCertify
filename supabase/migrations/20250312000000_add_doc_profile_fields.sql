ALTER TABLE projects
ADD COLUMN manufacturer_name TEXT,
ADD COLUMN manufacturer_address TEXT,
ADD COLUMN declaration_place TEXT,
ADD COLUMN signatory_name TEXT,
ADD COLUMN signatory_title TEXT,
ADD COLUMN signatory_signature TEXT,
ADD COLUMN declaration_date DATE DEFAULT CURRENT_DATE;
