# Software Engineering Documentation — Attendance Analyzer

| Document | Description |
|----------|-------------|
| [SRS.md](SRS.md) | Software Requirements Specification — functional & non-functional requirements, use cases, constraints |
| [UML_DIAGRAMS.md](UML_DIAGRAMS.md) | PlantUML diagrams — Use Case, Class, Sequence (login / analysis / refresh / reset), Component, Deployment, ER, Activity, State Machine |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture — ADRs, layer structure, data flow, security model, tech stack, design patterns |
| [API_REFERENCE.md](API_REFERENCE.md) | REST API reference — all endpoints with request/response schemas |

## How to Render PlantUML Diagrams

**Online:** Paste any diagram block from `UML_DIAGRAMS.md` at https://www.plantuml.com/plantuml

**VS Code:** Install the "PlantUML" extension by jebbs, then open a `.puml` file and press `Alt+D` to preview.

**CLI:**
```bash
# Install Java + PlantUML jar, then:
java -jar plantuml.jar docs/UML_DIAGRAMS.md
```
