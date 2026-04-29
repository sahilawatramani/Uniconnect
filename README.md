# 🎓 UniConnect Student Management System

<div align="center">

![UniConnect Logo](https://img.shields.io/badge/UniConnect-Student%20Management-blue?style=for-the-badge&logo=graduation-cap)

**A comprehensive full-stack web application for managing student information in educational institutes**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-success?style=for-the-badge&logo=vercel)](https://uni-connect-git-main-jdoijad15115s-projects.vercel.app)
[![API Status](https://img.shields.io/badge/API-Online-brightgreen?style=for-the-badge&logo=render)](https://uniconnect-mv75.onrender.com/api)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)

</div>

---

## 🌟 Overview

UniConnect is a modern, full-stack student management system designed to streamline administrative tasks for educational institutions. Built with cutting-edge technologies, it provides a robust platform for managing students, courses, departments, and more through an intuitive admin dashboard.

### 🚀 Live Application
- **🌐 Frontend**: [https://uni-connect-git-main-jdoijad15115s-projects.vercel.app](https://uni-connect-git-main-jdoijad15115s-projects.vercel.app)
- **⚡ Backend API**: [https://uniconnect-mv75.onrender.com/api](https://uniconnect-mv75.onrender.com/api)

---

## ✨ Key Features

<div align="center">

| 📚 **Academic Management** | 👥 **User Management** | 📊 **Data Operations** | 🔧 **System Features** |
|:-------------------------:|:----------------------:|:---------------------:|:---------------------:|
| Course Management | Student Profiles | CRUD Operations | Admin Dashboard |
| Department Tracking | Instructor Management | Data Validation | Error Handling |
| Classroom Allocation | Alumni Database | Relational Schema | CORS Support |
| Enrollment System | Attendance Tracking | Foreign Key Constraints | Responsive Design |

</div>

### 🎯 Core Functionalities
- ✅ **Student Management** - Complete student lifecycle management
- ✅ **Course Administration** - Comprehensive course and curriculum handling
- ✅ **Department Organization** - Structured departmental management
- ✅ **Instructor Portal** - Faculty information and assignment tracking
- ✅ **Classroom Management** - Room allocation and scheduling
- ✅ **Enrollment System** - Student-course enrollment tracking
- ✅ **Attendance Monitoring** - Real-time attendance management
- ✅ **Alumni Network** - Graduate tracking and engagement

### 🔐 Security & Access Control (RBAC)
UniConnect implements strict Role-Based Access Control to partition administrative features from student data. 
- **Students**: Only have access to their own personal data, attendance stats, and AI learning tools.
- **Administrators**: Have full access to manage the campus database.

> [!IMPORTANT]
> **Admin Secret Code**
> To register as an Administrator, you must provide the Admin Authorization Code on the registration page to prevent privilege escalation. 
> 
> Default Code: `UNICONNECT2026`
> 
> *(This can be changed by setting the `ADMIN_SECRET` variable in your backend `.env` file).*

---

## 🛠️ Technology Stack

### Frontend Architecture
```
React 18 + Vite
├── 🎨 Ant Design UI Components
├── 🌐 Axios for API Communication
├── 🧭 React Router DOM for Navigation
├── ⏰ Moment.js for Date Handling
└── 📱 Responsive Design Patterns
```

### Backend Infrastructure
```
Node.js + Express
├── 🐘 PostgreSQL Database
├── 🔌 pg Database Driver
├── 🌍 CORS Configuration
├── 🔐 Environment Variables (dotenv)
└── 📝 Body Parser Middleware
```

### Deployment & DevOps
```
Cloud Deployment
├── 🚀 Vercel (Frontend Hosting)
├── 🌐 Render (Backend + Database)
└── 📦 Continuous Integration
```

---

## 🚀 Quick Start Guide

### 📋 Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

### ⚡ Installation Steps

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/uniconnect.git
cd uniconnect
```

#### 2️⃣ Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
touch .env
```

**Configure your `.env` file:**
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/uniconnect

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: Add any other environment variables
```

**Start the backend server:**
```bash
npm start
# or for development with auto-reload
npm run dev
```

#### 3️⃣ Frontend Setup
```bash
# Navigate to frontend directory (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4️⃣ Database Setup
```sql
-- Create database tables (run in PostgreSQL)
-- Import the provided schema file or create tables manually
-- Ensure all foreign key relationships are properly established
```

### 🌐 Access Your Application
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 📚 API Documentation

### 🔗 Base URL
```
Production: https://uniconnect-mv75.onrender.com/api
Development: http://localhost:5000/api
```

### 📊 Available Endpoints

<details>
<summary><strong>👥 Students API</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/students` | Retrieve all students |
| `GET` | `/students/:id` | Get student by ID |
| `POST` | `/students` | Create new student |
| `PUT` | `/students/:id` | Update student information |
| `DELETE` | `/students/:id` | Remove student |

</details>

<details>
<summary><strong>📚 Courses API</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/courses` | Retrieve all courses |
| `GET` | `/courses/:id` | Get course by ID |
| `POST` | `/courses` | Create new course |
| `PUT` | `/courses/:id` | Update course information |
| `DELETE` | `/courses/:id` | Remove course |

</details>

<details>
<summary><strong>🏢 Departments API</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/departments` | Retrieve all departments |
| `GET` | `/departments/:id` | Get department by ID |
| `POST` | `/departments` | Create new department |
| `PUT` | `/departments/:id` | Update department |
| `DELETE` | `/departments/:id` | Remove department |

</details>

**Additional APIs available for:**
- 👨‍🏫 **Instructors** (`/instructors`)
- 🏫 **Classrooms** (`/classrooms`)
- 📝 **Enrollments** (`/enrollments`)
- ✅ **Attendance** (`/attendance`)
- 🎓 **Alumni** (`/alumni`)

---

## 🗄️ Database Schema

```sql
UniConnect Database Structure
├── 👥 students (Primary Entity)
├── 📚 courses (Academic Programs)
├── 🏢 departments (Organizational Units)
├── 👨‍🏫 instructors (Faculty Members)
├── 🏫 classrooms (Physical Resources)
├── 📝 enrollments (Student-Course Relations)
├── ✅ attendance (Tracking Records)
└── 🎓 alumni (Graduate Database)
```

**Key Features:**
- 🔗 Foreign key constraints for data integrity
- 📊 Relational schema design
- 🛡️ Data validation at database level
- 🔄 Normalized table structure

---

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

#### 🚨 500 Internal Server Error
- **Cause**: Database connection issues or schema mismatches
- **Solution**: Verify DATABASE_URL and ensure all tables exist

#### 🚫 404 Not Found
- **Cause**: Incorrect API endpoint or missing route prefix
- **Solution**: Ensure all API calls include `/api/` prefix

#### 🌐 CORS Errors
- **Cause**: Cross-origin request blocked
- **Solution**: Verify CORS configuration in `server.js`

#### 🔌 Database Connection Failed
- **Cause**: PostgreSQL server not running or wrong credentials
- **Solution**: Check PostgreSQL status and verify `.env` configuration

#### 📦 Module Not Found
- **Cause**: Missing dependencies
- **Solution**: Run `npm install` in both frontend and backend directories

---

## 🤝 Contributing

We welcome contributions to UniConnect! Here's how you can help:

1. **🍴 Fork the repository**
2. **🌿 Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **💾 Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **📤 Push to the branch** (`git push origin feature/AmazingFeature`)
5. **🔄 Open a Pull Request**

### 📝 Contribution Guidelines
- Follow the existing code style and conventions
- Write clear, concise commit messages
- Add tests for new features when applicable
- Update documentation as needed

---

## 👨‍💻 Author & Acknowledgments

<div align="center">

**Designed and Developed by**

[![Janhavi Doijad](https://img.shields.io/badge/👩‍💻-Janhavi%20Doijad-purple?style=for-the-badge)](https://github.com/jdoijad15115)

*Full-Stack Developer | Educational Technology Enthusiast*

</div>

### 🙏 Special Thanks
- The open-source community for amazing tools and libraries
- Educational institutions for inspiration and feedback
- All contributors and testers who helped improve this project

---

## 📄 License

```
MIT License

Copyright (c) 2024 Janhavi Doijad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/uniconnect?style=social)](https://github.com/yourusername/uniconnect/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/uniconnect?style=social)](https://github.com/yourusername/uniconnect/network)

**Made with ❤️ for the Education Community**

</div>
