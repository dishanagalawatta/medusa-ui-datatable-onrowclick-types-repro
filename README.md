# @medusajs/ui — DataTable `onRowClick` is typed as receiving `TData`, but the runtime passes a TanStack `Row<TData>`

Type-only reproduction. No UI is rendered; the TypeScript compiler output is
the demonstration.

- `@medusajs/ui@4.2.13` (pinned exact in `package.json`)
- TypeScript ~5.6

## Run

```sh
npm install
npm run typecheck
```

Output (in full — this is the bug):

```
src/repro.ts(39,21): error TS2339: Property 'original' does not exist on type 'Product'.
```

`Product` is the row record passed as `TData`. The most natural consumer access
— `row.original.id`, the documented TanStack way to read the underlying record —
does not typecheck, because the published type claims the callback's second
argument is `TData` itself. At runtime, however, the table passes a TanStack
`Row<TData>` object, so `row.original` is exactly what consumers receive.
The wrong type also lets consumers mistakenly access `row.id` / `row.title`
(fields of the *record*) directly on the callback argument, which would be
`undefined` at runtime for real TanStack `Row` objects.

## Where it comes from

Upstream source (develop branch):

- Types — [`packages/design-system/ui/src/blocks/data-table/use-data-table.tsx:96-100`](https://github.com/medusajs/medusa/blob/develop/packages/design-system/ui/src/blocks/data-table/use-data-table.tsx)
  (and the `UseDataTableReturn` declaration at lines 163–168):

  ```ts
  onRowClick?: (
    event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
    row: TData
  ) => void
  ```

- Runtime — [`packages/design-system/ui/src/blocks/data-table/components/data-table-table.tsx:332-338`](https://github.com/medusajs/medusa/blob/develop/packages/design-system/ui/src/blocks/data-table/components/data-table-table.tsx)
  (and lines 516–522): the callback receives objects straight from the table
  model — TanStack `Row` instances:

  ```tsx
  {instance.getRowModel().rows.map((row) => {
    …
    onClick={(e) => instance.onRowClick?.(e, row)}
  ```

The published dist shows the same mismatch (`@medusajs/ui@4.2.13`):
`dist/esm/blocks/data-table/use-data-table.d.ts:65` vs
`dist/esm/blocks/data-table/components/data-table-table.js:194-195`
(`instance.getRowModel().rows.map((row) => … instance.onRowClick?.(e, row))`).

## Suggested fix

Type the callback argument as the TanStack row the runtime already passes:

```ts
import type { Row } from "@tanstack/react-table"

onRowClick?: (
  event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  row: Row<TData>
) => void
```

`@tanstack/react-table` is already a direct dependency of `@medusajs/ui`, so no
new dependency is needed. Alternatively, change the runtime to pass
`row.original` — but aligning the type with the actual runtime behavior is the
smaller change.
