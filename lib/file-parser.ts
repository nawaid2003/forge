export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          reject(new Error("File must contain headers and at least one data row"));
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        console.log("Raw headers:", headers); // Debug log
        const mappedHeaders = mapHeaders(headers);
        console.log("Mapped headers:", mappedHeaders); // Debug log
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          console.log(`Line ${i} values:`, values); // Debug log
          if (values.length === headers.length) {
            const row: any = {};
            mappedHeaders.forEach((header, index) => {
              row[header] = processValue(values[index], header);
            });
            data.push(row);
          } else {
            console.warn(`Mismatch at line ${i}: Expected ${headers.length} values, got ${values.length}. Values:`, values);
          }
        }

        console.log("Parsed CSV data:", data); // Debug log
        resolve(data);
      } catch (error) {
        console.error("Parse error:", error);
        reject(error);
      }
    };

    reader.onerror = () => {
      console.error("File read error");
      reject(new Error("Failed to read file"));
    };
    reader.readAsText(file);
  });
}

export async function parseXLSX(file: File): Promise<any[]> {
  // For demo purposes, simulate XLSX parsing
  // In a real implementation, use a library like xlsx or exceljs
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Simulate header mapping
        const headers = ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"];
        const mappedHeaders = mapHeaders(headers);
        const data = [
          {
            ClientID: "C001",
            ClientName: "Demo Client",
            PriorityLevel: 3,
            RequestedTaskIDs: ["T001", "T002"],
            GroupTag: "Premium",
            AttributesJSON: '{"region": "North"}',
          },
        ].map((row) => {
          const mappedRow: any = {};
          mappedHeaders.forEach((header, index) => {
            mappedRow[header] = processValue(String((row as any)[headers[index]]), header);
          });
          return mappedRow;
        });
        console.log("Parsed XLSX data:", data); // Debug log
        resolve(data);
      } catch (error) {
        console.error("XLSX parse error:", error);
        reject(error);
      }
    }, 1000);
  });
}

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = "";
  let inQuotes = false;
  let escaping = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "\\" && !escaping) {
      escaping = true;
      continue;
    }
    if (char === '"' && !escaping) {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
    escaping = false;
  }

  result.push(current.trim());
  return result.filter((v) => v.length > 0); // Filter out empty values
}

function processValue(value: string, header: string): any {
  value = value.replace(/^"|"$/g, "").trim();

  if (value === "" || value === "undefined") {
    return null; // Handle empty or undefined values
  }

  if (header === "RequestedTaskIDs" || header === "Skills" || header === "RequiredSkills") {
    return value ? value.split(",").map((s) => s.trim()).filter((s) => s) : [];
  }

  if (header === "AvailableSlots" || header === "PreferredPhases") {
    if (value.startsWith("[") && value.endsWith("]")) {
      return value
        .slice(1, -1)
        .split(",")
        .map((s) => Number.parseInt(s.trim()))
        .filter((n) => !isNaN(n));
    } else if (value.includes("-")) {
      const [start, end] = value.split("-").map((s) => Number.parseInt(s.trim()));
      return !isNaN(start) && !isNaN(end) ? Array.from({ length: end - start + 1 }, (_, i) => start + i) : [];
    } else {
      return value
        ? value
            .split(",")
            .map((s) => Number.parseInt(s.trim()))
            .filter((n) => !isNaN(n))
        : [];
    }
  }

  if (
    header === "PriorityLevel" ||
    header === "MaxLoadPerPhase" ||
    header === "Duration" ||
    header === "MaxConcurrent" ||
    header === "QualificationLevel"
  ) {
    const num = Number.parseInt(value);
    return isNaN(num) ? 0 : num;
  }

  return value;
}

function mapHeaders(headers: string[]): string[] {
  const standardHeaders = {
    clients: ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"],
    workers: ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase", "WorkerGroup", "QualificationLevel"],
    tasks: ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases", "MaxConcurrent"],
  };

  const similarity = (s1: string, s2: string) => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return matches / longer.length;
  };

  return headers.map((header) => {
    const normalized = header.toLowerCase().replace(/\s/g, "");
    for (const [entity, stdHeaders] of Object.entries(standardHeaders)) {
      for (const stdHeader of stdHeaders) {
        const stdNormalized = stdHeader.toLowerCase().replace(/\s/g, "");
        const sim = similarity(normalized, stdNormalized);
        if (sim > 0.7 || normalized === stdNormalized) {
          return stdHeader;
        }
      }
    }
    console.warn(`Unmapped header: ${header}, using as-is`);
    return header;
  });
}