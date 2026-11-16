/*
# Seed Default Data

## Overview
Inserts default business settings, a 7-day weekly menu, and sample subscription plans
so the application is immediately usable after deployment.

## Changes
1. `settings` - single default row for Maa Ki Rasoi
2. `weekly_menu` - 7 days with placeholder meal items
3. `plans` - 4 sample plans (Veg, Non-Veg, Student, Custom)
*/

-- Settings (single row)
INSERT INTO settings (business_name, tagline, phone, whatsapp, email, address, google_map_url, business_timing, monthly_delivery_charge, receipt_footer, currency, admin_email)
VALUES (
  'Maa Ki Rasoi',
  'घर जैसा खाना, घर जैसा प्यार',
  '9876543210',
  '9876543210',
  'contact@maakirasoi.demo',
  'Gopalganj, Sagar (Madhya Pradesh)',
  'https://maps.google.com/?q=Gopalganj+Sagar+Madhya+Pradesh',
  'सुबह 6:00 बजे से रात 10:00 बजे तक',
  300,
  'धन्यवाद! - माा की रसोई',
  '₹',
  'contact@maakirasoi.demo'
)
ON CONFLICT (id) DO NOTHING;

-- Weekly Menu (7 days)
INSERT INTO weekly_menu (day_of_week, breakfast, lunch, dinner, sort_order) VALUES
  ('Monday', 'पोहा, चाय', 'दाल, चावल, सब्ज़ी, रोटी, सलाद', 'पनीर सब्ज़ी, रोटी, चावल, दाल', 1),
  ('Tuesday', 'पराठा, अचार, चाय', 'राजमा, चावल, रोटी, सलाद', 'आलू गोभी, रोटी, चावल, दाल', 2),
  ('Wednesday', 'इडली, सांभर, चाय', 'छोले, चावल, रोटी, सलाद', 'मिक्स वेज, रोटी, चावल, दाल', 3),
  ('Thursday', 'उपमा, चाय', 'दाल, चावल, सब्ज़ी, रोटी, सलाद', 'गोभी मटर, रोटी, चावल, दाल', 4),
  ('Friday', 'पोहा, चाय', 'कड़ी पकोड़ा, चावल, रोटी, सलाद', 'आलू मटर, रोटी, चावल, दाल', 5),
  ('Saturday', 'पराठा, अचार, चाय', 'चने, चावल, रोटी, सलाद', 'पनीर तड़का, रोटी, चावल, दाल', 6),
  ('Sunday', 'चना कुल्चा, चाय', 'विशेष थाली - दाल, चावल, सब्ज़ी, रोटी, खीर, सलाद', 'आलू पराठा, रायता, चावल, दाल', 7)
ON CONFLICT DO NOTHING;

-- Subscription Plans
INSERT INTO plans (name, duration, breakfast, lunch, dinner, veg, non_veg, is_student_plan, is_custom, monthly_subscription_charge, monthly_delivery_charge, description, benefits, is_active, sort_order) VALUES
  ('वेज प्रीमियम', 'Monthly', true, true, true, true, false, false, false, 2500, 300, 'शुद्ध शाकाहारी थाली - ब्रेकफ़ास्ट, लंच और डिनर', 'रोज़ 3 वक़्त ताज़ा भोजन\nघर जैसा स्वाद\nसाप्ताहिक मेनू बदलाव\nस्वच्छ रसोई', true, 1),
  ('नॉन-वेज स्पेशल', 'Monthly', true, true, true, false, true, false, false, 3500, 300, 'नॉन-वेज थाली - सप्ताह में 3 दिन नॉन-वेज', 'रोज़ 3 वक़्त भोजन\nसप्ताह में 3 दिन नॉन-वेज\nघर जैसा स्वाद\nस्वच्छ रसोई', true, 2),
  ('स्टूडेंट बजट', 'Monthly', false, true, true, true, false, true, false, 1800, 300, 'छात्रों के लिए किफ़ायती योजना - लंच और डिनर', 'लंच और डिनर\nछात्रों के लिए विशेष दर\nघर जैसा स्वाद\nस्वच्छ रसोई', true, 3),
  ('कस्टम प्लान', 'Monthly', false, false, false, true, true, false, true, 1500, 300, 'अपने चुने हुए भोजन के लिए कस्टम योजना', 'अपनी पसंद के भोजन\nलचीली योजना\nघर जैसा स्वाद\nस्वच्छ रसोई', true, 4)
ON CONFLICT DO NOTHING;
