/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Badge,
  Divider,
} from "@mui/material";

import StarIcon from "@mui/icons-material/Star";
import EventIcon from "@mui/icons-material/Event";
import GroupsIcon from "@mui/icons-material/Groups";

import FlagIcon from "@mui/icons-material/Flag";
import PlaceIcon from "@mui/icons-material/Place";
import BuildIcon from "@mui/icons-material/Build";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
// import Diversity3Icon from "@mui/icons-material/Diversity3"; // Parteneri
import HandshakeIcon from "@mui/icons-material/Handshake"; // Cereri parteneriat

import CreateProfileModal from "@/components/Admin/CreateProfileModal";
import CreateEventModal from "@/components/Admin/CreateEvent";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

type ActionKey =
  | "create_personality"
  | "create_event"
  | "view_users"
  | "claims"
  | "events"
  | "places_all"
  | "places_fix"
  | "sources"
  | "sources_pending" // doar Admin
  | "partnership_requests"// doar Admin
  | "cemeteries";

type ActionItem = {
  key: ActionKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  showBadge?: boolean;
  badgeCount?: number;
  hidden?: boolean; // pentru filtrare ușoară
};

type Section = {
  title: string;
  items: ActionItem[];
};

export default function AdminPage() {
  const router = useRouter();

  const { isAdmin } = useAuth();

  const [openCreatePersonality, setOpenCreatePersonality] = useState(false);
  const [openCreateEvent, setOpenCreateEvent] = useState(false);

  // numărul de places care au settlement_name dar NU au lat/lng
  const [needsFixCount, setNeedsFixCount] = useState<number>(0);
  const [pendingClaims, setPendingClaims] = useState<number>(0);
  const [pendingPartnerRequests, setPendingPartnerRequests] =
    useState<number>(0);
  const [pendingSourceApprovals, setPendingSourceApprovals] =
    useState<number>(0);

  const RON_PER_CREDIT = 0.1;
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [usdRateRON, setUsdRateRON] = useState<number>(4.6); // RON per 1 USD (fallback)

  const fmtRON = (n: number) =>
    new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(n);
  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<{ count: number }>(
          "/places/stats/needing-coords"
        );
        setNeedsFixCount(Number(r.data?.count || 0));
      } catch {
        setNeedsFixCount(0);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<{ count: number }>(
          "/sources-admin/approvals/stats/pending"
        );
        setPendingSourceApprovals(Number(r.data?.count || 0));
      } catch {
        setPendingSourceApprovals(0);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<{ count: number }>("/claims/stats/pending");
        setPendingClaims(Number(r.data?.count || 0));
      } catch {
        setPendingClaims(0);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<{ count: number }>(
          "/users-admin/partner-requests/stats/pending"
        );
        setPendingPartnerRequests(Number(r.data?.count || 0));
      } catch {
        setPendingPartnerRequests(0);
      }
    })();
  }, []);
  useEffect(() => {
    let t: any;
    const load = async () => {
      try {
        const s = await api.get<{ total_credits: number }>(
          "/users/stats/credits"
        );
        setTotalCredits(Number(s.data?.total_credits || 0));
      } catch {
        /* noop */
      }

      
    };
    load();
    t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);
  const sections: Section[] = [
    {
      title: "People",
      items: [
        {
          key: "create_personality",
          title: "Creează vedetă",
          subtitle: "Create personality",
          icon: <StarIcon fontSize="inherit" />,
        },
        {
          key: "view_users",
          title: "Utilizatori",
          subtitle: "View all users",
          icon: <GroupsIcon fontSize="inherit" />,
        },
        {
          key: "claims",
          title: "Cereri de profil",
          subtitle: "Profile claims",
          icon: <FlagIcon fontSize="inherit" />,
          showBadge: true,
          badgeCount: pendingClaims,
        },

        // doar Admin: Cereri de parteneriat
        {
          key: "partnership_requests",
          title: "Cereri de parteneriat",
          subtitle: "Partnership requests",
          icon: <HandshakeIcon fontSize="inherit" />,
          hidden: !isAdmin,
          showBadge: true,
          badgeCount: pendingPartnerRequests,
        },
      ],
    },
    {
      title: "Events",
      items: [
        {
          key: "create_event",
          title: "Creează eveniment",
          subtitle: "Create event",
          icon: <EventIcon fontSize="inherit" />,
        },
        {
          key: "events",
          title: "Evenimente",
          subtitle: "Manage events",
          icon: <EventIcon fontSize="inherit" />,
        },
      ],
    },
    {
      title: "Places",
      items: [
        {
          key: "places_all",
          title: "Locuri",
          subtitle: "All places",
          icon: <PlaceIcon fontSize="inherit" />,
        },
          {
      key: "cemeteries",                            // +++ nou
      title: "Cimitire",
      subtitle: "Cemeteries",
      icon: <PlaceIcon fontSize="inherit" />,
    },
        {
          key: "places_fix",
          title: "De revizuit",
          subtitle: "Places to fix",
          icon: <BuildIcon fontSize="inherit" />,
          showBadge: true,
          badgeCount: needsFixCount,
        },
      ],
    },
    {
      title: "Sources",
      items: [
        {
          key: "sources",
          title: "Surse",
          subtitle: "Sources",
          icon: <LibraryBooksIcon fontSize="inherit" />,
        },
        // doar Admin: Surse de aprobat
        {
          key: "sources_pending",
          title: "Surse de aprobat",
          subtitle: "Pending sources",
          icon: <LibraryBooksIcon fontSize="inherit" />,
          hidden: !isAdmin,
          showBadge: true,
          badgeCount: pendingSourceApprovals,
        },
      ],
    },
  ];

  const handleActionClick = (key: ActionKey) => {
    switch (key) {
      case "create_personality":
        setOpenCreatePersonality(true);
        return;
      case "create_event":
        setOpenCreateEvent(true);
        return;

      case "events":
        router.push("/admin/events");
        return;

      case "view_users":
        router.push("/admin/users");
        return;

      case "claims":
        router.push("/admin/claims");
        return;
      
      case "cemeteries":
        router.push("/admin/cemeteries");
        return;

      case "partnership_requests": // doar Admin
        router.push("/admin/partnership-requests");
        return;

      case "places_all":
        router.push("/admin/places");
        return;

      case "places_fix":
        router.push("/admin/places-to-fix");
        return;

      case "sources":
        router.push("/admin/sources");
        return;

      case "sources_pending": // doar Admin
        router.push("/admin/sources-pending");
        return;

      default:
        return;
    }
  };
const payableRon = totalCredits * RON_PER_CREDIT;        // 0.1 RON * credite
const usdEquivalent = usdRateRON ? payableRon / usdRateRON : 0; // RON -> USD
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
     <Stack
  direction="row"
  alignItems="flex-start"
  justifyContent="space-between"
  sx={{ mb: 3, gap: 2 }}
>
  <Box>
    <Typography variant="h4" gutterBottom>
      Admin Portal
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Select an action to get started.
    </Typography>
  </Box>

  {/* + ADD: card total credite & sume */}
  <Card
    sx={{
      minWidth: 300,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
    }}
    elevation={0}
  >
    <CardContent sx={{ py: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack spacing={0.25}>
          <Typography variant="overline" color="text.secondary">
            Credite existente
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {totalCredits.toLocaleString("ro-RO")}
          </Typography>
        </Stack>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid",
            borderColor: "divider",
            display: "grid",
            placeItems: "center",
          }}
        >
          <MonetizationOnIcon fontSize="small" />
        </Box>
      </Stack>

      <Divider sx={{ my: 1.25 }} />

      <Stack spacing={0.25}>
        <Typography variant="caption" color="text.secondary">
          De plătit în RON (0.1 RON / credit)
        </Typography>
        <Typography variant="subtitle1" fontWeight={700}>
          {fmtRON(payableRon)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ≈ {fmtUSD(usdEquivalent)} &nbsp; • &nbsp; curs USD/RON: {usdRateRON.toFixed(4)}
        </Typography>
      </Stack>
    </CardContent>
  </Card>
</Stack>


      <Stack spacing={3}>
        {sections.map((section) => {
          const visibleItems = section.items.filter((i) => !i.hidden);
          if (visibleItems.length === 0) return null;

          return (
            <Box key={section.title}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="h6">{section.title}</Typography>
                <Divider sx={{ flex: 1, ml: 2 }} />
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: 2,
                }}
              >
                {visibleItems.map((a) => {
                  const iconEl = (
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "9999px",
                        border: "1px solid",
                        borderColor: "divider",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 26,
                      }}
                    >
                      {a.icon}
                    </Box>
                  );

                  return (
                    <Card
                      key={a.key}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        "&:hover": {
                          boxShadow: 4,
                          transform: "translateY(-2px)",
                        },
                        transition: "all .15s ease-in-out",
                      }}
                    >
                      <CardActionArea onClick={() => handleActionClick(a.key)}>
                        <CardContent>
                          <Stack
                            alignItems="center"
                            justifyContent="center"
                            spacing={1.25}
                            sx={{ textAlign: "center", py: 1 }}
                          >
                            {a.showBadge ? (
                              <Badge
                                color="error"
                                badgeContent={
                                  (a.badgeCount ?? 0) > 99
                                    ? "99+"
                                    : a.badgeCount ?? 0
                                }
                                overlap="circular"
                                anchorOrigin={{
                                  vertical: "top",
                                  horizontal: "right",
                                }}
                                invisible={!a.badgeCount}
                              >
                                {iconEl}
                              </Badge>
                            ) : (
                              iconEl
                            )}

                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              noWrap
                            >
                              {a.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ lineHeight: 1.2 }}
                              noWrap
                            >
                              {a.subtitle}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Stack>

      <CreateProfileModal
        open={openCreatePersonality}
        onClose={() => setOpenCreatePersonality(false)}
      />
      <CreateEventModal
        open={openCreateEvent}
        onClose={() => setOpenCreateEvent(false)}
      />
    </Box>
  );
}
