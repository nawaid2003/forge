"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Plus, Download, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/contexts/data-context";
import { saveAs } from "file-saver";

interface RuleState {
  name: string;
  tasks?: string[];
  group?: string;
  minCommonSlots?: string;
  maxSlotsPerPhase?: string;
  taskId?: string;
  phases?: number[];
  regex?: string;
  template?: string;
  params?: string;
  rules?: string[];
  priority?: string[];
}

interface Rule {
  id: string;
  active: boolean;
  type: string;
  name: string;
  description: string;
  parameters: { [key: string]: any };
}

export default function RuleBuilder() {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState("coRun");
  const [ruleData, setRuleData] = useState<RuleState>({
    name: "",
    tasks: [],
    group: "",
    minCommonSlots: "",
    maxSlotsPerPhase: "",
    taskId: "",
    phases: [],
    regex: "",
    template: "",
    params: "",
    rules: [],
    priority: [],
  });
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [nlRule, setNlRule] = useState("");
  const [ruleErrors, setRuleErrors] = useState<string[]>([]);

  // Define groups based on state
  const groups = [
    ...new Set([
      ...state.clients.map((c: any) => c.GroupTag || ""),
      ...state.workers.map((w: any) => w.WorkerGroup || ""),
    ]),
  ].filter(Boolean);

  const taskIds = state.tasks.map((t: any) => t.TaskID);

  const addRule = () => {
    let ruleDataToAdd: Rule = {
      id: Date.now().toString(),
      active: true,
      type: activeTab,
      name: ruleData.name || `${activeTab} Rule`,
      description: "",
      parameters: {},
    };

    switch (activeTab) {
      case "coRun":
        if (!ruleData.tasks || ruleData.tasks.length < 2) {
          setRuleErrors(["At least 2 tasks are required for Co-run rule"]);
          return;
        }
        const invalidTasks = ruleData.tasks.filter((t) => !taskIds.includes(t));
        if (invalidTasks.length > 0) {
          setRuleErrors([`Invalid TaskIDs: ${invalidTasks.join(", ")}`]);
          return;
        }
        ruleDataToAdd = {
          ...ruleDataToAdd,
          description: "Tasks must run together",
          parameters: { tasks: ruleData.tasks },
        };
        break;

      case "slotRestriction":
        if (!ruleData.group || !ruleData.minCommonSlots) {
          setRuleErrors(["Group and Min Common Slots are required"]);
          return;
        }
        if (!groups.includes(ruleData.group)) {
          setRuleErrors([`Invalid group: ${ruleData.group}`]);
          return;
        }
        ruleDataToAdd = {
          ...ruleDataToAdd,
          description: `Min ${ruleData.minCommonSlots} slots for ${ruleData.group}`,
          parameters: {
            group: ruleData.group,
            minCommonSlots: parseInt(ruleData.minCommonSlots),
          },
        };
        break;

      case "loadLimit":
        if (!ruleData.group || !ruleData.maxSlotsPerPhase) {
          setRuleErrors(["Group and Max Slots Per Phase are required"]);
          return;
        }
        if (!groups.includes(ruleData.group)) {
          setRuleErrors([`Invalid group: ${ruleData.group}`]);
          return;
        }
        ruleDataToAdd = {
          ...ruleDataToAdd,
          description: `Max ${ruleData.maxSlotsPerPhase} slots for ${ruleData.group}`,
          parameters: {
            group: ruleData.group,
            maxSlotsPerPhase: parseInt(ruleData.maxSlotsPerPhase),
          },
        };
        break;

      case "phaseWindow":
        if (!ruleData.taskId || !ruleData.phases?.length) {
          setRuleErrors(["Task ID and Phases are required"]);
          return;
        }
        if (!taskIds.includes(ruleData.taskId)) {
          setRuleErrors([`Invalid TaskID: ${ruleData.taskId}`]);
          return;
        }
        ruleDataToAdd = {
          ...ruleDataToAdd,
          description: `Task ${
            ruleData.taskId
          } in phases ${ruleData.phases.join(",")}`,
          parameters: { taskId: ruleData.taskId, phases: ruleData.phases },
        };
        break;

      case "patternMatch":
        if (!ruleData.regex || !ruleData.template) {
          setRuleErrors(["Regex and Template are required"]);
          return;
        }
        ruleDataToAdd = {
          ...ruleDataToAdd,
          description: `Match ${ruleData.regex} with ${ruleData.template}`,
          parameters: {
            regex: ruleData.regex,
            template: ruleData.template,
            params: ruleData.params,
          },
        };
        break;

      case "precedenceOverride":
        if (!ruleData.rules?.length || !ruleData.priority?.length) {
          setRuleErrors(["Rules and Priority Order are required"]);
          return;
        }
        ruleDataToAdd = {
          ...ruleDataToAdd,
          description: "Override precedence",
          parameters: { rules: ruleData.rules, priority: ruleData.priority },
        };
        break;

      default:
        setRuleErrors(["Invalid rule type"]);
        return;
    }

    dispatch({ type: "ADD_RULE", payload: ruleDataToAdd });
    setRuleData({
      name: "",
      tasks: [],
      group: "",
      minCommonSlots: "",
      maxSlotsPerPhase: "",
      taskId: "",
      phases: [],
      regex: "",
      template: "",
      params: "",
      rules: [],
      priority: [],
    });
    setRuleErrors([]);
  };

  const generateRulesConfig = () => {
    const config = {
      rules: state.rules,
      priorities: state.priorities,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    saveAs(blob, "rules.json");
  };

  const parseNaturalLanguage = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("tasks run together")) {
      const taskMatch = lowerText.match(/tasks\s*([\w,-]+)/i);
      if (taskMatch) {
        const tasks = taskMatch[1].split(",").map((t) => t.trim());
        const validTasks = taskIds.filter((id: string) =>
          tasks.includes(id.toLowerCase())
        );
        if (validTasks.length > 1) {
          setRuleData((prev) => ({
            ...prev,
            name: "Co-run from NL",
            tasks: validTasks,
          }));
          setActiveTab("coRun");
        } else {
          setRuleErrors(["No valid TaskIDs found in data"]);
        }
      }
    } else if (lowerText.includes("limit slots")) {
      const groupMatch = lowerText.match(/for\s*(\w+)/i);
      const slotsMatch = lowerText.match(/to\s*(\d+)/i);
      if (groupMatch && slotsMatch && groups.includes(groupMatch[1])) {
        setRuleData((prev) => ({
          ...prev,
          name: "Load-limit from NL",
          group: groupMatch[1],
          maxSlotsPerPhase: slotsMatch[1],
        }));
        setActiveTab("loadLimit");
      } else {
        setRuleErrors(["Invalid group or slot limit format"]);
      }
    } else if (lowerText.includes("task in phases")) {
      const taskMatch = lowerText.match(/task\s*(\w+)/i);
      const phaseMatch = lowerText.match(/phases\s*([\d,-]+)/i);
      if (taskMatch && phaseMatch && taskIds.includes(taskMatch[1])) {
        const phases = phaseMatch[1]
          .split(",")
          .map((p) => parseInt(p.trim()))
          .filter((n) => !isNaN(n));
        setRuleData((prev) => ({
          ...prev,
          name: "Phase-window from NL",
          taskId: taskMatch[1],
          phases,
        }));
        setActiveTab("phaseWindow");
      } else {
        setRuleErrors(["Invalid TaskID or phase format"]);
      }
    }
    setNlRule("");
  };

  useEffect(() => {
    const taskFreq: { [key: string]: number } = {};
    state.tasks.forEach((task: any) => {
      const skills = task.RequiredSkills?.join(",") || "";
      taskFreq[skills] = (taskFreq[skills] || 0) + 1;
    });
    const topPair = Object.entries(taskFreq).sort(([, a], [, b]) => b - a)[0];
    if (topPair && topPair[1] > 1) {
      setAiSuggestion(
        `Tasks with skills ${topPair[0]} often run together. Add a Co-run rule?`
      );
    } else if (
      state.workers.some((w: any) => parseInt(w.MaxLoadPerPhase || "0") > 5)
    ) {
      setAiSuggestion(`Some workers are overloaded. Set a Load-limit rule?`);
    } else if (state.tasks.some((t: any) => !t.PreferredPhases?.length)) {
      setAiSuggestion(
        `Some tasks lack phase restrictions. Add a Phase-window rule?`
      );
    }
  }, [state.tasks, state.workers]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">
            Scheduling Rules
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Define rules to optimize task scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Natural Language Input */}
            <div className="space-y-2">
              <Label className="text-gray-700">Natural Language Rule</Label>
              <div className="flex gap-2">
                <Input
                  value={nlRule}
                  onChange={(e) => setNlRule(e.target.value)}
                  placeholder="e.g., 'Tasks T1,T2 run together' or 'Limit slots to 5 for Sales' or 'Task T1 in phases 1,2'"
                  className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                />
                <Button
                  onClick={() => parseNaturalLanguage(nlRule)}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm"
                >
                  Add Rule
                </Button>
              </div>
            </div>

            {/* Rule Errors */}
            {ruleErrors.length > 0 && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-2 rounded-md">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                {ruleErrors.map((error, idx) => (
                  <span key={idx} className="text-sm text-red-700">
                    {error}
                  </span>
                ))}
              </div>
            )}

            {/* Rule Type Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-6">
                {[
                  "coRun",
                  "slotRestriction",
                  "loadLimit",
                  "phaseWindow",
                  "patternMatch",
                  "precedenceOverride",
                ].map((type) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    {type.charAt(0).toUpperCase() +
                      type
                        .slice(1)
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Co-run Rule */}
              <TabsContent value="coRun">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700">Rule Name</Label>
                    <Input
                      value={ruleData.name}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, name: e.target.value })
                      }
                      placeholder="e.g., Co-run Rule"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Tasks</Label>
                    <Select
                      onValueChange={(value) => {
                        if (!ruleData.tasks?.includes(value)) {
                          setRuleData({
                            ...ruleData,
                            tasks: [...(ruleData.tasks || []), value],
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full">
                        <SelectValue placeholder="Select Task" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.tasks.map((task: any) => (
                          <SelectItem
                            key={task.TaskID}
                            value={task.TaskID}
                            disabled={ruleData.tasks?.includes(task.TaskID)}
                          >
                            {`${task.TaskName} (${task.TaskID})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(ruleData.tasks || []).map((taskId: string) => (
                        <div
                          key={taskId}
                          className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                        >
                          {taskId}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setRuleData({
                                ...ruleData,
                                tasks: ruleData.tasks?.filter(
                                  (t) => t !== taskId
                                ),
                              })
                            }
                            className="h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Slot Restriction Rule */}
              <TabsContent value="slotRestriction">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700">Rule Name</Label>
                    <Input
                      value={ruleData.name}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, name: e.target.value })
                      }
                      placeholder="e.g., Slot Restriction Rule"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Group</Label>
                    <Select
                      value={ruleData.group || ""}
                      onValueChange={(value) =>
                        setRuleData({ ...ruleData, group: value })
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full">
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group: string) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700">Min Common Slots</Label>
                    <Input
                      type="number"
                      value={ruleData.minCommonSlots || ""}
                      onChange={(e) =>
                        setRuleData({
                          ...ruleData,
                          minCommonSlots: e.target.value,
                        })
                      }
                      placeholder="e.g., 2"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Load Limit Rule */}
              <TabsContent value="loadLimit">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700">Rule Name</Label>
                    <Input
                      value={ruleData.name}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, name: e.target.value })
                      }
                      placeholder="e.g., Load Limit Rule"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Group</Label>
                    <Select
                      value={ruleData.group || ""}
                      onValueChange={(value) =>
                        setRuleData({ ...ruleData, group: value })
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full">
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group: string) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700">Max Slots Per Phase</Label>
                    <Input
                      type="number"
                      value={ruleData.maxSlotsPerPhase || ""}
                      onChange={(e) =>
                        setRuleData({
                          ...ruleData,
                          maxSlotsPerPhase: e.target.value,
                        })
                      }
                      placeholder="e.g., 5"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Phase Window Rule */}
              <TabsContent value="phaseWindow">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700">Rule Name</Label>
                    <Input
                      value={ruleData.name}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, name: e.target.value })
                      }
                      placeholder="e.g., Phase Window Rule"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Task ID</Label>
                    <Select
                      value={ruleData.taskId || ""}
                      onValueChange={(value) =>
                        setRuleData({ ...ruleData, taskId: value })
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full">
                        <SelectValue placeholder="Select Task" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.tasks.map((task: any) => (
                          <SelectItem key={task.TaskID} value={task.TaskID}>
                            {`${task.TaskName} (${task.TaskID})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700">Phases</Label>
                    <Input
                      value={(ruleData.phases || []).join(",")}
                      onChange={(e) =>
                        setRuleData({
                          ...ruleData,
                          phases: e.target.value
                            .split(",")
                            .map((v: string) => parseInt(v.trim()))
                            .filter(
                              (n: number) => !isNaN(n) && n >= 1 && n <= 6
                            ),
                        })
                      }
                      placeholder="e.g., 1,2,3"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Pattern Match Rule */}
              <TabsContent value="patternMatch">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700">Rule Name</Label>
                    <Input
                      value={ruleData.name}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, name: e.target.value })
                      }
                      placeholder="e.g., Pattern Match Rule"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Regex</Label>
                    <Input
                      value={ruleData.regex || ""}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, regex: e.target.value })
                      }
                      placeholder="e.g., T\d+"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Template</Label>
                    <Input
                      value={ruleData.template || ""}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, template: e.target.value })
                      }
                      placeholder="e.g., Task Match"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Parameters</Label>
                    <Input
                      value={ruleData.params || ""}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, params: e.target.value })
                      }
                      placeholder="e.g., field1,field2"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Precedence Override Rule */}
              <TabsContent value="precedenceOverride">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700">Rule Name</Label>
                    <Input
                      value={ruleData.name}
                      onChange={(e) =>
                        setRuleData({ ...ruleData, name: e.target.value })
                      }
                      placeholder="e.g., Precedence Override Rule"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Rules</Label>
                    <Input
                      value={(ruleData.rules || []).join(",")}
                      onChange={(e) =>
                        setRuleData({
                          ...ruleData,
                          rules: e.target.value
                            .split(",")
                            .map((v: string) => v.trim()),
                        })
                      }
                      placeholder="e.g., rule1,rule2"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">Priority Order</Label>
                    <Input
                      value={(ruleData.priority || []).join(",")}
                      onChange={(e) =>
                        setRuleData({
                          ...ruleData,
                          priority: e.target.value
                            .split(",")
                            .map((v: string) => v.trim()),
                        })
                      }
                      placeholder="e.g., 1,2"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md p-2 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Add Rule Button */}
            <Button
              onClick={addRule}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm"
              disabled={Object.values(ruleData).some(
                (v) =>
                  (!v && v !== 0) ||
                  (Array.isArray(v) && v.length === 0) ||
                  (typeof v === "string" && !v.trim())
              )}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Rule
            </Button>

            {/* AI Suggestion */}
            {aiSuggestion && (
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 flex items-center gap-2 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-yellow-700">{aiSuggestion}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (aiSuggestion.includes("Co-run")) {
                      setRuleData({
                        ...ruleData,
                        name: "AI Co-run",
                        tasks: state.tasks
                          .slice(0, 2)
                          .map((t: any) => t.TaskID),
                      });
                      setActiveTab("coRun");
                    } else if (aiSuggestion.includes("Load-limit")) {
                      setRuleData({
                        ...ruleData,
                        name: "AI Load-limit",
                        group: "Overloaded",
                        maxSlotsPerPhase: "5",
                      });
                      setActiveTab("loadLimit");
                    } else if (aiSuggestion.includes("Phase-window")) {
                      const taskWithoutPhases = state.tasks.find(
                        (t: any) => !t.PreferredPhases?.length
                      );
                      if (taskWithoutPhases) {
                        setRuleData({
                          ...ruleData,
                          name: "AI Phase-window",
                          taskId: taskWithoutPhases.TaskID,
                          phases: [1, 2],
                        });
                        setActiveTab("phaseWindow");
                      }
                    }
                    setAiSuggestion(null);
                  }}
                  className="border-yellow-500 text-yellow-500 hover:bg-yellow-100 ml-auto"
                >
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiSuggestion(null)}
                  className="text-yellow-500 hover:text-yellow-700"
                >
                  Ignore
                </Button>
              </div>
            )}

            {/* Active Rules */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Active Rules
              </h3>
              {state.rules.length === 0 ? (
                <p className="text-sm text-gray-600">No rules created yet</p>
              ) : (
                <div className="space-y-2">
                  {state.rules.map((rule: any, index: number) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          {rule.name}
                        </span>
                        <p className="text-sm text-gray-600">
                          {rule.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          dispatch({
                            type: "UPDATE_RULE",
                            payload: {
                              index,
                              rule: { ...rule, active: !rule.active },
                            },
                          })
                        }
                        className={
                          rule.active ? "text-blue-500" : "text-gray-500"
                        }
                      >
                        {rule.active ? "Active" : "Inactive"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={generateRulesConfig}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm"
              >
                <Download className="h-4 w-4 mr-2" /> Generate Rules Config
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
