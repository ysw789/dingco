-- 예제 이미지 테이블
CREATE TABLE example_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE example_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_example_images" ON example_images FOR SELECT USING (true);

-- submissions 테이블 확장
ALTER TABLE submissions
  ADD COLUMN example_image_id UUID REFERENCES example_images(id),
  ADD COLUMN user_prompts TEXT[] DEFAULT '{}',
  ADD COLUMN mode TEXT DEFAULT '청개구리',
  ADD COLUMN attempt_limit INTEGER,
  ADD COLUMN time_limit INTEGER;
