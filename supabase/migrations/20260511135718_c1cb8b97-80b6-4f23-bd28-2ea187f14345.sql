
-- Helper: ensure caller owns the vendor row
CREATE OR REPLACE FUNCTION public._assert_vendor_owner(_vendor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.canteen_vendors
    WHERE id = _vendor_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden: caller does not own this vendor';
  END IF;
END;
$$;

-- INSERT
CREATE OR REPLACE FUNCTION public.insert_menu_item_secure(
  _vendor_id uuid,
  _name text,
  _description text,
  _price numeric,
  _category menu_category,
  _is_available boolean,
  _image_url text
)
RETURNS menu_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.menu_items;
BEGIN
  PERFORM public._assert_vendor_owner(_vendor_id);
  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF _price IS NULL OR _price < 0 THEN
    RAISE EXCEPTION 'Price must be >= 0';
  END IF;

  INSERT INTO public.menu_items (vendor_id, name, description, price, category, is_available, image_url)
  VALUES (_vendor_id, trim(_name), _description, _price, _category, COALESCE(_is_available, true), _image_url)
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

-- UPDATE
CREATE OR REPLACE FUNCTION public.update_menu_item_secure(
  _id uuid,
  _name text,
  _description text,
  _price numeric,
  _category menu_category,
  _is_available boolean,
  _image_url text
)
RETURNS menu_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _vendor uuid;
  _row public.menu_items;
BEGIN
  SELECT vendor_id INTO _vendor FROM public.menu_items WHERE id = _id;
  IF _vendor IS NULL THEN
    RAISE EXCEPTION 'Menu item not found';
  END IF;
  PERFORM public._assert_vendor_owner(_vendor);

  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF _price IS NULL OR _price < 0 THEN
    RAISE EXCEPTION 'Price must be >= 0';
  END IF;

  UPDATE public.menu_items
  SET name = trim(_name),
      description = _description,
      price = _price,
      category = _category,
      is_available = COALESCE(_is_available, true),
      image_url = _image_url
  WHERE id = _id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

-- DELETE
CREATE OR REPLACE FUNCTION public.delete_menu_item_secure(_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _vendor uuid;
BEGIN
  SELECT vendor_id INTO _vendor FROM public.menu_items WHERE id = _id;
  IF _vendor IS NULL THEN
    RAISE EXCEPTION 'Menu item not found';
  END IF;
  PERFORM public._assert_vendor_owner(_vendor);

  DELETE FROM public.menu_items WHERE id = _id;
  RETURN _id;
END;
$$;
