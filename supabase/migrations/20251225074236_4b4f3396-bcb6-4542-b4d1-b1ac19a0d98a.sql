-- Seed venue data for Courts, Recovery, and Studio categories
INSERT INTO public.venues (name, slug, sport, category, description, address, city, latitude, longitude, price_per_hour, rating, reviews_count, image_url, amenities, gallery_urls, opening_time, closing_time, total_courts, is_active)
VALUES
-- Courts Category (8 venues)
('Metro Football Arena', 'metro-football-arena', 'football', 'courts', 'Professional football arena with FIFA-approved turf and night lighting facilities.', '123 Sports Complex, Anna Nagar', 'Chennai', 13.0850, 80.2101, 800, 4.7, 156, '/venue-football.jpg', ARRAY['Lighting', 'Parking', 'Locker', 'Cafeteria'], ARRAY['/venue-football.jpg'], '06:00', '22:00', 3, true),

('Phoenix Sports Arena', 'phoenix-sports-arena', 'badminton', 'courts', 'State-of-the-art badminton facility with synthetic courts and air conditioning.', '45 Velachery Main Road', 'Chennai', 12.9815, 80.2180, 300, 4.8, 203, '/venue-badminton.jpg', ARRAY['Lighting', 'Parking', 'Shower', 'AC'], ARRAY['/venue-badminton.jpg'], '06:00', '22:00', 6, true),

('Stadium Cricket Nets', 'stadium-cricket-nets', 'cricket', 'courts', 'Professional cricket practice nets with bowling machines and coaching available.', '78 Stadium Road, Chepauk', 'Chennai', 13.0633, 80.2795, 600, 4.8, 189, '/venue-cricket.jpg', ARRAY['Nets', 'Lighting', 'Parking', 'Bowling Machine'], ARRAY['/venue-cricket.jpg'], '05:00', '21:00', 8, true),

('Pickleball Pro Arena', 'pickleball-pro-arena', 'pickleball', 'courts', 'Modern indoor pickleball facility with professional-grade courts.', '22 ECR Road, Neelankarai', 'Chennai', 12.9456, 80.2556, 400, 4.9, 78, '/venue-pickleball.jpg', ARRAY['Indoor', 'AC', 'Equipment', 'Coaching'], ARRAY['/venue-pickleball.jpg'], '07:00', '21:00', 4, true),

('Slam Dunk Courts', 'slam-dunk-courts', 'basketball', 'courts', 'Full-size indoor basketball courts with NBA-standard flooring.', '56 OMR, Sholinganallur', 'Chennai', 12.9010, 80.2279, 400, 4.6, 134, '/venue-basketball.jpg', ARRAY['AC', 'Parking', 'Shower', 'Scoreboard'], ARRAY['/venue-basketball.jpg'], '06:00', '22:00', 2, true),

('Spin Masters TT Club', 'spin-masters-tt-club', 'tabletennis', 'courts', 'Premium table tennis club with international standard tables and coaching.', '89 T Nagar Main Road', 'Chennai', 13.0418, 80.2341, 200, 4.8, 167, '/venue-tabletennis.jpg', ARRAY['Indoor', 'AC', 'Equipment', 'Coaching'], ARRAY['/venue-tabletennis.jpg'], '08:00', '22:00', 8, true),

('Elite Squash Center', 'elite-squash-center', 'squash', 'courts', 'World-class squash facility with glass-back championship courts.', '34 Boat Club Road', 'Chennai', 13.0827, 80.2707, 500, 4.9, 92, '/venue-squash.jpg', ARRAY['AC', 'Shower', 'Equipment', 'Pro Shop'], ARRAY['/venue-squash.jpg'], '06:00', '21:00', 4, true),

('Royal Tennis Club', 'royal-tennis-club', 'tennis', 'courts', 'Prestigious tennis club with clay and hard courts, professional coaching available.', '12 Cathedral Road', 'Chennai', 13.0569, 80.2632, 500, 4.9, 245, '/venue-tennis.jpg', ARRAY['Coaching', 'Parking', 'Café', 'Pro Shop'], ARRAY['/venue-tennis.jpg'], '05:30', '21:00', 6, true),

-- Recovery Category (5 venues)
('Aqua Wellness Pool', 'aqua-wellness-pool', 'swimming', 'recovery', 'Olympic-size heated swimming pool with aqua therapy and lap lanes.', '67 Adyar Main Road', 'Chennai', 13.0067, 80.2573, 500, 4.8, 178, '/recovery-swimming.jpg', ARRAY['Heated Pool', 'Lap Lanes', 'Aqua Therapy', 'Locker'], ARRAY['/recovery-swimming.jpg'], '05:00', '21:00', 1, true),

('Arctic Recovery Center', 'arctic-recovery-center', 'icebath', 'recovery', 'Premium cold therapy center with ice baths, contrast therapy, and guided sessions.', '23 Besant Nagar Beach Road', 'Chennai', 12.9988, 80.2685, 800, 4.9, 89, '/recovery-icebath.jpg', ARRAY['Cold Plunge', 'Contrast Therapy', 'Guided', 'Sauna'], ARRAY['/recovery-icebath.jpg'], '06:00', '20:00', 1, true),

('Serenity Massage Studio', 'serenity-massage-studio', 'massage', 'recovery', 'Luxury massage studio offering deep tissue, hot stone, and aromatherapy treatments.', '45 Khader Nawaz Khan Road', 'Chennai', 13.0589, 80.2520, 1200, 4.9, 312, '/recovery-massage.jpg', ARRAY['Deep Tissue', 'Hot Stone', 'Aromatherapy', 'Couples Room'], ARRAY['/recovery-massage.jpg'], '09:00', '21:00', 1, true),

('Nordic Sauna House', 'nordic-sauna-house', 'sauna', 'recovery', 'Authentic Finnish sauna experience with steam room and ice shower facilities.', '78 TTK Road', 'Chennai', 13.0345, 80.2589, 600, 4.7, 145, '/recovery-sauna.jpg', ARRAY['Finnish Sauna', 'Steam Room', 'Ice Shower', 'Relaxation Area'], ARRAY['/recovery-sauna.jpg'], '07:00', '22:00', 1, true),

('Zen Yoga Studio', 'zen-yoga-studio', 'yoga', 'recovery', 'Peaceful yoga studio offering Hatha, Vinyasa, and meditation classes.', '12 Greenways Road', 'Chennai', 13.0123, 80.2601, 400, 4.8, 234, '/recovery-yoga.jpg', ARRAY['Hatha', 'Vinyasa', 'Meditation', 'Mats Provided'], ARRAY['/recovery-yoga.jpg'], '05:30', '20:00', 1, true),

-- Studio Category (2 venues)
('Harmony Yoga Studio', 'harmony-yoga-studio', 'yoga', 'studio', 'Premium yoga studio with certified instructors and all-level classes.', '56 Nungambakkam High Road', 'Chennai', 13.0615, 80.2380, 400, 4.9, 287, '/studio-yoga.jpg', ARRAY['AC', 'Mats Provided', 'Showers', 'Props'], ARRAY['/studio-yoga.jpg'], '05:00', '21:00', 1, true),

('PowerFit Gym', 'powerfit-gym', 'gym', 'studio', 'Full-service fitness center with cardio, weights, and personal training.', '34 Anna Salai', 'Chennai', 13.0678, 80.2510, 1500, 4.8, 456, '/studio-gym.jpg', ARRAY['Cardio', 'Weights', 'Trainer', 'Steam Room'], ARRAY['/studio-gym.jpg'], '05:00', '23:00', 1, true);