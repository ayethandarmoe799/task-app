"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; color: string } | null;
  tags?: { id: string; name: string; color: string }[];
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState("pending");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [categoryMsg, setCategoryMsg] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState("");
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'add' | 'categories' | 'tasks'>('analytics');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (sessionStatus === "authenticated") {
      fetchTasks();
      fetchCategories();
      fetchTags();
      fetchAnalytics();
    }
    // eslint-disable-next-line
  }, [sessionStatus]);

  const fetchTasks = async () => {
    setLoading(true);
    const res = await fetch("/api/tasks", { credentials: "include" });
    if (res.ok) {
      setTasks(await res.json());
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories", { credentials: "include" });
    if (res.ok) {
      setCategories(await res.json());
    }
  };

  const fetchTags = async () => {
    const res = await fetch("/api/tags", { credentials: "include" });
    if (res.ok) {
      setTags(await res.json());
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    const res = await fetch("/api/tasks/analytics", { credentials: "include" });
    if (res.ok) {
      setAnalytics(await res.json());
    }
    setAnalyticsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        title,
        description,
        status: taskStatus,
        categoryId: categoryId || null,
        tagIds: selectedTags.map(t => t.id),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const errorData = await res.json();
      setError(`Failed to create task: ${errorData.error || res.statusText}`);
      setToast({ message: `Failed to create task: ${errorData.error || res.statusText}`, type: "error" });
    } else {
      setTitle("");
      setDescription("");
      setTaskStatus("pending");
      setCategoryId("");
      setSelectedTags([]);
      fetchTasks();
      setToast({ message: "Task created!", type: "success" });
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await fetch(`/api/tasks/${id}`, { method: "DELETE", credentials: "include" });
    setLoading(false);
    fetchTasks();
    setToast({ message: "Task deleted!", type: "success" });
  };

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setTaskStatus(task.status);
    setCategoryId(task.category?.id || "");
    setSelectedTags(task.tags || []);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    setLoading(true);
    const res = await fetch(`/api/tasks/${editTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        description,
        status: taskStatus,
        categoryId: categoryId || null,
        tagIds: selectedTags.map(t => t.id),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Failed to update task");
      setToast({ message: "Failed to update task", type: "error" });
    } else {
      setEditTask(null);
      setTitle("");
      setDescription("");
      setTaskStatus("pending");
      setCategoryId("");
      setSelectedTags([]);
      fetchTasks();
      setToast({ message: "Task updated!", type: "success" });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ 
        title: task.title, 
        description: task.description, 
        status: newStatus 
      }),
    });
    if (res.ok) {
      fetchTasks();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryMsg("");
    if (!newCategoryName.trim()) {
      setCategoryMsg("Category name is required");
      return;
    }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
      credentials: "include",
    });
    if (res.ok) {
      setNewCategoryName("");
      setNewCategoryColor("#3B82F6");
      setCategoryMsg("Category created!");
      fetchCategories();
      setToast({ message: "Category created!", type: "success" });
    } else {
      const data = await res.json();
      setCategoryMsg(data.error || "Failed to create category");
      setToast({ message: data.error || "Failed to create category", type: "error" });
    }
  };

  const handleTagInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const existing = tags.find(t => t.name.toLowerCase() === tagInput.trim().toLowerCase());
      let tag = existing;
      if (!existing) {
        const res = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: tagInput.trim() }),
          credentials: "include",
        });
        if (res.ok) {
          const newTag = await res.json();
          if (newTag && newTag.id) {
            setTags(prev => [...prev, newTag]);
            tag = newTag;
          }
        }
      }
      if (tag && tag.id && !selectedTags.some(t => t.id === tag!.id)) {
        setSelectedTags(prev => [...prev, tag!]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (id: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== id));
  };

  const handleSelectTag = (id: string) => {
    const tag = tags.find(t => t.id === id);
    if (tag && !selectedTags.some(tg => tg.id === id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const inProgress = tasks.filter(t => t.status === "in-progress").length;
    return { total, completed, pending, inProgress };
  };

  const stats = getTaskStats();

  if (sessionStatus === "loading") return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-2 sm:px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-black">Task Dashboard</h1>
        {/* Tab Bar */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'add' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('add')}
          >
            Add Task
          </button>
          <button
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'categories' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('tasks')}
          >
            Task List
          </button>
        </div>
        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Progress Analytics</h2>
            {analyticsLoading ? (
              <div className="text-center text-black flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                Loading analytics...
              </div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-100 p-3 rounded text-center">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-lg font-bold text-black">{analytics.total}</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded text-center">
                    <div className="text-xs text-gray-500">Completed</div>
                    <div className="text-lg font-bold text-green-700">{analytics.completed}</div>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded text-center">
                    <div className="text-xs text-gray-500">Pending</div>
                    <div className="text-lg font-bold text-yellow-700">{analytics.pending}</div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded text-center">
                    <div className="text-xs text-gray-500">In Progress</div>
                    <div className="text-lg font-bold text-blue-700">{analytics.inProgress}</div>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
                  <div className="w-full overflow-x-auto" style={{ maxWidth: 600, margin: "0 auto" }}>
                    <Line
                      data={{
                        labels: analytics.completedPerDay.map((d: any) => d.date.slice(5)),
                        datasets: [
                          {
                            label: "Completed Tasks",
                            data: analytics.completedPerDay.map((d: any) => d.count),
                            borderColor: "#22c55e",
                            backgroundColor: "rgba(34,197,94,0.2)",
                            tension: 0.3,
                            fill: true,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: false },
                          title: { display: false },
                        },
                        scales: {
                          x: { grid: { display: false } },
                          y: { beginAtZero: true, grid: { color: "#f3f4f6" } },
                        },
                      }}
                      height={180}
                    />
                  </div>
                  <div className="w-full max-w-xs mx-auto">
                    <Pie
                      data={{
                        labels: ["Completed", "Pending", "In Progress"],
                        datasets: [
                          {
                            data: [analytics.completed, analytics.pending, analytics.inProgress],
                            backgroundColor: ["#22c55e", "#facc15", "#3b82f6"],
                            borderColor: ["#16a34a", "#eab308", "#2563eb"],
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { display: true, position: "bottom" },
                          title: { display: true, text: "Task Status Distribution" },
                        },
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-black flex flex-col items-center">
                <svg className="h-12 w-12 mb-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                No analytics data.
              </div>
            )}
          </div>
        )}
        {activeTab === 'add' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black">{editTask ? "Edit Task" : "Add New Task"}</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={editTask ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter task title"
                  required
                  aria-label="Task Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter task description"
                  rows={3}
                  aria-label="Task Description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  aria-label="Task Status"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  aria-label="Task Category"
                >
                  <option value="">No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTags.map(tag => (
                    <span key={tag.id} className="flex items-center px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                      <button type="button" className="ml-1 text-white" onClick={() => handleRemoveTag(tag.id)}>&times;</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="w-full p-2 border border-gray-300 rounded text-black"
                  placeholder="Type a tag and press Enter"
                  aria-label="Tag Input"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.filter(t => !selectedTags.some(st => st.id === t.id)).map(tag => (
                    <button key={tag.id} type="button" className="px-2 py-1 text-xs rounded-full text-white" style={{ backgroundColor: tag.color }} onClick={() => handleSelectTag(tag.id)}>
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  {editTask ? "Update Task" : "Add Task"}
                </button>
                {editTask && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTask(null);
                      setTitle("");
                      setDescription("");
                      setTaskStatus("pending");
                      setCategoryId("");
                      setSelectedTags([]);
                    }}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-black">Create New Category</h2>
            <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-end">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black"
                  required
                  aria-label="Category Name"
                />
              </div>
              <div>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={e => setNewCategoryColor(e.target.value)}
                  className="w-10 h-10 p-0 border-0 bg-transparent"
                  title="Pick a color"
                  aria-label="Category Color Picker"
                />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Add</button>
            </form>
            {categoryMsg && <p className={`mt-2 text-sm ${categoryMsg === "Category created!" ? "text-green-600" : "text-red-500"}`}>{categoryMsg}</p>}
            {/* List of created categories */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-black">Created Categories ({categories.length})</h3>
              {categories.length === 0 ? (
                <div className="text-gray-500 flex flex-col items-center">
                  <svg className="h-8 w-8 mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>
                  No categories created yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 p-3 bg-gray-100 rounded">
                      <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-black font-medium">{cat.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'tasks' && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-black mb-1">Search Tasks</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Search by title or description..."
                    aria-label="Search Tasks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    aria-label="Filter by Status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Task List */}
            <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-black">Your Tasks</h2>
              </div>
              {loading ? (
                <div className="p-6 text-center text-black">
                  <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Loading tasks...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-6 text-center text-black flex flex-col items-center">
                  <svg className="h-12 w-12 mb-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h3m4 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h5"></path></svg>
                  {tasks.length === 0 ? "No tasks yet. Create your first task above!" : "No tasks match your filters."}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <div key={task.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-black">{task.title}</h3>
                          {task.category && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: task.category.color }}>{task.category.name}</span>
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full text-black bg-gray-100`}>
                            {task.status}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-black mb-3">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-black">
                          <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                          <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.tags.map(tag => (
                              <span key={tag.id} className="px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-0 sm:ml-4 mt-2 sm:mt-0">
                        <button
                          aria-label="View Task"
                          onClick={() => setModalTask(task)}
                          className="bg-gray-200 text-black px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
                        >
                          View
                        </button>
                        <select
                          aria-label="Change Task Status"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 text-black"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          aria-label="Edit Task"
                          onClick={() => handleEdit(task)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          aria-label="Delete Task"
                          onClick={() => {
                            setShowDeleteModal(true);
                            setTaskToDelete(task);
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {/* Modal remains outside tab content for global access */}
        {modalTask && (
          <Modal
            isOpen={!!modalTask}
            onClose={() => setModalTask(null)}
            title={modalTask.title}
            overlayClassName="bg-transparent"
          >
            <div className="mb-2">
              <span className="font-semibold text-black">Status: </span>
              <span className="capitalize text-black">{modalTask.status}</span>
            </div>
            {modalTask.category && (
              <div className="mb-2">
                <span className="font-semibold text-black">Category: </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: modalTask.category.color }}>{modalTask.category.name}</span>
              </div>
            )}
            {modalTask.tags && modalTask.tags.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-black">Tags: </span>
                {modalTask.tags.map(tag => (
                  <span key={tag.id} className="px-2 py-1 text-xs font-medium rounded-full text-white mr-1" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                ))}
              </div>
            )}
            {modalTask.description && (
              <div className="mb-2">
                <span className="font-semibold text-black">Description: </span>
                <span className="text-black">{modalTask.description}</span>
              </div>
            )}
            <div className="mb-2 text-black">
              <span className="font-semibold">Created: </span>{new Date(modalTask.createdAt).toLocaleString()}
            </div>
            <div className="mb-2 text-black">
              <span className="font-semibold">Updated: </span>{new Date(modalTask.updatedAt).toLocaleString()}
            </div>
          </Modal>
        )}
        {showDeleteModal && (
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Confirm Deletion"
            actions={
              <>
                <button
                  className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded"
                  onClick={async () => {
                    if (taskToDelete) {
                      await handleDelete(taskToDelete.id);
                      setShowDeleteModal(false);
                    }
                  }}
                >
                  Delete
                </button>
              </>
            }
          >
            <p className="text-black">Are you sure you want to delete this task?</p>
          </Modal>
        )}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
} 