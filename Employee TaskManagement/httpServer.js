import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 3000;
const MAX_BODY_SIZE = 1024 * 1024;
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const tasks = [];
const employees = [
  { id: 1, name: "Alex Morgan", role: "Project Manager", department: "Operations", email: "alex.morgan@example.com" },
  { id: 2, name: "Jamie Lee", role: "Software Developer", department: "Engineering", email: "jamie.lee@example.com" },
  { id: 3, name: "Taylor Patel", role: "HR Specialist", department: "Human Resources", email: "taylor.patel@example.com" },
];

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(text);
}

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must contain valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Employee Task Management</title></head><body><h1>Welcome to Employee Task Management</h1></body></html>");
    return;
  }

  if (request.method === "GET" && pathname === "/tasks") {
    sendJson(response, 200, tasks);
    return;
  }

  if (request.method === "GET" && pathname === "/employees") {
    sendJson(response, 200, employees);
    return;
  }

  if (request.method === "POST" && pathname === "/add-task") {
    if (request.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json") {
      sendJson(response, 415, { error: "Content-Type must be application/json." });
      return;
    }

    try {
      const task = await readJsonBody(request);
      const validId =
        (typeof task?.id === "string" && task.id.trim() !== "") ||
        (typeof task?.id === "number" && Number.isFinite(task.id));
      const validTextFields = ["taskName", "assignedTo", "status"].every(
        (field) => typeof task?.[field] === "string" && task[field].trim() !== "",
      );

      if (!task || typeof task !== "object" || Array.isArray(task) || !validId || !validTextFields) {
        sendJson(response, 400, {
          error: "Required fields: id, taskName, assignedTo, and status.",
        });
        return;
      }

      tasks.push({
        id: task.id,
        taskName: task.taskName.trim(),
        assignedTo: task.assignedTo.trim(),
        status: task.status.trim(),
      });
      sendJson(response, 201, { message: "Task added successfully.", task: tasks[tasks.length - 1] });
    } catch (error) {
      sendJson(response, error.statusCode ?? 400, { error: error.message });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/about") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>About</title></head><body><h1>About</h1><p>An application for managing employee tasks.</p></body></html>");
    return;
  }

  if (request.method === "GET" && pathname === "/home") {
    try {
      const html = await readFile(path.join(publicDirectory, "index.html"));
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(html);
    } catch {
      sendText(response, 500, "Unable to load the home page.");
    }
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
});

server.listen(PORT, () => {
  console.log(`Employee Task Management server listening at http://localhost:${PORT}`);
});