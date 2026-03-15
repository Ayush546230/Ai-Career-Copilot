
export const mockResumes = [
    {
        id: 1,
        name: "Software_Engineer_Resume_v3.pdf",
        uploadedAt: "2025-03-01",
        isPrimary: true,
        atsScore: {
            overall: 78,
            breakdown: { formatting: 85, keywords: 72, experience: 80, education: 90, skills: 65 },
        },
        targetRole: "Senior Backend Engineer",
        currentSkills: ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker basics", "Git"],
        requiredSkills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes", "AWS", "System Design", "Redis"],
        missingSkills: ["Kubernetes", "AWS", "Redis"],
        skillsToImprove: [
            { skill: "System Design", currentLevel: "beginner", targetLevel: "intermediate", priority: "high" },
            { skill: "Docker", currentLevel: "beginner", targetLevel: "advanced", priority: "high" },
        ],
        suggestions: [
            { category: "Keywords", priority: "critical", issue: "Missing cloud platform keywords", recommendation: "Add specific cloud technologies you've used", exampleBefore: "Worked on cloud infrastructure", exampleAfter: "Architected microservices on AWS ECS, reducing latency by 40%" },
            { category: "Formatting", priority: "high", issue: "Inconsistent date formatting", recommendation: "Use consistent MM/YYYY format throughout", exampleBefore: "Jan 2023 - Present", exampleAfter: "01/2023 – Present" },
            { category: "Impact", priority: "high", issue: "Weak action verbs in experience section", recommendation: "Start bullets with strong action verbs", exampleBefore: "Worked on API development", exampleAfter: "Engineered 15+ RESTful APIs serving 50K daily requests" },
            { category: "Skills", priority: "medium", issue: "Skills section missing key technologies", recommendation: "Add Docker, Kubernetes, and cloud platforms", exampleBefore: "Skills: Python, SQL, Git", exampleAfter: "Skills: Python, FastAPI, PostgreSQL, Docker, AWS, Git" },
        ],
    },
    {
        id: 2,
        name: "Product_Manager_Resume.pdf",
        uploadedAt: "2025-02-20",
        isPrimary: false,
        atsScore: {
            overall: 64,
            breakdown: { formatting: 70, keywords: 58, experience: 72, education: 75, skills: 45 },
        },
        targetRole: "Product Manager",
        currentSkills: ["Product Strategy", "Agile", "JIRA", "User Research"],
        requiredSkills: ["Product Strategy", "Agile", "JIRA", "User Research", "SQL", "A/B Testing", "Roadmapping", "Stakeholder Management"],
        missingSkills: ["SQL", "A/B Testing"],
        skillsToImprove: [
            { skill: "Roadmapping", currentLevel: "intermediate", targetLevel: "advanced", priority: "medium" },
        ],
        suggestions: [
            { category: "Keywords", priority: "critical", issue: "Missing data analysis keywords", recommendation: "Add SQL and A/B testing experience", exampleBefore: "Tracked metrics", exampleAfter: "Analyzed product metrics using SQL, driving 25% retention improvement through A/B testing" },
        ],
    },
    {
        id: 3,
        name: "Data_Analyst_Resume.pdf",
        uploadedAt: "2025-02-10",
        isPrimary: false,
        atsScore: {
            overall: 82,
            breakdown: { formatting: 88, keywords: 80, experience: 85, education: 90, skills: 70 },
        },
        targetRole: "Senior Data Analyst",
        currentSkills: ["Python", "SQL", "Tableau", "Excel", "Machine Learning basics"],
        requiredSkills: ["Python", "SQL", "Tableau", "Excel", "Machine Learning", "Power BI", "Statistics"],
        missingSkills: ["Power BI"],
        skillsToImprove: [
            { skill: "Machine Learning", currentLevel: "intermediate", targetLevel: "advanced", priority: "medium" },
        ],
        suggestions: [
            { category: "Tools", priority: "medium", issue: "Power BI not mentioned", recommendation: "Add Power BI to skills if applicable", exampleBefore: "Data visualization tools", exampleAfter: "Tableau, Power BI, matplotlib – built executive dashboards for C-suite" },
        ],
    },
];

export const mockMentors = [
    { id: 1, name: "Sarah Chen", role: "Senior SWE @ Google", avatar: "SC", color: "#3D5A80", rating: 4.9, reviews: 47, expertise: ["System Design", "Backend", "Distributed Systems"], price: "$80/hr", availability: "Available", sessions: 142 },
    { id: 2, name: "Marcus Johnson", role: "Staff Eng @ Meta", avatar: "MJ", color: "#E84855", rating: 4.8, reviews: 63, expertise: ["React", "Frontend", "Performance"], price: "$90/hr", availability: "Available", sessions: 198 },
    { id: 3, name: "Priya Sharma", role: "PM @ Amazon", avatar: "PS", color: "#FF6B35", rating: 4.9, reviews: 38, expertise: ["Product Strategy", "A/B Testing", "Growth"], price: "$70/hr", availability: "Busy", sessions: 97 },
    { id: 4, name: "Alex Rivera", role: "Lead DS @ Netflix", avatar: "AR", color: "#6B46C1", rating: 5.0, reviews: 22, expertise: ["ML", "Python", "Data Science"], price: "$100/hr", availability: "Available", sessions: 54 },
    { id: 5, name: "Jordan Kim", role: "DevOps @ Spotify", avatar: "JK", color: "#059669", rating: 4.7, reviews: 51, expertise: ["Kubernetes", "AWS", "CI/CD"], price: "$75/hr", availability: "Available", sessions: 163 },
    { id: 6, name: "Diana Osei", role: "TPM @ Airbnb", avatar: "DO", color: "#DC6B19", rating: 4.8, reviews: 34, expertise: ["Project Mgmt", "Agile", "Leadership"], price: "$65/hr", availability: "Available", sessions: 89 },
];

export const faqs = [
    { q: "How does PathForge AI analyze my resume?", a: "PathForge AI uses advanced language models to parse your resume, evaluate ATS compatibility, identify skill gaps relative to your target role, and provide actionable, specific recommendations to improve your chances of landing interviews." },
    { q: "Which AI providers does PathForge use?", a: "Our AI engine supports multiple providers including Google Gemini, OpenAI GPT-4, and Anthropic Claude. We use a vendor-agnostic architecture to always route your request through the best-performing model for that specific task." },
    { q: "How accurate is the ATS scoring?", a: "Our ATS scoring system is calibrated against real Applicant Tracking Systems used by top-tier companies. We analyze formatting, keyword density, section structure, and quantifiable impact — giving you a multi-dimensional score breakdown." },
    { q: "Can I upload multiple resumes?", a: "Yes! PathForge supports multiple resume uploads. You can designate a primary resume for your dashboard overview while keeping all versions accessible for comparison and analysis." },
    { q: "How does mentor matching work?", a: "Mentors on PathForge are verified professionals from leading tech companies. You can filter by expertise, availability, and pricing. We also suggest mentors based on your identified skill gaps." },
    { q: "Is my resume data secure?", a: "Absolutely. All uploaded files are encrypted at rest and in transit. We use industry-standard security practices including JWT authentication, bcrypt password hashing, and strict access controls. Your data is never sold or shared." },
];

export const companyLogos = [
    { name: "Google", color: "#4285F4" },
    { name: "Meta", color: "#0082FB" },
    { name: "Netflix", color: "#E50914" },
    { name: "Amazon", color: "#FF9900" },
    { name: "Airbnb", color: "#FF5A5F" },
    { name: "Spotify", color: "#1DB954" },
    { name: "Microsoft", color: "#00A4EF" },
    { name: "Apple", color: "#555555" },
    { name: "Stripe", color: "#635BFF" },
    { name: "Uber", color: "#000000" },
];