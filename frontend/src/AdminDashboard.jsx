import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import PlacementDrivesHub from './PlacementDrivesHub';
import { apiFetch } from './api';
import { useToast } from './Toast';
import { ThemeToggle } from './ThemeContext';
import CampusEdgeLogo from './CampusEdgeLogo';
import UserProgressGraph from './UserProgressGraph';

function safeJsonParse(val, fallback = null) {
  if (!val) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

function formatInterviewDialogues(feedback) {
  if (!feedback) return [];
  let list = feedback;
  if (typeof feedback === 'string') {
    try {
      list = JSON.parse(feedback);
    } catch (e) {
      return [{ question: 'Interview Feedback & Summary', answer: feedback }];
    }
  }
  if (!Array.isArray(list) || list.length === 0) {
    if (typeof list === 'string' && list.trim()) {
      return [{ question: 'Interview Feedback & Summary', answer: list }];
    }
    return [];
  }

  // Check if it's chat message format [{ sender: 'ai', text: '...' }, { sender: 'user', text: '...' }]
  const hasSenderFormat = list.some(item => item && (item.sender || item.role));
  if (hasSenderFormat) {
    const pairs = [];
    let currentQuestion = null;

    list.forEach(msg => {
      if (!msg) return;
      const isAI = msg.sender === 'ai' || msg.role === 'assistant' || msg.role === 'ai';
      const isUser = msg.sender === 'user' || msg.role === 'user';

      if (isAI) {
        if (currentQuestion) {
          pairs.push({ question: currentQuestion, answer: "Dialogue concluded" });
        }
        currentQuestion = msg.text || msg.content || "";
      } else if (isUser) {
        pairs.push({
          question: currentQuestion || "Interview Prompt",
          answer: msg.text || msg.content || "Spoken response recorded"
        });
        currentQuestion = null;
      } else if (msg.question || msg.answer) {
        pairs.push({
          question: msg.question || "Interview Prompt",
          answer: msg.answer || msg.text || "Spoken response recorded"
        });
      }
    });

    if (currentQuestion) {
      pairs.push({ question: currentQuestion, answer: "Dialogue concluded" });
    }

    return pairs;
  }

  // Standard Q&A format [{ question: '...', answer: '...' }]
  return list.map((item, idx) => ({
    question: item.question || item.prompt || (item.text && !item.answer ? item.text : `Interview Question ${idx + 1}`),
    answer: item.answer || item.response || (item.question ? item.text : "Spoken response recorded")
  }));
}

export default function AdminDashboard({ user: propUser, onLogout, onViewLanding }) {
  const [activeAdminTab, setActiveAdminTab] = useState('questions');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [questions, setQuestions] = useState([]);
  
  // Bulk Delete States for Questions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category Deletion States
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState('');
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  
  // Student Management & Activity State
  const [allTestRecords, setAllTestRecords] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Leaderboard & AI Interview Logs State for Admin
  const [leaderboard, setLeaderboard] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [expandedInterviewId, setExpandedInterviewId] = useState(null);
  const [expandedStudentEmail, setExpandedStudentEmail] = useState(null);
  const [interviewViewMode, setInterviewViewMode] = useState('by_student'); // 'by_student' or 'all_sessions'
  const [interviewSearch, setInterviewSearch] = useState('');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  // Selected Student for Activity Modal View
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentActivityRecords, setStudentActivityRecords] = useState([]);
  const [studentInterviewRecords, setStudentInterviewRecords] = useState([]);
  const [studentCodingRecords, setStudentCodingRecords] = useState([]);
  const [studentLatestAts, setStudentLatestAts] = useState(null);
  const [studentModalTab, setStudentModalTab] = useState('progress'); // 'progress', 'all_questions', 'tests', 'interviews', 'coding'
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingStudentActivity, setLoadingStudentActivity] = useState(false);
  const [selectedTestForReview, setSelectedTestForReview] = useState(null);
  
  // Coding Submissions Monitor State for Admin
  const [allCodingRecords, setAllCodingRecords] = useState([]);
  const [loadingCodingRecords, setLoadingCodingRecords] = useState(false);
  const [selectedCodeForReview, setSelectedCodeForReview] = useState(null);
  const [studentFeedTab, setStudentFeedTab] = useState('mock_tests'); // 'mock_tests' or 'coding_tests'
  const [codingFeedSearch, setCodingFeedSearch] = useState('');
  const [expandedStudentCodingEmail, setExpandedStudentCodingEmail] = useState(null);

  // Search & Filter States for Questions
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [questionViewMode, setQuestionViewMode] = useState('by_category'); // 'by_category', 'by_difficulty', 'table'
  const [expandedQuestionCategory, setExpandedQuestionCategory] = useState(null);
  const [expandedQuestionDifficulty, setExpandedQuestionDifficulty] = useState(null);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(10);

  // Pagination States for Student Test Submissions
  const [recordPage, setRecordPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [testSubmissionViewMode, setTestSubmissionViewMode] = useState('by_student'); // 'by_student' or 'all_table'
  const [expandedStudentTestEmail, setExpandedStudentTestEmail] = useState(null);
  const [testFeedSearch, setTestFeedSearch] = useState('');

  // Admin Profile Modal & Menu State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Admin User Data State
  const [adminUser, setAdminUser] = useState(() => {
    if (propUser) return propUser;
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    if (propUser) {
      setAdminUser(propUser);
    }
  }, [propUser]);

  const adminName = adminUser?.name || 'Administrator';
  const adminEmail = adminUser?.email || 'admin@campusedge.com';

  // Editable Admin Profile Form State
  const [editName, setEditName] = useState(adminUser?.name || '');
  const [editDob, setEditDob] = useState(adminUser?.dob || '');
  const [editHometown, setEditHometown] = useState(adminUser?.hometown || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchQuestions();
    fetchAllStudentActivity();
    fetchStudentsList();
    fetchAdminLeaderboard();
    fetchAdminInterviews();
    fetchAdminCodingHistory();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await apiFetch('/api/questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
        setQuestionPage(1);
        setSelectedQuestionIds([]);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const fetchAllStudentActivity = async () => {
    setLoadingRecords(true);
    try {
      const response = await apiFetch('/api/questions/admin/all-history');
      if (response.ok) {
        setAllTestRecords(await response.json());
        setRecordPage(1);
      }
    } catch (err) {
      console.error("Failed to load admin records:", err);
    }
    setLoadingRecords(false);
  };

  const fetchStudentsList = async () => {
    setLoadingStudents(true);
    try {
      const response = await apiFetch('/api/users/admin/students');
      if (response.ok) {
        const students = await response.json();
        const studentsWithAts = await Promise.all(students.map(async (student) => {
          try {
            const atsRes = await apiFetch(`/api/resume/history/${student.email}`);
            if (atsRes.ok) {
              const atsHistory = await atsRes.json();
              if (atsHistory.length > 0) {
                return { ...student, latestAts: atsHistory[0] };
              }
            }
          } catch (e) {
            console.error("Error fetching ATS for student", student.email);
          }
          return { ...student, latestAts: null };
        }));
        setStudentsList(studentsWithAts);
      }
    } catch (err) {
      console.error("Failed to load students list:", err);
    }
    setLoadingStudents(false);
  };

  const fetchAdminLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await apiFetch('/api/admin/leaderboard');
      if (res.ok) setLeaderboard(await res.json());
    } catch (err) {
      console.error("Error fetching admin leaderboard:", err);
    }
    setLoadingLeaderboard(false);
  };

  const fetchAdminInterviews = async () => {
    setLoadingInterviews(true);
    try {
      const res = await apiFetch('/api/admin/interviews');
      if (res.ok) setInterviews(await res.json());
    } catch (err) {
      console.error("Error fetching admin interviews:", err);
    }
    setLoadingInterviews(false);
  };

  const fetchAdminCodingHistory = async () => {
    setLoadingCodingRecords(true);
    try {
      const res = await apiFetch('/api/code/admin/all-history');
      if (res.ok) setAllCodingRecords(await res.json());
    } catch (err) {
      console.error("Error fetching admin coding history:", err);
    }
    setLoadingCodingRecords(false);
  };

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setStudentLatestAts(student.latestAts);
    setLoadingStudentActivity(true);
    setStudentModalTab('progress');
    try {
      const [testRes, interviewRes, codingRes] = await Promise.all([
        apiFetch(`/api/questions/history/${student.email}`),
        apiFetch(`/api/interview/history/${student.email}`),
        apiFetch(`/api/code/history/${student.email}`)
      ]);

      if (testRes.ok) {
        setStudentActivityRecords(await testRes.json());
      } else {
        setStudentActivityRecords([]);
      }

      if (interviewRes.ok) {
        setStudentInterviewRecords(await interviewRes.json());
      } else {
        setStudentInterviewRecords([]);
      }

      if (codingRes.ok) {
        setStudentCodingRecords(await codingRes.json());
      } else {
        setStudentCodingRecords([]);
      }
    } catch (err) {
      console.error("Failed to fetch student activities:", err);
      setStudentActivityRecords([]);
      setStudentInterviewRecords([]);
      setStudentCodingRecords([]);
    }
    setLoadingStudentActivity(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await apiFetch('/api/users/update-profile', {
        method: 'PUT',
        body: JSON.stringify({
          email: adminEmail,
          name: editName,
          dob: editDob,
          hometown: editHometown,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        showSuccess("Admin profile updated successfully!");
        const updated = { ...adminUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updated));
        setAdminUser(updated);
        setIsEditingProfile(false);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        showError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      showError(err.message || "Server error updating profile.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    } else {
      showSuccess("Logged out successfully!");
      window.location.reload();
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showWarning('Please select an Excel or CSV file first.');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      setUploadStatus('Uploading & importing questions...');
      const response = await apiFetch('/api/questions/bulk-upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess(data.message || 'Questions uploaded successfully!');
        setUploadStatus(data.message);
        fetchQuestions(); 
        setFile(null); 
        e.target.reset();
      } else {
        showError(data.message || 'Upload failed.');
        setUploadStatus('Upload failed.');
      }
    } catch (err) {
      showError('Network error uploading file.');
      setUploadStatus('Upload failed.');
    }
  };

  const toggleSelectAllQuestions = (e) => {
    if (e.target.checked) {
      setSelectedQuestionIds(currentQuestions.map(q => q.id));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const toggleSelectOneQuestion = (id) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteQuestions = async () => {
    if (selectedQuestionIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedQuestionIds.length} selected questions?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiFetch('/api/admin/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({ table: 'questions', ids: selectedQuestionIds })
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess(data.message || 'Questions deleted.');
        setSelectedQuestionIds([]);
        fetchQuestions();
      } else {
        showError(data.message || 'Failed to delete questions.');
      }
    } catch (err) {
      console.error('Bulk delete network error:', err);
      showError('Failed to connect to server.');
    }
    setIsDeleting(false);
  };

  const handleDeleteStudent = async (studentId, studentName, studentEmail) => {
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete candidate "${studentName || 'Student'}" (${studentEmail})?\n\nThis will permanently purge their account, mock test records, AI interview logs, ATS resume history, and leaderboard rankings.`)) {
      return;
    }
    try {
      const response = await apiFetch(`/api/users/admin/students/${studentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess(data.message || "Student removed successfully.");
        fetchStudentsList();
        fetchAllStudentActivity();
        fetchAdminLeaderboard();
        fetchAdminInterviews();
      } else {
        showError(data.message || "Failed to remove student.");
      }
    } catch (err) {
      console.error("Delete student error:", err);
      showError("Server error removing student.");
    }
  };

  const handlePurgeTestUsers = async () => {
    if (!window.confirm("⚠️ Are you sure you want to purge all test/demo accounts (matching 'test*', 'demo*', or 'example.com')?\n\nThis will permanently clean up test candidate data and logs.")) {
      return;
    }
    try {
      const response = await apiFetch('/api/users/admin/purge-test-users', {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess(data.message);
        fetchStudentsList();
        fetchAllStudentActivity();
        fetchAdminLeaderboard();
        fetchAdminInterviews();
      } else {
        showError(data.message || "Failed to purge test users.");
      }
    } catch (err) {
      console.error("Purge error:", err);
      showError("Server error purging test accounts.");
    }
  };

  const handleDeleteSingleQuestion = async (id, questionText) => {
    const preview = (questionText || '').slice(0, 80);
    if (!window.confirm(`Are you sure you want to permanently delete Question #${id}?\n\n"${preview}..."`)) {
      return;
    }
    try {
      const response = await apiFetch(`/api/questions/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess(data.message || 'Question deleted.');
        setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
        fetchQuestions();
      } else {
        showError(data.message || 'Failed to delete question.');
      }
    } catch (err) {
      console.error('Single delete error:', err);
      showError('Failed to delete question.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategoryToDelete) {
      showWarning("Please select a category to delete.");
      return;
    }

    if (!window.confirm(`WARNING: Are you sure you want to permanently delete ALL questions under the category "${selectedCategoryToDelete}"?`)) {
      return;
    }

    setIsDeletingCategory(true);
    try {
      const response = await apiFetch('/api/admin/delete-by-category', {
        method: 'DELETE',
        body: JSON.stringify({ category: selectedCategoryToDelete })
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess(data.message);
        setSelectedCategoryToDelete('');
        fetchQuestions(); 
      } else {
        showError(data.message || 'Failed to delete category.');
      }
    } catch (err) {
      console.error('Category delete error:', err);
      showError('Failed to connect to server.');
    }
    setIsDeletingCategory(false);
  };

  const downloadTemplate = () => {
    const templateData = [{
      "CATEGORY": "JavaScript", "TOPIC": "Variables", "DIFFICULTY": "Easy",
      "QUESTION": "What keyword is used to declare a block-scoped variable in modern JS?",
      "OPTION A": "var", "OPTION B": "let", "OPTION C": "function", "OPTION D": "int",
      "ANSWER": "let", "EXPLANATION": "let is block-scoped in ES6."
    }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "CampusEdge_Upload_Template.xlsx");
    showInfo("Template downloaded.");
  };

  const filteredQuestions = questions.filter((q) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (q.category && q.category.toLowerCase().includes(searchLower)) ||
                          (q.question_text && q.question_text.toLowerCase().includes(searchLower));
    const matchesDifficulty = difficultyFilter === 'All' || (q.difficulty && q.difficulty.toLowerCase() === difficultyFilter.toLowerCase());
    return matchesSearch && matchesDifficulty;
  });

  const indexOfLastQuestion = questionPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalQuestionPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const indexOfLastRecord = recordPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = allTestRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalRecordPages = Math.ceil(allTestRecords.length / recordsPerPage);

  const navItems = [
    { id: 'questions', label: 'Question Bank', icon: '📚', count: questions.length },
    { id: 'students', label: 'Student Management', icon: '👥', count: studentsList.length },
    { id: 'rankings', label: 'Global Standings', icon: '🏆', count: leaderboard.length },
    { id: 'interviews', label: 'AI Interview Q&A', icon: '🎙️', count: interviews.length },
    { id: 'drives', label: 'Placement Drives', icon: '🏢' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans selection:bg-indigo-600 selection:text-white relative">
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Executive Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col 
        w-68 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 
        p-5 sm:p-6 transition-transform duration-300 shadow-xl lg:shadow-none min-h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-6 flex items-center justify-between">
          <CampusEdgeLogo 
            size="sm" 
            subtitle="Executive Command Hub"
            onClick={() => { setActiveAdminTab('questions'); setMobileMenuOpen(false); }}
          />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Live System Heartbeat Pill */}
        <div className="mb-5 flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Live Grid Engine</span>
          </div>
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
            SYNCED
          </span>
        </div>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = activeAdminTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => { setActiveAdminTab(item.id); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]' 
                    : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="font-bold tracking-tight">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Telemetry Health Card */}
        <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/50 border border-indigo-200/60 dark:border-indigo-500/20 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">System Telemetry</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">99.9% Uptime</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <div className="flex justify-between">
              <span>Database Cluster:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">PostgreSQL Online</span>
            </div>
            <div className="flex justify-between">
              <span>Proctoring Guard:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Active 3-Strike</span>
            </div>
          </div>
        </div>

        {/* Admin Account Card */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/20">
              👑
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{adminName}</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate font-bold">Master Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-slate-50 dark:bg-slate-950">
        
        {/* Background Ambient Glows */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-10 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl" />

        {/* Top Header Banner */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 relative z-10">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-base shadow-xs shrink-0 mt-0.5 cursor-pointer"
              title="Open Navigation"
            >
              ☰
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Command Deck
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  • Campus Placement Grid 2026
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Admin Operations Console
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                Control question repositories, monitor candidate ATS metrics, inspect proctoring logs, and broadcast placement notices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Live Server</span>
              <span className="font-mono text-slate-400 text-[10px]">:5000</span>
            </div>

            <ThemeToggle />
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Admin Profile Menu"
              >
                {adminName.charAt(0).toUpperCase()}
              </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Signed in as Admin</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">{adminEmail}</p>
                </div>

                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    setEditName(adminUser?.name || '');
                    setEditDob(adminUser?.dob || '');
                    setEditHometown(adminUser?.hometown || '');
                    setIsEditingProfile(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span>👤</span> Manage Profile
                </button>

                <a 
                  href="/dashboard"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span>🎓</span> Student Workspace
                </a>

                {onViewLanding && (
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      onViewLanding();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>🏠</span> Campus Landing
                  </button>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition flex items-center gap-2 border-t border-slate-200 dark:border-slate-800 mt-1 cursor-pointer"
                >
                  <span>🚪</span> Log Out
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Manage Admin Profile Modal */}
        {isEditingProfile && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-8 animate-fade-in text-slate-900 dark:text-white space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black">Manage Admin Profile</h2>
                <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xl cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-400 uppercase mb-1">Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-400 uppercase mb-1">Date of Birth</label>
                    <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-400 uppercase mb-1">Hometown</label>
                    <input type="text" value={editHometown} placeholder="e.g. Mumbai" onChange={(e) => setEditHometown(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none" />
                  </div>
                </div>

                <hr className="my-2 border-slate-200 dark:border-slate-800" />
                <p className="font-bold text-slate-700 dark:text-slate-400 uppercase">Change Password (Optional)</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md cursor-pointer">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Student Detail & Activity Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-8 animate-fade-in max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-inner">
                    {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedStudent.name}</h2>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{selectedStudent.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-xl cursor-pointer">✕</button>
              </div>

              {/* Student Profile Meta & ATS Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">DOB:</span>
                  <span className="text-slate-900 dark:text-white">{selectedStudent.dob || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Location / City:</span>
                  <span className="text-slate-900 dark:text-white">{selectedStudent.address || selectedStudent.hometown || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Latest ATS Score:</span>
                  <span className={studentLatestAts ? (studentLatestAts.score >= 70 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-amber-600 dark:text-amber-400 font-black') : 'text-slate-400 dark:text-slate-500'}>
                    {studentLatestAts ? `${studentLatestAts.score}/100` : 'No Scan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Joined:</span>
                  <span className="text-slate-900 dark:text-white">{selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              {/* Privilege Management Action Bar */}
              {selectedStudent.role !== 'admin' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Privilege Management</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Granting admin access allows this user to manage questions and placement notices.</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to promote ${selectedStudent.email} to Admin?`)) {
                        try {
                          const res = await apiFetch(`/api/admin/promote-user/${selectedStudent.id}`, {
                            method: 'PUT'
                          });
                          const data = await res.json();
                          if (res.ok) {
                            showSuccess(data.message);
                            setSelectedStudent(null);
                            fetchStudentsList();
                          } else {
                            showError(data.message || "Failed to promote user.");
                          }
                        } catch (err) {
                          console.error("Promotion error:", err);
                          showError("Server error connecting to backend.");
                        }
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap cursor-pointer"
                  >
                    Promote to Admin 👑
                  </button>
                </div>
              )}

              {/* Student Questions & Activity Navigation Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
                <button
                  onClick={() => setStudentModalTab('progress')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    studentModalTab === 'progress'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📈 Progress Graph
                </button>
                <button
                  onClick={() => setStudentModalTab('all_questions')}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    studentModalTab === 'all_questions'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📝 All Questions in Line
                </button>
                <button
                  onClick={() => setStudentModalTab('tests')}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    studentModalTab === 'tests'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🧠 Mock Tests ({studentActivityRecords.length})
                </button>
                <button
                  onClick={() => setStudentModalTab('interviews')}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    studentModalTab === 'interviews'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🎙️ AI Interviews ({studentInterviewRecords.length})
                </button>
                <button
                  onClick={() => setStudentModalTab('coding')}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    studentModalTab === 'coding'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  💻 Coding Tests ({studentCodingRecords.length})
                </button>
              </div>

              {/* TAB 0: PROGRESS GRAPH & GROWTH TRAJECTORY */}
              {studentModalTab === 'progress' && (
                <div className="space-y-4">
                  {loadingStudentActivity ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse">
                      Generating candidate progress analytics and score curves...
                    </div>
                  ) : (
                    <UserProgressGraph
                      student={selectedStudent}
                      testRecords={studentActivityRecords}
                      interviewRecords={studentInterviewRecords}
                      codingRecords={studentCodingRecords}
                      onInspectTest={(test) => setSelectedTestForReview(test)}
                      onInspectCode={(codeRec) => setSelectedCodeForReview({ ...codeRec, student_name: selectedStudent.name })}
                      onInspectInterview={(interview) => setSelectedInterview(interview)}
                    />
                  )}
                </div>
              )}

              {/* TAB 1: ALL QUESTIONS IN LINE */}
              {studentModalTab === 'all_questions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      All Spoken, Written & Coding Questions by {selectedStudent.name || 'Student'}
                    </h3>
                  </div>

                  {loadingStudentActivity ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse">Loading all questions...</div>
                  ) : (() => {
                    const allQuestionsInLine = [];

                    // Extract test questions
                    studentActivityRecords.forEach((rec) => {
                      const full = typeof rec.full_data === 'string' ? JSON.parse(rec.full_data || '{}') : (rec.full_data || {});
                      const list = full.coveredQuestions || [];
                      list.forEach((q) => {
                        allQuestionsInLine.push({
                          type: 'test',
                          badge: `${rec.category} Test`,
                          date: rec.test_date,
                          question: q.question,
                          selected: q.selected,
                          correct: q.correct,
                          isCorrect: q.isCorrect,
                          explanation: q.explanation
                        });
                      });
                    });

                    // Extract interview questions
                    studentInterviewRecords.forEach((interview) => {
                      const list = interview.feedback || [];
                      list.forEach((qa) => {
                        allQuestionsInLine.push({
                          type: 'interview',
                          badge: `AI Interview (${interview.role})`,
                          date: new Date(interview.created_at).toLocaleDateString(),
                          question: qa.question || qa.text,
                          selected: qa.answer || qa.text,
                          correct: null,
                          isCorrect: true,
                          explanation: null
                        });
                      });
                    });

                    // Extract coding challenges
                    studentCodingRecords.forEach((codeRec) => {
                      allQuestionsInLine.push({
                        type: 'coding',
                        badge: `Coding Challenge (${codeRec.language ? codeRec.language.toUpperCase() : 'JS'})`,
                        date: new Date(codeRec.created_at).toLocaleDateString(),
                        question: `${codeRec.problem_title} (${codeRec.difficulty})`,
                        selected: codeRec.code,
                        correct: `${codeRec.status} • Passed ${codeRec.passed_count}/${codeRec.total_test_cases} Cases (${codeRec.runtime_ms}ms)`,
                        isCorrect: codeRec.status === 'Accepted',
                        rawCode: codeRec
                      });
                    });

                    if (allQuestionsInLine.length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">No detailed question records found for {selectedStudent.name || 'this student'}.</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">When the student completes tests, coding assessments, or AI interviews, all questions and answers will appear here in line.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {allQuestionsInLine.map((q, idx) => (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-2xl border ${
                              q.type === 'interview'
                                ? 'border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20'
                                : q.type === 'coding'
                                ? (q.isCorrect ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-amber-300 dark:border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20')
                                : (q.isCorrect ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-rose-300 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20')
                            } space-y-2 text-xs`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-md">
                                Q{idx + 1} • {q.badge} • {q.date}
                              </span>
                              {q.type === 'test' && (
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  q.isCorrect ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                                }`}>
                                  {q.isCorrect ? 'Correct ✓' : 'Incorrect ✕'}
                                </span>
                              )}
                              {q.type === 'coding' && (
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  q.isCorrect ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                                }`}>
                                  {q.isCorrect ? 'Accepted ✓' : 'Attempted ⚡'}
                                </span>
                              )}
                            </div>

                            <p className="font-bold text-slate-900 dark:text-white text-xs leading-relaxed">
                              {q.question}
                            </p>

                            {q.type === 'coding' ? (
                              <div className="space-y-2">
                                <div className="bg-slate-950 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-32 border border-slate-800">
                                  <pre>{q.selected || '// No code submitted'}</pre>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{q.correct}</span>
                                  {q.rawCode && (
                                    <button 
                                      onClick={() => setSelectedCodeForReview({ ...q.rawCode, student_name: selectedStudent.name })}
                                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                      Inspect Full Code 👁️
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                                    {selectedStudent.name ? selectedStudent.name.split(' ')[0] : 'Student'}'s Answer:
                                  </span>
                                  <p className={`font-semibold ${q.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    {q.selected || 'No answer submitted'}
                                  </p>
                                </div>

                                {q.correct && !q.isCorrect && (
                                  <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Correct Answer:</span>
                                    <p className="font-bold text-emerald-700 dark:text-emerald-400">{q.correct}</p>
                                  </div>
                                )}

                                {q.explanation && (
                                  <div className="bg-slate-100 dark:bg-slate-950/80 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-800">
                                    <strong className="text-indigo-700 dark:text-indigo-400">Explanation: </strong> {q.explanation}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: MOCK TESTS */}
              {studentModalTab === 'tests' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Mock Test Assessment History</h3>
                  {studentActivityRecords.length === 0 ? (
                    <div className="text-center text-slate-500 py-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">No test submissions found for this student.</div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {studentActivityRecords.map((rec) => (
                        <div key={rec.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-indigo-700 dark:text-indigo-400 block">{rec.category} Assessment</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">Completed on: {rec.test_date}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className={`font-black ${rec.percentage >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{rec.percentage}%</span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{rec.score} / {rec.total} Correct</p>
                            </div>
                            <button
                              onClick={() => setSelectedTestForReview({ ...rec, user_email: selectedStudent.email, student_name: selectedStudent.name })}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-xs cursor-pointer whitespace-nowrap"
                            >
                              Inspect Q&A 👁️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: AI INTERVIEWS */}
              {studentModalTab === 'interviews' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">AI Recruiter Video & Voice Sessions</h3>
                  {studentInterviewRecords.length === 0 ? (
                    <div className="text-center text-slate-500 py-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">No AI interview recordings found for this student.</div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {studentInterviewRecords.map((interview) => (
                        <div key={interview.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-700 dark:text-indigo-400">{interview.role} Interview</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">Score: {interview.score}/100</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Completed on: {new Date(interview.created_at).toLocaleDateString()}</p>
                          <div className="space-y-1.5 pt-1">
                            {(interview.feedback || []).map((qa, qIdx) => (
                              <div key={qIdx} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                <p className="font-bold text-slate-900 dark:text-white text-xs">Q{qIdx + 1}: {qa.question || qa.text}</p>
                                <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5"><strong className="text-emerald-700 dark:text-emerald-400">Answer:</strong> {qa.answer || qa.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CODING TESTS */}
              {studentModalTab === 'coding' && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Live Coding Sandbox & Assessment Attempts</h3>
                  {studentCodingRecords.length === 0 ? (
                    <div className="text-center text-slate-500 py-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">No coding submissions found for this student.</div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {studentCodingRecords.map((codeItem) => (
                        <div key={codeItem.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-700 dark:text-indigo-400 text-xs">{codeItem.problem_title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800 uppercase">
                                {codeItem.language}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                              codeItem.status === 'Accepted'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                            }`}>
                              {codeItem.status} ({codeItem.passed_count}/{codeItem.total_test_cases} Passed)
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Runtime: <strong>{codeItem.runtime_ms}ms</strong> • Mode: <strong>{codeItem.arena_mode === 'timed_test' ? '⏱️ Timed Assessment' : '💡 Practice'}</strong></span>
                            <span>{new Date(codeItem.created_at).toLocaleDateString()}</span>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => setSelectedCodeForReview({ ...codeItem, student_name: selectedStudent.name })}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-xs cursor-pointer"
                            >
                              Inspect Code 👁️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button onClick={() => setSelectedStudent(null)} className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: QUESTION MANAGEMENT */}
        {activeAdminTab === 'questions' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Executive KPI Overview Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Question Bank */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shadow-inner">
                    📚
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-mono">
                    {Array.from(new Set(questions.map(q => q.category).filter(Boolean))).length} Categories
                  </span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">{questions.length}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Questions</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span>⚡ Active Bank</span>
                  </span>
                </div>
              </div>

              {/* Card 2: Registered Students */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shadow-inner">
                    👥
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-mono">
                    Active Roster
                  </span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">{studentsList.length}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Enrolled Candidates</span>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                    <span>🎯 ATS Tracked</span>
                  </span>
                </div>
              </div>

              {/* Card 3: Test Submissions */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-inner">
                    🧠
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-mono">
                    Proctored
                  </span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">{allTestRecords.length}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Mock Assessments</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span>🛡️ Anti-Cheat Active</span>
                  </span>
                </div>
              </div>

              {/* Card 4: AI Interviews */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shadow-inner">
                    🎙️
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-mono">
                    Gemini AI
                  </span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">{interviews.length}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">AI Speech Sessions</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <span>🤖 Dialogues Saved</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Upload Box */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center justify-center">
                      📥
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Bulk Question Import Engine</h2>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Upload .xlsx, .xls, or .csv sheets directly to populate question categories with explanations.</p>
                </div>
                <button 
                  onClick={downloadTemplate} 
                  className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-500/40 px-4 py-2.5 rounded-2xl transition cursor-pointer shadow-xs flex items-center gap-2"
                >
                  <span>📊</span>
                  <span>Download Excel Template</span>
                </button>
              </div>

              <div className="bg-slate-50/70 dark:bg-slate-950/70 border-2 border-dashed border-indigo-300 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-6 sm:p-8 text-center transition-all duration-300">
                <form onSubmit={handleBulkUpload} className="flex flex-col items-center max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 text-2xl flex items-center justify-center mb-3 shadow-inner">
                    📁
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Select Excel / CSV Spreadsheet</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">Supports Question, Option A-D, Answer Key, Explanation</p>

                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileChange} 
                    className="mb-4 text-xs text-slate-700 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" 
                  />
                  <button 
                    type="submit" 
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-black text-xs transition cursor-pointer shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                  >
                    <span>⚡</span>
                    <span>Upload & Parse Into Database ➔</span>
                  </button>
                </form>
                {uploadStatus && (
                  <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-xs font-black text-indigo-700 dark:text-indigo-300 inline-block animate-fade-in">
                    {uploadStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Category Delete Section */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Category Management</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Purge an entire subject category and all its questions in one safe action.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <select
                  value={selectedCategoryToDelete}
                  onChange={(e) => setSelectedCategoryToDelete(e.target.value)}
                  className="w-full sm:w-80 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="">-- Select Category to Delete --</option>
                  {[...new Set(questions.map(q => q.category))].map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={handleDeleteCategory}
                  disabled={isDeletingCategory || !selectedCategoryToDelete}
                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-40"
                >
                  {isDeletingCategory ? 'Deleting Category...' : '🗑 Delete Entire Category'}
                </button>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedQuestionIds.length > 0 && (
              <div className="bg-rose-950/60 border border-rose-500/30 p-4 rounded-2xl flex justify-between items-center shadow-lg animate-fade-in">
                <span className="text-xs font-bold text-rose-300">
                  {selectedQuestionIds.length} question(s) selected for permanent deletion
                </span>
                <button
                  onClick={handleBulkDeleteQuestions}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-40"
                >
                  {isDeleting ? 'Deleting...' : '🗑 Delete Selected Questions'}
                </button>
              </div>
            )}

            {/* Question Repository */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Database Question Repository ({filteredQuestions.length})
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Explore questions organized by subject categories with answer keys and explanations.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Export Button */}
                  <button
                    onClick={() => {
                      if (filteredQuestions.length === 0) {
                        showWarning("No questions to export.");
                        return;
                      }
                      const exportData = filteredQuestions.map(q => ({
                        ID: q.id,
                        Category: q.category,
                        Subcategory: q.subcategory || 'General',
                        Difficulty: q.difficulty,
                        Question: q.question_text,
                        'Option A': q.option_a,
                        'Option B': q.option_b,
                        'Option C': q.option_c,
                        'Option D': q.option_d,
                        'Correct Answer': q.correct_answer,
                        Explanation: q.explanation || ''
                      }));
                      const worksheet = XLSX.utils.json_to_sheet(exportData);
                      const workbook = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
                      XLSX.writeFile(workbook, `CampusEdge_QuestionBank_${new Date().toISOString().slice(0,10)}.xlsx`);
                      showSuccess(`Exported ${exportData.length} questions successfully!`);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Export Questions to Excel (.xlsx)"
                  >
                    <span>📊</span> Export Excel
                  </button>

                  {/* View Mode Switch */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setQuestionViewMode('by_category')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        questionViewMode === 'by_category'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📁 By Category
                    </button>
                    <button
                      onClick={() => setQuestionViewMode('by_difficulty')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        questionViewMode === 'by_difficulty'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ⚡ By Difficulty
                    </button>
                    <button
                      onClick={() => setQuestionViewMode('table')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        questionViewMode === 'table'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📋 Table View
                    </button>
                  </div>

                  <select 
                    value={difficultyFilter} 
                    onChange={(e) => { setDifficultyFilter(e.target.value); setQuestionPage(1); }}
                    className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>

                  <input 
                    type="text" 
                    placeholder="Search questions..." 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setQuestionPage(1); }} 
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 w-full sm:w-48" 
                  />
                </div>
              </div>

              {/* Quick Category Filter Pills */}
              <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] whitespace-nowrap">Filter Subject:</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                    !searchTerm ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({questions.length})
                </button>
                {Array.from(new Set(questions.map(q => q.category).filter(Boolean))).map(cat => {
                  const catCount = questions.filter(q => q.category === cat).length;
                  const isSelected = searchTerm.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => setSearchTerm(isSelected ? '' : cat)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:text-indigo-700 dark:hover:text-white shadow-xs'
                      }`}
                    >
                      {cat} ({catCount})
                    </button>
                  );
                })}
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">No questions found matching your filter criteria.</div>
              ) : questionViewMode === 'by_category' ? (
                // ================= MODE 1: GROUP BY CATEGORY =================
                <div className="p-6 space-y-4">
                  {(() => {
                    const catMap = new Map();

                    filteredQuestions.forEach(q => {
                      const cat = q.category || 'General';
                      if (!catMap.has(cat)) {
                        catMap.set(cat, []);
                      }
                      catMap.get(cat).push(q);
                    });

                    const categoryGroups = Array.from(catMap.entries());

                    return categoryGroups.map(([catName, qList]) => {
                      const isExpanded = expandedQuestionCategory === catName;
                      const easyCount = qList.filter(q => q.difficulty === 'Easy').length;
                      const medCount = qList.filter(q => q.difficulty === 'Medium').length;
                      const hardCount = qList.filter(q => q.difficulty === 'Hard').length;
                      const allCatSelected = qList.every(q => selectedQuestionIds.includes(q.id));

                      return (
                        <div 
                          key={catName}
                          className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                            isExpanded 
                              ? 'bg-slate-50 dark:bg-slate-950 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' 
                              : 'bg-slate-50/50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {/* Category Header Bar */}
                          <div 
                            onClick={() => setExpandedQuestionCategory(isExpanded ? null : catName)}
                            className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-inner flex-shrink-0">
                                📁
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-2">
                                  <span>{catName}</span>
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-md">
                                    Easy: {easyCount}
                                  </span>
                                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-md">
                                    Medium: {medCount}
                                  </span>
                                  <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 px-2 py-0.5 rounded-md">
                                    Hard: {hardCount}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 self-end sm:self-auto">
                              <div className="text-right">
                                <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-xl">
                                  {qList.length} Questions
                                </span>
                              </div>

                              <button
                                type="button"
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                                  isExpanded 
                                    ? 'bg-indigo-600 text-white rotate-180' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs'
                                }`}
                              >
                                ▼
                              </button>
                            </div>
                          </div>

                          {/* In-Line Questions for this Category */}
                          {isExpanded && (
                            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 space-y-4 animate-fade-in">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const catIds = qList.map(q => q.id);
                                      if (allCatSelected) {
                                        setSelectedQuestionIds(prev => prev.filter(id => !catIds.includes(id)));
                                      } else {
                                        setSelectedQuestionIds(prev => [...new Set([...prev, ...catIds])]);
                                      }
                                    }}
                                    className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-xl"
                                  >
                                    {allCatSelected ? 'Deselect All in Category' : 'Select All in Category'}
                                  </button>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {qList.length} total questions in {catName}
                                  </span>
                                </div>

                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to permanently delete all ${qList.length} questions in "${catName}"?`)) {
                                      try {
                                        const res = await apiFetch(`/api/questions/category/${encodeURIComponent(catName)}`, {
                                          method: 'DELETE'
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                          showSuccess(data.message);
                                          fetchQuestions();
                                        } else {
                                          showError(data.message || "Failed to delete category.");
                                        }
                                      } catch (err) {
                                        console.error("Delete category error:", err);
                                        showError("Server error deleting category.");
                                      }
                                    }
                                  }}
                                  className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer shadow-xs"
                                >
                                  🗑 Delete Entire {catName} Category
                                </button>
                              </div>

                              <div className="space-y-3">
                                {qList.map((q, qIdx) => (
                                  <div key={q.id || qIdx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs shadow-xs">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex items-start gap-2.5">
                                        <input
                                          type="checkbox"
                                          checked={selectedQuestionIds.includes(q.id)}
                                          onChange={() => toggleSelectOneQuestion(q.id)}
                                          className="w-4 h-4 rounded text-indigo-500 cursor-pointer mt-0.5"
                                        />
                                        <span className="font-bold text-slate-500 dark:text-slate-400 text-xs">#{q.id}</span>
                                        <p className="font-bold text-slate-900 dark:text-white text-xs leading-relaxed">{q.question_text}</p>
                                      </div>

                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                          q.difficulty === 'Easy' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' :
                                          q.difficulty === 'Medium' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' :
                                          'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                                        }`}>
                                          {q.difficulty}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSingleQuestion(q.id, q.question_text)}
                                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                          title="Permanently Delete This Question"
                                        >
                                          <span>🗑</span> Delete
                                        </button>
                                      </div>
                                    </div>

                                    {/* Options Grid */}
                                    {(q.option_a || q.option_b || q.option_c || q.option_d) && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 ml-6">
                                        {['A', 'B', 'C', 'D'].map((letter) => {
                                          const optVal = q[`option_${letter.toLowerCase()}`];
                                          const isCorrect = q.correct_option === letter || q.correct_answer === optVal;
                                          if (!optVal) return null;

                                          return (
                                            <div 
                                              key={letter}
                                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs shadow-xs ${
                                                isCorrect 
                                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold' 
                                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300'
                                              }`}
                                            >
                                              <span><b>{letter}:</b> {optVal}</span>
                                              {isCorrect && <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">✓ Correct</span>}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {q.explanation && (
                                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 text-[11px] ml-6 border border-slate-200 dark:border-slate-800/80 shadow-xs">
                                        <strong className="text-indigo-700 dark:text-indigo-400">Explanation: </strong> {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : questionViewMode === 'by_difficulty' ? (
                // ================= MODE 2: GROUP BY DIFFICULTY =================
                <div className="p-6 space-y-4">
                  {['Easy', 'Medium', 'Hard'].map((diff) => {
                    const qList = filteredQuestions.filter(q => q.difficulty === diff);
                    const isExpanded = expandedQuestionDifficulty === diff;

                    return (
                      <div 
                        key={diff}
                        className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? 'bg-slate-50 dark:bg-slate-950 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' 
                            : 'bg-slate-50/50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Header Bar */}
                        <div 
                          onClick={() => setExpandedQuestionDifficulty(isExpanded ? null : diff)}
                          className="p-5 flex justify-between items-center cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-3.5 h-3.5 rounded-full ${
                              diff === 'Easy' ? 'bg-emerald-500' : diff === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            <h3 className="font-bold text-slate-900 dark:text-white text-base">{diff} Questions</h3>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-xl">
                              {qList.length} Questions
                            </span>
                            <button
                              type="button"
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                                isExpanded ? 'bg-indigo-600 text-white rotate-180' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs'
                              }`}
                            >
                              ▼
                            </button>
                          </div>
                        </div>

                        {/* Questions List */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-3 animate-fade-in">
                            {qList.map((q, qIdx) => (
                              <div key={q.id || qIdx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs shadow-xs">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-indigo-700 dark:text-indigo-400">{q.category}</span>
                                    <span className="text-slate-500 dark:text-slate-400">#{q.id}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSingleQuestion(q.id, q.question_text)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Permanently Delete This Question"
                                  >
                                    <span>🗑</span> Delete
                                  </button>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white text-xs leading-relaxed">{q.question_text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // ================= MODE 3: ALL QUESTIONS TABLE =================
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            onChange={toggleSelectAllQuestions} 
                            checked={currentQuestions.length > 0 && selectedQuestionIds.length === currentQuestions.length}
                            className="w-4 h-4 rounded text-indigo-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Question Text</th>
                        <th className="px-6 py-4">Difficulty</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                      {currentQuestions.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-4 w-12 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedQuestionIds.includes(q.id)}
                              onChange={() => toggleSelectOneQuestion(q.id)}
                              className="w-4 h-4 rounded text-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">#{q.id}</td>
                          <td className="px-6 py-4">
                            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs">
                              {q.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 truncate max-w-sm font-medium text-slate-900 dark:text-slate-200">{q.question_text}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs ${
                              q.difficulty === 'Easy' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' :
                              q.difficulty === 'Medium' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' :
                              'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                            }`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleQuestion(q.id, q.question_text)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-white font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1 shadow-xs"
                              title="Permanently Delete This Question"
                            >
                              <span>🗑</span> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredQuestions.length > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Showing {indexOfFirstQuestion + 1} to {Math.min(indexOfLastQuestion, filteredQuestions.length)} of {filteredQuestions.length} entries
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setQuestionPage(prev => Math.max(prev - 1, 1))} 
                          disabled={questionPage === 1}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer shadow-xs"
                        >
                          Previous
                        </button>
                        <div className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-400">
                          Page {questionPage} of {totalQuestionPages || 1}
                        </div>
                        <button 
                          onClick={() => setQuestionPage(prev => Math.min(prev + 1, totalQuestionPages))} 
                          disabled={questionPage === totalQuestionPages || totalQuestionPages === 0}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer shadow-xs"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeAdminTab === 'students' ? (
          // ================= STUDENT MANAGEMENT TAB =================
          <div className="space-y-8 animate-fade-in">
            {/* Student Header & Quick Summary */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 font-black text-sm flex items-center justify-center">
                    👥
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Registered Candidate Roster ({studentsList.length})</h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Deep inspection of candidate ATS compatibility, proctoring telemetry audit logs, and mock performance.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search candidate name, email, city..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 w-full sm:w-64 shadow-xs"
                />
                
                <button
                  type="button"
                  onClick={handlePurgeTestUsers}
                  className="bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold text-xs px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Purge all test/demo accounts and their records"
                >
                  <span>🧹</span> Clean Demo Users
                </button>
              </div>
            </div>

            {loadingStudents ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse">Loading student profiles...</div>
            ) : studentsList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">No registered students found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {studentsList
                  .filter((s) => {
                    const term = studentSearch.toLowerCase();
                    return (
                      (s.name && s.name.toLowerCase().includes(term)) ||
                      (s.email && s.email.toLowerCase().includes(term)) ||
                      (s.address && s.address.toLowerCase().includes(term)) ||
                      (s.hometown && s.hometown.toLowerCase().includes(term))
                    );
                  })
                  .map((student) => (
                  <div 
                    key={student.id} 
                    onClick={() => handleStudentClick(student)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative hover:border-indigo-400 dark:hover:border-indigo-500/60 shadow-sm hover:shadow-xl transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-inner flex-shrink-0">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{student.name || 'Student'}</h3>
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate">{student.email}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudent(student.id, student.name, student.email);
                          }}
                          className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-white border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-xs transition cursor-pointer shrink-0 shadow-xs"
                          title="Delete / Purge this Candidate"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="space-y-2.5 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Latest ATS:</span>
                          <span className={student.latestAts ? (student.latestAts.score >= 70 ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-amber-600 dark:text-amber-400 font-black') : 'text-slate-400 dark:text-slate-500'}>
                            {student.latestAts ? `${student.latestAts.score}/100` : 'Not Scanned'}
                          </span>
                        </div>

                        {student.latestAts && (
                          <div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${student.latestAts.score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${student.latestAts.score}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">Location:</span>
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{student.address || student.hometown || 'Not Provided'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <span>📈</span> View Progress Graph & Analytics
                      </span>
                      <span>➔</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Student Activity Monitor Feed */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Top Feed Type Selector */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-950/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => setStudentFeedTab('mock_tests')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        studentFeedTab === 'mock_tests'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      🧠 Mock Tests Feed ({allTestRecords.length})
                    </button>
                    <button
                      onClick={() => setStudentFeedTab('coding_tests')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        studentFeedTab === 'coding_tests'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      💻 Coding Submissions ({allCodingRecords.length})
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {studentFeedTab === 'mock_tests' 
                      ? 'Inspect all written mock test and practice attempts grouped cleanly by student candidate.'
                      : 'Audit code written by students, syntax, test cases passed, and execution benchmarks.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setTestSubmissionViewMode('by_student')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        testSubmissionViewMode === 'by_student'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      👥 Group by Student
                    </button>
                    <button
                      onClick={() => setTestSubmissionViewMode('all_table')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        testSubmissionViewMode === 'all_table'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📋 All Submissions Table
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder={studentFeedTab === 'mock_tests' ? "Search by student or category..." : "Search student, problem, language..."}
                    value={studentFeedTab === 'mock_tests' ? testFeedSearch : codingFeedSearch}
                    onChange={(e) => {
                      if (studentFeedTab === 'mock_tests') setTestFeedSearch(e.target.value);
                      else setCodingFeedSearch(e.target.value);
                    }}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 w-full sm:w-56"
                  />
                </div>
              </div>

              {/* MOCK TESTS FEED */}
              {studentFeedTab === 'mock_tests' && (
                <>
                  {loadingRecords ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse">Loading records...</div>
                  ) : allTestRecords.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No student test records found.</div>
                  ) : testSubmissionViewMode === 'by_student' ? (
                    // ================= GROUP BY STUDENT TEST FEED =================
                    <div className="p-6 space-y-4">
                      {(() => {
                        const groupedMap = new Map();
                        const term = testFeedSearch.toLowerCase();

                        allTestRecords.forEach(rec => {
                          const email = rec.user_email || 'unknown';
                          const matches = 
                            email.toLowerCase().includes(term) ||
                            (rec.category && rec.category.toLowerCase().includes(term));

                          if (matches) {
                            if (!groupedMap.has(email)) {
                              groupedMap.set(email, {
                                email,
                                tests: []
                              });
                            }
                            groupedMap.get(email).tests.push(rec);
                          }
                        });

                        const studentTestGroups = Array.from(groupedMap.values());

                        if (studentTestGroups.length === 0) {
                          return <div className="p-8 text-center text-slate-500 text-xs">No student submissions match your filter.</div>;
                        }

                        return studentTestGroups.map(group => {
                          const isExpanded = expandedStudentTestEmail === group.email;
                          const totalTests = group.tests.length;
                          const avgPct = Math.round(group.tests.reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0) / totalTests);
                          const categoriesList = [...new Set(group.tests.map(t => t.category))].join(', ');
                          const latestDate = group.tests[0]?.test_date || 'N/A';

                          return (
                            <div 
                              key={group.email}
                              className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                                isExpanded 
                                  ? 'bg-slate-50 dark:bg-slate-950 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' 
                                  : 'bg-slate-50/50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              {/* Student Header Row */}
                              <div 
                                onClick={() => setExpandedStudentTestEmail(isExpanded ? null : group.email)}
                                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white font-black text-sm flex items-center justify-center shadow-inner flex-shrink-0">
                                    {group.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-2">
                                      <span>{group.email}</span>
                                    </h3>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                                      📚 Assessments: <span className="text-slate-700 dark:text-slate-300">{categoriesList}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 self-end sm:self-auto">
                                  <div className="text-right">
                                    <span className={`text-sm font-black px-3 py-1 rounded-xl border ${
                                      avgPct >= 70 
                                        ? 'text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/30' 
                                        : 'text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/30'
                                    }`}>
                                      Avg: {avgPct}%
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                                      {totalTests} Tests Completed • Latest: {latestDate}
                                    </span>
                                  </div>

                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {isExpanded ? '▲' : '▼'}
                                  </div>
                                </div>
                              </div>

                              {/* Accordion Content */}
                              {isExpanded && (
                                <div className="p-5 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 space-y-3 animate-fade-in">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {group.tests.map((test) => (
                                      <div 
                                        key={test.id}
                                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs shadow-xs"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-black text-indigo-700 dark:text-indigo-400 text-xs">
                                              {test.category} Assessment
                                            </span>
                                            <span className="text-[10px] text-slate-500">• {test.test_date}</span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                              Raw Score: <b className="text-slate-900 dark:text-white">{test.score} / {test.total}</b>
                                            </p>
                                            {(() => {
                                              const full = typeof test.full_data === 'string' ? JSON.parse(test.full_data || '{}') : (test.full_data || {});
                                              const switches = test.tab_switches !== undefined ? test.tab_switches : (full.tabSwitches || 0);
                                              return (
                                                <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] border ${
                                                  switches === 0 
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                                                    : switches <= 2 
                                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' 
                                                    : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                                                }`}>
                                                  {switches === 0 ? '🛡️ 0 Tabs' : `⚠️ ${switches} Tabs`}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                          <span className={`px-2.5 py-1 rounded-xl font-black text-xs ${
                                            test.percentage >= 70 
                                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' 
                                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                                          }`}>
                                            {test.percentage}%
                                          </span>

                                          <button
                                            onClick={() => setSelectedTestForReview(test)}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap"
                                          >
                                            Inspect Q&A 👁️
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    // ================= ALL SUBMISSIONS FLAT TABLE =================
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-4">Student Email</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Score</th>
                            <th className="p-4">Percentage</th>
                            <th className="p-4">Proctoring / Tabs</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Student Answers</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                          {allTestRecords
                            .filter(r => {
                              const term = testFeedSearch.toLowerCase();
                              return (
                                (r.user_email && r.user_email.toLowerCase().includes(term)) ||
                                (r.category && r.category.toLowerCase().includes(term))
                              );
                            })
                            .slice((recordPage - 1) * recordsPerPage, recordPage * recordsPerPage)
                            .map((record) => {
                              const full = typeof record.full_data === 'string' ? JSON.parse(record.full_data || '{}') : (record.full_data || {});
                              const switches = record.tab_switches !== undefined ? record.tab_switches : (full.tabSwitches || 0);

                              return (
                                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                  <td className="p-4 font-bold text-indigo-700 dark:text-indigo-400">{record.user_email}</td>
                                  <td className="p-4 text-slate-900 dark:text-slate-200">{record.category}</td>
                                  <td className="p-4 text-slate-700 dark:text-slate-300">{record.score} / {record.total}</td>
                                  <td className="p-4">
                                    <span className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] ${record.percentage >= 70 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'}`}>
                                      {record.percentage}%
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] inline-flex items-center gap-1 border ${
                                      switches === 0 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                                        : switches <= 2 
                                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' 
                                        : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/40 animate-pulse'
                                    }`}>
                                      <span>{switches === 0 ? '🛡️' : '⚠️'}</span>
                                      <span>{switches === 0 ? '0 Tabs (Clean)' : `${switches} ${switches === 1 ? 'Tab Switch' : 'Tab Switches'}`}</span>
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-500 dark:text-slate-400">{record.test_date}</td>
                                  <td className="p-4 text-right">
                                    <button
                                      onClick={() => setSelectedTestForReview(record)}
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                                    >
                                      Inspect Q&A 👁️
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* CODING SUBMISSIONS FEED */}
              {studentFeedTab === 'coding_tests' && (
                <>
                  {loadingCodingRecords ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse">Loading coding submissions...</div>
                  ) : allCodingRecords.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No coding submissions found in database.</div>
                  ) : testSubmissionViewMode === 'by_student' ? (
                    // ================= GROUP BY STUDENT CODING FEED =================
                    <div className="p-6 space-y-4">
                      {(() => {
                        const groupedMap = new Map();
                        const term = codingFeedSearch.toLowerCase();

                        allCodingRecords.forEach(codeItem => {
                          const email = codeItem.email || 'unknown';
                          const name = codeItem.student_name || '';
                          const matches = 
                            email.toLowerCase().includes(term) ||
                            name.toLowerCase().includes(term) ||
                            (codeItem.problem_title && codeItem.problem_title.toLowerCase().includes(term)) ||
                            (codeItem.language && codeItem.language.toLowerCase().includes(term));

                          if (matches) {
                            if (!groupedMap.has(email)) {
                              groupedMap.set(email, {
                                email,
                                student_name: codeItem.student_name,
                                submissions: []
                              });
                            }
                            groupedMap.get(email).submissions.push(codeItem);
                          }
                        });

                        const studentCodingGroups = Array.from(groupedMap.values());

                        if (studentCodingGroups.length === 0) {
                          return <div className="p-8 text-center text-slate-500 text-xs">No student coding submissions match your filter.</div>;
                        }

                        return studentCodingGroups.map(group => {
                          const isExpanded = expandedStudentCodingEmail === group.email;
                          const totalSubs = group.submissions.length;
                          const acceptedCount = group.submissions.filter(s => s.status === 'Accepted').length;
                          const problemsList = [...new Set(group.submissions.map(s => s.problem_title))].join(', ');
                          const latestDate = new Date(group.submissions[0]?.created_at).toLocaleDateString();

                          return (
                            <div 
                              key={group.email}
                              className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                                isExpanded 
                                  ? 'bg-slate-50 dark:bg-slate-950 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' 
                                  : 'bg-slate-50/50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              {/* Student Header Row */}
                              <div 
                                onClick={() => setExpandedStudentCodingEmail(isExpanded ? null : group.email)}
                                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-3.5">
                                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-inner flex-shrink-0">
                                    💻
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-2">
                                      <span>{group.student_name || group.email}</span>
                                      <span className="text-[11px] font-normal text-slate-500">({group.email})</span>
                                    </h3>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                                      Challenges: <span className="text-slate-700 dark:text-slate-300">{problemsList}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 self-end sm:self-auto">
                                  <div className="text-right">
                                    <span className="text-sm font-black px-3 py-1 rounded-xl border text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/30">
                                      {acceptedCount} / {totalSubs} Solved
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                                      {totalSubs} Submissions • Latest: {latestDate}
                                    </span>
                                  </div>

                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {isExpanded ? '▲' : '▼'}
                                  </div>
                                </div>
                              </div>

                              {/* Accordion Content */}
                              {isExpanded && (
                                <div className="p-5 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 space-y-3 animate-fade-in">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {group.submissions.map((sub) => (
                                      <div 
                                        key={sub.id}
                                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs shadow-xs"
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-black text-indigo-700 dark:text-indigo-400 text-xs">
                                              {sub.problem_title}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300">
                                              {sub.language}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                              Passed: <b className="text-slate-900 dark:text-white">{sub.passed_count} / {sub.total_test_cases}</b> • {sub.runtime_ms}ms • {new Date(sub.created_at).toLocaleDateString()}
                                            </p>
                                            <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] border ${
                                              (sub.tab_switches || 0) === 0 
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                                                : (sub.tab_switches || 0) <= 2 
                                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' 
                                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                                            }`}>
                                              {(sub.tab_switches || 0) === 0 ? '🛡️ 0 Tabs' : `⚠️ ${sub.tab_switches} Tabs`}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-auto">
                                          <span className={`px-2.5 py-1 rounded-xl font-black text-xs border ${
                                            sub.status === 'Accepted'
                                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                                          }`}>
                                            {sub.status}
                                          </span>

                                          <button
                                            onClick={() => setSelectedCodeForReview(sub)}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap"
                                          >
                                            Inspect Code 👁️
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    // ================= ALL CODING SUBMISSIONS FLAT TABLE =================
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-4">Student</th>
                            <th className="p-4">Problem</th>
                            <th className="p-4">Language</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Tests Passed</th>
                            <th className="p-4">Proctoring / Tabs</th>
                            <th className="p-4">Runtime</th>
                            <th className="p-4">Date</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                          {allCodingRecords
                            .filter(r => {
                              const term = codingFeedSearch.toLowerCase();
                              return (
                                (r.email && r.email.toLowerCase().includes(term)) ||
                                (r.student_name && r.student_name.toLowerCase().includes(term)) ||
                                (r.problem_title && r.problem_title.toLowerCase().includes(term)) ||
                                (r.language && r.language.toLowerCase().includes(term))
                              );
                            })
                            .map((codeRec) => (
                              <tr key={codeRec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="p-4 font-bold text-indigo-700 dark:text-indigo-400">
                                  <div>{codeRec.student_name || codeRec.email}</div>
                                  <div className="text-[10px] text-slate-500 font-normal">{codeRec.email}</div>
                                </td>
                                <td className="p-4 text-slate-900 dark:text-slate-200 font-semibold">{codeRec.problem_title}</td>
                                <td className="p-4">
                                  <span className="uppercase text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800">
                                    {codeRec.language}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] border ${
                                    codeRec.status === 'Accepted'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                                  }`}>
                                    {codeRec.status}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-700 dark:text-slate-300">{codeRec.passed_count} / {codeRec.total_test_cases}</td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] border ${
                                    (codeRec.tab_switches || 0) === 0 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                                      : (codeRec.tab_switches || 0) <= 2 
                                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' 
                                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                                  }`}>
                                    {(codeRec.tab_switches || 0) === 0 ? '🛡️ 0 Tabs' : `⚠️ ${codeRec.tab_switches} Tabs`}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-500 dark:text-slate-400">{codeRec.runtime_ms}ms</td>
                                <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(codeRec.created_at).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => setSelectedCodeForReview(codeRec)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                                  >
                                    Inspect Code 👁️
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : activeAdminTab === 'rankings' ? (
          // ================= ADMIN RANKINGS TAB =================
          <div className="space-y-8 animate-fade-in">
            {/* Header and Refresh Bar */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center">
                    🏆
                  </span>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Global Student Standings & Leaderboard ({leaderboard.length})</h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Live points matrix computed across proctored mock assessments, speed duels, and AI speech interviews.</p>
              </div>
              <button 
                onClick={fetchAdminLeaderboard} 
                className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 px-4 py-2.5 rounded-2xl border border-indigo-300 dark:border-indigo-500/40 cursor-pointer shadow-xs transition flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Refresh Matrix</span>
              </button>
            </div>

            {/* Top 3 3D Podium Display */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4">
                {/* 2nd Place Silver */}
                <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-xl text-center space-y-3 relative overflow-hidden transform hover:-translate-y-1 transition duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-3xl font-black flex items-center justify-center mx-auto shadow-inner border border-slate-300 dark:border-slate-600">
                    🥈
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    2nd Position
                  </span>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white truncate">{leaderboard[1]?.name || 'Student'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{leaderboard[1]?.email}</p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{leaderboard[1]?.total_score} <span className="text-xs font-bold text-slate-500">XP</span></p>
                    <p className="text-[11px] text-slate-500 font-semibold">{leaderboard[1]?.tests_completed || 0} Tests Completed</p>
                  </div>
                </div>

                {/* 1st Place Gold (Champion) */}
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-100 via-amber-50 to-white dark:from-amber-950/60 dark:via-slate-900 dark:to-slate-900 p-7 rounded-3xl border-2 border-amber-400 dark:border-amber-500/60 shadow-2xl text-center space-y-3 relative overflow-hidden transform hover:-translate-y-2 transition duration-300 md:-translate-y-4">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 text-4xl font-black flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 border-2 border-amber-300">
                    👑
                  </div>
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-mono">
                    🥇 National Rank 1
                  </span>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white truncate">{leaderboard[0]?.name || 'Student'}</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400/90 font-medium truncate">{leaderboard[0]?.email}</p>
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-500/30">
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">{leaderboard[0]?.total_score} <span className="text-sm font-bold text-slate-500">XP</span></p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">{leaderboard[0]?.tests_completed || 0} Tests • {leaderboard[0]?.interviews_completed || 0} AI Interviews</p>
                  </div>
                </div>

                {/* 3rd Place Bronze */}
                <div className="order-3 md:order-3 bg-gradient-to-b from-orange-50 to-white dark:from-amber-950/30 dark:to-slate-900 p-6 rounded-3xl border-2 border-amber-600/40 dark:border-amber-600/40 shadow-xl text-center space-y-3 relative overflow-hidden transform hover:-translate-y-1 transition duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-amber-700/20 text-amber-700 dark:text-amber-400 text-3xl font-black flex items-center justify-center mx-auto shadow-inner border border-amber-700/30">
                    🥉
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-mono">
                    3rd Position
                  </span>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white truncate">{leaderboard[2]?.name || 'Student'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{leaderboard[2]?.email}</p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{leaderboard[2]?.total_score} <span className="text-xs font-bold text-slate-500">XP</span></p>
                    <p className="text-[11px] text-slate-500 font-semibold">{leaderboard[2]?.tests_completed || 0} Tests Completed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Ranking Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Full Cohort Leaderboard</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive student rankings sorted by total XP score.</p>
              </div>

              {loadingLeaderboard ? (
                <div className="text-center py-16 font-bold text-slate-500 dark:text-slate-400 text-xs">Loading rankings...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">No student standings recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {leaderboard.map((student, idx) => {
                    const rank = idx + 1;
                    return (
                      <div key={student.id || idx} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                            rank === 1 ? 'bg-amber-400 text-slate-950 font-black' :
                            rank === 2 ? 'bg-slate-300 text-slate-900 font-black' :
                            rank === 3 ? 'bg-amber-700 text-white font-black' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold'
                          }`}>
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{student.name || 'Student'}</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{student.email} • Tests: {student.tests_completed} | Interviews: {student.interviews_completed}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{student.total_score}</span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider font-mono">Points XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeAdminTab === 'interviews' ? (
          // ================= ADMIN INTERVIEW LOGS TAB =================
          <div className="space-y-6 animate-fade-in">
            
            {/* Header & Controls Bar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Student AI Interview Q&A Sessions ({interviews.length})</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Click on any student (e.g. Dhruvi) to expand all of her interview questions and spoken answers in line.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setInterviewViewMode('by_student')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                      interviewViewMode === 'by_student'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    👥 Group by Student
                  </button>
                  <button
                    onClick={() => setInterviewViewMode('all_sessions')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                      interviewViewMode === 'all_sessions'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    📋 Individual Sessions
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search student or role..."
                  value={interviewSearch}
                  onChange={(e) => setInterviewSearch(e.target.value)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 w-full sm:w-48"
                />

                <button 
                  onClick={fetchAdminInterviews} 
                  className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-500/30 cursor-pointer whitespace-nowrap shadow-xs"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {loadingInterviews ? (
              <div className="text-center py-16 font-bold text-slate-500 dark:text-slate-400 text-xs animate-pulse">Loading interview sessions...</div>
            ) : interviews.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">No student interview records found yet.</div>
            ) : interviewViewMode === 'by_student' ? (
              // ================= MODE 1: GROUPED BY STUDENT (e.g. Dhruvi) =================
              <div className="space-y-4">
                {(() => {
                  const groupedMap = new Map();
                  const term = interviewSearch.toLowerCase();

                  interviews.forEach(item => {
                    const email = item.email || 'unknown';
                    const name = item.name || email.split('@')[0];
                    const matches = 
                      name.toLowerCase().includes(term) ||
                      email.toLowerCase().includes(term) ||
                      (item.role && item.role.toLowerCase().includes(term));

                    if (matches) {
                      if (!groupedMap.has(email)) {
                        groupedMap.set(email, {
                          email,
                          name,
                          sessions: []
                        });
                      }
                      groupedMap.get(email).sessions.push(item);
                    }
                  });

                  const studentGroups = Array.from(groupedMap.values());

                  if (studentGroups.length === 0) {
                    return <div className="p-8 text-center text-slate-500 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">No students match your search filter.</div>;
                  }

                  return studentGroups.map(group => {
                    const isExpanded = expandedStudentEmail === group.email;
                    const totalSessions = group.sessions.length;
                    const avgScore = Math.round(group.sessions.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalSessions);
                    const rolesList = [...new Set(group.sessions.map(s => s.role))].join(', ');

                    return (
                      <div 
                        key={group.email} 
                        className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? 'bg-slate-50 dark:bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' 
                            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        {/* Student Bar */}
                        <div 
                          onClick={() => setExpandedStudentEmail(isExpanded ? null : group.email)}
                          className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-inner flex-shrink-0">
                              {group.name ? group.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-2">
                                <span>{group.name}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({group.email})</span>
                              </h3>
                              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                                🎯 Practiced Roles: <span className="text-slate-700 dark:text-slate-300">{rolesList}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-auto">
                            <div className="text-right">
                              <span className="text-sm font-black text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1 rounded-xl">
                                Avg Score: {avgScore}/100
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                                {totalSessions} Interview Sessions Completed
                              </span>
                            </div>

                            <button
                              type="button"
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                                isExpanded 
                                  ? 'bg-indigo-600 text-white rotate-180' 
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs'
                              }`}
                            >
                              ▼
                            </button>
                          </div>
                        </div>

                        {/* Expanded All Sessions & Questions In Line for this Student */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 p-6 space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                🎙️ All Interview Questions & Spoken Answers for {group.name} ({totalSessions} Sessions)
                              </span>
                            </div>

                            <div className="space-y-5">
                              {group.sessions.map((sess, sIdx) => {
                                const dialogues = formatInterviewDialogues(sess.feedback);

                                return (
                                  <div key={sess.id || sIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800/80">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                                          Session {sIdx + 1}: {sess.role}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">• {new Date(sess.created_at).toLocaleDateString()}</span>
                                      </div>
                                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                                        Score: {sess.score}/100
                                      </span>
                                    </div>

                                    {dialogues.length === 0 ? (
                                      <p className="text-xs text-slate-500 italic py-2">No dialogue questions recorded for this session.</p>
                                    ) : (
                                      <div className="space-y-3 pt-1">
                                        {dialogues.map((qa, qIdx) => (
                                          <div key={qIdx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                                            <div className="flex items-start gap-2.5">
                                              <span className="w-5 h-5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                Q{qIdx + 1}
                                              </span>
                                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                                                {qa.question}
                                              </p>
                                            </div>

                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 ml-7 space-y-0.5 shadow-xs">
                                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">
                                                {group.name}'s Answer:
                                              </span>
                                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {qa.answer}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              // ================= MODE 2: INDIVIDUAL SESSIONS =================
              <div className="space-y-3">
                {interviews
                  .filter((item) => {
                    const term = interviewSearch.toLowerCase();
                    return (
                      (item.name && item.name.toLowerCase().includes(term)) ||
                      (item.email && item.email.toLowerCase().includes(term)) ||
                      (item.role && item.role.toLowerCase().includes(term))
                    );
                  })
                  .map((item) => {
                    const isExpanded = expandedInterviewId === item.id;
                    const dialogues = formatInterviewDialogues(item.feedback);

                    return (
                      <div 
                        key={item.id} 
                        className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? 'bg-slate-50 dark:bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20' 
                            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        {/* Clickable Header Row */}
                        <div 
                          onClick={() => setExpandedInterviewId(isExpanded ? null : item.id)}
                          className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-inner flex-shrink-0">
                              {item.name ? item.name.charAt(0).toUpperCase() : 'D'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1.5">
                                  <span>{item.name || 'Student'}</span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">({item.email})</span>
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-md">
                                  Role: {item.role}
                                </span>
                                {(item.tab_switches > 0 || (item.tab_switch_logs && item.tab_switch_logs.length > 0)) ? (
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                    item.tab_switches >= 3 
                                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse' 
                                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  }`}>
                                    {item.tab_switches >= 3 ? '🚨 Auto-Disqualified (3 Tab Switches)' : `⚠️ ${item.tab_switches} Tab Switches`}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-md">
                                    ✓ Clean Proctor Log
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  • {new Date(item.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-auto">
                            <div className="text-right">
                              <span className={`text-sm font-black px-3 py-1 rounded-xl border ${
                                item.tab_switches >= 3 || item.score === 0
                                  ? 'text-rose-800 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/30'
                                  : 'text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/30'
                              }`}>
                                Score: {item.score}/100
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                                {dialogues.length} Dialogue Exchanges
                              </span>
                            </div>

                            <button
                              type="button"
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                                isExpanded 
                                  ? 'bg-indigo-600 text-white rotate-180' 
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs'
                              }`}
                            >
                              ▼
                            </button>
                          </div>
                        </div>

                        {/* Streamlined In-Line Questions & Answers Stream */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-5 sm:p-6 space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                🎙️ Live Interview Transcript Stream • {item.name || item.email} ({item.role})
                              </span>
                              <span className="text-xs text-slate-600 dark:text-slate-400">Target Role: <b className="text-slate-900 dark:text-white">{item.role}</b></span>
                            </div>

                            {dialogues.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-4 italic">No dialogue items recorded for this session.</p>
                            ) : (
                              <div className="space-y-3">
                                {dialogues.map((qa, qIdx) => (
                                  <div key={qIdx} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-xs">
                                    {/* Question Line */}
                                    <div className="flex items-start gap-2.5">
                                      <span className="w-5 h-5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        Q{qIdx + 1}
                                      </span>
                                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                                        {qa.question}
                                      </p>
                                    </div>

                                    {/* Student Answer Line */}
                                    <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 ml-7">
                                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                                        Answer:
                                      </span>
                                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {qa.answer}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : activeAdminTab === 'drives' ? (
          <PlacementDrivesHub 
            userEmail={adminEmail} 
            userName={adminName} 
            userRole="admin" 
            onBack={() => setActiveAdminTab('questions')} 
          />
        ) : null}

        {/* MODAL: VIEW SPECIFIC INTERVIEW TRANSCRIPT */}
        {selectedInterview && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <div>
                  <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-1 rounded-md">{selectedInterview.role}</span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Transcript: {selectedInterview.name || selectedInterview.email}</h3>
                </div>
                <button 
                  onClick={() => setSelectedInterview(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                {selectedInterview.feedback && selectedInterview.feedback.map((qa, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                    <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">Dialogue Exchange {i + 1}</p>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{qa.question || qa.text || "Interview prompt"}</p>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 mt-2">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Student Response:</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">{qa.answer || qa.text || "Recorded response"}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  Close Transcript
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: VIEW SPECIFIC TEST QUESTION & ANSWERS BREAKDOWN */}
        {selectedTestForReview && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                      {selectedTestForReview.category} Assessment
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • {selectedTestForReview.test_date}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Candidate: {selectedTestForReview.student_name ? `${selectedTestForReview.student_name} (${selectedTestForReview.user_email || selectedTestForReview.email})` : (selectedTestForReview.user_email || selectedTestForReview.email)}
                  </h3>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`text-base font-black px-3 py-1 rounded-xl ${selectedTestForReview.percentage >= 70 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'}`}>
                      {selectedTestForReview.percentage}% ({selectedTestForReview.score}/{selectedTestForReview.total})
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedTestForReview(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Questions & Student Answers Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/60 dark:bg-slate-950/60">
                {(() => {
                  const full = typeof selectedTestForReview.full_data === 'string' 
                    ? JSON.parse(selectedTestForReview.full_data || '{}') 
                    : (selectedTestForReview.full_data || selectedTestForReview.fullData || {});
                  
                  const switches = selectedTestForReview.tab_switches !== undefined 
                    ? selectedTestForReview.tab_switches 
                    : (full.tabSwitches || 0);
                  const logs = full.tabSwitchLogs || [];
                  const questionsList = full.coveredQuestions || [];

                  return (
                    <>
                      {/* Proctoring & Anti-Cheat Audit Card */}
                      <div className={`p-4 rounded-2xl border ${
                        switches === 0 
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30' 
                          : switches <= 2 
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30' 
                          : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40'
                      } space-y-3 shadow-xs`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{switches === 0 ? '🛡️' : '⚠️'}</span>
                            <div>
                              <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                Examination Proctoring & Integrity Audit
                              </h4>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                Real-time window focus & tab-switch telemetry captured during attempt.
                              </p>
                            </div>
                          </div>
                          
                          <span className={`px-3 py-1 rounded-xl font-black text-xs border ${
                            switches === 0 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                              : switches <= 2 
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' 
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                          }`}>
                            {switches === 0 ? '✅ 100% Integrity Clean' : switches <= 2 ? `⚠️ ${switches} Tab Switches (Moderate Risk)` : `🚨 ${switches} Tab Switches (High Risk Flag)`}
                          </span>
                        </div>

                        {logs.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Violation Audit Log:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {logs.map((log, lIdx) => (
                                <div key={lIdx} className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between">
                                  <span className="font-bold text-rose-600 dark:text-rose-400">Warning #{log.warningNumber || (lIdx + 1)}</span>
                                  <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px]">{log.timestamp}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {(!questionsList || questionsList.length === 0) ? (
                        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-300">Assessment Summary Record</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Candidate achieved <b className="text-slate-900 dark:text-white">{selectedTestForReview.score}</b> out of <b className="text-slate-900 dark:text-white">{selectedTestForReview.total}</b> points ({selectedTestForReview.percentage}%) on {selectedTestForReview.test_date}.
                          </p>
                          <p className="text-[11px] text-slate-500 italic">Detailed question-by-question breakdown was not recorded for this legacy attempt.</p>
                        </div>
                      ) : (
                        questionsList.map((q, idx) => (
                    <div 
                      key={idx} 
                      className={`p-5 rounded-2xl border ${
                        q.isCorrect 
                          ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/15' 
                          : 'border-rose-300 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/15'
                      } space-y-2.5 text-xs shadow-xs`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                          Question {idx + 1}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                          q.isCorrect 
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' 
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                        }`}>
                          {q.isCorrect ? 'Correct ✓' : 'Incorrect ✕'}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Student's Selected Answer:</span>
                          <span className={`font-bold ${q.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {q.selected || 'No Answer Submitted'}
                          </span>
                        </div>

                        {!q.isCorrect && (
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Correct Answer:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {q.correct}
                            </span>
                          </div>
                        )}
                      </div>

                      {q.explanation && (
                        <div className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 shadow-xs">
                          <strong className="text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider block mb-0.5">Explanation:</strong>
                          <p className="text-[11px] leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )))
                }
              </>
            );
          })()}
        </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
                <button
                  onClick={() => setSelectedTestForReview(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Close Review
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: VIEW SPECIFIC CODING SUBMISSION CODE */}
        {selectedCodeForReview && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-950">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                      💻 Coding Submission • {selectedCodeForReview.language?.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      selectedCodeForReview.status === 'Accepted'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                    }`}>
                      {selectedCodeForReview.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {selectedCodeForReview.problem_title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Candidate: <strong className="text-slate-900 dark:text-white">{selectedCodeForReview.student_name || selectedCodeForReview.email}</strong> ({selectedCodeForReview.email})
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedCodeForReview(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Submission Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Test Cases</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedCodeForReview.passed_count} / {selectedCodeForReview.total_test_cases} Passed</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Runtime</span>
                  <span className="font-black text-slate-900 dark:text-white">{selectedCodeForReview.runtime_ms} ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Environment</span>
                  <span className="font-black text-slate-900 dark:text-white capitalize">{selectedCodeForReview.arena_mode === 'timed_test' ? '⏱️ Timed Assessment' : '💡 Practice Arena'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Submitted On</span>
                  <span className="font-black text-slate-900 dark:text-white">{new Date(selectedCodeForReview.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Proctoring & Integrity Audit Card */}
              {(() => {
                const switches = selectedCodeForReview.tab_switches || 0;
                const rawLogs = selectedCodeForReview.tab_switch_logs;
                const logs = typeof rawLogs === 'string' ? JSON.parse(rawLogs || '[]') : (rawLogs || []);

                return (
                  <div className={`p-4 mx-5 my-3 rounded-2xl border ${
                    switches === 0 
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30' 
                      : switches <= 2 
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30' 
                      : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40'
                  } space-y-2.5 text-xs shadow-xs`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{switches === 0 ? '🛡️' : '⚠️'}</span>
                        <div>
                          <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                            Coding Exam Proctoring & Integrity Audit
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Window focus & tab-switch telemetry captured during compiler session.
                          </p>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-xl font-black text-xs border ${
                        switches === 0 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                          : switches <= 2 
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' 
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                      }`}>
                        {switches === 0 ? '✅ 100% Integrity Clean' : switches <= 2 ? `⚠️ ${switches} Tab Switches (Moderate Risk)` : `🚨 ${switches} Tab Switches (High Risk Flag)`}
                      </span>
                    </div>

                    {Array.isArray(logs) && logs.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Violation Audit Log:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {logs.map((log, lIdx) => (
                            <div key={lIdx} className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between">
                              <span className="font-bold text-rose-600 dark:text-rose-400">Warning #{log.warningNumber || (lIdx + 1)}</span>
                              <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px]">{log.timestamp} ({log.type || 'Tab Switch'})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Code Box */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-900 text-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Solution Source Code</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCodeForReview.code || '');
                      showSuccess("Code copied to clipboard!");
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md font-bold transition cursor-pointer"
                  >
                    📋 Copy Code
                  </button>
                </div>
                <pre className="font-mono text-xs leading-relaxed overflow-x-auto p-2 select-text whitespace-pre-wrap">
                  {selectedCodeForReview.code || '// No code recorded'}
                </pre>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
                <button
                  onClick={() => setSelectedCodeForReview(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Close Code Viewer
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}