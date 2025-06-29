"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Wand2,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useData } from "@/contexts/data-context";
import { validateData } from "@/lib/validators";

interface ErrorSuggestion {
  id: string;
  errorId: string;
  type: "fix" | "suggestion" | "alternative";
  title: string;
  description: string;
  action: string;
  confidence: number;
  autoApplicable: boolean;
  fixFunction?: () => void;
}

export default function AIErrorCorrection() {
  const { state, dispatch } = useData();
  const [suggestions, setSuggestions] = useState<ErrorSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(
    new Set()
  );
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const fixInvalidTaskReferences = () => {
    const updatedClients = state.clients.map(
      (client: { RequestedTaskIDs: any[] }) => {
        if (Array.isArray(client.RequestedTaskIDs)) {
          const validTaskIds = client.RequestedTaskIDs.filter((taskId: any) =>
            state.tasks.some((task: { TaskID: any }) => task.TaskID === taskId)
          );
          return { ...client, RequestedTaskIDs: validTaskIds };
        }
        return client;
      }
    );
    dispatch({ type: "SET_CLIENTS", payload: updatedClients });
  };

  const fixMalformedJSON = () => {
    const updatedClients = state.clients.map(
      (client: { AttributesJSON: string }) => {
        if (
          client.AttributesJSON &&
          typeof client.AttributesJSON === "string"
        ) {
          try {
            JSON.parse(client.AttributesJSON);
            return client;
          } catch {
            return {
              ...client,
              AttributesJSON: JSON.stringify({
                message: client.AttributesJSON,
              }),
            };
          }
        }
        return client;
      }
    );
    dispatch({ type: "SET_CLIENTS", payload: updatedClients });
  };

  const fixOverloadedWorkers = () => {
    const updatedWorkers = state.workers.map(
      (worker: { AvailableSlots: string | any[]; MaxLoadPerPhase: number }) => {
        if (
          Array.isArray(worker.AvailableSlots) &&
          worker.MaxLoadPerPhase > worker.AvailableSlots.length
        ) {
          return { ...worker, MaxLoadPerPhase: worker.AvailableSlots.length };
        }
        return worker;
      }
    );
    dispatch({ type: "SET_WORKERS", payload: updatedWorkers });
  };

  const fixInvalidDurations = () => {
    const updatedTasks = state.tasks.map((task: { Duration: number }) => {
      if (task.Duration < 1) {
        return { ...task, Duration: 1 };
      }
      return task;
    });
    dispatch({ type: "SET_TASKS", payload: updatedTasks });
  };

  const fixInvalidPriorities = () => {
    const updatedClients = state.clients.map(
      (client: { PriorityLevel: number }) => {
        const priority = Math.max(1, Math.min(5, client.PriorityLevel));
        return { ...client, PriorityLevel: priority };
      }
    );
    dispatch({ type: "SET_CLIENTS", payload: updatedClients });
  };

  const generateSuggestions = async () => {
    setIsAnalyzing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const newSuggestions: ErrorSuggestion[] = [];

      state.validationErrors.forEach(
        (error: { type: string; id: any; message: string | string[] }) => {
          if (error.type === "Unknown Task References") {
            newSuggestions.push({
              id: `fix-invalid-tasks-${error.id}`,
              errorId: error.id,
              type: "fix",
              title: "Fix Invalid Task References",
              description: "Remove non-existent task IDs from client requests.",
              action: "Auto-remove invalid task references",
              confidence: 95,
              autoApplicable: true,
              fixFunction: fixInvalidTaskReferences,
            });
          }
          if (error.type === "Malformed JSON") {
            newSuggestions.push({
              id: `fix-malformed-json-${error.id}`,
              errorId: error.id,
              type: "fix",
              title: "Convert Text to JSON",
              description: "Wrap invalid text in valid JSON format.",
              action: 'Wrap in JSON: {"message": "text content"}',
              confidence: 98,
              autoApplicable: true,
              fixFunction: fixMalformedJSON,
            });
          }
          if (error.type === "Overloaded Worker") {
            newSuggestions.push({
              id: `fix-overloaded-worker-${error.id}`,
              errorId: error.id,
              type: "fix",
              title: "Fix Worker Overload",
              description: "Adjust MaxLoadPerPhase to match available slots.",
              action: "Reduce MaxLoadPerPhase to available slots count",
              confidence: 90,
              autoApplicable: true,
              fixFunction: fixOverloadedWorkers,
            });
          }
          if (
            error.type === "Out of Range Value" &&
            error.message.includes("Duration")
          ) {
            newSuggestions.push({
              id: `fix-invalid-duration-${error.id}`,
              errorId: error.id,
              type: "fix",
              title: "Fix Invalid Task Duration",
              description: "Set minimum duration to 1 phase.",
              action: "Set duration to 1 for invalid values",
              confidence: 100,
              autoApplicable: true,
              fixFunction: fixInvalidDurations,
            });
          }
          if (
            error.type === "Out of Range Value" &&
            error.message.includes("Priority Level")
          ) {
            newSuggestions.push({
              id: `fix-invalid-priority-${error.id}`,
              errorId: error.id,
              type: "fix",
              title: "Fix Invalid Priority Level",
              description: "Adjust priority levels to valid range (1-5).",
              action: "Clamp priority values to 1-5 range",
              confidence: 100,
              autoApplicable: true,
              fixFunction: fixInvalidPriorities,
            });
          }
        }
      );

      const uniqueSuggestions = newSuggestions.filter(
        (suggestion, index, self) =>
          index === self.findIndex((s) => s.id === suggestion.id)
      );

      if (state.clients.length > 0) {
        uniqueSuggestions.push({
          id: "pattern-suggestion-1",
          errorId: "",
          type: "suggestion",
          title: "Balance Client Priorities",
          description:
            "Optimize priority distribution to avoid resource conflicts.",
          action: "Suggest rebalancing priorities",
          confidence: 70,
          autoApplicable: false,
        });
      }

      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = async (suggestion: ErrorSuggestion) => {
    if (!suggestion.autoApplicable || !suggestion.fixFunction) return;

    setIsApplying(suggestion.id);
    try {
      suggestion.fixFunction();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const allData = {
        clients: state.clients,
        workers: state.workers,
        tasks: state.tasks,
        rules: state.rules,
      };
      const clientErrors = validateData(state.clients, "clients", allData);
      const workerErrors = validateData(state.workers, "workers", allData);
      const taskErrors = validateData(state.tasks, "tasks", allData);
      const allErrors = [...clientErrors, ...workerErrors, ...taskErrors];
      dispatch({ type: "SET_VALIDATION_ERRORS", payload: allErrors });
      setAppliedSuggestions((prev) => new Set([...prev, suggestion.id]));
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    } catch (error) {
      console.error("Error applying suggestion:", error);
    } finally {
      setIsApplying(null);
    }
  };

  const getSuggestionIcon = (type: ErrorSuggestion["type"]) => {
    switch (type) {
      case "fix":
        return <Wand2 className="h-5 w-5 text-teal-500" />;
      case "suggestion":
        return <Lightbulb className="h-5 w-5 text-gold-500" />;
      case "alternative":
        return <AlertTriangle className="h-5 w-5 text-coral-500" />;
    }
  };

  const getSuggestionBadge = (type: ErrorSuggestion["type"]) => {
    switch (type) {
      case "fix":
        return <Badge className="bg-teal-100 text-teal-600">Auto-Fix</Badge>;
      case "suggestion":
        return <Badge className="bg-gold-100 text-gold-600">Suggestion</Badge>;
      case "alternative":
        return (
          <Badge className="bg-coral-100 text-coral-600">Alternative</Badge>
        );
    }
  };

  return (
    <Card className="border-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-teal-500" />
          <CardTitle className="text-lg text-teal-600">
            AI Error Correction
          </CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          AI-powered fixes to clean and optimize your data instantly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          onClick={generateSuggestions}
          disabled={isAnalyzing}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Find AI Fixes
            </>
          )}
        </Button>

        {suggestions.length === 0 && !isAnalyzing && (
          <Alert className="bg-teal-50 border-teal-200">
            <CheckCircle className="h-5 w-5 text-teal-500" />
            <AlertDescription className="text-teal-600">
              No issues detected or all issues resolved.
            </AlertDescription>
          </Alert>
        )}

        {suggestions.length > 0 && (
          <ScrollArea className="h-[300px] rounded-lg border border-teal-200 p-4">
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-start gap-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg"
                >
                  <div className="mt-1">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-teal-600">
                        {suggestion.title}
                      </h4>
                      {getSuggestionBadge(suggestion.type)}
                      <span className="text-xs text-muted-foreground">
                        Confidence: {suggestion.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                    <p className="text-sm font-medium text-teal-600">
                      {suggestion.action}
                    </p>
                  </div>
                  {suggestion.autoApplicable && (
                    <Button
                      size="sm"
                      onClick={() => applySuggestion(suggestion)}
                      disabled={
                        isApplying === suggestion.id ||
                        appliedSuggestions.has(suggestion.id)
                      }
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      {isApplying === suggestion.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : appliedSuggestions.has(suggestion.id) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        "Apply Fix"
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
