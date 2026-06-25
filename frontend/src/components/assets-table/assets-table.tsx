import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { HierarchyPath } from "../../api/types";
import { useAssetsQueryOptions } from "../../api/use-assets-query-options";
import { useHierarchyQueryOptions } from "../../api/use-hierarchy-query-options";
import { useSearchAssetsQueryOptions } from "../../api/use-search-assets-query-options";
import { useAssetsTableColumns } from "./use-assets-table-columns";

const locationFilterOptions = (
  options: HierarchyPath[],
  { inputValue }: { inputValue: string },
) => {
  const tokens = inputValue
    .split(">")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return options;

  return options.filter((option) => {
    const segments = option.path.split(" > ").map((s) => s.toLowerCase());
    let tokenIdx = 0;
    for (const segment of segments) {
      if (segment.includes(tokens[tokenIdx])) {
        tokenIdx++;
        if (tokenIdx === tokens.length) return true;
      }
    }
    return false;
  });
};

export const AssetsTable = () => {
  const [name, setName] = useState<string>("");
  const [status, setStatus] = useState<number | "">("");
  const [ancestor, setAncestor] = useState<HierarchyPath | null>(null);
  const [debouncedParams, setDebouncedParams] = useState<{
    name?: string;
    statusId?: number;
    ancestorId?: number;
  }>({});

  const columns = useAssetsTableColumns();
  const { data: assetsData } = useQuery(useAssetsQueryOptions());
  const { data: searchData } = useQuery(
    useSearchAssetsQueryOptions(debouncedParams),
  );
  const { data: hierarchyData } = useQuery(useHierarchyQueryOptions());

  useEffect(() => {
    const params = {
      name: name || undefined,
      statusId: status || undefined,
      ancestorId: ancestor?.id || undefined,
    };
    const timer = setTimeout(() => setDebouncedParams(params), 300);
    return () => clearTimeout(timer);
  }, [name, status, ancestor]);

  const hasFilters = Object.values(debouncedParams).some(
    (v) => v !== undefined,
  );

  const rows = useMemo(
    () => (hasFilters ? (searchData?.assets ?? []) : (assetsData ?? [])),
    [hasFilters, searchData, assetsData],
  );

  // const CustomToolbar = () => (
  //   <Toolbar>
  //     <GridToolbarColumnsButton />
  //     <GridToolbarExport />
  //   </Toolbar>
  // );

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={4}>
        <TextField
          label="Name"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormControl>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
            }}
            sx={{ width: "15ch", textAlign: "left" }}
          >
            <MenuItem value={1}>Normal</MenuItem>
            <MenuItem value={2}>Warning</MenuItem>
            <MenuItem value={3}>Critical</MenuItem>
          </Select>
        </FormControl>
        <Autocomplete
          options={hierarchyData?.paths ?? []}
          getOptionLabel={(option) => option.path}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterOptions={locationFilterOptions}
          value={ancestor}
          onChange={(_, value) => setAncestor(value)}
          sx={{ flex: 1 }}
          renderInput={(params) => <TextField {...params} label="Location" />}
        />
      </Stack>
      <DataGrid
        columns={columns}
        rows={rows}
        getDetailPanelContent={(params) => {
          return <span>{params.row.description}</span>;
        }}
        initialState={{
          columns: {
            columnVisibilityModel: {
              description: false,
            },
          },
        }}
        showToolbar
        // slots={{
        //   toolbar: CustomToolbar,
        // }}
      />
    </Stack>
  );
};
