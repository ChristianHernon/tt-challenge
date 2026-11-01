import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

type Props = {
  count: number;
  onDiscard: () => void;
};

export const PendingEditsBar = ({ count, onDiscard }: Props) =>
  count > 0 ? (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" onClick={onDiscard}>
          Discard
        </Button>
      }
    >
      {count} {count === 1 ? "row" : "rows"} with unsaved changes
    </Alert>
  ) : null;
