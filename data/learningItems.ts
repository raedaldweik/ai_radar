import { LearningItem, Category } from '../types';

export const learningItems: LearningItem[] = [
    {
        id: 'course-1',
        category: Category.Learning,
        title: 'AI for Everyone',
        description: 'A non-technical introduction to AI. Learn about machine learning, deep learning, and how to build an AI strategy.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/research_image.jpeg',
        tags: ['Generative AI', 'Business', 'Strategy'],
        isFeatured: true,
        details: {
            instructor: 'Andrew Ng',
            platform: 'Coursera',
            rating: 4.8,
            duration: '10 hours',
            level: 'Beginner',
            courseUrl: 'https://www.coursera.org/learn/ai-for-everyone'
        }
    },
    {
        id: 'course-2',
        category: Category.Learning,
        title: 'Machine Learning Specialization',
        description: 'Master fundamental machine learning concepts like supervised and unsupervised learning, recommendation systems, and more.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/tech.jpg',
        tags: ['Machine Learning', 'Python', 'Scikit-learn'],
        isFeatured: true,
        details: {
            instructor: 'Andrew Ng, Stanford University',
            platform: 'Coursera',
            rating: 4.9,
            duration: '3 months',
            level: 'Beginner',
            courseUrl: 'https://www.coursera.org/specializations/machine-learning-introduction'
        }
    },
    {
        id: 'course-3',
        category: Category.Learning,
        title: 'Generative AI for Everyone',
        description: 'Learn how generative AI works, its capabilities and limitations, and how to use it in your daily work.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/news.jpeg',
        tags: ['Generative AI', 'Prompt Engineering'],
        isFeatured: true,
        details: {
            instructor: 'Andrew Ng',
            platform: 'Coursera',
            rating: 4.8,
            duration: '5 hours',
            level: 'Beginner',
            courseUrl: 'https://www.coursera.org/learn/generative-ai-for-everyone'
        }
    },
    {
        id: 'course-4',
        category: Category.Learning,
        title: 'Deep Learning Specialization',
        description: 'Build and train neural networks, CNNs, RNNs, and more. A deep dive into the technology powering modern AI.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/github2.jpg',
        tags: ['Deep Learning', 'Neural Networks', 'PyTorch', 'TensorFlow'],
        details: {
            instructor: 'Andrew Ng',
            platform: 'Coursera',
            rating: 4.9,
            duration: '5 months',
            level: 'Intermediate',
            courseUrl: 'https://www.coursera.org/specializations/deep-learning'
        }
    },
    {
        id: 'course-5',
        category: Category.Learning,
        title: 'Natural Language Processing Specialization',
        description: 'Learn to build NLP applications using sequence models, attention mechanisms, and transformers.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/news.jpeg',
        tags: ['NLP', 'Transformers', 'BERT', 'GPT'],
        details: {
            instructor: 'Younes Bensouda Mourri, Łukasz Kaiser',
            platform: 'Coursera',
            rating: 4.8,
            duration: '4 months',
            level: 'Intermediate',
            courseUrl: 'https://www.coursera.org/specializations/natural-language-processing'
        }
    },
    {
        id: 'course-6',
        category: Category.Learning,
        title: 'IBM Data Science Professional Certificate',
        description: 'Get job-ready with skills in Python, SQL, data visualization, and machine learning using real-world data science tools.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/jobs.jpeg',
        tags: ['Data Science', 'Python', 'SQL', 'Machine Learning'],
        details: {
            instructor: 'IBM',
            platform: 'Coursera',
            rating: 4.6,
            duration: '6 months',
            level: 'Beginner',
            courseUrl: 'https://www.coursera.org/professional-certificates/ibm-data-science'
        }
    },
    {
        id: 'course-7',
        category: Category.Learning,
        title: 'Applied Data Science with Python',
        description: 'Enhance your data science career by mastering Python, data visualization, machine learning, and text mining.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/tech.jpg',
        tags: ['Data Science', 'Python', 'Pandas', 'Matplotlib'],
        details: {
            instructor: 'University of Michigan',
            platform: 'Coursera',
            rating: 4.7,
            duration: '5 months',
            level: 'Intermediate',
            courseUrl: 'https://www.coursera.org/specializations/data-science-python'
        }
    },
    {
        id: 'course-8',
        category: Category.Learning,
        title: 'Computer Vision Specialization',
        description: 'Master computer vision techniques from image processing to advanced deep learning models for object detection and recognition.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/github2.jpg',
        tags: ['Computer Vision', 'Image Recognition', 'Deep Learning'],
        details: {
            instructor: 'IBM',
            platform: 'Coursera',
            rating: 4.8,
            duration: '4 months',
            level: 'Intermediate',
            courseUrl: 'https://www.coursera.org/specializations/introduction-computer-vision-image-processing'
        }
    },
    {
        id: 'course-9',
        category: Category.Learning,
        title: 'AI Foundations for Everyone',
        description: 'A comprehensive introduction to AI technologies, ethics, and career paths for beginners.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/research_image.jpeg',
        tags: ['AI Foundations', 'Ethics', 'Career'],
        details: {
            instructor: 'IBM',
            platform: 'Coursera',
            rating: 4.7,
            duration: '4 months',
            level: 'Beginner',
            courseUrl: 'https://www.coursera.org/specializations/ai-foundations-for-everyone'
        }
    },
    {
        id: 'course-10',
        category: Category.Learning,
        title: 'Generative AI with Large Language Models',
        description: 'Practical course on building and deploying generative AI applications using LLMs.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/news.jpeg',
        tags: ['Generative AI', 'LLMs', 'AWS', 'Fine-tuning'],
        details: {
            instructor: 'AWS & DeepLearning.AI',
            platform: 'Coursera',
            rating: 4.9,
            duration: '35 hours',
            level: 'Intermediate',
            courseUrl: 'https://www.coursera.org/learn/generative-ai-with-llms'
        }
    },
    {
        id: 'course-11',
        category: Category.Learning,
        title: 'Python for Data Science and Machine Learning Bootcamp',
        description: 'Learn how to use NumPy, Pandas, Seaborn, Matplotlib, Plotly, Scikit-Learn, and more.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/tech.jpg',
        tags: ['Python', 'Data Science', 'Machine Learning'],
        details: {
            instructor: 'Jose Portilla',
            platform: 'Udemy',
            rating: 4.7,
            duration: '25 hours',
            level: 'Beginner',
            courseUrl: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/'
        }
    },
    {
        id: 'course-12',
        category: Category.Learning,
        title: 'Deep Learning A-Z 2024: Neural Networks, AI & ChatGPT',
        description: 'Build neural networks, CNNs, RNNs, Self-Organizing Maps, and Boltzmann Machines.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/github2.jpg',
        tags: ['Deep Learning', 'Neural Networks', 'ChatGPT'],
        details: {
            instructor: 'Kirill Eremenko',
            platform: 'Udemy',
            rating: 4.6,
            duration: '22 hours',
            level: 'Intermediate',
            courseUrl: 'https://www.udemy.com/course/deeplearning/'
        }
    },
    {
        id: 'course-13',
        category: Category.Learning,
        title: 'Artificial Intelligence A-Z 2024: Build 5 AI Agents',
        description: 'Combine data science, machine learning, and deep learning to create powerful AI agents.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/research_image.jpeg',
        tags: ['AI Agents', 'Reinforcement Learning', 'Q-Learning'],
        isFeatured: true,
        details: {
            instructor: 'Hadelin de Ponteves',
            platform: 'Udemy',
            rating: 4.5,
            duration: '17 hours',
            level: 'Intermediate',
            courseUrl: 'https://www.udemy.com/course/artificial-intelligence-az/'
        }
    },
    {
        id: 'course-14',
        category: Category.Learning,
        title: 'The Complete Machine Learning Course with Python',
        description: 'Build a strong foundation in machine learning using Python. Cover regression, classification, and clustering.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/tech.jpg',
        tags: ['Machine Learning', 'Python', 'Algorithms'],
        details: {
            instructor: 'Mammoth Interactive',
            platform: 'Udemy',
            rating: 4.4,
            duration: '18 hours',
            level: 'Beginner',
            courseUrl: 'https://www.udemy.com/course/the-complete-machine-learning-course-with-python/'
        }
    },
    {
        id: 'course-15',
        category: Category.Learning,
        title: 'Master Generative AI with LLMs, ChatGPT & Prompt Engineering',
        description: 'Learn to build cutting-edge generative AI applications using OpenAI, Anthropic, and open-source models.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/news.jpeg',
        tags: ['Generative AI', 'LLMs', 'Prompt Engineering'],
        details: {
            instructor: 'Dr. Ryan Ahmed',
            platform: 'Udemy',
            rating: 4.8,
            duration: '15 hours',
            level: 'Intermediate',
            courseUrl: 'https://www.udemy.com/course/generative-ai-python-mastery/'
        }
    },
    {
        id: 'course-16',
        category: Category.Learning,
        title: 'AI Agentic Architecture: Build Autonomous AI Agents',
        description: 'Master the design and implementation of autonomous AI agents using AutoGen and LangChain.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/github2.jpg',
        tags: ['AI Agents', 'Agentic AI', 'AutoGen', 'LangChain'],
        isFeatured: true,
        details: {
            instructor: 'SkillUp EdTech',
            platform: 'Udemy',
            rating: 4.7,
            duration: '12 hours',
            level: 'Advanced',
            courseUrl: 'https://www.udemy.com/course/ai-agents-autogen/'
        }
    },
    {
        id: 'course-17',
        category: Category.Learning,
        title: 'Complete AI Guide: ChatGPT, Claude, Midjourney & More',
        description: 'A comprehensive guide to the most popular AI tools for content creation, coding, and productivity.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/news.jpeg',
        tags: ['AI Tools', 'ChatGPT', 'Midjourney', 'Productivity'],
        details: {
            instructor: 'Julian Melchor',
            platform: 'Udemy',
            rating: 4.7,
            duration: '20 hours',
            level: 'Beginner',
            courseUrl: 'https://www.udemy.com/course/complete-ai-guide/'
        }
    },
    {
        id: 'course-18',
        category: Category.Learning,
        title: 'Prompt Engineering for ChatGPT',
        description: 'Learn how to formulate effective prompts to get the best out of LLMs for various tasks.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/research_image.jpeg',
        tags: ['Prompt Engineering', 'ChatGPT', 'LLMs'],
        details: {
            instructor: 'Vanderbilt University',
            platform: 'Udemy',
            rating: 4.8,
            duration: '8 hours',
            level: 'Beginner',
            courseUrl: 'https://www.udemy.com/course/prompt-engineering-for-chatgpt/'
        }
    },
    {
        id: 'course-19',
        category: Category.Learning,
        title: 'Computer Vision A-Z™: Learn OpenCV, Keras & PyTorch',
        description: 'Master Computer Vision by building a face detection model, an emotion detector, and a self-driving car.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/github2.jpg',
        tags: ['Computer Vision', 'OpenCV', 'PyTorch', 'Keras'],
        details: {
            instructor: 'Hadelin de Ponteves',
            platform: 'Udemy',
            rating: 4.6,
            duration: '11 hours',
            level: 'Intermediate',
            courseUrl: 'https://www.udemy.com/course/computer-vision-a-z/'
        }
    },
    {
        id: 'course-20',
        category: Category.Learning,
        title: 'Robot Operating System (ROS) for Beginners',
        description: 'Learn the foundations of ROS to build and simulate your own autonomous robots.',
        imageUrl: 'https://raedaldweik.github.io/AIRadar/tech.jpg',
        tags: ['Robotics', 'ROS', 'Autonomous Systems'],
        details: {
            instructor: 'Edouard Renard',
            platform: 'Udemy',
            rating: 4.7,
            duration: '14 hours',
            level: 'Beginner',
            courseUrl: 'https://www.udemy.com/course/ros-for-beginners/'
        }
    }
];
