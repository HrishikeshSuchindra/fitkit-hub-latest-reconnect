-- Add admin role to Hrishikesh's existing account
INSERT INTO public.user_roles (user_id, role)
VALUES ('51eeb581-52e6-4989-8005-6209505a2e9f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;