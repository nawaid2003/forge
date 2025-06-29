import { v4 as uuidv4 } from "uuid";

interface ValidationError {
  id: string;
  type: string;
  message: string;
  entity: string;
  field: string;
  severity: string;
  row: number;
}

interface Rule {
  id: string;
  active: boolean;
  type: string;
  name: string;
  description: string;
  parameters: { [key: string]: any };
}

const requiredFields: { [key: string]: string[] } = {
  clients: ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"],
  workers: ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase", "WorkerGroup", "QualificationLevel"],
  tasks: ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases", "MaxConcurrent"],
};

const parseArrayField = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value.replace(/'/g, '"'));
    } catch {
      return value.split(",").map((v: string) => v.trim()).filter((v: string) => v);
    }
  }
  return [];
};

const normalizePhases = (phases: any): number[] => {
  if (!phases) return [];
  if (Array.isArray(phases)) {
    return phases.map((p) => parseInt(p)).filter((n) => !isNaN(n) && n >= 1 && n <= 6);
  }
  if (typeof phases === "string") {
    try {
      if (phases.includes("-")) {
        const [start, end] = phases.split("-").map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i).filter((n) => n >= 1 && n <= 6);
      }
      return JSON.parse(phases.replace(/'/g, '"')).filter((n: number) => n >= 1 && n <= 6);
    } catch {
      return phases.split(",").map((p) => parseInt(p.trim())).filter((n) => !isNaN(n) && n >= 1 && n <= 6);
    }
  }
  return [];
};

export function validateData(
  data: any[],
  type: "clients" | "workers" | "tasks",
  state: { clients: any[]; workers: any[]; tasks: any[]; rules: any[] }
): ValidationError[] {
  console.log(`Validating ${type} data:`, data);
  const errors: ValidationError[] = [];

  if (type === "clients" && state.tasks.length === 0) {
    errors.push({
      id: uuidv4(),
      type: "warning",
      message: "Tasks data not uploaded; cannot validate RequestedTaskIDs",
      entity: "clients",
      field: "RequestedTaskIDs",
      severity: "warning",
      row: -1,
    });
  }

  const taskIds = new Set(state.tasks.map((task) => task?.TaskID));
  const workerSkills = new Set(state.workers.flatMap((worker) => parseArrayField(worker.Skills)));

  data?.forEach((item, index) => {
    console.log(`Validating row ${index}:`, item);
    if (!item) return;
    requiredFields[type].forEach((field) => {
      if (item[field] === undefined || item[field] === null || (typeof item[field] === "string" && item[field].trim() === "")) {
        errors.push({
          id: uuidv4(),
          type: "missing",
          message: `${field} is required`,
          entity: type,
          field,
          severity: "error",
          row: index,
        });
      }
    });

    switch (type) {
      case "clients":
        if (item.PriorityLevel !== undefined && item.PriorityLevel !== null) {
          const priority = parseInt(item.PriorityLevel);
          if (isNaN(priority) || priority < 1 || priority > 5) { // d
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: "PriorityLevel must be between 1 and 5",
              entity: "clients",
              field: "PriorityLevel",
              severity: "error",
              row: index,
            });
          }
        }
        const requestedTaskIds = parseArrayField(item.RequestedTaskIDs);
        if (!requestedTaskIds || requestedTaskIds.length === 0) {
          errors.push({
            id: uuidv4(),
            type: "invalid",
            message: "RequestedTaskIDs cannot be empty",
            entity: "clients",
            field: "RequestedTaskIDs",
            severity: "error",
            row: index,
          });
        } else {
          requestedTaskIds.forEach((taskId: string) => {
            if (taskId && !taskIds.has(taskId)) { // f
              errors.push({
                id: uuidv4(),
                type: "invalid",
                message: `Task ${taskId} not found`,
                entity: "clients",
                field: "RequestedTaskIDs",
                severity: "error",
                row: index,
              });
            }
          });
        }
        if (item.AttributesJSON && typeof item.AttributesJSON === "string") {
          try {
            JSON.parse(item.AttributesJSON);
          } catch { // e
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: "Invalid JSON in AttributesJSON",
              entity: "clients",
              field: "AttributesJSON",
              severity: "error",
              row: index,
            });
          }
        } else if (!item.AttributesJSON) {
          errors.push({
            id: uuidv4(),
            type: "invalid",
            message: "AttributesJSON cannot be empty",
            entity: "clients",
            field: "AttributesJSON",
            severity: "warning",
            row: index,
          });
        }
        const duplicateClients = data.filter((r, i) => r.ClientID === item.ClientID && i !== index);
        if (duplicateClients.length > 0) { // b
          errors.push({
            id: uuidv4(),
            type: "duplicate",
            message: `Duplicate ClientID: ${item.ClientID}`,
            entity: "clients",
            field: "ClientID",
            severity: "error",
            row: index,
          });
        }
        break;

      case "workers":
        const skills = parseArrayField(item.Skills);
        const slots = normalizePhases(item.AvailableSlots);
        if (skills.length === 0) {
          errors.push({
            id: uuidv4(),
            type: "invalid",
            message: "Skills array is empty",
            entity: "workers",
            field: "Skills",
            severity: "warning",
            row: index,
          });
        }
        if (slots.length === 0 || slots.some((s) => isNaN(s))) { // c
          errors.push({
            id: uuidv4(),
            type: "invalid",
            message: "AvailableSlots contains non-numeric values",
            entity: "workers",
            field: "AvailableSlots",
            severity: "error",
            row: index,
          });
        }
        if (item.MaxLoadPerPhase !== undefined && item.MaxLoadPerPhase !== null) {
          const load = parseInt(item.MaxLoadPerPhase);
          if (isNaN(load) || load < 0) {
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: "MaxLoadPerPhase must be a non-negative number",
              entity: "workers",
              field: "MaxLoadPerPhase",
              severity: "error",
              row: index,
            });
          }
          if (slots.length < load) { // i
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: "AvailableSlots length less than MaxLoadPerPhase",
              entity: "workers",
              field: "MaxLoadPerPhase",
              severity: "warning",
              row: index,
            });
          }
        }
        if (item.QualificationLevel !== undefined && item.QualificationLevel !== null) {
          const qual = parseInt(item.QualificationLevel);
          if (isNaN(qual) || qual < 1 || qual > 5) {
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: "QualificationLevel must be between 1 and 5",
              entity: "workers",
              field: "QualificationLevel",
              severity: "error",
              row: index,
            });
          }
        }
        const duplicateWorkers = data.filter((r, i) => r.WorkerID === item.WorkerID && i !== index);
        if (duplicateWorkers.length > 0) { // b
          errors.push({
            id: uuidv4(),
            type: "duplicate",
            message: `Duplicate WorkerID: ${item.WorkerID}`,
            entity: "workers",
            field: "WorkerID",
            severity: "error",
            row: index,
          });
        }
        break;

      case "tasks":
        const requiredSkills = parseArrayField(item.RequiredSkills);
        const phases = normalizePhases(item.PreferredPhases);
        if (requiredSkills.length === 0) {
          errors.push({
            id: uuidv4(),
            type: "invalid",
            message: "RequiredSkills array is empty",
            entity: "tasks",
            field: "RequiredSkills",
            severity: "warning",
            row: index,
          });
        }
        if (phases.length === 0 || phases.some((p) => isNaN(p))) { // c
          errors.push({
            id: uuidv4(),
            type: "invalid",
            message: "PreferredPhases contains non-numeric values",
            entity: "tasks",
            field: "PreferredPhases",
            severity: "error",
            row: index,
          });
        }
        if (item.Duration !== undefined && item.Duration !== null) {
          const duration = parseInt(item.Duration);
          if (isNaN(duration) || duration < 1) { // d
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: "Duration must be a positive number",
              entity: "tasks",
              field: "Duration",
              severity: "error",
              row: index,
            });
          }
        }
        if (item.MaxConcurrent !== undefined && item.MaxConcurrent !== null) {
          const concurrent = parseInt(item.MaxConcurrent);
          if (isNaN(concurrent) || concurrent <= 0) { // d
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: "MaxConcurrent must be a positive number",
              entity: "tasks",
              field: "MaxConcurrent",
              severity: "error",
              row: index,
            });
          }
          const qualifiedWorkers = state.workers.filter((w) => {
            const wSkills = parseArrayField(w.Skills);
            return requiredSkills.every((s) => wSkills.includes(s)) && normalizePhases(w.AvailableSlots).length >= concurrent;
          }).length;
          if (qualifiedWorkers < concurrent) { // l
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: `MaxConcurrent ${concurrent} exceeds qualified workers ${qualifiedWorkers}`,
              entity: "tasks",
              field: "MaxConcurrent",
              severity: "warning",
              row: index,
            });
          }
        }
        const duplicateTasks = data.filter((r, i) => r.TaskID === item.TaskID && i !== index);
        if (duplicateTasks.length > 0) { // b
          errors.push({
            id: uuidv4(),
            type: "duplicate",
            message: `Duplicate TaskID: ${item.TaskID}`,
            entity: "tasks",
            field: "TaskID",
            severity: "error",
            row: index,
          });
        }
        requiredSkills.forEach((skill: string) => {
          if (skill && !workerSkills.has(skill)) { // k
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: `Required skill ${skill} not found in any worker`,
              entity: "tasks",
              field: "RequiredSkills",
              severity: "error",
              row: index,
            });
          }
        });
        // j: Phase-slot saturation
        const phaseSlots = state.workers.reduce((sum, w) => sum + normalizePhases(w.AvailableSlots).length, 0);
        const totalDuration = data.reduce((sum, t) => sum + (parseInt(t.Duration) || 0), 0);
        if (totalDuration > phaseSlots) {
          errors.push({
            id: uuidv4(),
            type: "invalid",
            message: "Total task durations exceed available worker slots",
            entity: "tasks",
            field: "Duration",
            severity: "warning",
            row: -1,
          });
        }
        // g: Circular co-run groups (simplified placeholder)
        if (state.rules.some((rule: Rule) => rule.type === "coRun" && rule.parameters.tasks && Array.isArray(rule.parameters.tasks) && rule.parameters.tasks.includes(item.TaskID))) {
          const coRunTasks = state.rules
            .filter((r: Rule) => r.type === "coRun" && r.parameters.tasks && Array.isArray(r.parameters.tasks) && r.parameters.tasks.includes(item.TaskID))
            .flatMap((r: Rule) => r.parameters.tasks);
          if (coRunTasks.length > new Set(coRunTasks).size) {
            errors.push({
              id: uuidv4(),
              type: "invalid",
              message: `Circular co-run detected with TaskID ${item.TaskID}`,
              entity: "tasks",
              field: "TaskID",
              severity: "error",
              row: index,
            });
          }
        }
        // h: Conflicting rules vs. phase-window (placeholder)
        if (phases.length > 0 && state.rules.some((r: Rule) => r.type === "phase-window" && r.parameters.allowedPhases && !r.parameters.allowedPhases.some((p: number) => phases.includes(p)))) {
          errors.push({
            id: uuidv4(),
            type: "invalid",
            message: "PreferredPhases conflicts with phase-window rules",
            entity: "tasks",
            field: "PreferredPhases",
            severity: "warning",
            row: index,
          });
        }
        break;
    }
  });

  console.log(`Validation errors for ${type}:`, errors);
  return errors;
}