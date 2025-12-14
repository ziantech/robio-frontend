/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Divider,
  Chip,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SourceIcon from "@mui/icons-material/Source";
// import HistoryEduIcon from "@mui/icons-material/HistoryEdu";

export function SectionCard({
  title,
  canEdit,
  onEdit,
  children,
  sourcesCount = 0,
  changesCount = 0,
  label,
  onSeeSources,
  onSeeChanges,
}: {
  title: string;
  canEdit?: boolean;
  onEdit?: () => void;
  children: React.ReactNode;
  sourcesCount?: number;
  changesCount?: number;
  label: (en: string, ro: string) => string;
  onSeeSources?: () => void;   // ⬅️ NEW
  onSeeChanges?: () => void;   // ⬅️ NEW
}) {
  const canSources = !!onSeeSources && sourcesCount > 0;
  // const canChanges = !!onSeeChanges && changesCount > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        backgroundColor: "#f9f9f9",
        p: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <CardContent sx={{ wordBreak: "break-word" }}>
    
          <Tooltip title={label("Edit section", "Editează secțiunea")}>
            <IconButton
              size="small"
              sx={{ position: "absolute", top: 8, right: 8 }}
              onClick={onEdit}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
      

        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        <Stack spacing={1}>{children}</Stack>

        <Divider sx={{ my: 1 }} />

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {/* <Tooltip
            title={
              canChanges
                ? label("See changes", "Vezi modificările")
                : label("No changes", "Nu există modificări")
            }
          >
            <span>
              <Chip
                icon={<HistoryEduIcon />}
                label={`${label("See changes", "Vezi modificările")} (${changesCount})`}
                variant="outlined"
                size="small"
                clickable={canChanges}
                onClick={canChanges ? onSeeChanges : undefined}
                sx={!canChanges ? { opacity: 0.6, pointerEvents: "none" } : undefined}
              />
            </span>
          </Tooltip> */}

          <Tooltip
            title={
              canSources
                ? label("See sources", "Vezi sursele")
                : label("No sources", "Nu există surse")
            }
          >
            <span>
              <Chip
                icon={<SourceIcon />}
                label={`${label("See sources", "Vezi sursele")} (${sourcesCount})`}
                variant="outlined"
                size="small"
                clickable={canSources}
                onClick={canSources ? onSeeSources : undefined}
                sx={!canSources ? { opacity: 0.6, pointerEvents: "none" } : undefined}
              />
            </span>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}
