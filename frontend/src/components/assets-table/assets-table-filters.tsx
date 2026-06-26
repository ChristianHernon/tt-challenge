import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import type { HierarchyPath } from "../../api/types";
import type { SearchAssetsParams } from "../../api/use-search-assets-query-options";
import { locationFilterOptions } from "./location-filter-utils";

interface Props {
  onParamsChange: (params: SearchAssetsParams) => void;
  hierarchyPaths: HierarchyPath[];
}

export const AssetsTableFilters = ({
  onParamsChange,
  hierarchyPaths,
}: Props) => {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<number | "">("");
  const [ancestor, setAncestor] = useState<HierarchyPath | null>(null);

  const parseNameQuery = (
    value: string,
  ): { name?: string; excludeNames?: string[] } => {
    const tokens = value.trim().split(/\s+/).filter(Boolean);
    const excludeNames: string[] = [];
    const includeTokens: string[] = [];

    for (const token of tokens) {
      if (token.startsWith("-") && token.length > 1) {
        excludeNames.push(token.slice(1));
      } else {
        includeTokens.push(token);
      }
    }

    return {
      name: includeTokens.length > 0 ? includeTokens.join(" ") : undefined,
      excludeNames: excludeNames.length > 0 ? excludeNames : undefined,
    };
  };

  const buildParams = (
    nameValue: string,
    statusValue: number | "",
    ancestorValue: HierarchyPath | null,
  ): SearchAssetsParams => ({
    ...parseNameQuery(nameValue),
    statusId: statusValue || undefined,
    ancestorId: ancestorValue?.id,
  });

  const handleNameChange = (value: string) => {
    setName(value);
    onParamsChange(buildParams(value, status, ancestor));
  };

  const handleStatusChange = (value: number | "") => {
    setStatus(value);
    onParamsChange(buildParams(name, value, ancestor));
  };

  const handleAncestorChange = (value: HierarchyPath | null) => {
    setAncestor(value);
    onParamsChange(buildParams(name, status, value));
  };

  return (
    <Stack direction="row" spacing={4}>
      <TextField
        label="Name"
        variant="outlined"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
      />
      <FormControl>
        <InputLabel id="status-label">Status</InputLabel>
        <Select<number | "">
          labelId="status-label"
          label="Status"
          value={status}
          onChange={(e) => {
            const val = e.target.value;
            handleStatusChange(val === "" ? "" : Number(val));
          }}
          sx={{ width: "15ch", textAlign: "left" }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value={1}>Normal</MenuItem>
          <MenuItem value={2}>Warning</MenuItem>
          <MenuItem value={3}>Critical</MenuItem>
        </Select>
      </FormControl>
      <Autocomplete
        options={hierarchyPaths}
        getOptionLabel={(option) => option.path}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={locationFilterOptions}
        value={ancestor}
        onChange={(_, value) => handleAncestorChange(value)}
        sx={{ flex: 1 }}
        renderInput={(params) => <TextField {...params} label="Location" />}
      />
    </Stack>
  );
};
