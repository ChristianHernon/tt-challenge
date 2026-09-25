import Stack from "@mui/material/Stack";
import {
  gridRowSelectionIdsSelector,
  useGridApiRef,
  type GridColDef,
} from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid/DataGrid";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { AssetsItem } from "../../api/types";
import { useHierarchyQueryOptions } from "../../api/use-hierarchy-query-options";
import { useSearchAssetsQueryOptions } from "../../api/use-search-assets-query-options";
import { AssetsTableFilters } from "./assets-table-filters";
import { BulkEditColumnMenu } from "./bulk-edit-column-menu";
import { BulkEditDialog } from "./bulk-edit-dialog";
import { buildBulkPatches, diff, isValidName } from "./bulk-edit-utils";
import { useAssetFilters } from "./use-asset-filters";
import { useAssetsTableColumns } from "./use-assets-table-columns";
import { usePendingEdits } from "./use-pending-edits";

type BulkEditState = {
  colDef: GridColDef<AssetsItem>;
  rows: AssetsItem[];
};

export const AssetsTable = () => {
  const apiRef = useGridApiRef();
  const columns = useAssetsTableColumns();
  const { debouncedParams, setParams } = useAssetFilters();
  const { data: searchData, isFetching } = useQuery(
    useSearchAssetsQueryOptions(debouncedParams),
  );
  const { data: hierarchyData } = useQuery(useHierarchyQueryOptions());

  const { applyPatch, applyPatches, mergeRows } = usePendingEdits();

  // Snapshot of the column and selected rows, taken when the dialog opens.
  const [bulkEdit, setBulkEdit] = useState<BulkEditState | null>(null);

  const openBulkEdit = (field: string) => {
    if (!apiRef.current) return;
    // The selector resolves "select all" (exclude model) to concrete rows.
    const selected = gridRowSelectionIdsSelector(apiRef);
    setBulkEdit({
      colDef: apiRef.current.getColumn(field),
      rows: [...selected.values()].filter(Boolean) as AssetsItem[],
    });
  };

  const applyBulkEdit = (value: unknown) => {
    if (!bulkEdit) return;
    applyPatches(
      buildBulkPatches(bulkEdit.rows, bulkEdit.colDef, value, apiRef),
    );
    setBulkEdit(null);
  };

  const serverRows = searchData?.assets;
  const rows = useMemo(
    () => mergeRows(serverRows ?? []),
    [mergeRows, serverRows],
  );

  return (
    <Stack spacing={4}>
      <AssetsTableFilters
        onParamsChange={setParams}
        hierarchyPaths={hierarchyData?.paths ?? []}
      />
      <DataGrid
        apiRef={apiRef}
        columns={columns}
        rows={rows}
        checkboxSelection
        processRowUpdate={(newRow, oldRow) => {
          // Reject blank names by reverting. (preProcessEditCellProps would
          // swallow an Enter pressed within the input's 200ms debounce.)
          if (!isValidName(newRow.name)) return oldRow;
          applyPatch(newRow.id, diff(oldRow, newRow));
          return newRow;
        }}
        getDetailPanelContent={(params) => (
          <span>{params.row.description}</span>
        )}
        loading={isFetching}
        initialState={{
          columns: {
            columnVisibilityModel: {
              description: false,
            },
          },
        }}
        showToolbar
        slots={{ columnMenu: BulkEditColumnMenu }}
        slotProps={{ columnMenu: { onBulkEdit: openBulkEdit } }}
      />
      {bulkEdit && (
        <BulkEditDialog
          colDef={bulkEdit.colDef}
          rows={bulkEdit.rows}
          onCancel={() => setBulkEdit(null)}
          onApply={applyBulkEdit}
        />
      )}
    </Stack>
  );
};
