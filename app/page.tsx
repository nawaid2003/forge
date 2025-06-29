"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Database,
  Gavel,
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import DataIngestion from "@/components/data-ingestion";
import DataGrid from "@/components/data-grid";
import RuleBuilder from "@/components/rule-builder";
import PrioritizationPanel from "@/components/prioritization-panel";
import ValidationSummary from "@/components/validation-summary";
import NaturalLanguageSearch from "@/components/natural-language-search";
import ExportPanel from "@/components/export-panel";
import Tutorial from "@/components/tutorial";
import { DataProvider, useData } from "@/contexts/data-context";
import { Input } from "@/components/ui/input";
import { validateData } from "@/lib/validators";

function AIChatAssistant() {
  const { state, dispatch } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return;

    const lowercaseMessage = message.toLowerCase();
    setResponse("Processing your request...");

    // Natural Language Data Modification
    if (
      lowercaseMessage.includes("modify") ||
      lowercaseMessage.includes("update")
    ) {
      if (
        lowercaseMessage.includes("client") &&
        lowercaseMessage.includes("priority")
      ) {
        const clientIndex = parseInt(
          lowercaseMessage.match(/\d+/)?.[0] || "-1"
        );
        if (clientIndex >= 0 && clientIndex < state.clients.length) {
          const priorityMatch = lowercaseMessage.match(/priority (\w+)/i);
          if (priorityMatch) {
            const newPriority = priorityMatch[1];
            const newClients = [...state.clients];
            newClients[clientIndex] = {
              ...newClients[clientIndex],
              PriorityLevel: newPriority,
            };
            dispatch({ type: "SET_CLIENTS", payload: newClients });
            setResponse(
              `Updated PriorityLevel for Client ${clientIndex} to ${newPriority}.`
            );
          }
        }
      }
    }

    // AI Rule Recommendations
    else if (lowercaseMessage.includes("suggest rule")) {
      const tasks = lowercaseMessage.match(/t\d+/g) || [];
      if (tasks.length > 1) {
        const rule = {
          id: Date.now().toString(),
          type: "coRun",
          name: `Suggested Rule ${Date.now()}`,
          description: `AI suggested that ${tasks.join(
            ", "
          )} should run together.`,
          parameters: { tasks },
          active: true,
        };
        dispatch({ type: "ADD_RULE", payload: rule });
        setResponse(
          `Suggested rule added for tasks ${tasks.join(", ")} to run together.`
        );
      } else {
        setResponse(
          "Please specify at least two tasks (e.g., T1 and T2) for a rule suggestion."
        );
      }
    }

    // AI-based Error Correction
    else if (lowercaseMessage.includes("fix error")) {
      const errors = state.validationErrors;
      if (errors.length > 0) {
        const firstError = errors[0];
        if (
          firstError.type === "duplicate" &&
          firstError.entity === "clients"
        ) {
          const uniqueClients = state.clients.filter(
            (client: { ClientID: any }, index: any) =>
              state.clients.findIndex(
                (c: { ClientID: any }) => c.ClientID === client.ClientID
              ) === index
          );
          dispatch({ type: "SET_CLIENTS", payload: uniqueClients });
          dispatch({
            type: "SET_VALIDATION_ERRORS",
            payload: validateData(uniqueClients, "clients", state),
          });
          setResponse(
            `Fixed duplicate ClientID error at row ${firstError.row}.`
          );
        }
      } else {
        setResponse("No errors to fix. Your data looks clean!");
      }
    }

    // AI-based Validation
    else if (lowercaseMessage.includes("validate")) {
      const allErrors = [
        ...validateData(state.clients, "clients", state),
        ...validateData(state.workers, "workers", state),
        ...validateData(state.tasks, "tasks", state),
      ];
      dispatch({ type: "SET_VALIDATION_ERRORS", payload: allErrors });
      setResponse(`Validation complete. Found ${allErrors.length} errors.`);
    }

    // Default response for unrecognized commands
    else {
      setResponse(
        "I can help with: 'modify client X priority to Y', 'suggest rule for T1 and T2', 'fix error', or 'validate'. Try one!"
      );
    }

    setMessage("");
    setIsOpen(true); // Keep chat open after response
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white border border-gray-200 shadow-lg p-4 rounded-lg w-80">
          <div className="mb-3">
            <h4 className="font-medium text-gray-900 mb-1">AI Assistant</h4>
            <p className="text-xs text-gray-600">
              Try: "Modify client 0 priority to high", "Suggest rule for T1 and
              T2", "Fix error", or "Validate"
            </p>
            {response && (
              <div className="mt-2 p-2 bg-gray-100 rounded-md text-sm">
                {response.includes("error") ? (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" /> {response}
                  </div>
                ) : (
                  response
                )}
              </div>
            )}
          </div>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your request..."
            className="mb-3"
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="default"
            >
              Send
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

function MainContent() {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState("ingestion");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedType, setSelectedType] = useState<
    "clients" | "workers" | "tasks"
  >("clients");

  const handleUndo = () => dispatch({ type: "UNDO" });
  const handleRedo = () => dispatch({ type: "REDO" });

  const showHistoryButtons = ["data", "rules", "priorities"].includes(
    activeTab
  );

  const navigationItems = [
    {
      id: "ingestion",
      label: "Upload Data",
      icon: Upload,
    },
    {
      id: "data",
      label: "View & Edit",
      icon: Database,
    },
    {
      id: "rules",
      label: "Business Rules",
      icon: Gavel,
    },
    {
      id: "priorities",
      label: "Priorities",
      icon: Star,
    },
    {
      id: "export",
      label: "Export",
      icon: Download,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen ${
          isSidebarOpen ? "w-64" : "w-16"
        } bg-gray-900 flex flex-col py-6 transition-all duration-300 ease-in-out z-40`}
      >
        <div className="flex items-center gap-2 mb-8 px-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">DF</span>
          </div>
          {isSidebarOpen && (
            <span className="text-white font-semibold text-lg">DataForge</span>
          )}
        </div>

        <nav className="space-y-2 flex-1 px-2">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              className={`w-full flex items-center gap-3 ${
                activeTab === id
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              } ${
                isSidebarOpen ? "justify-start px-4" : "justify-center px-2"
              } h-12 transition-colors`}
              onClick={() => setActiveTab(id)}
            >
              <Icon className="h-5 w-5" />
              {isSidebarOpen && <span className="text-sm">{label}</span>}
            </Button>
          ))}
        </nav>

        <div className="px-2">
          <Button
            variant="ghost"
            className="w-full text-gray-300 hover:bg-gray-800 hover:text-white h-12 transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  DataForge
                </h1>
                <p className="text-gray-600">
                  Clean, validate, and optimize your data with AI assistance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-200 text-blue-700"
                >
                  AI-Powered
                </Badge>
                <Badge
                  variant="outline"
                  className="border-green-200 text-green-700"
                >
                  Smart Validation
                </Badge>
              </div>
            </div>

            {showHistoryButtons && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleUndo}
                  disabled={state.historyIndex < 0}
                  variant="outline"
                  size="sm"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button
                  onClick={handleRedo}
                  disabled={state.historyIndex >= state.history.length - 1}
                  variant="outline"
                  size="sm"
                >
                  <Redo2 className="h-4 w-4 mr-2" />
                  Redo
                </Button>
              </div>
            )}
          </header>

          {/* Tab content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsContent value="ingestion">
              <DataIngestion />
            </TabsContent>

            <TabsContent value="data">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <DataGrid type={selectedType} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rules">
              <RuleBuilder />
            </TabsContent>

            <TabsContent value="priorities">
              <PrioritizationPanel />
            </TabsContent>

            <TabsContent value="export">
              <ExportPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Tutorial />
      <AIChatAssistant />
    </div>
  );
}

export default function HomePage() {
  return (
    <DataProvider>
      <MainContent />
    </DataProvider>
  );
}
