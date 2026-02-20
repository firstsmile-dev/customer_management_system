-- Fix alcohol_strength constraint to match Django's choices (Weak, Medium, Strong)
ALTER TABLE customer_preferences DROP CONSTRAINT IF EXISTS customer_preferences_alcohol_strength_check;

ALTER TABLE customer_preferences
ADD CONSTRAINT customer_preferences_alcohol_strength_check
CHECK (alcohol_strength IN ('Weak', 'Medium', 'Strong'));
