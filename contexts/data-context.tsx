"use client";

import React, { createContext, useContext, useReducer } from "react";

const DataContext = createContext<any>(null);

const initialState = {
  clients: [],
  workers: [],
  tasks: [],
  rules: [],
  priorities: [
    {
      id: "1",
      name: "Fulfillment",
      description: "Complete requested tasks",
      weight: 0.3,
    },
    { id: "2", name: "Fairness", description: "Balance workload", weight: 0.3 },
    {
      id: "3",
      name: "Priority",
      description: "Follow priority levels",
      weight: 0.2,
    },
    {
      id: "4",
      name: "Efficiency",
      description: "Minimize idle time",
      weight: 0.1,
    },
    { id: "5", name: "Skill Match", description: "Match skills", weight: 0.1 },
  ],
  validationErrors: [],
  history: [],
  historyIndex: -1,
};

const dataReducer = (state: any, action: any) => {
  let newState = { ...state };
  const updateHistory = (updatedState: any) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({
      ...updatedState,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
    return {
      ...updatedState,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  };

  switch (action.type) {
    case "SET_CLIENTS":
      newState = { ...state, clients: action.payload };
      return updateHistory(newState);
    case "SET_WORKERS":
      newState = { ...state, workers: action.payload };
      return updateHistory(newState);
    case "SET_TASKS":
      newState = { ...state, tasks: action.payload };
      return updateHistory(newState);
    case "ADD_RULE":
      newState = { ...state, rules: [...state.rules, action.payload] };
      return updateHistory(newState);
    case "UPDATE_RULE":
      const updatedRules = [...state.rules];
      updatedRules[action.payload.index] = action.payload.rule;
      newState = { ...state, rules: updatedRules };
      return updateHistory(newState);
    case "SET_PRIORITIES":
      newState = { ...state, priorities: action.payload };
      return updateHistory(newState);
    case "SET_VALIDATION_ERRORS":
      newState = {
        ...state,
        validationErrors: [
          ...state.validationErrors.filter(
            (e: { entity: any }) => e.entity !== action.payload[0]?.entity
          ),
          ...action.payload,
        ],
      };
      return updateHistory(newState);
    case "UNDO":
      if (state.historyIndex < 0) return state;
      const previousState = state.history[state.historyIndex];
      return { ...previousState, historyIndex: state.historyIndex - 1 };
    case "REDO":
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextState = state.history[state.historyIndex + 2];
      return { ...nextState, historyIndex: state.historyIndex + 1 };
    case "UPDATE_CLIENT":
      newState = {
        ...state,
        clients: state.clients.map((client: any, index: number) =>
          index === action.payload.index ? action.payload.client : client
        ),
      };
      return updateHistory(newState);
    case "UPDATE_WORKER":
      newState = {
        ...state,
        workers: state.workers.map((worker: any, index: number) =>
          index === action.payload.index ? action.payload.worker : worker
        ),
      };
      return updateHistory(newState);
    case "UPDATE_TASK":
      newState = {
        ...state,
        tasks: state.tasks.map((task: any, index: number) =>
          index === action.payload.index ? action.payload.task : task
        ),
      };
      return updateHistory(newState);
    default:
      return state;
  }
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
