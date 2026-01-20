# AASEF Implementation Essentials - Auto-generated
# Focused rules for implementation phase
# Size: 2326 chars

# AASEF Implementation Essentials

**You are in IMPLEMENTATION MODE.** Focus on coding the current task.

## 🎯 Your Mission
Implement the spec/story in the task context file. Stay focused on the requirements.

## ⚠️ Critical Rules

### 1. Follow Tech & Architecture Decisions
Check `.aasef/context/tech_decisions.md` BEFORE choosing any package/framework.
If it exists, you MUST use ONLY the packages listed there. No alternatives.

**This file also contains "Important Architecture Decisions"** - patterns, conventions, 
and design decisions that ALL implementations MUST follow. Check this section before
implementing any significant logic.

### 2. Follow Design System
If implementing UI, check `.aasef/context/design_system.md`:
- Use EXACT color values (e.g., `Color(0xFF6D5AE6)`)
- Use design system spacing constants
- Use design system typography styles
- Match Hi-Fi designs PIXEL-PERFECT if they exist

### 3. Scope Enforcement
- **IN SCOPE**: Implement everything in spec's requirements and acceptance criteria
- **OUT OF SCOPE**: Do NOT implement items in "Out of Scope" section
- If asked for out-of-scope items, tell developer to create a new spec

### 4. Code Quality
- Follow existing code patterns in the codebase
- Maintain consistent naming conventions
- Add appropriate error handling
- Keep functions focused and testable

### 5. Testing & TDD
If this is a TDD workflow (`aasef implement --tdd`):
- **RED Phase**: Write failing tests first from acceptance criteria
- **GREEN Phase**: Implement minimum code to pass tests
- **REFACTOR Phase**: Clean up while keeping tests green
- Run tests frequently: `aasef test run --spec <id>`

Available testing commands:
- `aasef test gen <id>` - Generate tests for spec
- `aasef test run` - Run all tests
- `aasef test coverage` - Show coverage
- `aasef complete <id> --test` - Run tests before marking complete

### 6. File Organization
- **NEVER** create files in project root (except README.md)
- **NEVER** create `*_SPEC.md`, `IMPLEMENTATION_COMPLETE.md`, or analysis files
- Use `.aasef/temp/` for any temporary files

### 7. When Done
Tell the developer: "Implementation complete. Run `aasef complete <id>` to verify."
Do NOT create completion marker files.

---

**Now focus on the task context below. The spec/story details are your implementation guide.**
