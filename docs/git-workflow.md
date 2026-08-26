# Git & GitHub Workflow

## Branching Strategy
- `main`: The stable, protected branch. **NO DIRECT PUSHES ALLOWED.**
- `feature/*`: Branches for new features (e.g., `feature/compliance-engine`, `feature/dashboard`).
- `fix/*`: Branches for bug fixes.

## Developer Workflow
1. Pull latest `main`.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Develop and test locally.
4. Commit using standard conventions (see below).
5. Push to GitHub: `git push origin feature/your-feature-name`
6. Open a Pull Request (PR) against `main`.
7. Request review from the other developer.
8. Merge after approval.

## Commit Convention
Follow conventional commits:
- `feat:` A new feature (e.g., `feat: add tender requirement model`)
- `fix:` A bug fix
- `docs:` Documentation updates
- `refactor:` Code changes that neither fix a bug nor add a feature
- `test:` Adding or updating tests
- `chore:` Maintenance tasks (e.g., update dependencies)

*Avoid ambiguous commit messages like `update`, `changes`, or `working`.*
