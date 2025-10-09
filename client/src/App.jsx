import React, { useState, useCallback } from 'react';
import axios from 'axios';

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

// --- Main App Components ---

// Dashboard is the landing page
const Dashboard = ({ onStart }) => (
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

// InputScreen lets the user upload a resume and paste a job description
const InputScreen = ({ onAnalyze }) => {
    const [resume, setResume] = useState(null); // Stores the uploaded file
    const [jobDescription, setJobDescription] = useState(''); // Stores the job description text
    const [loading, setLoading] = useState(false); // Shows if analyzing
    const [error, setError] = useState(''); // Shows error messages

    // This runs when the user picks a file
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "text/plain") {
            setResume(file);
            setError('');
        } else {
            setResume(null);
            setError("Please upload a .txt file for now.");
        }
    };

    // This runs when the user clicks "Analyze Now"
    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        let resumeText = '';
        if (resume) {
            resumeText = await resume.text();
        }
        try {
            const response = await axios.post("http://localhost:5159/api/ai/analyze", {
                resumeText,
                jobDescription
            });
            onAnalyze(response.data); // Pass result to parent
        } catch {
            setError("There was a problem analyzing your resume. Please try again.");
        }
        setLoading(false);
    };

    // Example job description for quick testing
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
                            <span className="text-gray-500">Click to upload a .txt file</span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">TXT only</p>
                    </label>
                    <input id="resume-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt" />
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
                    onClick={handleAnalyze}
                    disabled={!resume || !jobDescription || loading}
                    className="px-10 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {loading ? "Analyzing..." : "Analyze Now"}
                </button>
                {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>
        </div>
    );
};

// ReportScreen shows the backend's analysis results
const ReportScreen = ({ result }) => {
    if (!result) return <div>Loading...</div>;

    // Use backend data for jobs, analysis, improvements, and resources
    return (
        <div className="w-full max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">Analysis Report</h1>

            {/* Job Matches */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-blue-600 mb-4">Job Matches</h2>
                <ul className="space-y-2">
                    {result.jobs?.map((job, idx) => (
                        <li key={idx} className="flex items-center">
                            <CheckCircleIcon />
                            <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold hover:underline">
                                {job.title}
                            </a>
                            <span className="ml-2 text-gray-600">at {job.company} ({(job.matchScore * 100).toFixed(0)}%)</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* AI Feedback */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">AI Feedback</h2>
                <p className="bg-gray-100 p-4 rounded">{result.analysis}</p>
            </div>

            {/* Improvements */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-yellow-600 mb-2">Improvements</h2>
                <ul className="space-y-2">
                    {result.improvements?.map((imp, idx) => (
                        <li key={idx} className="flex items-center">
                            <XCircleIcon />
                            <span className="mr-2">{imp.suggestion}</span>
                            <a href={imp.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                Resource
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Resources */}
            <div>
                <h2 className="text-2xl font-semibold text-green-700 mb-2">Resources</h2>
                <ul className="space-y-1">
                    {result.resources?.map((url, idx) => (
                        <li key={idx}>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">{url}</a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// ResourcesScreen shows learning resources for a skill (static for now)
const ResourcesScreen = ({ skill, onBack }) => {
    // These are example resources for each skill
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

    // Get the resources for the selected skill
    const skillResources = resources[skill] || [];

    return (
        <div className="w-full max-w-4xl mx-auto">
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline">
                &larr; Back to Report
            </button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Learning Resources for: <span className="text-blue-600">{skill}</span>
            </h1>
            <p className="text-gray-600 mb-8">
                Here are some recommended resources to help you learn this skill.
            </p>
            <div className="space-y-4">
                {skillResources.map((resource, index) => (
                    <div
                        key={index}
                        className="bg-white p-5 rounded-lg shadow border border-gray-200 flex items-center justify-between hover:shadow-lg hover:border-blue-400 transition-all"
                    >
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">{resource.title}</h3>
                            <p className="text-gray-500">Provider: {resource.provider}</p>
                        </div>
                        <span className="px-3 py-1 text-sm bg-gray-200 text-gray-800 font-medium rounded-full">
                            {resource.type}
                        </span>
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

    // State to store the analysis result from the backend
    const [analysisResult, setAnalysisResult] = useState(null);

    // Navigation functions using useCallback for performance
    const navigateToInput = useCallback(() => setPage('input'), []);
    // When analysis is done, save the result and go to report
    const navigateToReport = useCallback((result) => {
        setAnalysisResult(result);
        setPage('report');
    }, []);
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
                return <ReportScreen result={analysisResult} onFindResources={navigateToResources} />;
            case 'resources':
                return <ResourcesScreen skill={selectedSkill} onBack={() => setPage('report')} />;
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