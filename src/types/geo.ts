export type PlaceHit = {
  id: string;
  settlement_name?: string | null;
  settlement_name_historical?: string | null;
  region_name?: string | null;
  region_name_historical?: string | null;
  country_name: string;
  country_name_historical?: string | null;
  latitude: number;
  longitude: number;
};
