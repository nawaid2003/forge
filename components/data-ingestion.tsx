"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useData } from "@/contexts/data-context";
import { parseCSV, parseXLSX } from "@/lib/file-parser";
import { validateData } from "@/lib/validators";

export default function DataIngestion() {
  const { dispatch, state } = useData();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [files, setFiles] = useState<{
    clients?: File;
    workers?: File;
    tasks?: File;
  }>({});

  const handleFileUpload = useCallback(
    async (file: File, type: "clients" | "workers" | "tasks") => {
      setFiles((prev) => ({ ...prev, [type]: file }));

      try {
        setUploadStatus("uploading");
        setUploadProgress(0);

        const progressSteps = [
          { progress: 25, message: "Reading file..." },
          { progress: 50, message: "Processing data..." },
          { progress: 75, message: "Validating entries..." },
          { progress: 100, message: "Upload complete!" },
        ];

        for (const step of progressSteps) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setUploadProgress(step.progress);
          setUploadMessage(step.message);
        }

        let data;
        if (file.name.endsWith(".csv")) {
          data = await parseCSV(file);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          data = await parseXLSX(file);
        } else {
          throw new Error("Unsupported file format");
        }

        console.log(`Parsed ${type} data:`, data);

        if (!Array.isArray(data)) {
          console.error(`Parsed data for ${type} is not an array:`, data);
          throw new Error(`Invalid data format for ${type}: Expected an array`);
        }

        switch (type) {
          case "clients":
            dispatch({ type: "SET_CLIENTS", payload: data });
            break;
          case "workers":
            dispatch({ type: "SET_WORKERS", payload: data });
            break;
          case "tasks":
            dispatch({ type: "SET_TASKS", payload: data });
            if (state.clients.length > 0) {
              const clientErrors = validateData(state.clients, "clients", {
                ...state,
                tasks: data,
              });
              dispatch({
                type: "SET_VALIDATION_ERRORS",
                payload: clientErrors,
              });
            }
            break;
        }

        const errors = validateData(data, type, state);
        dispatch({ type: "SET_VALIDATION_ERRORS", payload: errors });

        setUploadStatus("success");
        setUploadMessage(
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } data uploaded successfully!`
        );
      } catch (error) {
        setUploadStatus("error");
        setUploadMessage(
          `Error uploading ${type}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.error(`Upload error for ${type}:`, error);
      }
    },
    [dispatch, state]
  );

  const FileUploadCard = ({
    type,
    title,
    description,
    icon: Icon,
    stepNumber,
  }: {
    type: "clients" | "workers" | "tasks";
    title: string;
    description: string;
    icon: any;
    stepNumber: number;
  }) => (
    <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
              {stepNumber}
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">{title}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {description}
              </CardDescription>
            </div>
          </div>
          <Icon className="h-6 w-6 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <Label
              htmlFor={`${type}-upload`}
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Click to upload
                </p>
                <p className="text-xs text-gray-500">CSV or XLSX files</p>
              </div>
              <Input
                id={`${type}-upload`}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, type);
                }}
              />
            </Label>
          </div>

          {files[type] && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                {files[type]?.name}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          Upload Your Data
        </h2>
        <p className="text-gray-600">
          Upload your files in the order below. Each file will be validated
          automatically.
        </p>
      </div>

      {/* Progress indicator */}
      {uploadStatus === "uploading" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  {uploadMessage}
                </span>
                <span className="text-sm text-blue-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status alerts */}
      {uploadStatus === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-700">
            {uploadMessage}
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-700">
            {uploadMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Upload cards in new order */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FileUploadCard
          type="tasks"
          title="Tasks Data"
          description="Upload task requirements and constraints"
          icon={FileSpreadsheet}
          stepNumber={1}
        />
        <FileUploadCard
          type="workers"
          title="Workers Data"
          description="Upload worker skills and availability"
          icon={FileSpreadsheet}
          stepNumber={2}
        />
        <FileUploadCard
          type="clients"
          title="Clients Data"
          description="Upload client details with priorities"
          icon={FileSpreadsheet}
          stepNumber={3}
        />
      </div>

      {/* Simple info panel */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">
            Smart Data Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Auto-mapping</h4>
              <p>Automatically matches columns even with different headers</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">
                Real-time validation
              </h4>
              <p>Instant checks with clear error messages and suggestions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
