const majors = [
  { value: 'Undecided', label: 'Undecided' },
  { value: 'Accounting', label: 'Accounting' },
  { value: 'Advertising', label: 'Advertising' },
  { value: 'Agribusiness', label: 'Agribusiness' },
  { value: 'Agriculture (general)', label: 'Agriculture (general)' },
  { value: 'Agronomy & Plant Science', label: 'Agronomy & Plant Science' },
  { value: 'American Studies', label: 'American Studies' },
  { value: 'Animal Science', label: 'Animal Science' },
  { value: 'Anthropological Science', label: 'Anthropological Science' },
  { value: 'Anthropology', label: 'Anthropology' },
  { value: 'Aquaculture & Fisheries', label: 'Aquaculture & Fisheries' },
  { value: 'Architecture', label: 'Architecture' },
  { value: 'Art', label: 'Art' },
  { value: 'Art History & Theory', label: 'Art History & Theory' },
  { value: 'Asian Studies', label: 'Asian Studies' },
  { value: 'Astronomy', label: 'Astronomy' },
  { value: 'Aviation', label: 'Aviation' },
  { value: 'Aviation Management', label: 'Aviation Management' },
  { value: 'Biblical Studies', label: 'Biblical Studies' },
  { value: 'Biochemistry', label: 'Biochemistry' },
  { value: 'Biochemistry & Molecular Biology', label: 'Biochemistry & Molecular Biology' },
  { value: 'Bioinformatics', label: 'Bioinformatics' },
  { value: 'Biology (general)', label: 'Biology (general)' },
  { value: 'Biomedical Engineering', label: 'Biomedical Engineering' },
  {
    value: 'Biomedical Sciences (not elsewhere classified)',
    label: 'Biomedical Sciences (not elsewhere classified)',
  },
  { value: 'Biotechnology', label: 'Biotechnology' },
  { value: 'Biophysics', label: 'Biophysics' },
  { value: 'Botany', label: 'Botany' },
  { value: 'Business Administration', label: 'Business Administration' },
  { value: 'Chemical & Process Engineering', label: 'Chemical & Process Engineering' },
  { value: 'Chemical & Biomolecular Engineering', label: 'Chemical & Biomolecular Engineering' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Chinese Studies', label: 'Chinese Studies' },
  { value: 'Christian Thought & History', label: 'Christian Thought & History' },
  { value: 'Civil Engineering', label: 'Civil Engineering' },
  { value: 'Classical Studies', label: 'Classical Studies' },
  { value: 'Clothing & Textiles', label: 'Clothing & Textiles' },
  { value: 'Cognitive Science', label: 'Cognitive Science' },
  { value: 'Commercial Law', label: 'Commercial Law' },
  { value: 'Communication & Professional Writing', label: 'Communication & Professional Writing' },
  { value: 'Communication Studies', label: 'Communication Studies' },
  { value: 'Computer Engineering', label: 'Computer Engineering' },
  { value: 'Computer Information Systems', label: 'Computer Information Systems' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Conflict Resolution', label: 'Conflict Resolution' },
  { value: 'Construction & Project Management', label: 'Construction & Project Management' },
  { value: 'Counselling', label: 'Counselling' },
  { value: 'Creative Producing', label: 'Creative Producing' },
  { value: 'Creative Writing', label: 'Creative Writing' },
  { value: 'Credential Programs', label: 'Credential Programs' },
  { value: 'Criminology & Justice', label: 'Criminology & Justice' },
  { value: 'Cultural Studies', label: 'Cultural Studies' },
  { value: 'Dance', label: 'Dance' },
  { value: 'Defence Studies', label: 'Defence Studies' },
  { value: 'Dental Technology', label: 'Dental Technology' },
  { value: 'Dentistry', label: 'Dentistry' },
  { value: 'Design (general)', label: 'Design (general)' },
  { value: 'Digital Arts', label: 'Digital Arts' },
  { value: 'Drama / Theatre Studies', label: 'Drama / Theatre Studies' },
  { value: 'Earth Science (general)', label: 'Earth Science (general)' },
  { value: 'Ecology', label: 'Ecology' },
  { value: 'e-Commerce', label: 'e-Commerce' },
  { value: 'Economics', label: 'Economics' },
  { value: 'Education Studies', label: 'Education Studies' },
  { value: 'Electrical Engineering', label: 'Electrical Engineering' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Energy Studies & Management', label: 'Energy Studies & Management' },
  { value: 'Engineering Science', label: 'Engineering Science' },
  { value: 'English', label: 'English' },
  { value: 'English as a Second Language', label: 'English as a Second Language' },
  { value: 'Entrepreneurship', label: 'Entrepreneurship' },
  {
    value: 'Environmental & Natural Resources Engineering',
    label: 'Environmental & Natural Resources Engineering',
  },
  { value: 'Environmental Health', label: 'Environmental Health' },
  { value: 'Environmental Science', label: 'Environmental Science' },
  { value: 'Environmental Science & Policy', label: 'Environmental Science & Policy' },
  { value: 'Environmental Studies', label: 'Environmental Studies' },
  { value: 'Ethics', label: 'Ethics' },
  { value: 'European Languages & Cultures', label: 'European Languages & Cultures' },
  { value: 'European Studies', label: 'European Studies' },
  { value: 'Fashion Design', label: 'Fashion Design' },
  { value: 'Film & Media Studies', label: 'Film & Media Studies' },
  { value: 'Film-making', label: 'Film-making' },
  { value: 'Film Production', label: 'Film Production' },
  { value: 'Film Studies', label: 'Film Studies' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Fine Arts', label: 'Fine Arts' },
  { value: 'Food Science', label: 'Food Science' },
  { value: 'Forensic Analytical Science', label: 'Forensic Analytical Science' },
  { value: 'Forestry', label: 'Forestry' },
  { value: 'French', label: 'French' },
  { value: 'Gender Studies', label: 'Gender Studies' },
  { value: 'Genetics', label: 'Genetics' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Geology', label: 'Geology' },
  { value: 'German', label: 'German' },
  { value: 'Graphic Design', label: 'Graphic Design' },
  { value: 'Greek', label: 'Greek' },
  { value: 'Health Promotion', label: 'Health Promotion' },
  { value: 'Health Sciences', label: 'Health Sciences' },
  { value: 'History', label: 'History' },
  { value: 'Hospitality Management', label: 'Hospitality Management' },
  { value: 'Human Development Studies', label: 'Human Development Studies' },
  { value: 'Human Nutrition', label: 'Human Nutrition' },
  { value: 'Human Resource Management', label: 'Human Resource Management' },
  { value: 'Information Science', label: 'Information Science' },
  { value: 'International Business', label: 'International Business' },
  { value: 'International Relations', label: 'International Relations' },
  { value: 'International Studies', label: 'International Studies' },
  { value: 'Interpreting & Translating', label: 'Interpreting & Translating' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Japanese Studies', label: 'Japanese Studies' },
  { value: 'Journalism', label: 'Journalism' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Quantity Surveying', label: 'Quantity Surveying' },
  { value: 'Web & Digital Design', label: 'Web & Digital Design' },
  { value: 'Zoology', label: 'Zoology' },
  { value: 'Labour & Industrial Relations', label: 'Labour & Industrial Relations' },
  { value: 'Land Use Planning & Management', label: 'Land Use Planning & Management' },
  { value: 'Latin', label: 'Latin' },
  { value: 'Law', label: 'Law' },
  { value: 'Linguistics', label: 'Linguistics' },
  { value: 'Management', label: 'Management' },
  { value: 'Māori Development', label: 'Māori Development' },
  { value: 'Māori Health', label: 'Māori Health' },
  { value: 'Māori Language / Te Reo Māori', label: 'Māori Language / Te Reo Māori' },
  { value: 'Māori Media Studies', label: 'Māori Media Studies' },
  { value: 'Māori Studies', label: 'Māori Studies' },
  { value: 'Māori Visual Arts', label: 'Māori Visual Arts' },
  { value: 'Marine Biology', label: 'Marine Biology' },
  { value: 'Marine Science', label: 'Marine Science' },
  { value: 'Maritime Engineering', label: 'Maritime Engineering' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Materials Science', label: 'Materials Science' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
  { value: 'Mechatronics', label: 'Mechatronics' },
  { value: 'Medical Laboratory Science', label: 'Medical Laboratory Science' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Microbiology', label: 'Microbiology' },
  { value: 'Midwifery', label: 'Midwifery' },
  { value: 'Music Composition', label: 'Music Composition' },
  { value: 'Music Performance', label: 'Music Performance' },
  { value: 'Music Studies', label: 'Music Studies' },
  { value: 'Nanoscience', label: 'Nanoscience' },
  { value: 'Neuroscience', label: 'Neuroscience' },
  { value: 'New Zealand Sign Language', label: 'New Zealand Sign Language' },
  { value: 'Nursing', label: 'Nursing' },
  {
    value: 'Occupational Therapy & Rehabilitation',
    label: 'Occupational Therapy & Rehabilitation',
  },
  { value: 'Optometry', label: 'Optometry' },
  { value: 'Oral Health', label: 'Oral Health' },
  { value: 'Pacific Island Studies', label: 'Pacific Island Studies' },
  { value: 'Paramedicine', label: 'Paramedicine' },
  { value: 'Pastoral Studies', label: 'Pastoral Studies' },
  { value: 'Peace Studies', label: 'Peace Studies' },
  { value: 'Pharmacology', label: 'Pharmacology' },
  { value: 'Pharmacy', label: 'Pharmacy' },
  { value: 'Philosophy', label: 'Philosophy' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Physics & Computational Science', label: 'Physics & Computational Science' },
  { value: 'Physiology', label: 'Physiology' },
  { value: 'Physiotherapy', label: 'Physiotherapy' },
  { value: 'Podiatry', label: 'Podiatry' },
  { value: 'Political Studies', label: 'Political Studies' },
  { value: 'Political Science', label: 'Political Science' },
  { value: 'Population & Development Studies', label: 'Population & Development Studies' },
  { value: 'Population Health', label: 'Population Health' },
  { value: 'Pre-Health', label: 'Pre-Health' },
  { value: 'Pre-Law', label: 'Pre-Law' },
  { value: 'Product & Industrial Design', label: 'Product & Industrial Design' },
  { value: 'Psychology', label: 'Psychology' },
  { value: 'Public Health', label: 'Public Health' },
  { value: 'Public Policy', label: 'Public Policy' },
  { value: 'Public Relations', label: 'Public Relations' },
  { value: 'Public Relations & Advertising', label: 'Public Relations & Advertising' },
  { value: 'Radiation Therapy', label: 'Radiation Therapy' },
  { value: 'Radio & TV Production & Broadcasting', label: 'Radio & TV Production & Broadcasting' },
  { value: 'Religious Studies', label: 'Religious Studies' },
  { value: 'Russian', label: 'Russian' },
  { value: "Samoan Studies / Fa'asamoa", label: "Samoan Studies / Fa'asamoa" },
  { value: 'Screen Acting', label: 'Screen Acting' },
  { value: 'Screenwriting', label: 'Screenwriting' },
  { value: 'Social Policy', label: 'Social Policy' },
  { value: 'Social Science (general)', label: 'Social Science (general)' },
  { value: 'Social Work', label: 'Social Work' },
  { value: 'Sociology', label: 'Sociology' },
  { value: 'Software Engineering', label: 'Software Engineering' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Speech & Language Therapy', label: 'Speech & Language Therapy' },
  { value: 'Sport & Exercise Science', label: 'Sport & Exercise Science' },
  { value: 'Sport & Leisure Studies & Management', label: 'Sport & Leisure Studies & Management' },
  { value: 'Sport Coaching', label: 'Sport Coaching' },
  { value: 'Statistics', label: 'Statistics' },
  { value: 'Strategic & Corporate Communication', label: 'Strategic & Corporate Communication' },
  { value: 'Studio Art', label: 'Studio Art' },
  { value: 'Supply Chain Management', label: 'Supply Chain Management' },
  { value: 'Surveying', label: 'Surveying' },
  { value: 'Taxation', label: 'Taxation' },
  { value: 'Teaching – Early Childhood', label: 'Teaching – Early Childhood' },
  { value: 'Teaching – Māori Language', label: 'Teaching – Māori Language' },
  { value: 'Teaching – Physical Education', label: 'Teaching – Physical Education' },
  { value: 'Teaching – Primary', label: 'Teaching – Primary' },
  { value: 'Teaching – Secondary', label: 'Teaching – Secondary' },
  { value: 'Teaching – Technology', label: 'Teaching – Technology' },
  { value: 'Television Writing & Production', label: 'Television Writing & Production' },
  { value: 'Theology', label: 'Theology' },
  { value: 'Tourism', label: 'Tourism' },
  { value: 'Valuation & Property Management', label: 'Valuation & Property Management' },
  { value: 'Veterinary Science & Technology', label: 'Veterinary Science & Technology' },
  { value: 'Writing Seminars', label: 'Writing Seminars' },
];

export default majors;
