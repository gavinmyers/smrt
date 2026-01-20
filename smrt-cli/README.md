# SMRT CLI

A minimalistic, zero-dependency Node.js CLI toolset for tracking project progress, managing conditions, and executing features according to the **Definition of Done**.

## Setup
Ensure you have a `.smrt-cli/.key` file in the project root with the following structure:
```json
{
  "id": "YOUR_KEY_ID",
  "projectId": "YOUR_PROJECT_ID",
  "token": "YOUR_SECRET_TOKEN",
  "apiUrl": "http://localhost:3001/"
}
```

## Core Workflow

### 1. Check Project Status
Before starting any work, verify the project's health and current state.
```bash
node smrt-cli/status.js
node smrt-cli/project-info.js
```

### 2. Verify Conditions
Check the project-wide conditions that must be met before implementing new features.
```bash
node smrt-cli/conditions-list.js
```

### 3. Manage Features
Track the features you are working on. Each feature has a status: `OPEN`, `LOCKED`, or `CLOSED`.

- **List Features**: `node smrt-cli/features-list.js`
- **Create Feature**: `node smrt-cli/feature-create.js "Feature Name" "Description"`
- **Complete Feature**: `node smrt-cli/feature-complete.js <featureId>`

### 4. Requirements & Definition of Done
Every feature contains specific requirements. Additionally, the project defines global **Project Requirements** that serve as a "Definition of Done" for all features.

- **List Requirements**: `node smrt-cli/requirements-list.js <featureId>`
- **Create Requirement**: `node smrt-cli/requirement-create.js <featureId> "Task Name"`
- **Complete Requirement**: `node smrt-cli/requirement-complete.js <featureId> <requirementId>`

### 5. Project Templates (Definition of Done)
Manage global requirements that apply to every feature (e.g., "Write Tests").
```bash
node smrt-cli/project-requirements-list.js
node smrt-cli/project-requirement-create.js "New Template Requirement"
```

## Best Practices for Agents
1. **Always List Features** first to identify your current task.
2. **Read Requirements** for the specific feature to understand the scope.
3. **Mark as Complete** immediately upon finishing a task to maintain an accurate project audit trail.
4. **Follow Templates**: Ensure "Definition of Done" items from the project templates are respected during implementation.
