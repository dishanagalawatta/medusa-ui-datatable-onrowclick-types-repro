import { createDataTableColumnHelper, useDataTable } from "@medusajs/ui"

/**
 * A plain row record — note it has NO `original` property.
 */
interface Product {
  id: string
  title: string
}

const columnHelper = createDataTableColumnHelper<Product>()

const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("title", { header: "Title" }),
]

const data: Product[] = [{ id: "p_1", title: "Smoke test product" }]

/**
 * The published types declare the callback's second parameter as `TData`:
 *
 *   dist/esm/blocks/data-table/use-data-table.d.ts:65
 *   onRowClick?: (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: TData) => void;
 *
 * but the runtime passes a TanStack `Row<TData>` object:
 *
 *   dist/esm/blocks/data-table/components/data-table-table.js:194-195
 *   instance.getRowModel().rows.map((row) => ... instance.onRowClick?.(e, row))
 *
 * So the most natural consumer access — `row.original.id` — is rejected by
 * tsc even though it is exactly what the runtime argument carries.
 */
export const instance = useDataTable<Product>({
  columns,
  data,
  onRowClick: (_event, row) => {
    // tsc: TS2339: Property 'original' does not exist on type 'Product'.
    console.log(row.original.id)
  },
})
