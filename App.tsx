import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import RequireRole from './components/RequireRole'
import StudentLayout from './layouts/StudentLayout'
import TeacherLayout from './layouts/TeacherLayout'
import AdminLayout from './layouts/AdminLayout'
import StudentDashboard from './pages/student/Dashboard'
import StudentAttendance from './pages/student/Attendance'
import StudentHomework from './pages/student/Homework'
import StudentVocabulary from './pages/student/Vocabulary'
import StudentGrammar from './pages/student/Grammar'
import StudentAiTutor from './pages/student/AiTutor'
import StudentCourses from './pages/student/Courses'
import StudentMockTests from './pages/student/MockTests'
import StudentCertificates from './pages/student/Certificates'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherHomework from './pages/teacher/Homework'
import TeacherProgress from './pages/teacher/Progress'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminCourses from './pages/admin/Courses'
import AdminTests from './pages/admin/Tests'
import AdminAssignments from './pages/admin/Assignments'
import AdminAnalytics from './pages/admin/Analytics'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/student" element={<RequireRole role="student"><StudentLayout /></RequireRole>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="homework" element={<StudentHomework />} />
          <Route path="vocabulary" element={<StudentVocabulary />} />
          <Route path="grammar" element={<StudentGrammar />} />
          <Route path="ai-tutor" element={<StudentAiTutor />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="mock-tests" element={<StudentMockTests />} />
          <Route path="certificates" element={<StudentCertificates />} />
        </Route>

        <Route path="/teacher" element={<RequireRole role="teacher"><TeacherLayout /></RequireRole>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="homework" element={<TeacherHomework />} />
          <Route path="progress" element={<TeacherProgress />} />
        </Route>

        <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="tests" element={<AdminTests />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
