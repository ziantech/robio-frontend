"use client";

import { EthnicityDTO, Profile } from "@/types/profiles";
import { createContext, useContext, useState } from "react";


type ProfileContextType = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
   ethnicity: EthnicityDTO | null;
  setEthnicity: (e: EthnicityDTO | null) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ethnicity, setEthnicity] = useState<EthnicityDTO | null>(null);
  return (
    <ProfileContext.Provider value={{ profile, setProfile, ethnicity, setEthnicity }}>
      {children}
    </ProfileContext.Provider>
  );
}
