
-- Add role column to beta_registrations for organizer/player distinction
ALTER TABLE beta_registrations ADD COLUMN IF NOT EXISTS role text;

-- Add reserved_until to bookings for reservation timer
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reserved_until timestamptz;

-- Add conversation states to bot state for multi-step flows
ALTER TABLE telegram_bot_state ADD COLUMN IF NOT EXISTS conversation_states jsonb DEFAULT '{}'::jsonb;
