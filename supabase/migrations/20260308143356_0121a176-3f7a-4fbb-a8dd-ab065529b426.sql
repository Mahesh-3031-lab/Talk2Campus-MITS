
-- Enums
CREATE TYPE public.menu_category AS ENUM ('veg', 'non_veg', 'snacks', 'meals', 'drinks');
CREATE TYPE public.order_status AS ENUM ('received', 'preparing', 'ready', 'completed');

-- Canteen vendors
CREATE TABLE public.canteen_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisine_type text NOT NULL DEFAULT 'Multi-cuisine',
  is_open boolean NOT NULL DEFAULT true,
  prep_time_mins integer NOT NULL DEFAULT 15,
  rating numeric(2,1) NOT NULL DEFAULT 4.0,
  image_url text,
  vendor_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Menu items
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.canteen_vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(8,2) NOT NULL,
  image_url text,
  category public.menu_category NOT NULL DEFAULT 'meals',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.canteen_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_roll_number text NOT NULL,
  vendor_id uuid NOT NULL REFERENCES public.canteen_vendors(id),
  total_cost numeric(8,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Order items
CREATE TABLE public.canteen_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.canteen_orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(8,2) NOT NULL
);

-- RLS: canteen_vendors
ALTER TABLE public.canteen_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read vendors" ON public.canteen_vendors FOR SELECT USING (true);
CREATE POLICY "Public insert vendors" ON public.canteen_vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update vendors" ON public.canteen_vendors FOR UPDATE USING (true);

-- RLS: menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menu" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Public insert menu" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update menu" ON public.menu_items FOR UPDATE USING (true);
CREATE POLICY "Public delete menu" ON public.menu_items FOR DELETE USING (true);

-- RLS: canteen_orders
ALTER TABLE public.canteen_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read orders" ON public.canteen_orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.canteen_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON public.canteen_orders FOR UPDATE USING (true);

-- RLS: canteen_order_items
ALTER TABLE public.canteen_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read order items" ON public.canteen_order_items FOR SELECT USING (true);
CREATE POLICY "Public insert order items" ON public.canteen_order_items FOR INSERT WITH CHECK (true);

-- Realtime for order tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.canteen_orders;

-- Auto-cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_orders()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.canteen_orders WHERE expires_at < now();
$$;
