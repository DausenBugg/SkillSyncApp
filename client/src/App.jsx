import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [message, setMessage] = useState('Connecting to backend...');
  // New state to control the style: 'loading', 'success', or 'error'
  const [statusType, setStatusType] = useState('loading');

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await axios.get('http://localhost:5159/api/test/message');
        setMessage(response.data.message);
        setStatusType('success'); // Set status to success
      } catch (error) {
        console.error("Error fetching data: ", error);
        setMessage('Connection Failed. Is the backend server running?');
        setStatusType('error'); // Set status to error
      }
    };

    fetchMessage();
  }, []);

  return (
    <div className="container">
      <div className="status-card">
        <div className="card-header">
          <svg className="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.59L5.59 11 7 9.59l4 4 8-8L20.41 7 11 16.59z" />
          </svg>
          <h1 className="title">SkillSync Connectivity</h1>
        </div>
        
        <div className="status-display">
          <div className={`status-indicator ${statusType}`}></div>
          <p className="status-message">{message}</p>
        </div>

        <div className="card-footer">
          <p>This page verifies the connection between the React frontend and the ASP.NET backend.</p>
        </div>
      </div>
    </div>
  );
}

export default App;