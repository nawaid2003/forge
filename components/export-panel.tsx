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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileText, CheckCircle, Package, Eye } from "lucide-react";
import { useData } from "@/contexts/data-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ExportPanel() {
  const { state } = useData();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [previewFile, setPreviewFile] = useState<
    "clients" | "workers" | "tasks" | "rules" | null
  >(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const handleExport = async () => {
    setIsConfirmOpen(true);
  };

  const confirmExport = async () => {
    setIsConfirmOpen(false);
    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    const steps = [
      { progress: 20, message: "Validating data integrity..." },
      { progress: 40, message: "Cleaning and formatting data..." },
      { progress: 60, message: "Generating rules configuration..." },
      { progress: 80, message: "Creating export package..." },
      { progress: 100, message: "Export complete!" },
    ];

    try {
      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setExportProgress(step.progress);
      }

      await generateExportFiles();
      setExportComplete(true);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateExportFiles = async () => {
    const exportDate = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }); // 06:43 PM IST, Sunday, June 29, 2025

    if (state.tasks.length > 0) {
      const tasksCSV = generateCSV(state.tasks, "tasks");
      downloadFile(tasksCSV, "tasks_cleaned.csv", "text/csv");
    }
    if (state.workers.length > 0) {
      const workersCSV = generateCSV(state.workers, "workers");
      downloadFile(workersCSV, "workers_cleaned.csv", "text/csv");
    }
    if (state.clients.length > 0) {
      const clientsCSV = generateCSV(state.clients, "clients");
      downloadFile(clientsCSV, "clients_cleaned.csv", "text/csv");
    }

    const rulesConfig = {
      rules: state.rules.filter((rule: { active: any }) => rule.active),
      priorities: state.priorities,
      metadata: {
        exportDate,
        totalClients: state.clients.length,
        totalWorkers: state.workers.length,
        totalTasks: state.tasks.length,
        validationErrors: state.validationErrors.length,
      },
    };

    downloadFile(
      JSON.stringify(rulesConfig, null, 2),
      "rules_config.json",
      "application/json"
    );
  };

  const generateCSV = (data: any[], type: string) => {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (Array.isArray(value)) {
              return `"${value.join(", ")}"`;
            }
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasData =
    state.clients.length > 0 ||
    state.workers.length > 0 ||
    state.tasks.length > 0;
  const hasErrors = state.validationErrors.some(
    (e: { severity: string }) => e.severity === "error"
  );

  const renderPreview = () => {
    if (!previewFile || !isPreviewOpen) return null;

    let data: any[] = [];
    let headers: string[] = [];
    if (previewFile === "clients") {
      data = state.clients.slice(0, itemsPerPage * currentPage);
      headers = state.clients[0] ? Object.keys(state.clients[0]) : [];
    } else if (previewFile === "workers") {
      data = state.workers.slice(0, itemsPerPage * currentPage);
      headers = state.workers[0] ? Object.keys(state.workers[0]) : [];
    } else if (previewFile === "tasks") {
      data = state.tasks.slice(0, itemsPerPage * currentPage);
      headers = state.tasks[0] ? Object.keys(state.tasks[0]) : [];
    } else if (previewFile === "rules") {
      data = state.rules
        .filter((r: { active: any }) => r.active)
        .slice(0, itemsPerPage * currentPage);
      headers = ["id", "name", "type", "description", "parameters"];
    }

    const paginatedData = data.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    return (
      <TooltipProvider>
        <ScrollArea className="h-[350px] rounded-lg border border-gray-200 p-4 bg-gray-50 shadow-sm">
          <div className="space-y-4">
            {paginatedData.map((row, index) => (
              <Card
                key={index}
                className="border-l-4 border-blue-500 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  {headers.map((header) => (
                    <div key={header} className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="font-medium text-blue-700">
                            {header}:
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{`Details for ${header}`}</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-gray-600">
                        {typeof row[header] === "object"
                          ? JSON.stringify(row[header])
                          : String(row[header])}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="text-blue-500 hover:bg-blue-50"
              >
                Previous
              </Button>
              <span className="text-sm text-blue-600">
                Page {currentPage} of {Math.ceil(data.length / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(data.length / itemsPerPage))
                  )
                }
                disabled={currentPage === Math.ceil(data.length / itemsPerPage)}
                className="text-blue-500 hover:bg-blue-50"
              >
                Next
              </Button>
            </div>
          </div>
        </ScrollArea>
      </TooltipProvider>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          Export Your Data
        </h2>
        <p className="text-gray-600">
          Export your cleaned data and rules configuration for downstream
          processing.
        </p>
      </div>

      <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                1
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900">
                  Export Data Package
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Prepare and download your processed data
                </CardDescription>
              </div>
            </div>
            <Package className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-2xl font-bold text-blue-600">
                {state.tasks.length}
              </div>
              <div className="text-sm text-gray-600">Tasks</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-2xl font-bold text-blue-600">
                {state.workers.length}
              </div>
              <div className="text-sm text-gray-600">Workers</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-2xl font-bold text-blue-600">
                {state.clients.length}
              </div>
              <div className="text-sm text-gray-600">Clients</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Data Quality Status</h4>
              <p className="text-sm text-gray-600">
                {hasErrors
                  ? "Some validation errors need attention"
                  : "All validations passed"}
              </p>
            </div>
            <Badge
              variant={hasErrors ? "destructive" : "default"}
              className={hasErrors ? "bg-red-500" : "bg-blue-500"}
            >
              {hasErrors
                ? `${
                    state.validationErrors.filter(
                      (e: { severity: string }) => e.severity === "error"
                    ).length
                  } Errors`
                : "Clean"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Business Rules</h4>
              <p className="text-sm text-gray-600">
                {state.rules.filter((r: { active: any }) => r.active).length}{" "}
                active rules configured
              </p>
            </div>
            <Badge variant="secondary" className="bg-gray-200 text-gray-700">
              {state.rules.length} Total
            </Badge>
          </div>

          {isExporting && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">
                      Exporting...
                    </span>
                    <span className="text-sm text-blue-600">
                      {exportProgress}%
                    </span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {exportComplete && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertDescription className="text-green-700">
                Export completed successfully! Files have been downloaded to
                your device.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleExport}
            disabled={!hasData || isExporting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm"
          >
            {isExporting ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-pulse" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data Package
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                2
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900">
                  Export Contents
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Review and download individual files
                </CardDescription>
              </div>
            </div>
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-600">
                    tasks_cleaned.csv
                  </div>
                  <div className="text-sm text-gray-600">
                    Validated task data
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreviewFile("tasks");
                  setIsPreviewOpen(true);
                  setCurrentPage(1);
                }}
                className="text-blue-500 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-600">
                    workers_cleaned.csv
                  </div>
                  <div className="text-sm text-gray-600">
                    Validated worker data
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreviewFile("workers");
                  setIsPreviewOpen(true);
                  setCurrentPage(1);
                }}
                className="text-blue-500 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-600">
                    clients_cleaned.csv
                  </div>
                  <div className="text-sm text-gray-600">
                    Validated client data
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreviewFile("clients");
                  setIsPreviewOpen(true);
                  setCurrentPage(1);
                }}
                className="text-blue-500 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-600">
                    rules_config.json
                  </div>
                  <div className="text-sm text-gray-600">
                    Business rules and priorities
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreviewFile("rules");
                  setIsPreviewOpen(true);
                  setCurrentPage(1);
                }}
                className="text-blue-500 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {(previewFile || isPreviewOpen) && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-600">
                  Preview: {previewFile || "Selected File"}
                </h4>
                <Button
                  variant="ghost"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="text-blue-500 hover:bg-blue-50"
                >
                  {isPreviewOpen ? "Hide" : "Show"} Preview
                </Button>
              </div>
              {renderPreview()}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="bg-gray-50 border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Confirm Export</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to export the data package? This will
              download CSV files for clients, workers, tasks, and a JSON rules
              configuration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmExport}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
