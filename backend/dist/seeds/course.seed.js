"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCourses = seedCourses;
const Course_model_1 = __importDefault(require("../models/Course.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const db_config_1 = __importDefault(require("../utils/db.config"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const courseSeeds = [
    {
        courseId: "course-001",
        courseName: "Complete React Development Masterclass",
        tutorName: "John Smith",
        courseType: "PERSONAL",
        description: "Master React from scratch to advanced concepts including hooks, Redux, and Next.js. Build real-world projects and deploy them to production.",
        currency: "INR",
        sellingPrice: 4999,
        originalPrice: 19999,
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
        isVerified: true,
    },
    {
        courseId: "course-002",
        courseName: "Python for Data Science",
        tutorName: "Sarah Johnson",
        courseType: "YOUTUBE",
        description: "Learn Python programming for data science, machine learning, and AI. Covers pandas, numpy, matplotlib, and scikit-learn.",
        currency: "INR",
        sellingPrice: 0,
        originalPrice: 0,
        thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
        isVerified: true,
    },
    {
        courseId: "course-003",
        courseName: "Full Stack Web Development",
        tutorName: "Mike Chen",
        courseType: "PERSONAL",
        description: "Become a full stack developer with this comprehensive course covering HTML, CSS, JavaScript, Node.js, Express, MongoDB, and more.",
        currency: "INR",
        sellingPrice: 7999,
        originalPrice: 29999,
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
        isVerified: true,
    },
    {
        courseId: "course-004",
        courseName: "Machine Learning Fundamentals",
        tutorName: "Emily Davis",
        courseType: "SEMESTER",
        description: "Introduction to machine learning algorithms, supervised and unsupervised learning, neural networks, and deep learning fundamentals.",
        currency: "INR",
        sellingPrice: 9999,
        originalPrice: 39999,
        thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
        isVerified: true,
    },
    {
        courseId: "course-005",
        courseName: "UI/UX Design Principles",
        tutorName: "Alex Thompson",
        courseType: "TECH",
        description: "Learn user interface and user experience design principles. Create beautiful, functional designs that users love.",
        currency: "INR",
        sellingPrice: 3999,
        originalPrice: 14999,
        thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
        isVerified: true,
    },
    {
        courseId: "course-006",
        courseName: "JavaScript Advanced Concepts",
        tutorName: "David Wilson",
        courseType: "YOUTUBE",
        description: "Deep dive into JavaScript closures, prototypes, async/await, promises, and advanced ES6+ features.",
        currency: "INR",
        sellingPrice: 0,
        originalPrice: 0,
        thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
        isVerified: true,
    },
    {
        courseId: "course-007",
        courseName: "Cloud Computing with AWS",
        tutorName: "Lisa Anderson",
        courseType: "SEMESTER",
        description: "Master Amazon Web Services including EC2, S3, Lambda, RDS, and more. Prepare for AWS certification.",
        currency: "INR",
        sellingPrice: 12999,
        originalPrice: 49999,
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
        isVerified: true,
    },
    {
        courseId: "course-008",
        courseName: "Mobile App Development with React Native",
        tutorName: "Chris Brown",
        courseType: "PERSONAL",
        description: "Build cross-platform mobile applications using React Native. Learn to create iOS and Android apps from a single codebase.",
        currency: "INR",
        sellingPrice: 6999,
        originalPrice: 24999,
        thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
        isVerified: true,
    },
    {
        courseId: "course-009",
        courseName: "Cybersecurity Essentials",
        tutorName: "Kevin Martinez",
        courseType: "TECH",
        description: "Learn cybersecurity fundamentals including network security, encryption, ethical hacking, and security best practices.",
        currency: "INR",
        sellingPrice: 8999,
        originalPrice: 34999,
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
        isVerified: true,
    },
    {
        courseId: "course-010",
        courseName: "DevOps and CI/CD Pipeline",
        tutorName: "Rachel Green",
        courseType: "YOUTUBE",
        description: "Master DevOps practices including Docker, Kubernetes, Jenkins, GitLab CI, and continuous integration/deployment pipelines.",
        currency: "INR",
        sellingPrice: 0,
        originalPrice: 0,
        thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800",
        isVerified: true,
    },
    {
        courseId: "course-011",
        courseName: "Blockchain Development",
        tutorName: "Steven White",
        courseType: "SEMESTER",
        description: "Learn blockchain technology, smart contracts, and decentralized applications using Ethereum and Solidity.",
        currency: "INR",
        sellingPrice: 14999,
        originalPrice: 59999,
        thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
        isVerified: true,
    },
    {
        courseId: "course-012",
        courseName: "Digital Marketing Mastery",
        tutorName: "Jessica Lee",
        courseType: "PERSONAL",
        description: "Complete digital marketing course covering SEO, social media marketing, email marketing, content marketing, and analytics.",
        currency: "INR",
        sellingPrice: 5999,
        originalPrice: 22999,
        thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
        isVerified: true,
    },
];
async function seedCourses() {
    try {
        await (0, db_config_1.default)();
        console.log("Connected to database");
        // Get a user to use as uploadedBy
        const user = await User_model_1.default.findOne();
        if (!user) {
            console.log("No user found. Please create a user first.");
            process.exit(1);
        }
        // Clear existing courses
        await Course_model_1.default.deleteMany({});
        console.log("Cleared existing courses");
        // Insert new courses
        const coursesWithUser = courseSeeds.map((course) => ({
            ...course,
            uploadedBy: user._id,
        }));
        await Course_model_1.default.insertMany(coursesWithUser);
        console.log("Courses seeded successfully!");
        console.log("Seeded courses:");
        courseSeeds.forEach((course) => {
            console.log(`- ${course.courseName} (${course.courseType})`);
        });
        process.exit(0);
    }
    catch (error) {
        console.error("Error seeding courses:", error);
        process.exit(1);
    }
}
// Run the seed function if called directly
if (require.main === module) {
    seedCourses();
}
