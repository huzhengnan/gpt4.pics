-- First clean up any existing data
DELETE FROM "payment_product_mappings";
DELETE FROM "pricing_plans";

-- Insert pricing plans first
INSERT INTO "pricing_plans" 
("id", "name", "credits", "price", "is_popular", "is_active", "description", "created_at", "updated_at")
VALUES
(
  '1e30bafb-9c87-4f4e-b210-22d245502b78',
  'Starter Pack',
  100,
  9.99,
  false,
  true,
  'Perfect for trying out our service',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  '1e924980-2155-4697-ae9b-019808611630',
  'Pro Pack',
  500,
  39.99,
  true,
  true,
  'Best value for regular users',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  '9f0463ed-d89c-46e7-b9ea-1ac500214611',
  'Enterprise Pack',
  2000,
  149.99,
  false,
  true,
  'For power users and businesses',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Then insert payment product mappings
INSERT INTO "payment_product_mappings" 
("id", "pricing_plan_id", "provider", "provider_prod_id", "is_active", "created_at", "updated_at")
VALUES
(
  gen_random_uuid(), 
  '1e30bafb-9c87-4f4e-b210-22d245502b78', 
  'CREEM',
  'prod_3a52VptdpRQP7mkkSVGw2K',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  '1e924980-2155-4697-ae9b-019808611630',
  'CREEM',
  'prod_3kD6WWVhnaF4PcTfJ5P5EK',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  gen_random_uuid(),
  '9f0463ed-d89c-46e7-b9ea-1ac500214611',
  'CREEM',
  'prod_1aoX2Mn5P2g8uaVMwXVH3p',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);