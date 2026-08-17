/* JobFinder — Job Database & Matching Engine */

const JobDB = {

  companies: [
    { name: 'TechNova', emoji: '🚀' },
    { name: 'DataFlow', emoji: '📊' },
    { name: 'CloudSync', emoji: '☁️' },
    { name: 'CodeCraft', emoji: '🛠️' },
    { name: 'PixelPerfect', emoji: '🎨' },
    { name: 'ByteForce', emoji: '⚡' },
    { name: 'InnoLab', emoji: '🔬' },
    { name: 'SoftWave', emoji: '🌊' },
    { name: 'NetPulse', emoji: '📡' },
    { name: 'GreenTech', emoji: '🌿' },
    { name: 'FinEdge', emoji: '💰' },
    { name: 'MediCore', emoji: '🏥' },
    { name: 'EduSpark', emoji: '📚' },
    { name: 'UrbanHub', emoji: '🏙️' },
    { name: 'AgileWorks', emoji: '🔄' }
  ],

  locations: [
    'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Querétaro',
    'Cancún', 'Mérida', 'Tijuana', 'León', 'Oaxaca',
    'Bogotá', 'Lima', 'Buenos Aires', 'Santiago', 'Medellín',
    'Madrid', 'Barcelona', 'Buenos Aires', 'São Paulo',
    'Remote', 'Global'
  ],

  salaryRanges: {
    junior: { min: 15000, max: 30000 },
    mid: { min: 30000, max: 55000 },
    senior: { min: 55000, max: 90000 },
    lead: { min: 80000, max: 130000 }
  },

  _skillMap: {
    'javascript': ['Frontend Developer', 'Full Stack Developer', 'React Developer', 'Node.js Developer', 'Vue.js Developer'],
    'typescript': ['Frontend Developer', 'Full Stack Developer', 'Backend Developer', 'Angular Developer'],
    'react': ['React Developer', 'Frontend Developer', 'UI Engineer', 'Full Stack Developer'],
    'vue': ['Vue.js Developer', 'Frontend Developer', 'Full Stack Developer'],
    'angular': ['Angular Developer', 'Frontend Developer', 'Enterprise Developer'],
    'node.js': ['Backend Developer', 'Full Stack Developer', 'API Developer'],
    'python': ['Backend Developer', 'Data Engineer', 'ML Engineer', 'Python Developer'],
    'java': ['Backend Developer', 'Java Developer', 'Enterprise Developer', 'Android Developer'],
    'php': ['PHP Developer', 'WordPress Developer', 'Laravel Developer'],
    'ruby': ['Ruby Developer', 'Full Stack Developer'],
    'go': ['Backend Developer', 'Go Developer', 'Systems Engineer'],
    'rust': ['Systems Developer', 'Rust Developer', 'Blockchain Developer'],
    'sql': ['Database Administrator', 'Data Analyst', 'Backend Developer'],
    'mongodb': ['Backend Developer', 'Database Engineer'],
    'docker': ['DevOps Engineer', 'Backend Developer', 'Cloud Engineer'],
    'kubernetes': ['DevOps Engineer', 'Cloud Engineer', 'Platform Engineer'],
    'aws': ['Cloud Engineer', 'AWS Architect', 'DevOps Engineer'],
    'azure': ['Cloud Engineer', 'Azure Developer', 'DevOps Engineer'],
    'gcp': ['Cloud Engineer', 'GCP Architect'],
    'linux': ['Systems Administrator', 'DevOps Engineer', 'Backend Developer'],
    'git': ['Software Developer', 'Full Stack Developer'],
    'html': ['Frontend Developer', 'Web Developer'],
    'css': ['Frontend Developer', 'UI Developer', 'Web Developer'],
    'sass': ['Frontend Developer', 'UI Developer'],
    'figma': ['UI/UX Designer', 'Product Designer', 'Frontend Developer'],
    'photoshop': ['Graphic Designer', 'UI Designer'],
    'illustrator': ['Graphic Designer', 'UI Designer'],
    'design': ['UI/UX Designer', 'Product Designer'],
    'ux': ['UX Researcher', 'Product Designer', 'UI/UX Designer'],
    'testing': ['QA Engineer', 'Test Engineer', 'SDET'],
    'cypress': ['QA Engineer', 'Automation Engineer'],
    'selenium': ['QA Engineer', 'Automation Engineer'],
    'jest': ['QA Engineer', 'Frontend Developer'],
    'machine learning': ['ML Engineer', 'Data Scientist', 'AI Engineer'],
    'ai': ['AI Engineer', 'ML Engineer', 'Data Scientist'],
    'data science': ['Data Scientist', 'Data Analyst', 'ML Engineer'],
    'tensorflow': ['ML Engineer', 'AI Engineer'],
    'flutter': ['Mobile Developer', 'Flutter Developer'],
    'react native': ['Mobile Developer', 'React Native Developer'],
    'swift': ['iOS Developer', 'Mobile Developer'],
    'kotlin': ['Android Developer', 'Backend Developer'],
    'dart': ['Flutter Developer', 'Mobile Developer'],
    'graphql': ['API Developer', 'Full Stack Developer'],
    'rest': ['API Developer', 'Backend Developer'],
    'microservices': ['Backend Architect', 'Senior Backend Developer'],
    'agile': ['Scrum Master', 'Project Manager', 'Team Lead'],
    'scrum': ['Scrum Master', 'Agile Coach'],
    'project management': ['Project Manager', 'Product Manager', 'Program Manager'],
    'marketing': ['Marketing Specialist', 'Digital Marketing Manager'],
    'seo': ['SEO Specialist', 'Digital Marketing Manager'],
    'sales': ['Sales Representative', 'Business Development'],
    'english': [],
    'communication': [],
    'leadership': ['Team Lead', 'Engineering Manager', 'Tech Lead'],
    'problem solving': [],
    'teamwork': [],
    'excel': ['Data Analyst', 'Financial Analyst'],
    'powerpoint': [],
    'word': [],
    'c++': ['Systems Developer', 'Game Developer', 'Embedded Developer'],
    'c#': ['.NET Developer', 'Game Developer', 'Backend Developer'],
    '.net': ['.NET Developer', 'Backend Developer'],
    'blockchain': ['Blockchain Developer', 'Web3 Engineer'],
    'web3': ['Web3 Engineer', 'Blockchain Developer'],
    'security': ['Security Engineer', 'Cybersecurity Analyst'],
    'devops': ['DevOps Engineer', 'SRE', 'Platform Engineer'],
    'sre': ['Site Reliability Engineer', 'DevOps Engineer'],
    'terraform': ['DevOps Engineer', 'Cloud Engineer'],
    'ci/cd': ['DevOps Engineer', 'Platform Engineer'],
    'penetration testing': ['Security Engineer', 'Penetration Tester'],
    'wordpress': ['WordPress Developer', 'Full Stack Developer'],
    'shopify': ['Shopify Developer', 'E-commerce Developer'],
    'salesforce': ['Salesforce Developer', 'CRM Developer'],
    'sap': ['SAP Consultant', 'Enterprise Developer'],
    'erp': ['ERP Consultant', 'Business Analyst'],
    'crm': ['CRM Developer', 'Sales Operations'],
    'support': ['IT Support', 'Technical Support'],
    'helpdesk': ['Help Desk Technician', 'IT Support'],
    'networking': ['Network Engineer', 'Systems Administrator'],
    'database': ['Database Administrator', 'Data Engineer'],
    'etl': ['Data Engineer', 'ETL Developer'],
    'power bi': ['Data Analyst', 'BI Developer'],
    'tableau': ['Data Analyst', 'BI Developer'],
    'analytics': ['Data Analyst', 'Business Analyst'],
    'product management': ['Product Manager', 'Product Owner'],
    'ux research': ['UX Researcher', 'Product Designer'],
    'motion design': ['Motion Designer', 'Animator'],
    'video editing': ['Video Editor', 'Content Creator'],
    'copywriting': ['Copywriter', 'Content Writer'],
    'technical writing': ['Technical Writer', 'Documentation Specialist'],
    'recruiting': ['Recruiter', 'Talent Acquisition'],
    'hr': ['HR Specialist', 'People Operations'],
    'accounting': ['Accountant', 'Financial Analyst'],
    'finance': ['Financial Analyst', 'Finance Manager'],
    'legal': ['Legal Counsel', 'Paralegal'],
    'architecture': ['Solutions Architect', 'Enterprise Architect']
  },

  _titles: [
    { title: 'Frontend Developer', desc: 'Desarrollar interfaces de usuario modernas y responsivas usando tecnologías web actuales.', req: ['JavaScript', 'HTML', 'CSS', 'React'] },
    { title: 'Backend Developer', desc: 'Construir y mantener APIs y servicios backend escalables y robustos.', req: ['Node.js', 'Python', 'SQL', 'REST'] },
    { title: 'Full Stack Developer', desc: 'Desarrollar aplicaciones completas tanto en frontend como en backend.', req: ['JavaScript', 'React', 'Node.js', 'SQL'] },
    { title: 'Mobile Developer', desc: 'Crear aplicaciones móviles nativas o multiplataforma de alta calidad.', req: ['React', 'Flutter'] },
    { title: 'DevOps Engineer', desc: 'Automatizar infraestructura, CI/CD y asegurar la disponibilidad de servicios.', req: ['Docker', 'AWS', 'Linux', 'CI/CD'] },
    { title: 'Data Scientist', desc: 'Analizar datos complejos y construir modelos predictivos con machine learning.', req: ['Python', 'Machine Learning', 'SQL'] },
    { title: 'ML Engineer', desc: 'Implementar y desplegar modelos de machine learning en producción.', req: ['Python', 'TensorFlow', 'Docker'] },
    { title: 'Cloud Engineer', desc: 'Diseñar, implementar y gestionar infraestructura en la nube.', req: ['AWS', 'Docker', 'Linux'] },
    { title: 'QA Engineer', desc: 'Asegurar la calidad del software mediante testing automatizado y manual.', req: ['Testing', 'JavaScript'] },
    { title: 'UI/UX Designer', desc: 'Diseñar experiencias de usuario intuitivas y atractivas.', req: ['Figma', 'Design', 'UX'] },
    { title: 'Product Manager', desc: 'Definir la visión del producto y gestionar el roadmap de desarrollo.', req: ['Agile', 'Product Management'] },
    { title: 'Security Engineer', desc: 'Proteger sistemas y datos contra amenazas y vulnerabilidades.', req: ['Security', 'Linux', 'Networking'] },
    { title: 'Systems Administrator', desc: 'Gestionar y mantener servidores y sistemas operativos.', req: ['Linux', 'Networking', 'SQL'] },
    { title: 'Technical Writer', desc: 'Crear documentación técnica clara y concisa para productos de software.', req: ['Technical Writing', 'English'] },
    { title: 'Scrum Master', desc: 'Facilitar los procesos ágil y eliminar impedimentos del equipo.', req: ['Agile', 'Scrum', 'Leadership'] },
    { title: 'API Developer', desc: 'Diseñar y desarrollar APIs RESTful y GraphQL eficientes.', req: ['REST', 'GraphQL', 'Node.js'] },
    { title: 'WordPress Developer', desc: 'Desarrollar y personalizar sitios web con WordPress.', req: ['WordPress', 'PHP', 'HTML', 'CSS'] },
    { title: 'Java Developer', desc: 'Desarrollar aplicaciones empresariales robustas con Java.', req: ['Java', 'SQL', 'Docker'] },
    { title: '.NET Developer', desc: 'Construir soluciones empresariales con el ecosistema .NET.', req: ['C#', '.NET', 'SQL'] },
    { title: 'iOS Developer', desc: 'Crear aplicaciones nativas para dispositivos Apple.', req: ['Swift', 'Git'] },
    { title: 'Android Developer', desc: 'Desarrollar aplicaciones nativas para el ecosistema Android.', req: ['Kotlin', 'Git'] },
    { title: 'Data Analyst', desc: 'Transformar datos en insights accionables para el negocio.', req: ['SQL', 'Excel', 'Python'] },
    { title: 'BI Developer', desc: 'Crear dashboards y reportes interactivos para la toma de decisiones.', req: ['SQL', 'Power BI', 'Excel'] },
    { title: 'Blockchain Developer', desc: 'Desarrollar aplicaciones descentralizadas y smart contracts.', req: ['Blockchain', 'JavaScript', 'Go'] },
    { title: 'Game Developer', desc: 'Crear videojuegos innovadores con motores de renderizado modernos.', req: ['C++', 'C#', 'Git'] },
    { title: 'Embedded Developer', desc: 'Programar software para sistemas embebidos y IoT.', req: ['C++', 'Linux'] },
    { title: 'Solutions Architect', desc: 'Diseñar soluciones técnicas escalables para clientes empresariales.', req: ['AWS', 'Docker', 'Leadership'] },
    { title: 'SRE', desc: 'Garantizar la fiabilidad y escalabilidad de servicios en producción.', req: ['Linux', 'Docker', 'AWS', 'CI/CD'] },
    { title: 'Platform Engineer', desc: 'Construir herramientas internas para mejorar la productividad del desarrollo.', req: ['Docker', 'Kubernetes', 'CI/CD'] },
    { title: 'E-commerce Developer', desc: 'Desarrollar plataformas de comercio electrónico escalables.', req: ['JavaScript', 'React', 'Node.js'] },
    { title: 'CRM Developer', desc: 'Implementar y personalizar sistemas CRM para optimizar ventas.', req: ['Salesforce', 'JavaScript'] },
    { title: 'Digital Marketing Manager', desc: 'Estrategias de marketing digital para增长 de marca.', req: ['Marketing', 'SEO', 'Analytics'] },
    { title: 'Network Engineer', desc: 'Diseñar, implementar y gestionar infraestructura de redes.', req: ['Networking', 'Linux', 'Security'] },
    { title: 'Financial Analyst', desc: 'Analizar datos financieros para apoyar la toma de decisiones.', req: ['Excel', 'Finance', 'Accounting'] },
    { title: 'Project Manager', desc: 'Planificar, ejecutar y gestionar proyectos de software a tiempo y dentro del presupuesto.', req: ['Agile', 'Project Management', 'Leadership'] },
    { title: 'Content Writer', desc: 'Crear contenido de calidad para blogs, redes sociales y documentación.', req: ['Copywriting', 'SEO', 'English'] },
    { title: 'Recruiter Tech', desc: 'Reclutar talento técnico para posiciones de ingeniería de software.', req: ['Recruiting', 'HR', 'Communication'] },
    { title: 'IT Support Specialist', desc: 'Proporcionar soporte técnico a usuarios y resolver incidencias.', req: ['Support', 'Networking', 'Windows'] }
  ],

  workModes: ['remote', 'hybrid', 'onsite'],
  expLevels: ['junior', 'mid', 'senior', 'lead'],
  expLabels: { junior: 'Junior', mid: 'Mid-Level', senior: 'Senior', lead: 'Lead / Manager' },

  _expOrder: { junior: 0, mid: 1, senior: 2, lead: 3 },

  _random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  _formatSalary(range) {
    const min = (range.min / 1000).toFixed(0);
    const max = (range.max / 1000).toFixed(0);
    return `$${min}k – $${max}k MXN/mes`;
  },

  _computeMatch(userSkills, jobReqs) {
    if (!jobReqs || jobReqs.length === 0) return 50;
    const normalized = userSkills.map(s => s.toLowerCase());
    let matches = 0;
    for (const req of jobReqs) {
      if (normalized.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))) {
        matches++;
      }
    }
    return Math.round((matches / jobReqs.length) * 100);
  },

  _generateJobs(userProfile) {
    const { skills = [], level = 'mid', location = 'Ciudad de México' } = userProfile;
    const jobs = [];
    const count = this._random(18, 30);

    for (let i = 0; i < count; i++) {
      const titleObj = this._pick(this._titles);
      const company = this._pick(this.companies);
      const workMode = this._pick(this.workModes);

      let jobLocation;
      if (workMode === 'remote') {
        jobLocation = 'Remoto';
      } else {
        jobLocation = this._pick(this.locations.filter(l => l !== 'Remote' && l !== 'Global'));
      }

      const expLevel = this._pick(this.expLevels);
      const salary = this.salaryRanges[expLevel];
      const match = this._computeMatch(skills, titleObj.req);

      const posted = this._random(0, 14);
      const postedLabel = posted === 0 ? 'Hoy' : posted === 1 ? 'Ayer' : `Hace ${posted} días`;

      jobs.push({
        id: `job-${Date.now()}-${i}`,
        title: titleObj.title,
        description: titleObj.desc,
        company: company.name,
        companyEmoji: company.emoji,
        location: jobLocation,
        workMode,
        expLevel,
        expLabel: this.expLabels[expLevel],
        salary: this._formatSalary(salary),
        salaryMin: salary.min,
        salaryMax: salary.max,
        match,
        tags: titleObj.req.slice(0, 4),
        requirements: titleObj.req,
        benefits: this._pick([
          ['Home office', 'Seguro médico', 'Capacitación'],
          ['Horario flexible', 'Vacaciones premium', 'Gym'],
          ['Stock options', 'Equipo Provided', 'Retiros'],
          ['Educación pagada', 'Bono anual', 'Seguro dental'],
          ['25 días de vacaciones', 'Flexible schedule', 'FnB']
        ]),
        posted: postedLabel,
        applicants: this._random(5, 120)
      });
    }

    jobs.sort((a, b) => b.match - a.match);
    return jobs;
  },

  searchJobs(userProfile, filters = {}) {
    let jobs = this._generateJobs(userProfile);

    if (filters.mode && filters.mode !== 'all') {
      jobs = jobs.filter(j => j.workMode === filters.mode);
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return jobs;
  },

  getJobById(jobs, id) {
    return jobs.find(j => j.id === id) || null;
  }
};
