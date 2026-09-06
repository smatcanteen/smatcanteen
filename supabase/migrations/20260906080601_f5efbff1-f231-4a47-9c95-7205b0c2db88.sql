ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_fail_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pin_reset_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_run_done boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET first_run_done = true WHERE otp_pending = false;