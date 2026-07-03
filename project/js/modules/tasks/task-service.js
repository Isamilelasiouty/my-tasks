import { createDoc, updateDocById, deleteDocById, subscribeToCollection } from "../../core/firestore-service.js";
import { bus } from "../../core/event-bus.js";

const COLLECTION = "tasks";

export let allTasks = [];
let unsubscribe = null;

export function startTasksSubscription(ownerId) {
  if (unsubscribe) unsubscribe();
  unsubscribe = subscribeToCollection(COLLECTION, ownerId, (items) => {
    allTasks = items;
    bus.emit("tasks:updated", allTasks);
  }, "dueDate");
}

export async function addTask(taskData, ownerId) {
  const payload = {
    title: taskData.title,
    description: taskData.description || "",
    type: taskData.type || "work",
    status: "todo",
    priority: taskData.priority || "medium",
    dueDate: taskData.dueDate || null,
    estimatedMinutes: Number(taskData.estimatedMinutes) || 0,
    actualMinutes: 0,
    clientName: taskData.clientName || null,
    projectName: taskData.projectName || null,
    tags: taskData.tags || [],
    checklist: taskData.checklist || []
  };
  return createDoc(COLLECTION, payload, ownerId);
}

export async function updateTaskStatus(taskId, status) {
  const updates = { status };
  if (status === "done") updates.completedAt = new Date().toISOString();
  await updateDocById(COLLECTION, taskId, updates);
}

export async function updateTask(taskId, data) {
  await updateDocById(COLLECTION, taskId, data);
}

export async function removeTask(taskId) {
  await deleteDocById(COLLECTION, taskId);
}

export async function addTimeToTask(taskId, minutes) {
  const task = allTasks.find((t) => t.id === taskId);
  const newTotal = (task?.actualMinutes || 0) + minutes;
  await updateDocById(COLLECTION, taskId, { actualMinutes: newTotal });
}
