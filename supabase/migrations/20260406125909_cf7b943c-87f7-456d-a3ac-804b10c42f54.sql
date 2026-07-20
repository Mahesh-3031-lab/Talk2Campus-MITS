
-- Add location column to canteen_vendors
ALTER TABLE public.canteen_vendors ADD COLUMN IF NOT EXISTS location_tag text;

-- Delete existing menu items for old vendors
DELETE FROM canteen_order_items WHERE order_id IN (
  SELECT id FROM canteen_orders WHERE vendor_id IN (
    SELECT id FROM canteen_vendors WHERE name IN ('Hostel Mess','Juice Center','Night Canteen','Snack Point')
  )
);
DELETE FROM canteen_orders WHERE vendor_id IN (
  SELECT id FROM canteen_vendors WHERE name IN ('Hostel Mess','Juice Center','Night Canteen','Snack Point')
);
DELETE FROM menu_items WHERE vendor_id IN (
  SELECT id FROM canteen_vendors WHERE name IN ('Hostel Mess','Juice Center','Night Canteen','Snack Point')
);
DELETE FROM canteen_vendors WHERE name IN ('Hostel Mess','Juice Center','Night Canteen','Snack Point');

-- Update Main Canteen
UPDATE canteen_vendors SET
  cuisine_type = 'Full Meals & Breakfast',
  location_tag = 'Opposite side near NPN Block',
  prep_time_mins = 20,
  rating = 4.2
WHERE name = 'Main Canteen';

-- Insert Ekadant's Cafe
INSERT INTO canteen_vendors (name, cuisine_type, location_tag, prep_time_mins, rating, is_open)
VALUES ('Ekadant''s Cafe', 'Snacks, Fast Food & Beverages', 'Beside KK Block', 10, 4.5, true);

-- Insert Lickies Ice Creams & Cool Drinks
INSERT INTO canteen_vendors (name, cuisine_type, location_tag, prep_time_mins, rating, is_open)
VALUES ('Lickies Ice Creams & Cool Drinks', 'Ice Creams & Cool Drinks', 'Beside Ekadant''s Cafe, near KK Block', 5, 4.3, true);

-- Seed menu items for Ekadant's Cafe
INSERT INTO menu_items (vendor_id, name, description, price, category, is_available) VALUES
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Veg Burger', 'Classic veggie patty with fresh veggies', 60, 'snacks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Chicken Burger', 'Juicy chicken patty with lettuce & mayo', 90, 'non_veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Veg Sandwich', 'Grilled sandwich with cheese & veggies', 50, 'snacks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Paneer Sandwich', 'Grilled paneer with mint chutney', 70, 'snacks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Maggi', 'Classic 2-minute noodles with veggies', 40, 'snacks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Cheese Maggi', 'Maggi loaded with extra cheese', 60, 'snacks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Hot Coffee', 'Freshly brewed filter coffee', 30, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Tea', 'Indian masala chai', 20, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Cold Coffee', 'Iced coffee with cream', 50, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Lemon Soda', 'Refreshing lime & soda', 30, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'French Fries', 'Crispy golden fries with ketchup', 60, 'snacks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Ekadant''s Cafe'), 'Samosa', 'Crispy potato-filled samosa (2 pcs)', 20, 'veg', true);

-- Seed menu items for Lickies
INSERT INTO menu_items (vendor_id, name, description, price, category, is_available) VALUES
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Vanilla Ice Cream', 'Classic vanilla scoop', 40, 'veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Chocolate Ice Cream', 'Rich chocolate scoop', 40, 'veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Butterscotch Sundae', 'Butterscotch with nuts & caramel', 70, 'veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Mango Milkshake', 'Thick mango milkshake', 60, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Chocolate Milkshake', 'Creamy chocolate shake', 60, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Oreo Shake', 'Oreo cookie shake with ice cream', 80, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Fresh Lime Juice', 'Chilled lime with mint', 30, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Watermelon Juice', 'Fresh watermelon juice', 40, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Pineapple Juice', 'Sweet pineapple juice', 40, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Cool Blue', 'Blue curacao flavored cooler', 50, 'drinks', true),
((SELECT id FROM canteen_vendors WHERE name = 'Lickies Ice Creams & Cool Drinks'), 'Falooda', 'Rose falooda with ice cream', 90, 'veg', true);

-- Seed menu items for Main Canteen
INSERT INTO menu_items (vendor_id, name, description, price, category, is_available) VALUES
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Veg Meals', 'Rice, dal, sambar, rasam, veggie & curd', 70, 'meals', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Non-Veg Meals', 'Rice, chicken curry, dal & curd', 100, 'meals', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Egg Fried Rice', 'Spicy egg fried rice', 60, 'non_veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Chicken Fried Rice', 'Chicken fried rice with raita', 90, 'non_veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Veg Biryani', 'Fragrant veg biryani with raita', 70, 'meals', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Chicken Biryani', 'Hyderabadi chicken biryani', 110, 'meals', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Idli (4 pcs)', 'Soft idli with chutney & sambar', 30, 'veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Dosa', 'Crispy dosa with chutney & sambar', 40, 'veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Poori (3 pcs)', 'Poori with potato curry', 40, 'veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Chapathi (2 pcs)', 'Soft chapathi with curry', 40, 'veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Egg Curry', 'Spicy egg curry', 50, 'non_veg', true),
((SELECT id FROM canteen_vendors WHERE name = 'Main Canteen'), 'Curd Rice', 'Cool curd rice', 40, 'veg', true);
