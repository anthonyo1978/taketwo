export type AustralianState = 'ACT' | 'NSW' | 'NT' | 'QLD' | 'SA' | 'TAS' | 'VIC' | 'WA'

export type HouseStatus = 'Active' | 'Vacant' | 'Under maintenance'

export interface House {
  id: string
  address1: string
  unit?: string
  suburb: string
  state: AustralianState
  postcode: string
  country: string
  status: HouseStatus
  notes?: string
  goLiveDate: Date
  resident?: string
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string
}

export interface HouseCreateInput {
  address1: string
  unit?: string
  suburb: string
  state: AustralianState
  postcode: string
  country: string
  status: HouseStatus
  notes?: string
  goLiveDate: Date
  resident?: string
}