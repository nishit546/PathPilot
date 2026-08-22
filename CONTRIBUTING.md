# Contributing to PathPilot 🧭

Thank you for your interest in contributing to **PathPilot**! We are thrilled to welcome contributions from travelers, designers, engineers, and open-source advocates around the world.

---

## 📑 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
- [Contribution Workflow](#contribution-workflow)
  - [1. Branching Strategy](#1-branching-strategy)
  - [2. Commit Guidelines](#2-commit-guidelines)
  - [3. Code Quality & Linting](#3-code-quality--linting)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues & Bugs](#reporting-issues--bugs)
- [Feature Suggestions](#feature-suggestions)

---

## Code of Conduct

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before interacting with this project. By participating, you are expected to uphold these community standards.

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (LTS recommended)
- **npm**: v9.0.0 or later
- **Git**: v2.30.0 or later
- **PostgreSQL Database**: PostgreSQL 14+ or a cloud [Supabase](https://supabase.com) instance

### Local Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/PathPilot.git
   cd PathPilot
   ```

2. **Setup the Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Populate your DATABASE_URL and SUPABASE variables in .env
   npm run dev
   ```

3. **Setup the Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## Contribution Workflow

### 1. Branching Strategy
Create a dedicated branch with a descriptive name:
```bash
# For new features
git checkout -b feat/smart-packing-enhancement

# For bug fixes
git checkout -b fix/itinerary-date-calculation

# For documentation
git checkout -b docs/api-contract-update
```

### 2. Commit Guidelines
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` Adds a new feature or functionality
- `fix:` Patches a bug or defect
- `refactor:` Code refactoring without changing functionality
- `style:` Code formatting, CSS tweaks, UI design adjustments
- `docs:` Documentation additions or updates
- `test:` Adding or updating unit/integration tests
- `chore:` Build scripts, dependency updates, tooling

**Examples**:
```bash
git commit -m "feat(trips): add multi-modal transport selector to itinerary stops"
git commit -m "fix(calendar): resolve timezone offset on departure date pills"
```

### 3. Code Quality & Linting
Before submitting a PR, make sure both frontend and backend pass all build checks:
```bash
# In frontend/
npm run build

# In backend/
node test-api.js
```

---

## Pull Request Process

1. **Ensure branch is up to date**:
   ```bash
   git checkout main
   git pull origin main
   git checkout <your-branch>
   git rebase main
   ```
2. **Push to your fork**:
   ```bash
   git push origin <your-branch>
   ```
3. **Open a Pull Request** against `main` on GitHub with:
   - Clear summary of the problem and the solution
   - Screenshots / Loom video for frontend changes
   - Confirmation that all automated tests pass

---

## Reporting Issues & Bugs

If you discover a bug, please open a GitHub Issue with:
- Clear steps to reproduce
- Expected vs actual behavior
- Browser version / OS environment
- Relevant console logs or API responses

---

## Feature Suggestions

Have ideas for new AI travel planning tools or community features? Feel free to open a feature discussion or issue under GitHub Discussions!

Happy Travelling & Happy Coding! ✈️🌍
