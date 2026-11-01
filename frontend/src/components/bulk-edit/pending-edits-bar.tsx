import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

type Props = {
  count: number;
  onDiscard: () => void;
  onSave: () => void;
};

export const PendingEditsBar = ({ count, onDiscard, onSave }: Props) =>
  count > 0 ? (
    <Alert
      severity="warning"
      action={
        <Stack direction="row" spacing={1}>
          <Button color="inherit" size="small" onClick={onDiscard}>
            Discard
          </Button>
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            onClick={onSave}
          >
            Save
          </Button>
        </Stack>
      }
    >
      {count} {count === 1 ? "row" : "rows"} with unsaved changes
    </Alert>
  ) : null;
