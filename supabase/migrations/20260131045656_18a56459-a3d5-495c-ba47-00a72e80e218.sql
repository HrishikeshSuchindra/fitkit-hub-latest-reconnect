-- =============================================
-- PHASE 1: OWNER APPLICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.owner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT owner_applications_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_applications_status 
    ON public.owner_applications(status);
CREATE INDEX IF NOT EXISTS idx_owner_applications_user_id 
    ON public.owner_applications(user_id);

-- Enable RLS
ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for owner_applications
CREATE POLICY "Users can submit applications"
    ON public.owner_applications FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own applications"
    ON public.owner_applications FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
    ON public.owner_applications FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications"
    ON public.owner_applications FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete applications"
    ON public.owner_applications FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 2: PROFILES TABLE ADMIN POLICIES
-- =============================================

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- PHASE 3: USER_ROLES EXPLICIT ADMIN POLICIES
-- =============================================

CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));