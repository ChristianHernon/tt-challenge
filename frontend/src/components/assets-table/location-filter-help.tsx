import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { CircleHelp } from "lucide-react";

const HelpText = () => (
  <Box sx={{ p: 0.5, maxWidth: 340 }}>
    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
      Search by path
    </Typography>
    <Typography variant="body2" sx={{ mb: 1 }}>
      Separate parts of a location with <code>&gt;</code>. Parts match levels in
      order, and levels in between can be skipped. A part can be several words;
      a level matches if its name contains all of them.
    </Typography>
    <Typography variant="body2" component="div">
      <code>topeka &gt; kibble 01 &gt; pump</code> finds
      <Box component="span" sx={{ display: "block", opacity: 0.8, mt: 0.25 }}>
        Topeka Plant › Coating &amp; Enrobing › Kibble Line 01 › Digest Pump
      </Box>
    </Typography>
  </Box>
);

/** “?” icon with search tips, for the Location autocomplete's end adornment. */
export const LocationFilterHelp = () => (
  <Tooltip
    title={<HelpText />}
    placement="bottom-end"
    enterTouchDelay={0}
    arrow
  >
    <IconButton
      size="small"
      aria-label="How to search locations"
      // The Autocomplete root opens its popup on mousedown; keep the click
      // on the icon from toggling the option list.
      onMouseDown={(event) => event.stopPropagation()}
      sx={{ color: "text.secondary" }}
    >
      <CircleHelp size={18} />
    </IconButton>
  </Tooltip>
);
