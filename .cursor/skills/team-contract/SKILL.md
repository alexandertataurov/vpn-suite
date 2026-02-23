---
name: team-contract
description: Общие правила взаимодействия субагентов: границы, handoff notes, формат инкрементов, definition of done. Используй в начале любой мульти-агентной задачи.
---

# Team Contract

## Global rules
- Один owner на изменение. Остальные — только комментарии и handoff notes.
- Любое пересечение зон ответственности = TODO, не реализация.
- Инкременты маленькие: каждый должен быть deployable + тестируемый.
- Каждому инкременту: manual test checklist + rollback note.
- Done = работает + наблюдается (logs/metrics) + проверяется (tests/smoke).
