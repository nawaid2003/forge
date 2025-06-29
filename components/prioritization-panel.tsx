"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/contexts/data-context";
import dynamic from "next/dynamic";

interface Priority {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface DraggableItemProps {
  priority: Priority & { index: number };
  index: number;
  moveItem: (from: number, to: number) => void;
  setPriorities: React.Dispatch<React.SetStateAction<Priority[]>>;
}

const ItemType = "PRIORITY";

interface SketchProps {
  setup: (p: any, canvasParentRef: Element) => void;
  draw: (p: any) => void;
  className?: string;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  priority,
  index,
  moveItem,
  setPriorities,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemType,
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index]
  );
  const [, drop] = useDrop(
    () => ({
      accept: ItemType,
      hover: (draggedItem: { index: number }) => {
        if (draggedItem.index !== index) {
          moveItem(draggedItem.index, index);
          draggedItem.index = index;
        }
      },
    }),
    [index, moveItem]
  );
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2 cursor-move transition-colors ${
        isDragging ? "opacity-50" : "hover:bg-gray-100"
      }`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div>
        <Label className="font-medium text-gray-900">{priority.name}</Label>
        <p className="text-sm text-gray-600">{priority.description}</p>
      </div>
      <span className="text-sm font-medium text-gray-700">
        {Math.round(priority.weight * 100)}%
      </span>
    </div>
  );
};

const DynamicSketch = dynamic<SketchProps>(
  () => import("p5-sketch").then((mod) => mod.default),
  { ssr: false }
);

export default function PrioritizationPanel() {
  const { state, dispatch } = useData();
  const [priorities, setPriorities] = useState<Priority[]>(state.priorities);
  const [sliderWeights, setSliderWeights] = useState<{ [id: string]: number }>(
    {}
  );
  const [totalWeight, setTotalWeight] = useState(0);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const updated = [...priorities];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPriorities(updated);
  };

  const savePriorities = () => {
    if (totalWeight > 100) {
      alert("Total weight exceeds 100%. Please adjust sliders.");
      return;
    }
    const normalized =
      totalWeight > 0
        ? Object.fromEntries(
            Object.entries(sliderWeights).map(([id, weight]) => [
              id,
              weight / totalWeight,
            ])
          )
        : { [priorities[0]?.id || "1"]: 1 };
    const newPriorities = priorities.map((p) => ({
      ...p,
      weight: parseFloat(normalized[p.id].toFixed(2)),
    }));
    dispatch({ type: "SET_PRIORITIES", payload: newPriorities });
  };

  const presetProfiles = [
    {
      name: "Maximize Fulfillment",
      weights: { "1": 0.4, "2": 0.2, "3": 0.2, "4": 0.1, "5": 0.1 },
    },
    {
      name: "Fair Distribution",
      weights: { "1": 0.2, "2": 0.2, "3": 0.3, "4": 0.2, "5": 0.1 },
    },
    {
      name: "Minimize Workload",
      weights: { "1": 0.1, "2": 0.2, "3": 0.3, "4": 0.2, "5": 0.2 },
    },
  ];

  const applyPreset = (preset: {
    name: string;
    weights: Record<string, number>;
  }) => {
    if (
      confirm(
        `Apply "${preset.name}" preset? This will overwrite current weights.`
      )
    ) {
      const newWeights = { ...sliderWeights };
      priorities.forEach((p) => {
        newWeights[p.id] = preset.weights[p.id] || 0.2;
      });
      setSliderWeights(newWeights);
      savePriorities();
    }
  };

  useEffect(() => {
    setPriorities([...state.priorities]);
    setSliderWeights(
      Object.fromEntries(
        state.priorities.map((p: Priority) => [p.id, p.weight || 0.2])
      )
    );
  }, [state.priorities]);

  useEffect(() => {
    const total = Object.values(sliderWeights).reduce((sum, w) => sum + w, 0);
    setTotalWeight(Math.round(total * 100));
  }, [sliderWeights]);

  // Enhanced Gantt Chart Setup
  const setup = (p: any, canvasParentRef: Element) => {
    p.createCanvas(800, 400).parent(canvasParentRef);
    p.background(240, 245, 250, 220); // Light glassmorphism background
    p.textAlign(p.CENTER, p.TOP);
    p.noStroke();
  };

  const draw = (p: any) => {
    p.background(240, 245, 250, 220); // Animated glass effect
    const tasks = state.tasks.map((t: any) => t.TaskID);
    const rules = state.rules;
    const height = 40;
    let y = 60;

    // Title with glow effect
    p.textSize(20);
    p.fill(0, 0, 100, 180);
    p.textFont("Arial");
    p.text("Task Schedule (Gantt Chart)", p.width / 2, 20);

    // Enhanced Grid with subtle shadow
    p.fill(200, 210, 220, 50);
    for (let x = 50; x <= 750; x += 100) {
      p.rect(x, 50, 2, 350);
    }
    for (let yPos = 50; yPos <= 400; yPos += 50) {
      p.rect(50, yPos, 700, 2);
    }

    tasks.forEach((taskId: string, index: number) => {
      const taskRules = rules.filter(
        (r: any) => r.type === "coRun" && r.parameters.tasks.includes(taskId)
      );
      const baseColor =
        taskRules.length > 0 ? p.color(76, 175, 80) : p.color(33, 150, 243); // Green for coRun, Blue for others
      if (!baseColor) return;
      const gradient = p.drawingContext.createLinearGradient(50, y, 150, y);
      gradient.addColorStop(0, baseColor.toString());
      gradient.addColorStop(
        0.5,
        p
          .color(
            baseColor._array[0],
            baseColor._array[1],
            baseColor._array[2],
            150
          )
          .toString()
      );
      gradient.addColorStop(
        1,
        p
          .color(
            baseColor._array[0],
            baseColor._array[1],
            baseColor._array[2],
            80
          )
          .toString()
      );
      p.drawingContext.fillStyle = gradient;

      const x = 50;
      const w = 100 + Math.sin(p.frameCount * 0.05 + index) * 20; // Slight animation
      p.rect(x, y, w, height - 5, 10); // Rounded corners
      p.fill(255); // White text with shadow
      p.textSize(14);
      p.textFont("Arial");
      p.text(taskId, x + w / 2, y + 10);

      p.fill(50, 50, 70, 200); // Semi-transparent dark text
      p.textSize(12);
      p.text(
        `Rule: ${taskRules.length > 0 ? "Co-run" : "None"}`,
        x + w / 2,
        y + 25
      );

      // Glow effect
      p.fill(
        p
          .color(
            baseColor._array[0],
            baseColor._array[1],
            baseColor._array[2],
            30
          )
          .toString()
      );
      p.ellipse(x + w / 2, y + height / 2, w * 0.1, height * 0.1);

      y += height + 10;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900">
              Task Prioritization
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Rank criteria to guide the downstream allocator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ranking" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="ranking"
                  className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Ranking
                </TabsTrigger>
                <TabsTrigger
                  value="sliders"
                  className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Sliders
                </TabsTrigger>
                <TabsTrigger
                  value="presets"
                  className="text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  Presets
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ranking">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-gray-700 font-medium">
                    Drag to Rank Criteria
                  </Label>
                  <div className="mt-2 space-y-2">
                    {priorities.map((priority, index) => (
                      <DraggableItem
                        key={priority.id}
                        priority={{ ...priority, index }}
                        index={index}
                        moveItem={moveItem}
                        setPriorities={setPriorities}
                      />
                    ))}
                  </div>
                  <Button
                    onClick={savePriorities}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm"
                  >
                    Save Ranking
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="sliders">
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <Label className="text-gray-700 font-medium">
                    Adjust Weights
                  </Label>
                  <div className="space-y-6">
                    {priorities.map((priority) => (
                      <div key={priority.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-gray-900">
                            {priority.name}
                          </Label>
                          <span className="text-sm text-gray-700">
                            {Math.round(sliderWeights[priority.id] * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[sliderWeights[priority.id] * 100]}
                          onValueChange={(value) =>
                            setSliderWeights((prev) => ({
                              ...prev,
                              [priority.id]: value[0] / 100,
                            }))
                          }
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    ))}
                    <div className="text-sm text-gray-600">
                      Total Weight: {totalWeight}%{" "}
                      {totalWeight > 100 && (
                        <span className="text-red-600">(Exceeds 100%)</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={savePriorities}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm"
                    disabled={totalWeight > 100}
                  >
                    Save Weights
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="presets">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {presetProfiles.map((preset, index) => (
                    <Card
                      key={index}
                      className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardHeader>
                        <CardTitle className="text-sm text-gray-900">
                          {preset.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(preset.weights).map(
                            ([id, weight]) => {
                              const priority = priorities.find(
                                (p: Priority) => p.id === id
                              );
                              return priority ? (
                                <div
                                  key={id}
                                  className="flex justify-between text-sm text-gray-600"
                                >
                                  <span>{priority.name}</span>
                                  <span>{Math.round(weight * 100)}%</span>
                                </div>
                              ) : null;
                            }
                          )}
                        </div>
                        <Button
                          onClick={() => applyPreset(preset)}
                          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm"
                        >
                          Apply Preset
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-6">
                  <Label className="text-gray-700 font-medium">
                    Task Schedule Visualization
                  </Label>
                  <DynamicSketch // Add type annotation for props
                    setup={setup}
                    draw={draw}
                    className="border border-gray-200 rounded-lg mt-2"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  );
}
