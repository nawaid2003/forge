"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  X,
  ArrowRight,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  tip: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
}

export default function Tutorial() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Welcome to DataForge Adventure!",
      description:
        "Get ready to master DataForge, your AI-powered data wizard! Let’s embark on a journey to clean, validate, and optimize your data. Click 'Next' to dive in!",
      tip: "Pro Tip: The AI Assistant can help with fixes—try it later!",
      target: "none",
      position: "bottom",
    },
    {
      id: "sidebar",
      title: "Explore the Magic Sidebar",
      description:
        "Hover over the sidebar to reveal a treasure trove of sections: Upload, View & Edit, Business Rules, Priorities, and Export. Click to switch!",
      tip: "Tip: Toggle it with the arrow button for more screen space.",
      target: "sidebar",
      position: "right",
    },
    {
      id: "upload",
      title: "Upload Your Data Treasure",
      description:
        "Head to Upload and drop your CSV or XLSX files for clients, workers, and tasks. Watch the AI work its magic with real-time validation!",
      tip: "Tip: Upload in order—tasks, workers, then clients—for best results.",
      target: "ingestion",
      position: "bottom",
    },
    {
      id: "grid",
      title: "Edit Like a Pro",
      description:
        "Jump to View & Edit to tweak your data. Click cells to edit, and let AI spotlight errors with handy fixes on the right!",
      tip: "Tip: Use the AI Assistant to remove duplicates with 'Fix duplicate ClientIDs'.",
      target: "data",
      position: "bottom",
    },
    {
      id: "rules",
      title: "Craft Smart Rules",
      description:
        "In Business Rules, create your own logic or let AI whip up rules from plain English—like 'T1 and T2 run together'!",
      tip: "Tip: Toggle rules on/off to test different scenarios.",
      target: "rules",
      position: "bottom",
    },
    {
      id: "priorities",
      title: "Tune Your Priorities",
      description:
        "Visit Priorities to slide and set weights for client priority, task fulfillment, and worker fairness. Optimize your workflow!",
      tip: "Tip: Balance sliders for the best outcome—experiment freely!",
      target: "priorities",
      position: "bottom",
    },
    {
      id: "export",
      title: "Export Your Masterpiece",
      description:
        "Head to Export to grab your validated CSVs and JSON rules. Preview files to ensure perfection before downloading!",
      tip: "Tip: Check the Data Quality Status before exporting.",
      target: "export",
      position: "bottom",
    },
  ];

  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
    if (isVisible && steps[currentStep].target !== "none") {
      const targetElement = document.querySelector(
        `[data-tutorial="${steps[currentStep].target}"]`
      );
      if (targetElement) {
        targetElement.classList.add("ring-2", "ring-blue-600", "animate-pulse");
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return () => {
        targetElement?.classList.remove(
          "ring-2",
          "ring-blue-600",
          "animate-pulse"
        );
      };
    }
    setIsMobile(window.innerWidth < 768);
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-3 shadow-md hover:bg-blue-700 hover:scale-105 transition-all"
        onClick={() => {
          setIsVisible(true);
          setCurrentStep(0);
        }}
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
    );
  }

  const { title, description, tip, position } = steps[currentStep];
  // const isMobile = window.innerWidth < 768;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-lg transform transition-all duration-300">
        <CardContent className="p-6 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
          <Progress value={progress} className="mb-4 h-2 bg-gray-200" />
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            {description}
          </p>
          <p className="text-sm text-blue-600 italic mb-4">{tip}</p>
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="text-blue-600 hover:bg-blue-50"
            >
              <ChevronLeft className="h-5 w-5 mr-2" /> Previous
            </Button>
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md hover:shadow-md transition-all"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 p-4 text-center text-sm text-gray-500">
          Having fun? Explore more with the AI Assistant in the bottom-right
          corner!
        </CardFooter>
      </Card>
    </div>
  );
}
