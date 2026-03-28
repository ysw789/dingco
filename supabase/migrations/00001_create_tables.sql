-- submissions 테이블
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  html_code TEXT NOT NULL,
  transcript TEXT,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- votes 테이블
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(submission_id, voter_id)
);

CREATE INDEX idx_submissions_vote_count ON submissions(vote_count DESC);

-- vote_count 자동 동기화 trigger
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE submissions SET vote_count = vote_count + 1 WHERE id = NEW.submission_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE submissions SET vote_count = vote_count - 1 WHERE id = OLD.submission_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vote_count
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- RLS 정책 (인증 없이 공개 접근)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "public_insert_submissions" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_votes" ON votes FOR SELECT USING (true);
CREATE POLICY "public_insert_votes" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete_votes" ON votes FOR DELETE USING (true);
