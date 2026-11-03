import express from "express";

const app = express();
const PORT = 4000;

app.use(express.json());

const tasks = [
  {
    id: 1,
    taskName: "Develop Login Page",
    assignedTo: "Rahul Sharma",
    status: "Pending",
    priority: "High",
  },
  {
    id: 2,
    taskName: "Prepare Monthly Report",
    assignedTo: "Priya Patel",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: 3,
    taskName: "Review Customer Feedback",
    assignedTo: "Arjun Mehta",
    status: "Completed",
    priority: "Low",
  },
];

const taskFields = ["taskName", "assignedTo", "status", "priority"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidTaskDetails(task) {
  return (
    task !== null &&
    typeof task === "object" &&
    !Array.isArray(task) &&
    taskFields.every((field) => isNonEmptyString(task[field]))
  );
}

function sendError(response, statusCode, message) {
  response.status(statusCode).json({
    success: false,
    error: message,
  });
}

app.get("/tasks", (request, response) => {
  response.json({ success: true, data: tasks });
});

app.get("/tasks/:id", (request, response) => {
  const id = Number(request.params.id);
  const task = tasks.find((item) => item.id === id);

  if (!Number.isInteger(id) || !task) {
    return sendError(response, 404, "Task not found.");
  }

  response.json({ success: true, data: task });
});

app.post("/tasks", (request, response) => {
  const taskDetails = request.body;

  if (!isValidTaskDetails(taskDetails)) {
    return sendError(
      response,
      400,
      "Provide non-empty taskName, assignedTo, status, and priority fields.",
    );
  }

  const id = taskDetails.id === undefined
    ? Math.max(0, ...tasks.map((task) => task.id)) + 1
    : taskDetails.id;

  if (!Number.isInteger(id) || id < 1) {
    return sendError(response, 400, "Task id must be a positive integer.");
  }

  if (tasks.some((task) => task.id === id)) {
    return sendError(response, 400, "A task with this id already exists.");
  }

  const newTask = {
    id,
    taskName: taskDetails.taskName.trim(),
    assignedTo: taskDetails.assignedTo.trim(),
    status: taskDetails.status.trim(),
    priority: taskDetails.priority.trim(),
  };
  tasks.push(newTask);

  response.status(201).json({
    success: true,
    message: "Task created successfully.",
    data: newTask,
  });
});

app.put("/tasks/:id", (request, response) => {
  const id = Number(request.params.id);
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (!Number.isInteger(id) || taskIndex === -1) {
    return sendError(response, 404, "Task not found.");
  }

  const taskDetails = request.body;
  if (!isValidTaskDetails(taskDetails)) {
    return sendError(
      response,
      400,
      "Provide non-empty taskName, assignedTo, status, and priority fields.",
    );
  }

  if (taskDetails.id !== undefined && taskDetails.id !== id) {
    return sendError(response, 400, "Task id in the request body must match the URL.");
  }

  const updatedTask = {
    id,
    taskName: taskDetails.taskName.trim(),
    assignedTo: taskDetails.assignedTo.trim(),
    status: taskDetails.status.trim(),
    priority: taskDetails.priority.trim(),
  };
  tasks[taskIndex] = updatedTask;

  response.json({
    success: true,
    message: "Task updated successfully.",
    data: updatedTask,
  });
});

app.delete("/tasks/:id", (request, response) => {
  const id = Number(request.params.id);
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (!Number.isInteger(id) || taskIndex === -1) {
    return sendError(response, 404, "Task not found.");
  }

  const [deletedTask] = tasks.splice(taskIndex, 1);
  response.json({
    success: true,
    message: "Task deleted successfully.",
    data: deletedTask,
  });
});

app.use((request, response) => {
  sendError(response, 404, "Route not found.");
});

app.use((error, request, response, next) => {
  if (error.type === "entity.parse.failed") {
    return sendError(response, 400, "Request body must contain valid JSON.");
  }

  if (error.type === "entity.too.large") {
    return sendError(response, 413, "Request body is too large.");
  }

  console.error(error);
  sendError(response, 500, "Internal server error.");
});

app.listen(PORT, () => {
  console.log(`Employee Task Management API listening at http://localhost:${PORT}`);
});