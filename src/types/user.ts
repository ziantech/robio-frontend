export type SexEnum = "male" | "female" | "unknown";

export interface NameObject {
  title: string;
  first: string[];
  alternative: string[];
  last: string;
  maiden?: string;
  suffix: string;
}

export interface NewUser {
  email: string;
  username: string;
  password: string;
  address: string;
  sex?: SexEnum;
  name: NameObject;
}
