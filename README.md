DataForge - AI-Powered Data Management Tool
Welcome to DataForge, an innovative web-based application designed to streamline data management, validation, and optimization using artificial intelligence. Built with React and integrated with a robust data context system, DataForge empowers users to upload, edit, validate, and export data with smart AI assistance.
Table of Contents

Overview
Features
Installation
Usage
Components
AI Capabilities
Contributing
License
Contact

Overview
DataForge is a modern solution for managing complex datasets, such as client, worker, and task information. It leverages AI to provide natural language processing, rule recommendations, error correction, and data validation, making it an ideal tool for data analysts, project managers, and developers working with structured data.

Tech Stack: React, TypeScript, Tailwind CSS, Lucide React
AI Integration: Custom AI assistant for dynamic data manipulation
Date Created: June 2025

Features

Data Ingestion: Upload and manage client, worker, and task datasets.
Interactive Data Grid: View, edit, and save data with real-time validation.
AI-Powered Assistance: Utilize natural language commands for data modification, rule suggestions, error fixing, and validation.
Business Rule Management: Define and manage rules for data relationships (e.g., tasks running together or not).
Prioritization Panel: Set and adjust priorities for data entities.
Export Functionality: Export cleaned and validated data.
Undo/Redo History: Track and revert changes with ease.
Responsive Design: Works seamlessly across desktop and mobile devices.

Installation
To set up DataForge locally, follow these steps:

Clone the Repository
git clone https://github.com/nawaid2003/forge.git
cd forge

Install DependenciesEnsure you have Node.js and npm installed. Then run:
npm install

Set Up Environment VariablesCreate a .env file in the root directory and add any necessary configuration (e.g., API keys if extended with external services):
NEXT_PUBLIC_API_URL=http://localhost:3000

Run the ApplicationStart the development server:
npm run dev

Open http://localhost:3000 in your browser.

Usage
Getting Started

Upload your data via the "Upload Data" tab.
Switch to the "View & Edit" tab to manage and edit your datasets.
Use the AI Assistant (bottom-right corner) to issue commands like:
"Modify client 0 priority to high"
"Suggest rule for T1 and T2"
"Fix error"
"Validate"

Key Interactions

Tabs: Navigate between data ingestion, viewing/editing, rules, priorities, and export.
Sidebar: Toggle to adjust the layout and access different sections.
Validation: Errors are highlighted in red with tooltips explaining issues.

Components

DataIngestion: Handles data upload and initial processing.
DataGrid: Displays and edits data with validation support.
RuleBuilder: Manages business rules for data relationships.
PrioritizationPanel: Adjusts priority levels for data entities.
ExportPanel: Exports processed data.
AIChatAssistant: Provides AI-driven assistance for data tasks.
ValidationSummary: Summarizes validation errors.

AI Capabilities
The built-in AI assistant enhances DataForge with:

Natural Language Data Modification: Update fields (e.g., change a client's priority) using simple commands.
AI Rule Recommendations: Suggest rules based on task relationships (e.g., tasks to run together).
AI-based Error Correction: Automatically fix common issues like duplicate entries.
AI-based Validation: Run comprehensive data validation and report errors.

Contributing
We welcome contributions to improve DataForge! To contribute:

Fork the repository.
Create a new branch (git checkout -b feature/your-feature).
Commit your changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a Pull Request with a detailed description of your changes.

Please ensure your code follows the project's TypeScript and React best practices.
License
This project is licensed under the MIT License. See the LICENSE file for details.
Contact

Author: Nawaid Sheikh
Email: nawaidwork@gmail.com
GitHub: https://github.com/nawaid2003
Created: June 29, 2025

Thank you for using DataForge! We’re excited to see how you leverage this tool for your data management needs.
