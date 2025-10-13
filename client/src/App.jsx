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

// Dashboard is the landing page
const Dashboard = ({ onStart, user, pastAnalyses }) => (
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
            {user && pastAnalyses.length > 0 ? (
                <ul className="mt-2 text-left">
                    {pastAnalyses.map((a, idx) => (
                        <li key={idx} className="mb-2">
                            <span className="font-semibold text-blue-700">{a.jobTitle || "Job"}</span>
                            <span className="ml-2 text-gray-600">Score: {Math.round(a.matchScore * 100)}%</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2 text-gray-500">
                    {user ? "No past analyses yet." : "Sign in to see your past analyses."}
                </p>
            )}
        </div>
    </div>
);

// --- Main App Components ---

// InputScreen lets the user upload a resume and paste a job description
const InputScreen = ({ onAnalyze, token, setPastAnalyses }) => {
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

            // Save to history if signed in
            if (token) {
                await axios.post("http://localhost:5159/api/analysis/save", {
                    ResumeText: resumeText,
                    JobDescription: jobDescription,
                    MatchScore: response.data.matchScore ?? 0,
                    MatchingSkills: JSON.stringify(response.data.matchingSkills ?? []),
                    MissingSkills: JSON.stringify(response.data.missingSkills ?? []),
                    Analysis: response.data.analysis ?? "",
                    Improvements: JSON.stringify(response.data.improvements ?? []),
                    JobTitle: response.data.jobTitle ?? ""
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Optionally refresh past analyses
                const res = await axios.get('http://localhost:5159/api/analysis/mine', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPastAnalyses(res.data);
            }
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

    return (
        <div className="w-full max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">Analysis Report</h1>

            {/* Match Score */}
            <div className="mb-8 text-center">
                <span className="text-5xl font-bold text-blue-600">{Math.round(result.matchScore * 100)}%</span>
                <div className="text-lg text-gray-600">Match Score</div>
            </div>

            {/* Matching Skills */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-green-600 mb-2">Matching Skills</h2>
                <ul className="flex flex-wrap gap-2">
                    {result.matchingSkills?.length > 0 ? result.matchingSkills.map((skill, idx) => (
                        <li key={idx} className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full">
                            <CheckCircleIcon /> {skill}
                        </li>
                    )) : <li className="text-gray-500">No matching skills found.</li>}
                </ul>
            </div>

            {/* Missing Skills */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-yellow-600 mb-2">Missing Skills</h2>
                <ul className="flex flex-wrap gap-2">
                    {result.missingSkills?.length > 0 ? result.missingSkills.map((skill, idx) => (
                        <li key={idx} className="flex items-center bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                            <XCircleIcon /> {skill}
                        </li>
                    )) : <li className="text-gray-500">No missing skills found.</li>}
                </ul>
            </div>

            {/* AI Feedback */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">AI Feedback</h2>
                <p className="bg-gray-100 p-4 rounded">{result.analysis}</p>
            </div>

            {/* Improvements */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-yellow-600 mb-4">Improvements & Learning Resources</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    {result.improvements?.map((imp, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col justify-between transition hover:shadow-lg hover:border-blue-200"
                        >
                            <div>
                                <div className="flex items-center mb-2">
                                    <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-lg font-semibold text-gray-800">{imp.suggestion}</span>
                                </div>
                                <p className="text-gray-500 mb-4">
                                    Improve this skill to boost your match score.
                                </p>
                            </div>
                            <a
                                href={`https://www.coursera.org/search?query=${encodeURIComponent(imp.searchTerm)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition"
                            >
                                Search "{imp.searchTerm}" on Coursera
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resources (if any) */}
            <h2 className="text-2xl font-semibold text-green-700 mb-2">Other Resources</h2>
            <ul className="list-disc list-inside text-blue-700">
                <li>
                    <a href="https://www.coursera.org" target="_blank" rel="noopener noreferrer" className="hover:underline">Coursera</a>
                </li>
                <li>
                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>
                </li>
                <li>
                    <a href="https://www.Indeed.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Indeed</a>
                </li>
            </ul>
        </div>
    );
};

function SignInModal({ onClose, onSignIn }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Try to register first
            await axios.post('http://localhost:5159/api/auth/register', { email, password });
            // Registration successful, now sign in
            const res = await axios.post('http://localhost:5159/api/auth/login', { email, password });
            onSignIn(res.data.user, res.data.token);
            onClose();
        } catch (regErr) {
            // If registration failed because email exists, try to sign in
            if (regErr.response && regErr.response.data?.error === "Email already registered.") {
                try {
                    const res = await axios.post('http://localhost:5159/api/auth/login', { email, password });
                    onSignIn(res.data.user, res.data.token);
                    onClose();
                } catch {
                    setError('Invalid email or password.');
                }
            } else {
                setError('Registration failed.');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-4">Sign In</h2>
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full mb-3 p-2 border rounded"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full mb-3 p-2 border rounded"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                {error && <div className="text-red-500 mb-2">{error}</div>}
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Sign In</button>
                <button type="button" className="w-full mt-2 text-gray-600" onClick={onClose}>Cancel</button>
            </form>
        </div>
    );
}

export default function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [showSignIn, setShowSignIn] = useState(false);
    const [pastAnalyses, setPastAnalyses] = useState([]);
    const [page, setPage] = useState('dashboard');
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Fetch past analyses for the signed-in user
    const fetchPastAnalyses = async (jwt) => {
        try {
            const res = await axios.get('http://localhost:5159/api/analysis/mine', {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setPastAnalyses(res.data);
        } catch {
            setPastAnalyses([]);
        }
    };

    // Navigation functions
    const navigateToInput = useCallback(() => setPage('input'), []);
    const navigateToReport = useCallback((result) => {
        setAnalysisResult(result);
        setPage('report');
    }, []);
    const navigateToDashboard = useCallback(() => setPage('dashboard'), []);
    const navigateToResources = useCallback((skill) => {
        setSelectedSkill(skill);
        setPage('resources');
    }, []);

    // Render correct page
    const renderPage = () => {
        switch (page) {
            case 'input':
                return <InputScreen onAnalyze={navigateToReport} token={token} setPastAnalyses={setPastAnalyses} />;
            case 'report':
                return <ReportScreen result={analysisResult} onFindResources={navigateToResources} />;
            case 'resources':
                return <ResourcesScreen skill={selectedSkill} onBack={() => setPage('report')} />;
            case 'dashboard':
            default:
                return <Dashboard onStart={navigateToInput} user={user} pastAnalyses={pastAnalyses} />;
        }
    };

    // Handle sign in: set user/token, fetch analyses, go to dashboard
    const handleSignIn = async (userObj, jwt) => {
        setUser(userObj);
        setToken(jwt);
        setShowSignIn(false);
        await fetchPastAnalyses(jwt);
        setPage('dashboard');
    };

    // Handle logout: clear user/token/analyses, go to dashboard
    const handleLogout = () => {
        setUser(null);
        setPastAnalyses([]);
        setPage('dashboard');
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
                        {user ? (
                            <button
                                className="text-gray-600 hover:text-blue-600"
                                onClick={handleLogout}
                            >
                                Log Out
                            </button>
                        ) : (
                            <button
                                className="text-gray-600 hover:text-blue-600"
                                onClick={() => setShowSignIn(true)}
                            >
                                Sign In
                            </button>
                        )}
                    </nav>
                    {showSignIn && (
                        <SignInModal
                            onClose={() => setShowSignIn(false)}
                            onSignIn={handleSignIn}
                        />
                    )}
                </header>

                {/* Main Content Area */}
                <div className="py-10 flex items-center justify-center">
                    {renderPage()}
                </div>
            </div>
        </main>
    );
}