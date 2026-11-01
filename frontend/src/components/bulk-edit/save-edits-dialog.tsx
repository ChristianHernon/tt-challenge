import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import type { GridValidRowModel } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildSavePayload } from "./bulk-edit-utils";
import type { PendingEdits } from "./use-pending-edits";

type Props<R extends GridValidRowModel> = {
  pendingEdits: PendingEdits<R>;
  onClose: () => void;
};

/**
 * Placeholder for saving: shows the payload instead of sending it. Replace
 * with a real request (e.g. a react-query mutation) when an endpoint exists.
 */
export const SaveEditsDialog = <R extends GridValidRowModel>({
  pendingEdits,
  onClose,
}: Props<R>) => {
  const payload = useMemo(
    () => JSON.stringify(buildSavePayload(pendingEdits), null, 2),
    [pendingEdits],
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Save {pendingEdits.size} {pendingEdits.size === 1 ? "row" : "rows"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Your network request code goes here. Saving isn’t wired up yet, so
          nothing was sent. This is the payload it could send:
        </DialogContentText>
        <Box
          component="pre"
          sx={(theme) => ({
            m: 0,
            p: 2,
            maxHeight: 360,
            overflow: "auto",
            borderRadius: 1,
            fontFamily: "monospace",
            fontSize: 13,
            bgcolor: theme.palette.action.hover,
            border: `1px solid ${theme.palette.divider}`,
          })}
        >
          <code>{payload}</code>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
