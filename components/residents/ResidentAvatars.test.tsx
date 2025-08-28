import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Resident } from 'types/resident'
import { ResidentAvatars } from './ResidentAvatars'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockResidents: Resident[] = [
  {
    id: 'R001',
    houseId: 'H001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Male',
    phone: '0412345678',
    email: 'john@example.com',
    photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
    createdAt: new Date(),
    createdBy: 'admin',
    updatedAt: new Date(),
    updatedBy: 'admin'
  },
  {
    id: 'R002',
    houseId: 'H001',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: new Date('1985-06-15'),
    gender: 'Female',
    phone: '0412345679',
    email: 'jane@example.com',
    createdAt: new Date(),
    createdBy: 'admin',
    updatedAt: new Date(),
    updatedBy: 'admin'
  },
  {
    id: 'R003',
    houseId: 'H001',
    firstName: 'Bob',
    lastName: 'Wilson',
    dateOfBirth: new Date('1995-03-20'),
    gender: 'Male',
    createdAt: new Date(),
    createdBy: 'admin',
    updatedAt: new Date(),
    updatedBy: 'admin'
  }
]

describe('ResidentAvatars', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays loading state initially', () => {
    // Mock pending fetch
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<ResidentAvatars houseId="H001" />)

    // Should show loading skeletons
    const loadingAvatars = screen.getAllByRole('generic')
    expect(loadingAvatars.some(el => el.classList.contains('animate-pulse'))).toBe(true)
  })

  it('displays resident avatars with photos correctly', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockResidents[0]] // John with photo
      })
    })

    render(<ResidentAvatars houseId="H001" />)

    await waitFor(() => {
      expect(screen.getByAltText('John Doe')).toBeInTheDocument()
    })

    // Check photo is displayed
    const photo = screen.getByAltText('John Doe')
    expect(photo).toHaveAttribute('src', mockResidents[0].photoBase64)
  })

  it('displays resident initials when no photo available', async () => {
    // Mock API response with resident without photo
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockResidents[1]] // Jane without photo
      })
    })

    render(<ResidentAvatars houseId="H001" />)

    await waitFor(() => {
      expect(screen.getByText('JS')).toBeInTheDocument()
    })

    // Should show initials for Jane Smith
    expect(screen.getByText('JS')).toBeInTheDocument()
  })

  it('displays hover tooltip with resident name', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockResidents[0]]
      })
    })

    render(<ResidentAvatars houseId="H001" />)

    await waitFor(() => {
      expect(screen.getByAltText('John Doe')).toBeInTheDocument()
    })

    // Hover over avatar to show tooltip
    const avatar = screen.getByAltText('John Doe').parentElement
    await user.hover(avatar!)

    // Tooltip should appear
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('displays multiple residents correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockResidents.slice(0, 3) // John, Jane, Bob
      })
    })

    render(<ResidentAvatars houseId="H001" maxDisplay={4} />)

    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument() // John initials (has photo but fallback for test)
    })

    // Should show multiple residents
    expect(screen.getByText('JS')).toBeInTheDocument() // Jane Smith
    expect(screen.getByText('BW')).toBeInTheDocument() // Bob Wilson
  })

  it('displays overflow count when maxDisplay exceeded', async () => {
    // Create 5 residents to test overflow
    const manyResidents = [
      ...mockResidents.slice(0, 3),
      {
        ...mockResidents[0],
        id: 'R004',
        firstName: 'Alice',
        lastName: 'Brown'
      },
      {
        ...mockResidents[0],
        id: 'R005',
        firstName: 'Charlie',
        lastName: 'Davis'
      }
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: manyResidents
      })
    })

    render(<ResidentAvatars houseId="H001" maxDisplay={3} />)

    await waitFor(() => {
      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    // Should show +2 for the 2 residents beyond the limit
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('displays no residents message when empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: []
      })
    })

    render(<ResidentAvatars houseId="H001" />)

    await waitFor(() => {
      expect(screen.getByText('No residents')).toBeInTheDocument()
    })
  })

  it('displays error message on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Failed to load residents'
      })
    })

    render(<ResidentAvatars houseId="H001" />)

    await waitFor(() => {
      expect(screen.getByText('Error loading residents')).toBeInTheDocument()
    })
  })

  it('displays error message on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ResidentAvatars houseId="H001" />)

    await waitFor(() => {
      expect(screen.getByText('Error loading residents')).toBeInTheDocument()
    })
  })

  it('calls correct API endpoint with house ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: []
      })
    })

    render(<ResidentAvatars houseId="H123" />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/houses/H123/residents')
    })
  })
})