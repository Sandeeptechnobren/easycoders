"use client";
import { useState } from "react";
export default function Tasks() {
    const [addTaskPopup, setAddTaskPopup] = useState(false);
    // const [taskList, setTaskList] = useState([]);
    return (
        <div>
            <div className="header">
                <h3 className="text-2xl font-bold">Task List</h3>
                <button className="btn btn-primary" onClick={() => { setAddTaskPopup(true) }}>Add Task</button>
            </div>
            <div className="task-list">
                <table>
                    <thead>
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
                                <button className="btn btn-primary">Edit</button>
                                <button className="btn btn-danger">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className={`addTaskPopup ${addTaskPopup ? 'active' : ''}`}>
                <div className="popup-content">
                    <h3>Add Task</h3>
                    <form onSubmit={(e) => { e.preventDefault(); setAddTaskPopup(false) }}>
                        <input type="text" name="taskName" placeholder="Task Name" />
                        <textarea name="taskDescription" placeholder="Task Description"></textarea>
                        <button type="submit">Add Task</button>
                    </form>
                </div>
            </div>
        </div>
    );
}