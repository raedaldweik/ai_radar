import { TechItem, JobRole } from '../types';

export const kpiData = {
    researchPapers: {
        value: '1.2k',
        change: '+15%',
        period: 'vs last month',
    },
    startupsFunded: {
        value: 85,
        change: '+5%',
        period: 'vs last quarter',
    },
    jobPostings: {
        value: '3.4k',
        change: '-2%',
        period: 'vs last week',
    },
    newsArticles: {
        value: 472,
        change: '+20%',
        period: 'vs last month',
    }
};

export const aiTrendsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  series: [
    { name: 'Research Papers', data: [30, 40, 45, 50, 49, 60] },
    { name: 'GitHub Repositories', data: [55, 58, 65, 70, 72, 80] },
  ]
};

export const sourceDistributionData = [
    { name: 'Academic Journals', value: 45, color: '#0ea5e9' }, // sky-500
    { name: 'Tech Blogs', value: 25, color: '#38bdf8' }, // sky-400
    { name: 'Preprint Archives', value: 20, color: '#0284c7' }, // sky-600
    { name: 'News Media', value: 10, color: '#0369a1' }, // sky-700
];

export const startupAnalyticsData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
  values: [120, 150, 130, 170, 165, 180, 190, 210, 205, 30],
};

export const jobMarketData: { topRoles: JobRole[] } = {
    topRoles: [
        { role: 'ML Engineer', openings: 1200, salary: '$140k - $165k USD', growth: '+18%', description: 'Machine Learning Engineers design, build, and deploy AI models into production. They handle data pipelines, model training, and ensure models are scalable, efficient, and integrated into applications.' },
        { role: 'Data Scientist', openings: 950, salary: '$130k - $155k USD', growth: '+15%', description: 'Data Scientists analyze complex datasets to extract insights and inform business decisions. They use statistical methods and machine learning to build predictive models and communicate findings to stakeholders.' },
        { role: 'AI Researcher', openings: 600, salary: '$160k - $190k USD', growth: '+22%', description: 'AI Researchers push the boundaries of artificial intelligence. They work on developing new algorithms, models, and theories, often publishing their work in academic papers and contributing to fundamental advancements in the field.' },
        { role: 'Prompt Engineer', openings: 450, salary: '$125k - $150k USD', growth: '+35%', description: 'Prompt Engineers specialize in designing and refining the inputs (prompts) given to large language models (LLMs). Their goal is to optimize the model\'s output for quality, accuracy, and desired behavior.' },
        { role: 'AI Product Manager', openings: 400, salary: '$150k - $180k USD', growth: '+20%', description: 'AI Product Managers guide the strategy and development of AI-powered products. They bridge the gap between technical teams and business goals, defining product vision and ensuring features meet user needs.' },
        { role: 'MLOps Engineer', openings: 750, salary: '$145k - $170k USD', growth: '+25%', description: 'MLOps (Machine Learning Operations) Engineers focus on the lifecycle of AI models. They build and maintain the infrastructure for continuous integration, delivery, deployment, and monitoring of machine learning systems.' },
        { role: 'Computer Vision Eng.', openings: 550, salary: '$135k - $160k USD', growth: '+17%', description: 'Computer Vision Engineers develop AI systems that can interpret and understand visual information from the world, such as images and videos. They work on tasks like object detection, image recognition, and autonomous navigation.' },
        { role: 'AI Ethics Specialist', openings: 300, salary: '$130k - $150k USD', growth: '+30%', description: 'AI Ethics Specialists focus on the responsible and safe deployment of AI. They develop guidelines, conduct audits, and work to mitigate biases and potential harms, ensuring AI systems align with human values.' },
    ],
};

export const skillsCloudData = [
    { text: 'Python', value: 95, description: 'A high-level, versatile programming language widely used for AI/ML due to its extensive libraries like NumPy, Pandas, and Scikit-learn.' },
    { text: 'PyTorch', value: 80, description: 'An open-source machine learning library from Meta AI, known for its flexibility and ease of use in building and training deep neural networks.' },
    { text: 'TensorFlow', value: 75, description: 'A comprehensive, open-source platform for machine learning developed by Google, offering a flexible ecosystem of tools for building and deploying ML models.' },
    { text: 'LLMs', value: 90, description: 'Large Language Models are a type of AI model trained on vast amounts of text data to understand and generate human-like language for a wide range of tasks.' },
    { text: 'Computer Vision', value: 70, description: 'A field of AI that trains computers to interpret and understand the visual world, enabling tasks like image recognition, object detection, and scene understanding.' },
    { text: 'NLP', value: 85, description: 'Natural Language Processing is a field of AI focused on enabling computers to understand, interpret, and generate human language.' },
    { text: 'Kubernetes', value: 60, description: 'An open-source container orchestration system for automating the deployment, scaling, and management of containerized applications like those used in MLOps.' },
    { text: 'Docker', value: 65, description: 'A platform for developing, shipping, and running applications in containers, enabling consistent environments from development to production.' },
    { text: 'AWS', value: 78, description: 'Amazon Web Services, a cloud computing platform that provides a wide range of services for deploying, training, and scaling AI/ML applications.' },
    { text: 'MLOps', value: 82, description: 'A set of practices combining Machine Learning, DevOps, and Data Engineering to automate and streamline the ML lifecycle from development to production.' },
    { text: 'Transformers', value: 88, description: 'A state-of-the-art neural network architecture that excels at handling sequential data, forming the basis of most modern Large Language Models (LLMs).' },
];

// FIX: Add missing globalEventsData export to resolve import error in GlobalEventsMap.tsx
export const globalEventsData = [
    { eventName: 'AI World Conference', city: 'San Francisco', country: 'USA', date: 'Oct 15-17, 2024', lat: 37.7749, lng: -122.4194 },
    { eventName: 'Deep Learning Summit', city: 'London', country: 'UK', date: 'Sep 21-22, 2024', lat: 51.5074, lng: -0.1278 },
    { eventName: 'International Conference on ML', city: 'Vienna', country: 'Austria', date: 'Jul 21-27, 2024', lat: 48.2082, lng: 16.3738 },
    { eventName: 'AI & Big Data Expo', city: 'Amsterdam', country: 'Netherlands', date: 'Oct 1-2, 2024', lat: 52.3676, lng: 4.9041 },
    { eventName: 'World AI Summit', city: 'Singapore', country: 'Singapore', date: 'Nov 12-13, 2024', lat: 1.3521, lng: 103.8198 },
    { eventName: 'AI DevWorld', city: 'San Jose', country: 'USA', date: 'Oct 22-24, 2024', lat: 37.3382, lng: -121.8863 },
    { eventName: 'CVPR 2024', city: 'Seattle', country: 'USA', date: 'Jun 17-21, 2024', lat: 47.6062, lng: -122.3321 },
    { eventName: 'NeurIPS 2024', city: 'Vancouver', country: 'Canada', date: 'Dec 9-15, 2024', lat: 49.2827, lng: -123.1207 },
];