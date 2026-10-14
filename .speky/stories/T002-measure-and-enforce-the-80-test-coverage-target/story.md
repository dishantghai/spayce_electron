# Measure and enforce the 80% test coverage target

## Why
Spec 011 was completed claiming 80%+ coverage, but no vitest config sets coverage thresholds and no
coverage report is kept, so the claim can't be checked. Found while checking spec 011 during the
SPEKY v3 migration (coverage was not run).

## Capabilities
- A single command reports coverage per package, and the build fails below an agreed threshold.

## Non-goals
- Not writing new tests to reach the target in this story.

## Requirements

### R1: Coverage is measurable
The repo SHALL have a documented coverage command that reports line and branch coverage for core,
infrastructure, react-ui and desktop.

#### Scenario: run coverage
- GIVEN a clean checkout with dependencies installed
- WHEN the developer runs the coverage command
- THEN a per-package coverage summary is printed

### R2: Threshold enforced
Vitest coverage thresholds SHALL be set to the agreed target (80% per the project's testing config),
or to the measured baseline if that is lower, with the gap recorded.

#### Scenario: below threshold
- GIVEN coverage drops below the threshold
- WHEN the coverage command runs
- THEN it exits non-zero

## Assumptions
- Adding the coverage provider may need a new dev dependency; that needs the user's approval.
