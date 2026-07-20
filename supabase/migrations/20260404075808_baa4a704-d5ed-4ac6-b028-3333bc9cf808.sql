
-- Add user_id and email to canteen_vendors
ALTER TABLE public.canteen_vendors
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email text;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_canteen_vendors_user_id ON public.canteen_vendors(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_canteen_vendors_email ON public.canteen_vendors(email) WHERE email IS NOT NULL;

-- Drop existing overly-permissive policies on menu_items
DROP POLICY IF EXISTS "Public insert menu" ON public.menu_items;
DROP POLICY IF EXISTS "Public update menu" ON public.menu_items;
DROP POLICY IF EXISTS "Public delete menu" ON public.menu_items;

-- Vendor can insert their own menu items
CREATE POLICY "Vendors can insert own menu items"
ON public.menu_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.canteen_vendors
    WHERE canteen_vendors.id = menu_items.vendor_id
    AND canteen_vendors.user_id = auth.uid()
  )
);

-- Vendor can update their own menu items
CREATE POLICY "Vendors can update own menu items"
ON public.menu_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.canteen_vendors
    WHERE canteen_vendors.id = menu_items.vendor_id
    AND canteen_vendors.user_id = auth.uid()
  )
);

-- Vendor can delete their own menu items
CREATE POLICY "Vendors can delete own menu items"
ON public.menu_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.canteen_vendors
    WHERE canteen_vendors.id = menu_items.vendor_id
    AND canteen_vendors.user_id = auth.uid()
  )
);

-- Drop overly-permissive vendor update policy
DROP POLICY IF EXISTS "Public update vendors" ON public.canteen_vendors;

-- Vendor can update own record
CREATE POLICY "Vendors can update own record"
ON public.canteen_vendors FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
