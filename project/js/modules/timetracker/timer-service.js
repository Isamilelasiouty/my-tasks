import { createDoc } from "../../core/firestore-service.js";
import { addTimeToTask } from "../tasks/task-service.js";
import { currentUser } from "../../core/auth.js";
import { bus } from "../../core/event-bus.js";

let activeTimer = null; // { taskId, taskTitle, startTime }
let tickInterval = null;

export function getActiveTimerTaskId() {
  return activeTimer?.taskId || null;
}

export function startTimerForTask(taskId, taskTitle) {
  if (activeTimer) return;
  activeTimer = { taskId, taskTitle, startTime: Date.now() };
  bus.emit("timer:started", activeTimer);
  tickInterval = setInterval(() => bus.emit("timer:tick", getElapsedSeconds()), 1000);
  localStorage.setItem("activeTimer", JSON.stringify(activeTimer));
}

export function getElapsedSeconds() {
  if (!activeTimer) return 0;
  return Math.floor((Date.now() - activeTimer.startTime) / 1000);
}

export async function stopTimer() {
  if (!activeTimer) return;
  const durationMinutes = Math.max(1, Math.round((Date.now() - activeTimer.startTime) / 60000));
  const { taskId } = activeTimer;

  clearInterval(tickInterval);
  tickInterval = null;

  if (currentUser) {
    await createDoc("timeEntries", {
      taskId,
      startTime: new Date(activeTimer.startTime).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes
    }, currentUser.uid);
    await addTimeToTask(taskId, durationMinutes);
  }

  activeTimer = null;
  localStorage.removeItem("activeTimer");
  bus.emit("timer:stopped", { taskId, durationMinutes });
}

export function restoreTimerFromStorage() {
  const saved = localStorage.getItem("activeTimer");
  if (saved) {
    activeTimer = JSON.parse(saved);
    tickInterval = setInterval(() => bus.emit("timer:tick", getElapsedSeconds()), 1000);
    bus.emit("timer:started", activeTimer);
  }
}
