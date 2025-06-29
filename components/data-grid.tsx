"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/contexts/data-context";
import { validateData } from "@/lib/validators";
import ValidationSummary from "./validation-summary";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NaturalLanguageSearch from "./natural-language-search";

export default function DataGrid({ type }: { type?: string }) {
  const { state, dispatch } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(type || "tasks");
  const [editedData, setEditedData] = useState({
    clients: [...state.clients],
    workers: [...state.workers],
    tasks: [...state.tasks],
  });

  useEffect(() => {
    setEditedData({
      clients: [...state.clients],
      workers: [...state.workers],
      tasks: [...state.tasks],
    });
  }, [state.clients, state.workers, state.tasks]);

  const handleEdit = (
    type: string,
    index: number,
    field: string,
    value: any
  ) => {
    const newData = [...editedData[type as keyof typeof editedData]];
    newData[index] = { ...newData[index], [field]: value };
    setEditedData({ ...editedData, [type]: newData });

    const errors = validateData(
      [newData[index]],
      type as "clients" | "workers" | "tasks",
      state
    );
    dispatch({ type: "SET_VALIDATION_ERRORS", payload: errors });
  };

  const handleSave = (type: string, index: number) => {
    const newData = [...editedData[type as keyof typeof editedData]];
    dispatch({
      type: {
        clients: "UPDATE_CLIENT",
        workers: "UPDATE_WORKER",
        tasks: "UPDATE_TASK",
      }[type],
      payload: { index, [type]: newData[index] },
    });
    const allErrors = validateData(
      editedData[type as keyof typeof editedData],
      type as "clients" | "workers" | "tasks",
      state
    );
    dispatch({ type: "SET_VALIDATION_ERRORS", payload: allErrors });
  };

  const filterData = (type: string, data: any[]) => {
    if (!searchQuery) return data;
    const queryLower = searchQuery.toLowerCase();
    return data.filter((item) => {
      if (
        type === "tasks" &&
        queryLower.includes("duration") &&
        queryLower.includes("phase")
      ) {
        const duration = parseInt(item.Duration) || 0;
        const phases = normalizePhases(item.PreferredPhases || []);
        const hasPhase2 = phases.includes(2);
        const durationGt1 = duration > 1;
        return (
          (queryLower.includes("more than 1") ? durationGt1 : true) &&
          (queryLower.includes("phase 2") ? hasPhase2 : true)
        );
      }
      return JSON.stringify(item).toLowerCase().includes(queryLower);
    });
  };

  const headers = {
    clients: [
      "ClientID",
      "ClientName",
      "PriorityLevel",
      "RequestedTaskIDs",
      "GroupTag",
      "AttributesJSON",
    ],
    workers: [
      "WorkerID",
      "WorkerName",
      "Skills",
      "AvailableSlots",
      "MaxLoadPerPhase",
      "WorkerGroup",
      "QualificationLevel",
    ],
    tasks: [
      "TaskID",
      "TaskName",
      "Category",
      "Duration",
      "RequiredSkills",
      "PreferredPhases",
      "MaxConcurrent",
    ],
  };

  const normalizePhases = (phases: any): number[] => {
    if (!phases) return [];
    if (Array.isArray(phases))
      return phases
        .map((p) => parseInt(p))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 6);
    if (typeof phases === "string") {
      try {
        if (phases.includes("-")) {
          const [start, end] = phases.split("-").map(Number);
          return Array.from(
            { length: end - start + 1 },
            (_, i) => start + i
          ).filter((n) => n >= 1 && n <= 6);
        }
        return JSON.parse(phases.replace(/'/g, '"')).filter(
          (n: number) => n >= 1 && n <= 6
        );
      } catch {
        return phases
          .split(",")
          .map((p) => parseInt(p.trim()))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 6);
      }
    }
    return [];
  };

  return (
    <div className="flex h-screen">
      <main className="flex-1 bg-white p-6">
        {/* Centered container with proper max width and centering */}
        <div className="max-w-7xl mx-auto">
          <div className="w-full space-y-6">
            {/* Header section */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Data Management
                </h2>
                <p className="text-gray-600 mt-1">
                  View, edit, and validate your data
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">
                  Total Records:{" "}
                  {state.clients.length +
                    state.workers.length +
                    state.tasks.length}
                </div>
              </div>
            </div>

            {/* Tabs with full width */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                <TabsTrigger
                  value="tasks"
                  className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="workers"
                  className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Workers
                </TabsTrigger>
                <TabsTrigger
                  value="clients"
                  className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Clients
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="space-y-6">
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Tasks Data
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage and validate task information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Search and controls section */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <Input
                          placeholder="Search data (e.g., 'Tasks with Duration > 1 and phase 2')"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-3 text-sm"
                        />
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        {filterData("tasks", editedData.tasks).length} of{" "}
                        {state.tasks.length} records
                      </div>
                    </div>

                    {state.tasks.length > 0 ? (
                      <>
                        {/* Table container with better spacing */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-gray-50">
                                <TableRow>
                                  {headers.tasks.map((header) => (
                                    <TableHead
                                      key={header}
                                      className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                                    >
                                      {header}
                                    </TableHead>
                                  ))}
                                  <TableHead className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 min-w-[100px]">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filterData("tasks", editedData.tasks).map(
                                  (item, index) => {
                                    const errors =
                                      state.validationErrors.filter(
                                        (e: { entity: string; row: number }) =>
                                          e.entity === "tasks" &&
                                          e.row === index
                                      );
                                    return (
                                      <TableRow
                                        key={index}
                                        className="bg-white hover:bg-gray-50 transition-colors"
                                      >
                                        {headers.tasks.map((field) => {
                                          const hasError = errors.some(
                                            (e: { field: string }) =>
                                              e.field === field
                                          );
                                          return (
                                            <TableCell
                                              key={field}
                                              className="px-4 py-4 border-b border-gray-100"
                                            >
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Input
                                                      value={item[field] || ""}
                                                      onChange={(e) =>
                                                        handleEdit(
                                                          "tasks",
                                                          index,
                                                          field,
                                                          e.target.value
                                                        )
                                                      }
                                                      className={`w-full min-w-[120px] border ${
                                                        hasError
                                                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                      } rounded-md p-2 text-sm focus:outline-none transition-colors bg-white`}
                                                    />
                                                  </TooltipTrigger>
                                                  {hasError && (
                                                    <TooltipContent className="bg-red-100 text-red-700 text-xs p-2 rounded-md max-w-xs">
                                                      {
                                                        errors.find(
                                                          (e: {
                                                            field: string;
                                                          }) =>
                                                            e.field === field
                                                        )?.message
                                                      }
                                                    </TooltipContent>
                                                  )}
                                                </Tooltip>
                                              </TooltipProvider>
                                            </TableCell>
                                          );
                                        })}
                                        <TableCell className="px-4 py-4 border-b border-gray-100">
                                          <Button
                                            onClick={() =>
                                              handleSave("tasks", index)
                                            }
                                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                                          >
                                            Save
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Additional components in a grid layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                          <div>
                            <ValidationSummary type="tasks" />
                          </div>
                          <div>
                            <NaturalLanguageSearch />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-2">
                          <AlertCircle className="h-12 w-12 mx-auto" />
                        </div>
                        <p className="text-lg text-gray-600 mb-2">
                          No tasks data available
                        </p>
                        <p className="text-sm text-gray-500">
                          Upload data to get started
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="workers" className="space-y-6">
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Workers Data
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage and validate worker information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <Input
                          placeholder="Search workers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-3 text-sm"
                        />
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        {filterData("workers", editedData.workers).length} of{" "}
                        {state.workers.length} records
                      </div>
                    </div>

                    {state.workers.length > 0 ? (
                      <>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-gray-50">
                                <TableRow>
                                  {headers.workers.map((header) => (
                                    <TableHead
                                      key={header}
                                      className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                                    >
                                      {header}
                                    </TableHead>
                                  ))}
                                  <TableHead className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 min-w-[100px]">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filterData("workers", editedData.workers).map(
                                  (item, index) => {
                                    const errors =
                                      state.validationErrors.filter(
                                        (e: { entity: string; row: number }) =>
                                          e.entity === "workers" &&
                                          e.row === index
                                      );
                                    return (
                                      <TableRow
                                        key={index}
                                        className="bg-white hover:bg-gray-50 transition-colors"
                                      >
                                        {headers.workers.map((field) => {
                                          const hasError = errors.some(
                                            (e: { field: string }) =>
                                              e.field === field
                                          );
                                          return (
                                            <TableCell
                                              key={field}
                                              className="px-4 py-4 border-b border-gray-100"
                                            >
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Input
                                                      value={item[field] || ""}
                                                      onChange={(e) =>
                                                        handleEdit(
                                                          "workers",
                                                          index,
                                                          field,
                                                          e.target.value
                                                        )
                                                      }
                                                      className={`w-full min-w-[120px] border ${
                                                        hasError
                                                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                      } rounded-md p-2 text-sm focus:outline-none transition-colors bg-white`}
                                                    />
                                                  </TooltipTrigger>
                                                  {hasError && (
                                                    <TooltipContent className="bg-red-100 text-red-700 text-xs p-2 rounded-md max-w-xs">
                                                      {
                                                        errors.find(
                                                          (e: {
                                                            field: string;
                                                          }) =>
                                                            e.field === field
                                                        )?.message
                                                      }
                                                    </TooltipContent>
                                                  )}
                                                </Tooltip>
                                              </TooltipProvider>
                                            </TableCell>
                                          );
                                        })}
                                        <TableCell className="px-4 py-4 border-b border-gray-100">
                                          <Button
                                            onClick={() =>
                                              handleSave("workers", index)
                                            }
                                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                                          >
                                            Save
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                          <div>
                            <ValidationSummary type="workers" />
                          </div>
                          <div>
                            <NaturalLanguageSearch />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-2">
                          <AlertCircle className="h-12 w-12 mx-auto" />
                        </div>
                        <p className="text-lg text-gray-600 mb-2">
                          No workers data available
                        </p>
                        <p className="text-sm text-gray-500">
                          Upload data to get started
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients" className="space-y-6">
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Clients Data
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage and validate client information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <Input
                          placeholder="Search clients..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-3 text-sm"
                        />
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        {filterData("clients", editedData.clients).length} of{" "}
                        {state.clients.length} records
                      </div>
                    </div>

                    {state.clients.length > 0 ? (
                      <>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-gray-50">
                                <TableRow>
                                  {headers.clients.map((header) => (
                                    <TableHead
                                      key={header}
                                      className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
                                    >
                                      {header}
                                    </TableHead>
                                  ))}
                                  <TableHead className="px-4 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 min-w-[100px]">
                                    Actions
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filterData("clients", editedData.clients).map(
                                  (item, index) => {
                                    const errors =
                                      state.validationErrors.filter(
                                        (e: { entity: string; row: number }) =>
                                          e.entity === "clients" &&
                                          e.row === index
                                      );
                                    return (
                                      <TableRow
                                        key={index}
                                        className="bg-white hover:bg-gray-50 transition-colors"
                                      >
                                        {headers.clients.map((field) => {
                                          const hasError = errors.some(
                                            (e: { field: string }) =>
                                              e.field === field
                                          );
                                          return (
                                            <TableCell
                                              key={field}
                                              className="px-4 py-4 border-b border-gray-100"
                                            >
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Input
                                                      value={item[field] || ""}
                                                      onChange={(e) =>
                                                        handleEdit(
                                                          "clients",
                                                          index,
                                                          field,
                                                          e.target.value
                                                        )
                                                      }
                                                      className={`w-full min-w-[120px] border ${
                                                        hasError
                                                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                      } rounded-md p-2 text-sm focus:outline-none transition-colors bg-white`}
                                                    />
                                                  </TooltipTrigger>
                                                  {hasError && (
                                                    <TooltipContent className="bg-red-100 text-red-700 text-xs p-2 rounded-md max-w-xs">
                                                      {
                                                        errors.find(
                                                          (e: {
                                                            field: string;
                                                          }) =>
                                                            e.field === field
                                                        )?.message
                                                      }
                                                    </TooltipContent>
                                                  )}
                                                </Tooltip>
                                              </TooltipProvider>
                                            </TableCell>
                                          );
                                        })}
                                        <TableCell className="px-4 py-4 border-b border-gray-100">
                                          <Button
                                            onClick={() =>
                                              handleSave("clients", index)
                                            }
                                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                                          >
                                            Save
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                          <div>
                            <ValidationSummary type="clients" />
                          </div>
                          <div>
                            <NaturalLanguageSearch />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-2">
                          <AlertCircle className="h-12 w-12 mx-auto" />
                        </div>
                        <p className="text-lg text-gray-600 mb-2">
                          No clients data available
                        </p>
                        <p className="text-sm text-gray-500">
                          Upload data to get started
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
