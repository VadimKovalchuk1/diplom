# Диаграммы структуры системы

В этой папке лежит **код диаграмм**, который можно преобразовать в графические изображения для презентации или текста магистерской диссертации.

## 1. PlantUML

Файл:

```text
docs/diagrams/system-structure.puml
```

Преобразовать в PNG:

```bash
plantuml -tpng docs/diagrams/system-structure.puml
```

Преобразовать в SVG:

```bash
plantuml -tsvg docs/diagrams/system-structure.puml
```

Также можно открыть сайт PlantUML Online Server и вставить содержимое файла туда.

## 2. Mermaid

Файл:

```text
docs/diagrams/system-structure.mmd
```

Варианты использования:

1. Вставить код в [Mermaid Live Editor](https://mermaid.live/).
2. Вставить блок `flowchart` в Markdown-документ.
3. Сгенерировать SVG через Mermaid CLI:

```bash
npx @mermaid-js/mermaid-cli -i docs/diagrams/system-structure.mmd -o system-structure.svg
```

## Что показывает диаграмма

Диаграмма описывает структуру разработанной системы:

- пользователей и их роли;
- frontend на Next.js;
- backend на NestJS;
- PostgreSQL;
- IPFS/off-chain encrypted storage;
- ZK prover runtime;
- permissioned Ethereum-compatible blockchain;
- smart contracts `NotaryAccessControl`, `DocumentRegistry`, `AuditContract`, `ZKVerifier`;
- основные бизнес-потоки: регистрация документа и публичная проверка подлинности.
