-- ========================================================
-- CampusEdge Database Schema
-- Compatible with PostgreSQL 12+ (Neon, Supabase, Render, AWS RDS)
-- ========================================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name CHARACTER VARYING(100) NOT NULL,
  email CHARACTER VARYING(100) NOT NULL,
  password CHARACTER VARYING(255) NOT NULL,
  role CHARACTER VARYING(20) DEFAULT 'student'::character varying,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  branch CHARACTER VARYING(50),
  cgpa NUMERIC DEFAULT 0.00,
  backlogs INTEGER DEFAULT 0,
  dob CHARACTER VARYING(50),
  hometown CHARACTER VARYING(100),
  address CHARACTER VARYING(255)
);

-- Table: questions
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  category CHARACTER VARYING(100) NOT NULL,
  subcategory CHARACTER VARYING(100) NOT NULL,
  difficulty CHARACTER VARYING(20) NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: test_history
CREATE TABLE IF NOT EXISTS test_history (
  id SERIAL PRIMARY KEY,
  email CHARACTER VARYING(255) NOT NULL,
  category CHARACTER VARYING(100) NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  test_date CHARACTER VARYING(50) NOT NULL,
  full_data JSONB,
  tab_switches INTEGER DEFAULT 0,
  tab_switch_logs JSONB
);

-- Table: mock_test_history
CREATE TABLE IF NOT EXISTS mock_test_history (
  id SERIAL PRIMARY KEY,
  user_email CHARACTER VARYING(255),
  category CHARACTER VARYING(100),
  score INTEGER,
  total INTEGER,
  percentage INTEGER,
  test_date TEXT
);

-- Table: coding_history
CREATE TABLE IF NOT EXISTS coding_history (
  id SERIAL PRIMARY KEY,
  email CHARACTER VARYING(255) NOT NULL,
  student_name CHARACTER VARYING(255),
  problem_id CHARACTER VARYING(255),
  problem_title CHARACTER VARYING(255),
  difficulty CHARACTER VARYING(50),
  language CHARACTER VARYING(50),
  code TEXT,
  status CHARACTER VARYING(50),
  passed_count INTEGER DEFAULT 0,
  total_test_cases INTEGER DEFAULT 0,
  runtime_ms INTEGER DEFAULT 0,
  arena_mode CHARACTER VARYING(50) DEFAULT 'practice'::character varying,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tab_switches INTEGER DEFAULT 0,
  tab_switch_logs JSONB
);

-- Table: interview_history
CREATE TABLE IF NOT EXISTS interview_history (
  id SERIAL PRIMARY KEY,
  email CHARACTER VARYING(255) NOT NULL,
  role CHARACTER VARYING(255) NOT NULL,
  score INTEGER,
  feedback JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tab_switches INTEGER DEFAULT 0,
  tab_switch_logs JSONB
);

-- Table: resume_history
CREATE TABLE IF NOT EXISTS resume_history (
  id SERIAL PRIMARY KEY,
  user_email CHARACTER VARYING(255),
  target_role CHARACTER VARYING(255),
  recommended_role CHARACTER VARYING(255),
  score INTEGER,
  status CHARACTER VARYING(50),
  file_name CHARACTER VARYING(255),
  analysis_date TEXT,
  full_data JSONB
);

-- Table: roadmap_history
CREATE TABLE IF NOT EXISTS roadmap_history (
  id SERIAL PRIMARY KEY,
  email CHARACTER VARYING(255) NOT NULL,
  subject CHARACTER VARYING(255) NOT NULL,
  full_data JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: company_eligibility_history
CREATE TABLE IF NOT EXISTS company_eligibility_history (
  id SERIAL PRIMARY KEY,
  email CHARACTER VARYING(255) NOT NULL,
  company_name CHARACTER VARYING(255) NOT NULL,
  is_eligible BOOLEAN,
  match_status CHARACTER VARYING(100),
  full_data JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: admin_job_drives
CREATE TABLE IF NOT EXISTS admin_job_drives (
  id SERIAL PRIMARY KEY,
  company_name CHARACTER VARYING(255) NOT NULL,
  website CHARACTER VARYING(255),
  role CHARACTER VARYING(255) NOT NULL,
  eligibility TEXT NOT NULL,
  internship_details TEXT,
  selection_process TEXT,
  full_time_offer TEXT,
  package CHARACTER VARYING(100) NOT NULL,
  apply_link TEXT NOT NULL,
  instructions TEXT,
  deadline_timestamp TIMESTAMP WITHOUT TIME ZONE,
  deadline_text CHARACTER VARYING(100),
  notice_type CHARACTER VARYING(50) DEFAULT 'Job Drive'::character varying,
  pdf_url TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  job_location CHARACTER VARYING(255),
  is_local_only BOOLEAN DEFAULT false
);

-- Table: student_job_applications
CREATE TABLE IF NOT EXISTS student_job_applications (
  id SERIAL PRIMARY KEY,
  drive_id INTEGER,
  email CHARACTER VARYING(255) NOT NULL,
  student_name CHARACTER VARYING(255),
  additional_info TEXT,
  status CHARACTER VARYING(50) DEFAULT 'Applied'::character varying,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  screenshot_url TEXT
);

-- Table: student_streaks
CREATE TABLE IF NOT EXISTS student_streaks (
  id SERIAL PRIMARY KEY,
  email CHARACTER VARYING(255) NOT NULL,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  last_active_date CHARACTER VARYING(50),
  total_xp INTEGER DEFAULT 100,
  coins INTEGER DEFAULT 50,
  today_xp INTEGER DEFAULT 0,
  streak_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title CHARACTER VARYING(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

