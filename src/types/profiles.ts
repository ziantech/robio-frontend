/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeRecord, DateObject } from "./common"; // ❌ scos AddressObject

export type SexEnum = "male" | "female" | "other";

export interface NameObject {
  title?: string;
  first: string[];
  last: string[];
  maiden?: string;
  suffix?: string;
  changes?: any[];
  sources?: string[];
}

export interface SexObject {
  value: SexEnum;
  sources: string[];
  changes: ChangeRecord[];
}

export interface EthnicityObject {
  ethnicity_id?: string;
  sources: string[];
  changes: ChangeRecord[];
}

/** ✅ Birth/Death place devine doar place_id: string */
export interface BirthObject {
  date?: DateObject;
  place_id?: string;            // was: place?: AddressObject
  sources: string[];
  changes: ChangeRecord[];
}

export interface DeathObject {
  date?: DateObject;
  place_id?: string;            // was: place?: AddressObject
  sources: string[];
  changes: ChangeRecord[];
}

export interface CemeteryObject {
  cemetery_id?: string | null;  // păstrăm la fel pentru acum
}

export interface BurialObject {
  id?: string;
  date?: DateObject;
  cemetery?: CemeteryObject;
  sources: string[];
  changes: ChangeRecord[];
}

export type EthnicityDTO = {
  id: string;
  name_en: string;
  name_ro: string;
  flag_url?: string | null;
};

export interface Profile {
  id: string; // UUID
  tree_ref: string;
  name: NameObject;
  sex: SexObject;
  ethnicity: EthnicityObject;
  birth: BirthObject;
  death: DeathObject;
  burial: BurialObject[];
  picture_url: string;
  owner_id: string;
  deceased: boolean;
  created_at: string;
  personality: boolean;
  possible_copies?: string[]
}
