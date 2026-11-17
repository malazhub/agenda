-- Ensure existing non-owner Director accounts use their Owner-registered
-- phone number as the temporary initial password, including accounts created
-- before the phone-password onboarding flow was introduced.
UPDATE accounts
SET password_must_change = 1
WHERE role = 'director'
  AND length(replace(replace(replace(replace(replace(trim(COALESCE(phone, '')), '+', ''), ' ', ''), '-', ''), '(', ''), ')', '')) >= 6
  AND id NOT IN (SELECT account_id FROM platform_owners);
