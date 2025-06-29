"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { useData } from "@/contexts/data-context";

interface SearchResult {
  entity: "clients" | "workers" | "tasks";
  data: any;
  matchReason: string;
}

export default function NaturalLanguageSearch() {
  const { state } = useData();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const parseNaturalLanguageQuery = (query: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const lowercaseQuery = query.toLowerCase().trim();

    const conditions = {
      tasks: [
        {
          pattern: /duration\s*(?:of\s*)?more\s*than\s*(\d+)/,
          check: (task: any, match: RegExpMatchArray) => {
            const duration = parseInt(match[1]);
            return task.Duration > duration;
          },
        },
        {
          pattern: /phase\s*(\d+)/,
          check: (task: any, match: RegExpMatchArray) => {
            const phase = parseInt(match[1]);
            return normalizePhases(task.PreferredPhases).includes(phase);
          },
        },
      ],
      clients: [
        {
          pattern: /priority\s*(?:level\s*)?(\d+)/,
          check: (client: any, match: RegExpMatchArray) => {
            const priority = parseInt(match[1]);
            return client.PriorityLevel === priority;
          },
        },
      ],
      workers: [
        {
          pattern: /skill\s*([a-zA-Z\s]+)/,
          check: (worker: any, match: RegExpMatchArray) => {
            const skill = match[1].trim().toLowerCase();
            return worker.Skills.some((s: string) =>
              s.toLowerCase().includes(skill)
            );
          },
        },
      ],
    };

    const processEntity = (
      entity: "clients" | "workers" | "tasks",
      data: any[]
    ) => {
      data.forEach((item) => {
        const entityConditions = conditions[entity];
        let matchReason = "";
        for (const { pattern, check } of entityConditions) {
          const match = lowercaseQuery.match(pattern);
          if (match && check(item, match)) {
            matchReason += `${matchReason ? " and " : ""}${pattern.source
              .replace(/\s*\(\?:.*?\)\s*/g, " ")
              .trim()
              .replace(/\\\(\d+\)/g, match[1])} matched`;
          }
        }
        if (
          matchReason ||
          lowercaseQuery
            .split(" ")
            .some((word) => JSON.stringify(item).toLowerCase().includes(word))
        ) {
          results.push({
            entity,
            data: item,
            matchReason: matchReason || `Contains keywords from "${query}"`,
          });
        }
      });
    };

    processEntity("tasks", state.tasks);
    processEntity("clients", state.clients);
    processEntity("workers", state.workers);

    return results;
  };

  const handleSearch = () => {
    setIsSearching(true);
    const searchResults = parseNaturalLanguageQuery(query);
    setResults(searchResults);
    setIsSearching(false);
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

  const memoizedResults = useMemo(
    () => parseNaturalLanguageQuery(query),
    [query]
  );

  useEffect(() => {
    setResults(memoizedResults);
  }, [memoizedResults]);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">②</span>
          </div>
          <CardTitle className="text-lg text-gray-900">
            Natural Language
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-600">
          Search data using plain English (e.g., "Tasks with duration more than
          1 phase").
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Tasks with duration more than 1 phase"
            className="flex-1 border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-md p-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 text-sm"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
        {results.length > 0 && (
          <ScrollArea className="h-[200px] rounded-md border border-gray-200 p-4 bg-white">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={`${result.entity}-${index}`}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {result.entity.charAt(0).toUpperCase() +
                      result.entity.slice(1)}
                    :{" "}
                    {
                      result.data[
                        result.entity === "clients"
                          ? "ClientID"
                          : result.entity === "workers"
                          ? "WorkerID"
                          : "TaskID"
                      ]
                    }
                  </p>
                  <p className="text-xs text-gray-600">{result.matchReason}</p>
                  <div className="text-xs text-gray-600 mt-2 overflow-x-auto">
                    <pre className="inline whitespace-pre-wrap break-words">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {results.length === 0 && query.trim() && !isSearching && (
          <p className="text-sm text-gray-600">
            No results found. Try a different query.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
