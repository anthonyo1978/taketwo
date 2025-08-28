import type { AustralianState, HouseStatus } from "types/house"
import type { Gender } from "types/resident"

export const AUSTRALIAN_STATES: AustralianState[] = [
  'ACT',
  'NSW', 
  'NT',
  'QLD',
  'SA',
  'TAS',
  'VIC',
  'WA'
] as const

export const HOUSE_STATUSES: HouseStatus[] = [
  'Active',
  'Vacant', 
  'Under maintenance'
] as const

export const DEFAULT_COUNTRY = 'AU'

export const GENDER_OPTIONS: Gender[] = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say'
] as const

export const RESIDENT_PHOTO_MAX_SIZE = 5 * 1024 * 1024 // 5MB