/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Box,
  Stack,
  Typography,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Autocomplete from "@mui/material/Autocomplete";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import useDebounce from "@/hooks/useDebounce";
import { PlaceHit } from "@/types/geo";
import { highlight } from "@/utils/highlight";
import { formatPlaceLine } from "@/utils/formatPlace";
import PlaceBadge from "@/components/PlaceBadge";
// sus, lângă celelalte importuri
import CreatePlaceDialog from "@/components/CreatePlaceDialog";
import { simplifySearch } from "@/utils/diacritics";

type Props = {
  label?: string;
  value: string | undefined; // place_id
  onChange: (placeId: string | undefined) => void;
  required?: boolean;
  helperText?: string;
};

export default function SelectAddress({
  label,
  value,
  onChange,
  required,
  helperText,
}: Props) {
  const [query, setQuery] = useState<string>("");
  const debounced = useDebounce(query, 450);
  const [options, setOptions] = useState<PlaceHit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<PlaceHit | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // dacă avem value inițial (place_id), adu detaliile ca să afișăm frumos
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    (async () => {
      try {
        const r = await api.get(`/places/${value}`);
        setSelected(r.data as PlaceHit);
        // și umple query pentru UX (dar nu declanșăm search dacă nu scrie userul)
        const { title, subtitle } = formatPlaceLine(r.data);
        setQuery(title || subtitle || "");
      } catch {
        setSelected(null);
      }
    })();
  }, [value]);

  // search
  useEffect(() => {
    const qClean = simplifySearch(debounced);

    if (!qClean.trim()) {
      setOptions([]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/places/search", {
          params: { q: qClean, limit: 20 },
        });
        setOptions(res.data || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [debounced]);

  const handlePick = (_: any, v: PlaceHit | null) => {
    setSelected(v);
    onChange(v?.id);
  };

  const placeholder = "Search location (settlement/county/country)";

  return (
    <Box display="grid" gap={1.25}>
      {label && (
        <Typography fontWeight={600}>
          {label}
          {required ? " *" : ""}
        </Typography>
      )}

      <Autocomplete
        value={selected}
        onChange={handlePick}
        options={options}
        loading={loading}
        size="small"
        filterOptions={(x) => x} // păstrăm ordinea serverului
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(o) => {
          const { title, subtitle } = formatPlaceLine(o);
          return title || subtitle || "";
        }}
        inputValue={query}
        onInputChange={(_, v) => setQuery(v)}
        noOptionsText="Type to search…"
        renderOption={(props, option) => {
          const { key, ...rest } = props as any;
          const { title, subtitle, isHistorical, level } =
            formatPlaceLine(option);

          const levelLabel =
            level === "settlement"
              ? "Loc."
              : level === "region"
              ? "Jud."
              : "Country";

          return (
            <li key={option.id} {...rest}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
                gap={1}
              >
                <Box display="flex" flexDirection="column" minWidth={0}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 0.25 }}
                  >
                    <Box
                      component="span"
                      sx={{
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        fontSize: 11,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {levelLabel}
                    </Box>
                    <Typography
                      variant="body2"
                      noWrap
                      dangerouslySetInnerHTML={{
                        __html: highlight(title || "", debounced),
                      }}
                    />
                    {/* chip cu nivelul */}
                  </Stack>

                  {subtitle ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      dangerouslySetInnerHTML={{
                        __html: highlight(subtitle, debounced),
                      }}
                    />
                  ) : null}
                </Box>

                {/* badge istoricului (vizual, la dreapta) */}
                <PlaceBadge historical={isHistorical} />
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {helperText ? (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      ) : null}

      <Stack direction="row" justifyContent="flex-end">
        <Tooltip title="Add new place">
          <span>
            <IconButton size="small" onClick={() => setCreateOpen(true)}>
              <AddIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <CreatePlaceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(place) => {
          // setează selectarea imediat
          setSelected(place);
          onChange(place.id);
          // și injectează în opțiuni ca să fie vizibil în listă
          setOptions((prev) => {
            const exists = prev.some((p) => p.id === place.id);
            return exists ? prev : [place, ...prev];
          });
          setCreateOpen(false);
        }}
      />
    </Box>
  );
}
