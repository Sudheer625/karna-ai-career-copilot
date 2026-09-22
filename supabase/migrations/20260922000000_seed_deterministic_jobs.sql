insert into public.jobs (
  id, title, company, location, employment_type, description,
  required_skills, preferred_skills, experience_level, salary_min, salary_max,
  application_url, source
)
values
  ('00000000-0000-4000-8000-000000000001', 'Frontend Developer', 'ABC Technologies', 'Hyderabad', 'Full-time', 'Build accessible, responsive web interfaces for customer-facing products.', '{HTML,CSS,JavaScript,React}', '{TypeScript,Git}', 'Entry-level', 500000, 900000, 'https://example.com/jobs/frontend-developer', 'KARNA sample'),
  ('00000000-0000-4000-8000-000000000002', 'React Developer', 'Pixel Labs', 'Bengaluru', 'Full-time', 'Develop reusable React interfaces and collaborate with product designers.', '{JavaScript,React,CSS}', '{TypeScript,Next.js,Git}', 'Entry-level', 600000, 1100000, 'https://example.com/jobs/react-developer', 'KARNA sample'),
  ('00000000-0000-4000-8000-000000000003', 'MERN Stack Developer', 'StackWorks', 'Remote', 'Full-time', 'Deliver end-to-end features across a JavaScript web stack.', '{MongoDB,Express,React,Node.js,JavaScript}', '{TypeScript,Git}', 'Entry-level', 550000, 1000000, 'https://example.com/jobs/mern-developer', 'KARNA sample'),
  ('00000000-0000-4000-8000-000000000004', 'Python Developer', 'CodeHarbor', 'Pune', 'Full-time', 'Build maintainable Python services and data integrations.', '{Python,SQL,Git}', '{Pandas,NumPy,PostgreSQL}', 'Entry-level', 500000, 950000, 'https://example.com/jobs/python-developer', 'KARNA sample'),
  ('00000000-0000-4000-8000-000000000005', 'Data Analyst', 'InsightGrid', 'Mumbai', 'Full-time', 'Translate business questions into useful reports and analysis.', '{Python,SQL,Excel,Data Analysis}', '{Power BI,Pandas}', 'Entry-level', 450000, 850000, 'https://example.com/jobs/data-analyst', 'KARNA sample'),
  ('00000000-0000-4000-8000-000000000006', 'Machine Learning Intern', 'ModelSpring', 'Chennai', 'Internship', 'Support experiments, data preparation, and model evaluation.', '{Python,NumPy,Pandas,Machine Learning}', '{Scikit-learn,TensorFlow,SQL}', 'Internship', 150000, 300000, 'https://example.com/jobs/ml-intern', 'KARNA sample'),
  ('00000000-0000-4000-8000-000000000007', 'AI/ML Engineer', 'Neural Forge', 'Bengaluru', 'Full-time', 'Develop and evaluate machine learning systems for production use.', '{Python,NumPy,Pandas,Scikit-learn,Machine Learning}', '{TensorFlow,SQL,Git}', 'Entry-level', 700000, 1400000, 'https://example.com/jobs/ai-ml-engineer', 'KARNA sample'),
  ('00000000-0000-4000-8000-000000000008', 'Backend Developer', 'API Foundry', 'Hyderabad', 'Full-time', 'Create reliable APIs and backend services for web products.', '{Node.js,Express,JavaScript,SQL}', '{PostgreSQL,MongoDB,Git}', 'Entry-level', 550000, 1050000, 'https://example.com/jobs/backend-developer', 'KARNA sample'),
  ('00000000-0000-4000-8000-000000000009', 'Full Stack Developer', 'Productive Apps', 'Remote', 'Full-time', 'Own features from frontend interface through backend delivery.', '{React,Node.js,Express,MongoDB,JavaScript}', '{TypeScript,SQL,Git}', 'Entry-level', 650000, 1250000, 'https://example.com/jobs/full-stack-developer', 'KARNA sample'),
  ('00000000-0000-4000-8000-00000000000a', 'Software Engineer', 'LaunchPad Systems', 'Delhi', 'Full-time', 'Solve product engineering problems with a collaborative team.', '{Programming,Data Structures,Git}', '{JavaScript,Python,SQL}', 'Entry-level', 600000, 1200000, 'https://example.com/jobs/software-engineer', 'KARNA sample'),
  ('00000000-0000-4000-8000-00000000000b', 'Data Science Intern', 'Forecast AI', 'Remote', 'Internship', 'Explore datasets and prototype data science solutions.', '{Python,SQL,Statistics,Data Analysis}', '{Pandas,NumPy,Scikit-learn}', 'Internship', 150000, 300000, 'https://example.com/jobs/data-science-intern', 'KARNA sample'),
  ('00000000-0000-4000-8000-00000000000c', 'Junior Web Developer', 'Webline Studio', 'Kochi', 'Full-time', 'Implement polished websites and responsive user experiences.', '{HTML,CSS,JavaScript}', '{React,TypeScript,Git}', 'Entry-level', 350000, 700000, 'https://example.com/jobs/junior-web-developer', 'KARNA sample')
on conflict (id) do update set
  title = excluded.title,
  company = excluded.company,
  location = excluded.location,
  employment_type = excluded.employment_type,
  description = excluded.description,
  required_skills = excluded.required_skills,
  preferred_skills = excluded.preferred_skills,
  experience_level = excluded.experience_level,
  salary_min = excluded.salary_min,
  salary_max = excluded.salary_max,
  application_url = excluded.application_url,
  source = excluded.source,
  updated_at = now();
