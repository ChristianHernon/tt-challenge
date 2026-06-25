import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useAssetsQueryOptions } from "../../api/use-assets-query-options";
import { useSearchAssetsQueryOptions } from "../../api/use-search-assets-query-options";
import { useAssetsTableColumns } from "./use-assets-table-columns";

export const AssetsTable = () => {
  const [name, setName] = useState<string>("");
  const [status, setStatus] = useState<number | "">("");
  const [debouncedParams, setDebouncedParams] = useState<{
    name?: string;
    statusId?: number;
  }>({});

  const columns = useAssetsTableColumns();
  const { data: assetsData } = useQuery(useAssetsQueryOptions());
  const { data: searchData } = useQuery(
    useSearchAssetsQueryOptions(debouncedParams),
  );

  useEffect(() => {
    const params = {
      name: name || undefined,
      statusId: status || undefined,
    };
    const timer = setTimeout(() => setDebouncedParams(params), 300);
    return () => clearTimeout(timer);
  }, [name, status]);

  const hasFilters = Object.values(debouncedParams).some(
    (v) => v !== undefined,
  );

  const rows = useMemo(
    () => (hasFilters ? (searchData?.assets ?? []) : (assetsData ?? [])),
    [hasFilters, searchData, assetsData],
  );

  const api = useGridApiRef();

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
      </Stack>
      <DataGrid
        apiRef={api}
        columns={columns}
        rows={rows}
        // autosizeOnMount
        // autosizeOptions={{
        //   columns: ["name", "id"],
        //   includeHeaders: true,
        //   includeOutliers: true,
        // }}
      />
    </Stack>
  );
};
