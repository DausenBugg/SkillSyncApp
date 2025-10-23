import React, { useState, useCallback } from 'react';
import axios from 'axios';
import mammoth from 'mammoth';

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
const Dashboard = ({ onStart, user, pastAnalyses, darkMode, onSelectAnalysis }) => (
    <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} text-center rounded-lg p-6`}>
        <h1 className={`text-4xl md:text-5xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Welcome to SkillSync</h1>
        <p className={`mt-4 text-lg max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Close the gap between your skills and your dream job. Analyze your resume against any job description to get actionable insights.
        </p>
        <button
            onClick={onStart}
            className={`mt-8 px-8 py-4 font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 ${darkMode ? 'bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300'}`}
        >
            Start New Analysis
        </button>
        <div className={`mt-12 p-6 rounded-lg ${darkMode ? 'border border-gray-700 bg-gray-900' : 'border border-gray-200 bg-gray-50'}`}>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Past Analyses</h2>
            {user && pastAnalyses.length > 0 ? (
                <ul className="mt-2 text-left">
                    {pastAnalyses.map((a, idx) => (
                        <li key={idx} className={`mb-2 cursor-pointer rounded px-2 py-1 transition ${darkMode ? 'hover:bg-blue-50' : 'hover:bg-blue-200'}`} onClick={() => onSelectAnalysis(a.id)}>
                            <span className="font-semibold text-blue-700">{a.jobTitle || "Job"}</span>
                            <span className="ml-2 text-gray-400">Score: {Math.round(a.matchScore * 100)}%</span>
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
const InputScreen = ({ onAnalyze, token, setPastAnalyses, darkMode }) => {
    const [resume, setResume] = useState(null); // Stores the uploaded file
    const [jobDescription, setJobDescription] = useState(''); // Stores the job description text
    const [loading, setLoading] = useState(false); // Shows if analyzing
    const [error, setError] = useState(''); // Shows error messages

    // This runs when the user picks a file
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (
            file &&
            (
                file.type === "text/plain" ||
                file.type === "application/pdf" ||
                file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                file.name.endsWith(".txt") ||
                file.name.endsWith(".pdf") ||
                file.name.endsWith(".docx")
            )
        ) {
            setResume(file);
            setError('');
        } else {
            setResume(null);
            setError("Please upload a .txt, .pdf, or .docx file.");
        }
    };

    // This runs when the user clicks "Analyze Now"
    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        let resumeText = '';

        if (resume) {
            if (resume.type === "text/plain" || resume.name.endsWith(".txt")) {
                resumeText = await resume.text();
            } else if (
                resume.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                resume.name.endsWith(".docx")
            ) {
                const arrayBuffer = await resume.arrayBuffer();
                const { value } = await mammoth.extractRawText({ arrayBuffer });
                resumeText = value;
            }
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
            <h1 className={`text-3xl font-bold text-center mb-8 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Create New Analysis</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Resume Upload Section */}
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md border`}>
                    <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>1. Your Resume</h2>
                    <label htmlFor="resume-upload" className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col justify-center items-center cursor-pointer transition-colors ${darkMode ? 'border-gray-600 hover:bg-gray-900 hover:border-blue-400' : 'border-gray-300 hover:bg-gray-50 hover:border-blue-500'}`}>
                        <UploadIcon />
                        {resume ? (
                            <span className="text-green-600 font-semibold">{resume.name}</span>
                        ) : (
                            <span className="text-gray-500">Click to upload a .txt or .docx file</span>
                        )}
                        <p className="text-xs text-gray-400 mt-1">TXT and DOCX only</p>
                    </label>
                    <input
                        id="resume-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    />
                </div>

                {/* Job Description Section */}
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-md border`}>
                    <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>2. Job Description</h2>
                    <div className="flex items-start">
                        <ClipboardIcon />
                        <textarea
                            className={`w-full h-48 p-2 rounded-lg transition ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-600 focus:ring-blue-400 focus:border-blue-400' : 'bg-gray-100 text-gray-800 border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            placeholder="Paste the job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        ></textarea>
                    </div>
                    <button
                        className={`text-sm mt-2 ${darkMode ? 'text-blue-400 hover:underline' : 'text-blue-600 hover:underline'}`}
                        onClick={() => setJobDescription(exampleJobDescription)}
                    >
                        Use example job description
                    </button>
                </div>
            </div>
            <div className="text-center mt-10">
                <button
                    onClick={handleAnalyze}
                    disabled={!resume || !jobDescription || loading}
                    className={`px-10 py-4 font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 ${darkMode ? 'bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-400' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300'}`}
                >
                    {loading ? "Analyzing..." : "Analyze Now"}
                </button>
                {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>
        </div>
    );
};

// ReportScreen shows the backend's analysis results
const ReportScreen = ({ result, darkMode }) => {
    const [selectedSkillIdx, setSelectedSkillIdx] = useState(null);

    if (!result) return <div>Loading...</div>;

    // Find the improvement for the selected skill
    const selectedImprovement = selectedSkillIdx !== null && result.improvements
        ? result.improvements[selectedSkillIdx]
        : null;

    return (
        <div className={`w-full max-w-3xl mx-auto ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
            <h1 className={`text-3xl font-bold text-center mb-8 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Analysis Report</h1>

            {/* Match Score */}
            <div className="mb-8 text-center">
                <span className={`text-5xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{Math.round(result.matchScore * 100)}%</span>
                <div className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Match Score</div>
            </div>

            {/* Matching Skills */}
            <div className="mb-8">
                <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Matching Skills</h2>
                <ul className="flex flex-wrap gap-2">
                    {result.matchingSkills?.length > 0 ? result.matchingSkills.map((skill, idx) => (
                        <li key={idx} className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full">
                            <CheckCircleIcon /> {skill}
                        </li>
                    )) : <li className="text-gray-500">No matching skills found.</li>}
                </ul>
            </div>

            {/* Missing Skills as buttons */}
            <div className="mb-8">
                <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Missing Skills</h2>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Click on one to show only that suggestion</p>
                <div className="flex flex-wrap gap-2">
                    {result.missingSkills?.length > 0 ? result.missingSkills.map((skill, idx) => (
                        <button
                            key={idx}
                            className={`flex items-center px-3 py-1 rounded-full border transition font-semibold bg-yellow-100 text-yellow-700 ${selectedSkillIdx === idx ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'border-yellow-600 hover:bg-blue-300' : 'border-yellow-400 hover:bg-blue-100')}`}
                            onClick={() => setSelectedSkillIdx(idx)}
                        >
                            <XCircleIcon /> {skill}
                        </button>
                    )) : <span className="text-gray-500">No missing skills found.</span>}
                    {selectedSkillIdx !== null && (
                        <button
                            className={`ml-2 px-3 py-1 rounded-full border font-semibold ${darkMode ? 'bg-gray-700 text-gray-100 border-gray-500 hover:bg-gray-800' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                            onClick={() => setSelectedSkillIdx(null)}
                        >
                            Show All
                        </button>
                    )}
                </div>
            </div>

            {/* AI Feedback */}
            <div className="mb-8">
                <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>AI Feedback</h2>
                <p className={`p-4 rounded ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>{result.analysis}</p>
            </div>

            {/* Improvements & Learning Resources */}
            <div className="mb-8">
                <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Improvements & Learning Resources</h2>
                <div className="grid gap-6">
                    {selectedImprovement ? (
                        <div
                            className={`rounded-2xl shadow-md border p-8 flex flex-col justify-between transition hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-400' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                        >
                            <div>
                                <div className="flex items-center mb-2">
                                    <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{selectedImprovement.suggestion}</span>
                                </div>
                                <p className="text-gray-500 mb-4">
                                    Improve this skill to boost your match score.
                                </p>
                            </div>
                            <a
                                href={`https://www.coursera.org/search?query=${encodeURIComponent(selectedImprovement.searchTerm)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition"
                            >
                                Search "{selectedImprovement.searchTerm}" on Coursera
                            </a>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {result.improvements?.map((imp, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-2xl shadow-md border p-6 flex flex-col justify-between transition hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-400' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                                >
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{imp.suggestion}</span>
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
                    )}
                </div>
            </div>

            {/* Resources (if any) */}
            <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Other Resources</h2>
            <ul className="grid gap-1.5 md:grid-cols-3 text-blue-700 text-center">
                <li>
                    <a href="https://www.coursera.org" target="_blank" rel="noopener noreferrer" className={`rounded-2xl shadow-md border p-6 flex flex-col justify-between transition font-bold ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-blue-900 hover:border-blue-400 text-blue-300' : 'bg-white border-gray-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700'}`}>Coursera</a>
                </li>
                <li>
                    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className={`rounded-2xl shadow-md border p-6 flex flex-col justify-between transition font-bold ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-blue-900 hover:border-blue-400 text-blue-300' : 'bg-white border-gray-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700'}`}>LinkedIn</a>
                </li>
                <li>
                    <a href="https://www.Indeed.com" target="_blank" rel="noopener noreferrer" className={`rounded-2xl shadow-md border p-6 flex flex-col justify-between transition font-bold ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-blue-900 hover:border-blue-400 text-blue-300' : 'bg-white border-gray-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700'}`}>Indeed</a>
                </li>
            </ul>
        </div>
    );
};

function SignInModal({ onClose, onSignIn, darkMode }) {
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
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-md flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className={`rounded-xl shadow-lg p-8 w-full max-w-sm border ${darkMode ? 'bg-gray-900 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Register / Sign In</h2>
                <input
                    type="email"
                    placeholder="Email"
                    className={`w-full mb-3 p-2 border rounded transition ${darkMode ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'}`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className={`w-full mb-3 p-2 border rounded transition ${darkMode ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'}`}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                {error && <div className="text-red-500 mb-2">{error}</div>}
                <button type="submit" className={`w-full py-2 rounded font-bold transition ${darkMode ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Register / Sign In</button>
                <button type="button" className={`w-full mt-2 rounded transition ${darkMode ? 'bg-gray-900 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-200'}`} onClick={onClose}>Cancel</button>
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
    const [darkMode, setDarkMode] = useState(false);

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

    const handleSelectAnalysis = async (id) => {
        if (!token) return;
        try {
            const res = await axios.get(`http://localhost:5159/api/analysis/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalysisResult(res.data);
            setPage('report');
        } catch {
            // Do Nothing
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
                return <InputScreen onAnalyze={navigateToReport} token={token} setPastAnalyses={setPastAnalyses} darkMode={darkMode} />;
            case 'report':
                return <ReportScreen result={analysisResult} onFindResources={navigateToResources} darkMode={darkMode} />;
            case 'resources':
                return <ResourcesScreen skill={selectedSkill} onBack={() => setPage('report')} darkMode={darkMode} />;
            case 'dashboard':
            default:
                return <Dashboard onStart={navigateToInput} user={user} pastAnalyses={pastAnalyses} darkMode={darkMode} onSelectAnalysis={handleSelectAnalysis} />;
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
        <main className={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} min-h-screen font-sans`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="py-6 flex justify-between items-center">
                    <div
                        className={`text-2xl font-bold cursor-pointer ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}
                        onClick={navigateToDashboard}
                    >
                        SkillSync
                    </div>
                    <nav className="flex items-center gap-4">
                        <button
                            className={`px-3 py-2 rounded transition ${darkMode ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => setDarkMode(!darkMode)}
                        >
                            {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        {user ? (
                            <button
                                className={`text-gray-600 hover:text-blue-600 ${darkMode ? 'text-gray-300 hover:text-blue-300' : ''}`}
                                onClick={handleLogout}
                            >
                                Log Out
                            </button>
                        ) : (
                            <button
                                className={`text-gray-600 hover:text-blue-600 ${darkMode ? 'text-gray-300 hover:text-blue-300' : ''}`}
                                onClick={() => setShowSignIn(true)}
                            >
                                Register / Sign In
                            </button>
                        )}
                    </nav>
                    {showSignIn && (
                        <SignInModal
                            onClose={() => setShowSignIn(false)}
                            onSignIn={handleSignIn}
                            darkMode={darkMode}
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