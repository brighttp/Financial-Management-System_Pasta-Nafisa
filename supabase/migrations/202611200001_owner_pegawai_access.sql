-- Apply with a database administrator through Supabase SQL Editor.
-- Additive restrictive gates also constrain pre-existing permissive policies.
BEGIN;
CREATE OR REPLACE FUNCTION public.app_business_role(target_business uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT CASE WHEN bool_or(m.role::text = 'owner') THEN 'owner'
              WHEN bool_or(m.role::text = 'pegawai') THEN 'pegawai'
              ELSE NULL END
  FROM public.business_members m
  WHERE m.business_id = target_business AND m.user_id = (SELECT auth.uid())
$$;
REVOKE ALL ON FUNCTION public.app_business_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_business_role(uuid) TO authenticated, anon;

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_select_restrictive ON public.financial_transactions;
CREATE POLICY app_select_restrictive ON public.financial_transactions AS RESTRICTIVE FOR SELECT TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_select_permissive ON public.financial_transactions;
CREATE POLICY app_select_permissive ON public.financial_transactions AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_insert_restrictive ON public.financial_transactions;
CREATE POLICY app_insert_restrictive ON public.financial_transactions AS RESTRICTIVE FOR INSERT TO PUBLIC
  WITH CHECK (public.app_business_role(business_id) IN ('owner', 'pegawai') AND created_by = (SELECT auth.uid())
  AND EXISTS (SELECT 1 FROM public.outlets o WHERE o.id = outlet_id AND o.business_id = financial_transactions.business_id AND o.is_active IS NOT FALSE)
  AND EXISTS (SELECT 1 FROM public.transaction_categories c WHERE c.id = category_id AND c.business_id = financial_transactions.business_id AND c.type = financial_transactions.type AND c.is_active IS NOT FALSE)
  AND amount > 0 AND type IN ('income', 'expense'))
;
DROP POLICY IF EXISTS app_insert_permissive ON public.financial_transactions;
CREATE POLICY app_insert_permissive ON public.financial_transactions AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.app_business_role(business_id) IN ('owner', 'pegawai') AND created_by = (SELECT auth.uid())
  AND EXISTS (SELECT 1 FROM public.outlets o WHERE o.id = outlet_id AND o.business_id = financial_transactions.business_id AND o.is_active IS NOT FALSE)
  AND EXISTS (SELECT 1 FROM public.transaction_categories c WHERE c.id = category_id AND c.business_id = financial_transactions.business_id AND c.type = financial_transactions.type AND c.is_active IS NOT FALSE)
  AND amount > 0 AND type IN ('income', 'expense'))
;
DROP POLICY IF EXISTS app_update_restrictive ON public.financial_transactions;
CREATE POLICY app_update_restrictive ON public.financial_transactions AS RESTRICTIVE FOR UPDATE TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_update_permissive ON public.financial_transactions;
CREATE POLICY app_update_permissive ON public.financial_transactions AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_restrictive ON public.financial_transactions;
CREATE POLICY app_delete_restrictive ON public.financial_transactions AS RESTRICTIVE FOR DELETE TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_permissive ON public.financial_transactions;
CREATE POLICY app_delete_permissive ON public.financial_transactions AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_select_restrictive ON public.business_members;
CREATE POLICY app_select_restrictive ON public.business_members AS RESTRICTIVE FOR SELECT TO PUBLIC
  USING (user_id = (SELECT auth.uid()) OR public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_select_permissive ON public.business_members;
CREATE POLICY app_select_permissive ON public.business_members AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_insert_restrictive ON public.business_members;
CREATE POLICY app_insert_restrictive ON public.business_members AS RESTRICTIVE FOR INSERT TO PUBLIC
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_insert_permissive ON public.business_members;
CREATE POLICY app_insert_permissive ON public.business_members AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_update_restrictive ON public.business_members;
CREATE POLICY app_update_restrictive ON public.business_members AS RESTRICTIVE FOR UPDATE TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_update_permissive ON public.business_members;
CREATE POLICY app_update_permissive ON public.business_members AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_restrictive ON public.business_members;
CREATE POLICY app_delete_restrictive ON public.business_members AS RESTRICTIVE FOR DELETE TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_permissive ON public.business_members;
CREATE POLICY app_delete_permissive ON public.business_members AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_select_restrictive ON public.businesses;
CREATE POLICY app_select_restrictive ON public.businesses AS RESTRICTIVE FOR SELECT TO PUBLIC
  USING (public.app_business_role(id) IN ('owner', 'pegawai'))
;
DROP POLICY IF EXISTS app_select_permissive ON public.businesses;
CREATE POLICY app_select_permissive ON public.businesses AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.app_business_role(id) IN ('owner', 'pegawai'))
;
DROP POLICY IF EXISTS app_update_restrictive ON public.businesses;
CREATE POLICY app_update_restrictive ON public.businesses AS RESTRICTIVE FOR UPDATE TO PUBLIC
  USING (public.app_business_role(id) = 'owner')
  WITH CHECK (public.app_business_role(id) = 'owner')
;
DROP POLICY IF EXISTS app_update_permissive ON public.businesses;
CREATE POLICY app_update_permissive ON public.businesses AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.app_business_role(id) = 'owner')
  WITH CHECK (public.app_business_role(id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_restrictive ON public.businesses;
CREATE POLICY app_delete_restrictive ON public.businesses AS RESTRICTIVE FOR DELETE TO PUBLIC
  USING (public.app_business_role(id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_permissive ON public.businesses;
CREATE POLICY app_delete_permissive ON public.businesses AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.app_business_role(id) = 'owner')
;
DROP POLICY IF EXISTS app_insert_restrictive ON public.businesses;
CREATE POLICY app_insert_restrictive ON public.businesses AS RESTRICTIVE FOR INSERT TO PUBLIC
  WITH CHECK (false)
;
DROP POLICY IF EXISTS app_insert_permissive ON public.businesses;
CREATE POLICY app_insert_permissive ON public.businesses AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (false)
;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_select_restrictive ON public.outlets;
CREATE POLICY app_select_restrictive ON public.outlets AS RESTRICTIVE FOR SELECT TO PUBLIC
  USING (public.app_business_role(business_id) IN ('owner', 'pegawai'))
;
DROP POLICY IF EXISTS app_select_permissive ON public.outlets;
CREATE POLICY app_select_permissive ON public.outlets AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.app_business_role(business_id) IN ('owner', 'pegawai'))
;
DROP POLICY IF EXISTS app_insert_restrictive ON public.outlets;
CREATE POLICY app_insert_restrictive ON public.outlets AS RESTRICTIVE FOR INSERT TO PUBLIC
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_insert_permissive ON public.outlets;
CREATE POLICY app_insert_permissive ON public.outlets AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_update_restrictive ON public.outlets;
CREATE POLICY app_update_restrictive ON public.outlets AS RESTRICTIVE FOR UPDATE TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_update_permissive ON public.outlets;
CREATE POLICY app_update_permissive ON public.outlets AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_restrictive ON public.outlets;
CREATE POLICY app_delete_restrictive ON public.outlets AS RESTRICTIVE FOR DELETE TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_permissive ON public.outlets;
CREATE POLICY app_delete_permissive ON public.outlets AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_select_restrictive ON public.transaction_categories;
CREATE POLICY app_select_restrictive ON public.transaction_categories AS RESTRICTIVE FOR SELECT TO PUBLIC
  USING (public.app_business_role(business_id) IN ('owner', 'pegawai'))
;
DROP POLICY IF EXISTS app_select_permissive ON public.transaction_categories;
CREATE POLICY app_select_permissive ON public.transaction_categories AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.app_business_role(business_id) IN ('owner', 'pegawai'))
;
DROP POLICY IF EXISTS app_insert_restrictive ON public.transaction_categories;
CREATE POLICY app_insert_restrictive ON public.transaction_categories AS RESTRICTIVE FOR INSERT TO PUBLIC
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_insert_permissive ON public.transaction_categories;
CREATE POLICY app_insert_permissive ON public.transaction_categories AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_update_restrictive ON public.transaction_categories;
CREATE POLICY app_update_restrictive ON public.transaction_categories AS RESTRICTIVE FOR UPDATE TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_update_permissive ON public.transaction_categories;
CREATE POLICY app_update_permissive ON public.transaction_categories AS PERMISSIVE FOR UPDATE TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
  WITH CHECK (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_restrictive ON public.transaction_categories;
CREATE POLICY app_delete_restrictive ON public.transaction_categories AS RESTRICTIVE FOR DELETE TO PUBLIC
  USING (public.app_business_role(business_id) = 'owner')
;
DROP POLICY IF EXISTS app_delete_permissive ON public.transaction_categories;
CREATE POLICY app_delete_permissive ON public.transaction_categories AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.app_business_role(business_id) = 'owner')
;
COMMIT;
