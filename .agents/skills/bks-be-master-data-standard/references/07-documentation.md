# Documentation Standards

Updating documentation is mandatory for all new master data resources.

---

## Business Logic Documentation

Update `docs/logic/user/master-data.md` (Vietnamese) to describe the data source, logic, and any special filtering/authentication applied. Add the new resource to the **AVAILABLE RESOURCES** table. **ALWAYS bump the document version (minor/major)** following the `bks-doc-logic-standard`.

Additionally:
- Ensure module index is synchronized (`docs/logic/user/index.md` and root `docs/logic/index.md` links remain valid).
- Every `BR-*` referenced in master-data logic docs MUST resolve in `docs/system/br-registry.md`.
- **BR Registry**: **MANDATORY**: If new Business Rules (`BR-*`) were introduced or existing ones updated, you MUST update `docs/system/br-registry.md` to reflect these changes.

---

## API Reference Documentation

Update `docs/api/modules/master-data.md` (Vietnamese). Every resource MUST be documented with its query format and response shape. Add the new resource to the **Available Resources** table.

### Standard Format for Resource Documentation

```markdown
#### 1.X [Resource Name]
- **Description**: [What data this resource provides]
- **Driver**: [Eloquent | Enum | Custom | etc.]
- **Input Example**: `GET /api/master-data?resources[[resource_name]]={}`
- **Response**:
```json
{
    "[resource_name]": [
        { "id": 1, "name": "Value 1" },
        { "id": 2, "name": "Value 2" }
    ]
}
```
```
