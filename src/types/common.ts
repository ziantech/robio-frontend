export interface DateObject {
  day?: number;
  month?: number;
  year: number;
  circa: boolean;
  bc?: boolean;
  before?: boolean;
  after?: boolean;
}

export interface EthnicityOption {
  id: string;
  name_en: string;
  name_ro: string;
  flag_url: string;
}

export interface ChangeRecord {
  field: string; // exemplu: "first", "birth.place.city"
  from_: string;
  to: string;
  changed_at: string; // se va converti în Date în cod dacă e necesar
  reason?: string;
  sources: string[];
}
