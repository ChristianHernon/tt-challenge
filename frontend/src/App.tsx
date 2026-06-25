import { Typography } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { Moon, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import "./App.css";
import { AssetsTable } from "./components/assets-table/assets-table";

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
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "1rem",
          }}
        >
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
        </div>
        <Typography
          variant="h2"
          gutterBottom
          sx={{ color: mode === "dark" ? "#eee" : "#333" }}
        >
          Acme Pet Nutrition
        </Typography>
        <AssetsTable />
      </main>
    </ThemeProvider>
  );
}

export default App;
