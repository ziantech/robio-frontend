import { ChangeRecord, DateObject } from "./common";

export type SexEnum = "male" | "female" | "unknown";

export interface NameObject {
  title?: string;
  first: string[];
  
  last: string[];
  
  maiden?: string;
  suffix?: string;
    changes?: ChangeRecord[];
  sources?: string[];
}

export interface EthnicityObject {
  ethnicity_id: string; // UUID-ul salvat în DB
  value: string;
  flag_url: string;
}
export interface NewUser {
  email: string;
  username: string;
  password: string;
  
  agreeTerms: boolean;
  recoveryEmail?: string;
  
}

export interface Parent {
  sex: SexEnum;
  name: NameObject;
  birth: {
    date: DateObject;
  };
  death: {
    date: DateObject;
  };
  existing_id?: string;
  picture_url?: string; // ID-ul profilului existent, dacă e cazul
  deceased: boolean;
}


