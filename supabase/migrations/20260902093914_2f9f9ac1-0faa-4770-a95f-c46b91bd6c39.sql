DROP POLICY IF EXISTS "staff read profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin update profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "staff read roles" ON public.user_roles;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION public.has_role(uuid, public.app_role);

CREATE POLICY "staff read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'support') OR private.has_role(auth.uid(),'finance'));
CREATE POLICY "admin update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete profiles" ON public.profiles FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY "staff read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'support') OR private.has_role(auth.uid(),'finance'));