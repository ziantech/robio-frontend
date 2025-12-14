/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/family.ts
export type MinimalProfileDTO = {
  id: string;
  tree_ref: string;
  name: any;            // JSON din DB
  picture_url?: string | null;
  sex: any
  birth:any;
  death:any;
  deceased:boolean;
  personality: boolean
};

export interface HalfSiblingDTO {
  profile: MinimalProfileDTO;
  via: JointBy;                 // "mother" | "father" | "unknown"
  joint_parent_name?: string | null; // numele părintelui comun (opțional)
}
export type JointBy = "mother" | "father" | "unknown";
export interface FamilySnapshotDTO {
  subject: MinimalProfileDTO;
  parents: MinimalProfileDTO[];
  spouses: MinimalProfileDTO[];
  children: MinimalProfileDTO[];
  siblings_full: MinimalProfileDTO[];
  siblings_half: HalfSiblingDTO[];   // <-- modificat aici
}