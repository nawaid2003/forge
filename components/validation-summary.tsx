"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from "react";
import { validateData } from "@/lib/validators";

export default function ValidationSummary({
  type = "clients",
}: {
  type?: "clients" | "workers" | "tasks";
}) {
  const { state, dispatch } = useData();
  const [applyingFix, setApplyingFix] = useState<string | null>(null);

  const getIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case "clients":
        return "Client";
      case "workers":
        return "Worker";
      case "tasks":
        return "Task";
      default:
        return entity;
    }
  };

  const filteredErrors = state.validationErrors.filter(
    (error: { entity: string }) => error.entity === type
  );

  const applyFix = (error: any, index: number) => {
    setApplyingFix(error.id);
    const newValue =
      error.field === "Duration" ? 1 : error.field === "PriorityLevel" ? 3 : [];
    const updateAction = {
      clients: "UPDATE_CLIENT",
      workers: "UPDATE_WORKER",
      tasks: "UPDATE_TASK",
    }[type];
    const updatedItem = {
      ...state[type as keyof typeof state][index],
      [error.field]: newValue,
    };
    dispatch({
      type: updateAction,
      payload: { index: error.row, [type]: updatedItem },
    });
    const allErrors = validateData(
      [updatedItem],
      type as "clients" | "workers" | "tasks",
      state
    );
    dispatch({ type: "SET_VALIDATION_ERRORS", payload: allErrors });
    setApplyingFix(null);
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">①</span>
          </div>
          <CardTitle className="text-lg text-gray-900">
            Validation Summary
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-600">
          Overview of data issues with actionable fixes for {type}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredErrors.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 font-medium">
              All {type} data is valid!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[200px] rounded-md border border-gray-200 p-4 bg-white">
            <div className="space-y-3">
              {filteredErrors.map(
                (
                  error: {
                    id: Key | null | undefined;
                    entity: string;
                    message:
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactElement<
                          unknown,
                          string | JSXElementConstructor<any>
                        >
                      | Iterable<ReactNode>
                      | ReactPortal
                      | Promise<
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactPortal
                          | ReactElement<
                              unknown,
                              string | JSXElementConstructor<any>
                            >
                          | Iterable<ReactNode>
                          | null
                          | undefined
                        >
                      | null
                      | undefined;
                    field:
                      | string
                      | number
                      | bigint
                      | boolean
                      | ReactElement<
                          unknown,
                          string | JSXElementConstructor<any>
                        >
                      | Iterable<ReactNode>
                      | ReactPortal
                      | Promise<
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactPortal
                          | ReactElement<
                              unknown,
                              string | JSXElementConstructor<any>
                            >
                          | Iterable<ReactNode>
                          | null
                          | undefined
                        >
                      | null
                      | undefined;
                    row: number | undefined;
                    severity: string;
                  },
                  idx: any
                ) => (
                  <div
                    key={error.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getEntityLabel(error.entity)} Error: {error.message}
                      </p>
                      <p className="text-xs text-gray-600">
                        Field: {error.field}, Row:{" "}
                        {error.row !== undefined ? error.row + 1 : "N/A"}
                      </p>
                    </div>
                    {error.severity === "error" && (
                      <Button
                        onClick={() => applyFix(error, error.row || 0)}
                        variant="outline"
                        size="sm"
                        disabled={applyingFix === error.id}
                        className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-md px-3 py-1 text-sm"
                      >
                        {applyingFix === error.id ? "Applying..." : "Fix"}
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
