import React, { useState, useCallback } from 'react';

// --- Helper Components for Icons ---

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 14a1 1 0 01-1-1V9a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H8z" />
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
);


// --- Main App Components ---

/**
 * The Dashboard Screen (Scenario 1 Start)
 * This is the landing page for the user.
 * @param {object} props - Component props.
 * @param {Function} props.onStart - Callback function to navigate to the next screen.
 */
const Dashboard = ({ onStart }) => {
    return (
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Welcome to SkillSync</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Close the gap between your skills and your dream job. Analyze your resume against any job description to get actionable insights.
            </p>
            <button
                onClick={onStart}
                className="mt-8 px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
                Start New Analysis
            </button>
            <div className="mt-12 p-6 border border-gray-200 rounded-lg bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-700">Past Analyses</h2>
                <p className="mt-2 text-gray-500">You don't have any past analyses yet. Let's create your first one!</p>
            </div>
        </div>
    );
};

/**
 * The Input Screen (Scenario 1 End)
 * Where the user "uploads" a resume and "pastes" a job description.
 * @param {object} props - Component props.
 * @param {Function} props.onAnalyze - Callback function to navigate to the report screen.
 */
const InputScreen = ({ onAnalyze }) => {
    const [resume, setResume] = useState(null);
    const [jobDescription, setJobDescription] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setResume(e.target.files[0]);
        }
    };

    // A fake job description for the user test
    const exampleJobDescription = `Senior Product Manager - Tech Company

Responsibilities:
- Define product strategy and roadmap.
- Deliver MRDs and PRDs with prioritized features.
- Work closely with engineering, marketing, and sales teams.
- Drive product launches.

Requirements:
- 5+ years of product management experience.
- Experience with Agile development.
- Strong analytical and problem-solving skills.
- Knowledge of SQL and Data Visualization tools.`;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">Create New Analysis</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Resume Upload Section */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">1. Your Resume</h2>
                    <label htmlFor="resume-upload" className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors">
                        <UploadIcon />
                        {resume ? (
                            <span className="text-green-600 font-semibold">{resume.name}</span>
                        ) : (
                            <span className="text-gray-500">Click to upload a file</span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">PDF or DOCX</p>
                    </label>
                    <input id="resume-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx" />
                </div>

                {/* Job Description Section */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">2. Job Description</h2>
                    <div className="flex items-start">
                        <ClipboardIcon />
                        <textarea
                            className="w-full h-48 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Paste the job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        ></textarea>
                    </div>
                     <button 
                        onClick={() => setJobDescription(exampleJobDescription)}
                        className="text-sm text-blue-600 hover:underline mt-2"
                    >
                        Use example job description
                    </button>
                </div>
            </div>
            <div className="text-center mt-10">
                <button
                    onClick={onAnalyze}
                    disabled={!resume || !jobDescription}
                    className="px-10 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Analyze Now
                </button>
            </div>
        </div>
    );
};


/**
 * The Analysis Report Screen (Scenario 2)
 * Displays the match score, matching skills, and missing skills.
 * @param {object} props - Component props.
 * @param {Function} props.onFindResources - Callback function to navigate to the resources screen.
 */
const ReportScreen = ({ onFindResources }) => {
    const matchingSkills = ['Product Management', 'Agile Development', 'Problem Solving'];
    const missingSkills = ['SQL', 'Data Visualization', 'Roadmap Planning'];

    return (
        <div className="w-full max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">Analysis Report</h1>
            
            {/* Match Score */}
            <div className="text-center mb-10">
                <div className="relative inline-flex items-center justify-center w-48 h-48">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-gray-200" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-blue-600" strokeWidth="3" strokeDasharray="65, 100" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-5xl font-bold text-blue-600">65%</span>
                        <span className="text-lg text-gray-600">Match Score</span>
                    </div>
                </div>
                <p className="mt-4 text-gray-600">Your resume is a good fit, but there's room for improvement!</p>
            </div>

            {/* Skills Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Matching Skills */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold text-green-600 mb-4">Matching Skills</h2>
                    <ul className="space-y-3">
                        {matchingSkills.map(skill => (
                            <li key={skill} className="flex items-center text-gray-700">
                                <CheckCircleIcon /> {skill}
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Missing Skills */}
                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-yellow-400">
                    <h2 className="text-2xl font-semibold text-yellow-600 mb-4">Missing Skills</h2>
                    <p className="text-sm text-gray-500 mb-4">Focus on adding these skills to your resume to become a stronger candidate.</p>
                    <ul className="space-y-3">
                        {missingSkills.map(skill => (
                            <li key={skill} className="flex items-center justify-between text-gray-700">
                                <div className="flex items-center">
                                    <XCircleIcon /> {skill}
                                </div>
                                <button 
                                    onClick={() => onFindResources(skill)}
                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 font-semibold rounded-full hover:bg-blue-200 transition"
                                >
                                    Find Resources
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

/**
 * The Learning Resources Screen (Scenario 3)
 * Shows a list of learning resources for a specific skill.
 * @param {object} props - Component props.
 * @param {string} props.skill - The skill to find resources for.
 * @param {Function} props.onBack - Callback function to navigate back to the report.
 */
const ResourcesScreen = ({ skill, onBack }) => {
    const resources = {
        'SQL': [
            { title: 'SQL for Beginners', provider: 'Coursera', type: 'Course' },
            { title: 'Advanced SQL Queries', provider: 'Udemy', type: 'Course' },
            { title: 'W3Schools SQL Tutorial', provider: 'W3Schools', type: 'Article' },
        ],
        'Data Visualization': [
            { title: 'Data Visualization with Tableau', provider: 'Coursera', type: 'Course' },
            { title: 'Storytelling with Data', provider: 'LinkedIn Learning', type: 'Course' },
            { title: 'Fundamentals of Data Visualization', provider: 'Medium', type: 'Article' },
        ],
        'Roadmap Planning': [
            { title: 'Product Roadmap Planning', provider: 'Product School', type: 'Workshop' },
            { title: 'The Art of the Product Roadmap', provider: 'Mind the Product', type: 'Article' },
        ]
    };

    const skillResources = resources[skill] || [];

    return (
        <div className="w-full max-w-4xl mx-auto">
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline">
                &larr; Back to Report
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Learning Resources for: <span className="text-blue-600">{skill}</span></h1>
            <p className="text-gray-600 mb-8">Here are some recommended resources to help you learn this skill.</p>
            
            <div className="space-y-4">
                {skillResources.map((resource, index) => (
                    <div key={index} className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center justify-between hover:shadow-lg hover:border-blue-400 transition-all">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">{resource.title}</h3>
                            <p className="text-gray-500">Provider: {resource.provider}</p>
                        </div>
                        <span className="px-3 py-1 text-sm bg-gray-200 text-gray-800 font-medium rounded-full">{resource.type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- The Main App Component ---
// This component manages the state and renders the correct screen.
export default function App() {
    // State to manage which page is currently visible
    // 'dashboard', 'input', 'report', 'resources'
    const [page, setPage] = useState('dashboard');

    // State to store the skill selected for finding resources
    const [selectedSkill, setSelectedSkill] = useState(null);

    // Navigation functions using useCallback for performance
    const navigateToInput = useCallback(() => setPage('input'), []);
    const navigateToReport = useCallback(() => setPage('report'), []);
    const navigateToDashboard = useCallback(() => setPage('dashboard'), []);

    const navigateToResources = useCallback((skill) => {
        setSelectedSkill(skill);
        setPage('resources');
    }, []);

    // Function to render the correct component based on the current page state
    const renderPage = () => {
        switch (page) {
            case 'input':
                return <InputScreen onAnalyze={navigateToReport} />;
            case 'report':
                return <ReportScreen onFindResources={navigateToResources} />;
            case 'resources':
                return <ResourcesScreen skill={selectedSkill} onBack={navigateToReport} />;
            case 'dashboard':
            default:
                return <Dashboard onStart={navigateToInput} />;
        }
    };

    return (
        <main className="bg-gray-50 min-h-screen font-sans text-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="py-6 flex justify-between items-center">
                    <div 
                        className="text-2xl font-bold text-blue-600 cursor-pointer"
                        onClick={navigateToDashboard}
                    >
                        SkillSync
                    </div>
                    <nav>
                        <a href="#" className="text-gray-600 hover:text-blue-600">Sign In</a>
                    </nav>
                </header>

                {/* Main Content Area */}
                <div className="py-10 flex items-center justify-center">
                    {renderPage()}
                </div>
            </div>
        </main>
    );
}