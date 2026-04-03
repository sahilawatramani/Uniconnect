// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import Students from './pages/Students';
import Courses from './pages/Courses';
import Departments from './pages/Departments';
import Enrollments from './pages/Enrollments';
import Classrooms from './pages/Classrooms';
import Alumni from './pages/Alumni';
import Attendance from './pages/Attendance';

// AI Pages
import AiChat from './pages/AiChat';
import AiLearn from './pages/AiLearn';
import AiQuiz from './pages/AiQuiz';
import AiInsights from './pages/AiInsights';

// Components
import ChatWidget from './components/ChatWidget';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/students" element={<Students />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/enrollments" element={<Enrollments />} />
                <Route path="/classrooms" element={<Classrooms />} />
                <Route path="/alumni" element={<Alumni />} />
                <Route path="/attendance" element={<Attendance />} />
                {/* AI Routes */}
                <Route path="/ai-chat" element={<AiChat />} />
                <Route path="/ai-learn" element={<AiLearn />} />
                <Route path="/ai-quiz" element={<AiQuiz />} />
                <Route path="/ai-insights" element={<AiInsights />} />
            </Routes>
            {/* Floating Chat Widget — visible on all pages */}
            <ChatWidget />
        </Router>
    );
}

export default App;
