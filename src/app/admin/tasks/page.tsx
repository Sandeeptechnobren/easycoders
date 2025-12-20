"use client";

import { useState } from "react";
import api from "@/lib/axios"; // adjust path if needed

export default function Tasks() {
    const [addTaskPopup, setAddTaskPopup] = useState(false);
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskCategory, setTaskCategory] = useState("");
    const [taskImage, setTaskImage] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAddTask = () => {
        setError(null);
        setTaskName("");
        setTaskDescription("");
        setAddTaskPopup(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Note: Adjust the payload/endpoint if necessary based on API requirements
            const response = await api.post("/tasks", {
                task_name: taskName,
                task_description: taskDescription,
                category: taskCategory, // Added category if supported
            });

            console.log(response.data);

            // close modal only after success
            setAddTaskPopup(false);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 py-5" style={{ background: "#050505", color: "white" }}>
            <div className="container">
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div>
                        <h1 className="fw-bold mb-2" style={{ color: "#00c2ff", textShadow: "0 0 12px rgba(0,194,255,0.5)" }}>
                            Task Management
                        </h1>
                        <p className="text-white mb-0 opacity-75">Create, edit, and manage system tasks</p>
                    </div>
                    <button
                        className="btn fw-semibold px-4 py-2"
                        onClick={handleAddTask}
                        style={{
                            background: "rgba(0,194,255,0.1)",
                            color: "#00c2ff",
                            border: "1px solid rgba(0,194,255,0.3)",
                            borderRadius: "30px",
                            boxShadow: "0 0 15px rgba(0,194,255,0.2)",
                            transition: "all 0.3s ease"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = "rgba(0,194,255,0.2)";
                            e.currentTarget.style.boxShadow = "0 0 25px rgba(0,194,255,0.4)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = "rgba(0,194,255,0.1)";
                            e.currentTarget.style.boxShadow = "0 0 15px rgba(0,194,255,0.2)";
                        }}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add New Task
                    </button>
                </div>

                {/* Tasks Table Card */}
                <div
                    className="p-4 rounded-4"
                    style={{
                        background: "rgba(20,20,20,0.6)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                    }}
                >
                    <div className="table-responsive">
                        <table className="table" style={{ color: "white" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
                                    <th className="py-3 bg-transparent text-info border-0 ps-3">Task Name</th>
                                    <th className="py-3 bg-transparent text-info border-0">Description</th>
                                    <th className="py-3 bg-transparent text-info border-0 text-end pe-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Static Data Row - Replace with dynamic mapping when ready */}
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="hover-effect">
                                    <td className="py-3 bg-transparent text-white border-0 fw-semibold ps-3 alignment-middle">Task 1</td>
                                    <td className="py-3 bg-transparent text-white opacity-75 border-0 alignment-middle">Task 1 Description</td>
                                    <td className="py-3 bg-transparent border-0 text-end pe-3">
                                        <button
                                            className="btn btn-sm me-2"
                                            style={{
                                                background: "rgba(0,194,255,0.15)",
                                                color: "#00c2ff",
                                                border: "1px solid rgba(0,194,255,0.3)"
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{
                                                color: "#ff4d4d",
                                                background: "rgba(255,77,77,0.1)",
                                                border: "1px solid rgba(255,77,77,0.2)"
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Task Modal */}
                {addTaskPopup && (
                    <>
                        <div className="modal-backdrop fade show" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}></div>
                        <div
                            className="modal fade show d-block"
                            tabIndex={-1}
                        >
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content" style={{
                                    background: "#121212",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "16px",
                                    boxShadow: "0 0 40px rgba(0,0,0,0.6)"
                                }}>
                                    <div className="modal-header border-bottom border-secondary pt-4 px-4 pb-3" style={{ borderColor: "rgba(255,255,255,0.1) !important" }}>
                                        <h5 className="modal-title fw-bold text-white">Add New Task</h5>
                                        <button
                                            type="button"
                                            className="btn-close btn-close-white"
                                            onClick={() => setAddTaskPopup(false)}
                                        />
                                    </div>
                                    <form onSubmit={handleSubmit}>
                                        <div className="modal-body p-4">
                                            {error && (
                                                <div className="alert alert-danger border-0 mb-4" style={{ background: "rgba(220, 53, 69, 0.2)", color: "#ff6b6b" }}>
                                                    <i className="bi bi-exclamation-circle me-2"></i>
                                                    {error}
                                                </div>
                                            )}
                                            <div className="mb-4">
                                                <label className="form-label text-white opacity-75 small text-uppercase fw-bold ls-1">
                                                    Task Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-dark text-white border-0 py-3"
                                                    style={{ background: "rgba(255,255,255,0.05)", color: "white" }}
                                                    value={taskName}
                                                    onChange={(e) => setTaskName(e.target.value)}
                                                    required
                                                    placeholder="Enter task name"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="form-label text-white opacity-75 small text-uppercase fw-bold ls-1">
                                                    Task Category
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-dark text-white border-0 py-3"
                                                    style={{ background: "rgba(255,255,255,0.05)", color: "white" }}
                                                    value={taskCategory}
                                                    onChange={(e) => setTaskCategory(e.target.value)}
                                                    required
                                                    placeholder="e.g. Frontend, Backend"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="form-label text-white opacity-75 small text-uppercase fw-bold ls-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    className="form-control bg-dark text-white border-0 py-3"
                                                    style={{ background: "rgba(255,255,255,0.05)", color: "white", resize: "none" }}
                                                    rows={4}
                                                    value={taskDescription}
                                                    onChange={(e) => setTaskDescription(e.target.value)}
                                                    required
                                                    placeholder="Describe the task..."
                                                />
                                            </div>
                                            <div className="mb-2">
                                                <label className="form-label text-white opacity-75 small text-uppercase fw-bold ls-1">
                                                    Task Image
                                                </label>
                                                <input
                                                    type="file"
                                                    className="form-control bg-dark text-white border-0"
                                                    style={{ background: "rgba(255,255,255,0.05)", color: "white" }}
                                                    onChange={(e) => setTaskImage(e.target.files?.[0] || null)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="modal-footer border-top border-secondary p-4" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                            <button
                                                type="button"
                                                className="btn btn-link text-white text-decoration-none me-3"
                                                onClick={() => setAddTaskPopup(false)}
                                                disabled={loading}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary px-4 py-2 fw-semibold"
                                                disabled={loading}
                                                style={{
                                                    background: "linear-gradient(45deg, #00c2ff, #007bff)",
                                                    border: "none",
                                                    boxShadow: "0 4px 15px rgba(0, 194, 255, 0.4)"
                                                }}
                                            >
                                                {loading ? "Saving..." : "Create Task"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
