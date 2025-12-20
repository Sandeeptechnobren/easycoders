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
            const response = await api.post("/tasks", {
                task_name: taskName,
                task_description: taskDescription,
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
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold">Task List</h3>
                <button className="btn btn-primary" onClick={handleAddTask}>
                    Add Task
                </button>
            </div>
            <div className="table-responsive">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th>Task Name</th>
                            <th>Task Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Task 1</td>
                            <td>Task 1 Description</td>
                            <td>
                                <button className="btn btn-sm btn-primary me-2">
                                    Edit
                                </button>
                                <button className="btn btn-sm btn-danger">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div
                className={`modal fade ${addTaskPopup ? "show d-block" : ""}`}
                tabIndex={-1}
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header bg-dark">
                            <h5 className="modal-title text-white">Add Task</h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={() => setAddTaskPopup(false)}
                            />
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {error && (
                                    <div className="alert alert-danger">
                                        {error}
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label text-dark">
                                        Task Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={taskName}
                                        onChange={(e) =>
                                            setTaskName(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-dark">
                                        Task Category
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={taskCategory}
                                        onChange={(e) =>
                                            setTaskCategory(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-dark">
                                        Task Description
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows={5}
                                        value={taskDescription}
                                        onChange={(e) =>
                                            setTaskDescription(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-dark">
                                        Add image
                                    </label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        onChange={(e) =>
                                            setTaskImage(
                                                e.target.files?.[0] || null
                                            )
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setAddTaskPopup(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Add Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
