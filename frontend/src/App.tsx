import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Moon, PawPrint, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { AssetsTreemap } from "./components/assets-treemap/assets-treemap";

function App() {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main style={{ padding: "2rem" }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <PawPrint size={48} />
            <Typography
              variant="h2"
              sx={{ color: mode === "dark" ? "#eee" : "#333" }}
            >
              Acme Pet Nutrition
            </Typography>
          </Stack>
          <Tooltip
            title={
              mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <IconButton
              onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              color="inherit"
            >
              {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
          </Tooltip>
        </Stack>
        <AssetsTreemap />
      </main>
    </ThemeProvider>
  );
}

export default App;
