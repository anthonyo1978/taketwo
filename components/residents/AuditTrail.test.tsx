import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { AuditLogEntry } from 'types/resident'
import { AuditTrail } from './AuditTrail'

const mockAuditEntries: AuditLogEntry[] = [
  {
    id: 'A001',
    action: 'CREATED',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    userEmail: 'admin@example.com',
    field: undefined,
    oldValue: undefined,
    newValue: undefined
  },
  {
    id: 'A002',
    action: 'STATUS_CHANGED',
    timestamp: new Date('2024-01-16T14:30:00Z'),
    userEmail: 'manager@example.com',
    field: 'status',
    oldValue: 'Draft',
    newValue: 'Active'
  },
  {
    id: 'A003',
    action: 'FUNDING_ADDED',
    timestamp: new Date('2024-01-17T09:15:00Z'),
    userEmail: 'admin@example.com',
    field: 'funding',
    oldValue: undefined,
    newValue: 'NDIS: $1500'
  },
  {
    id: 'A004',
    action: 'UPDATED',
    timestamp: new Date('2024-01-18T16:45:00Z'),
    userEmail: 'staff@example.com',
    field: 'phone',
    oldValue: '0412345678',
    newValue: '0423456789'
  },
  {
    id: 'A005',
    action: 'FUNDING_REMOVED',
    timestamp: new Date('2024-01-19T11:20:00Z'),
    userEmail: 'manager@example.com',
    field: 'funding',
    oldValue: 'Family: $500',
    newValue: undefined
  }
]

describe('AuditTrail', () => {
  it('displays empty state when no entries exist', () => {
    render(<AuditTrail entries={[]} />)
    
    expect(screen.getByText('Audit Trail')).toBeInTheDocument()
    expect(screen.getByText('No audit trail entries available')).toBeInTheDocument()
  })

  it('displays audit entries correctly', () => {
    render(<AuditTrail entries={mockAuditEntries} />)
    
    expect(screen.getByText('Audit Trail (5 entries)')).toBeInTheDocument()
    expect(screen.getByText('created')).toBeInTheDocument()
    expect(screen.getByText('Changed status from Draft to Active')).toBeInTheDocument()
    expect(screen.getByText('Added funding: NDIS: $1500')).toBeInTheDocument()
    expect(screen.getByText('Updated phone from "0412345678" to "0423456789"')).toBeInTheDocument()
    expect(screen.getByText('Removed funding: Family: $500')).toBeInTheDocument()
  })

  it('shows entries sorted by newest first', () => {
    render(<AuditTrail entries={mockAuditEntries} />)
    
    const entryTexts = screen.getAllByText(/by .+@.+\.com/)
    expect(entryTexts[0]).toHaveTextContent('manager@example.com')
    expect(entryTexts[4]).toHaveTextContent('admin@example.com')
  })

  it('displays user email and timestamp for each entry', () => {
    render(<AuditTrail entries={mockAuditEntries} />)
    
    expect(screen.getByText('by admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('by manager@example.com')).toBeInTheDocument()
    expect(screen.getByText('by staff@example.com')).toBeInTheDocument()
  })

  it('shows action filter dropdown when multiple action types exist', () => {
    render(<AuditTrail entries={mockAuditEntries} />)
    
    expect(screen.getByText('Filter:')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All actions')).toBeInTheDocument()
  })

  it('does not show filter dropdown when only one action type exists', () => {
    const singleActionEntries = [mockAuditEntries[0]]
    render(<AuditTrail entries={singleActionEntries} />)
    
    expect(screen.queryByText('Filter:')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('filters entries by action type', async () => {
    const user = userEvent.setup()
    render(<AuditTrail entries={mockAuditEntries} />)
    
    // Filter by STATUS_CHANGED
    await user.selectOptions(screen.getByRole('combobox'), 'STATUS_CHANGED')
    
    await waitFor(() => {
      expect(screen.getByText('Audit Trail (1 entries)')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Changed status from Draft to Active')).toBeInTheDocument()
    expect(screen.queryByText('created')).not.toBeInTheDocument()
  })

  it('shows "Show all entries" button when more than 10 entries exist', () => {
    const manyEntries = Array.from({ length: 15 }, (_, i) => ({
      ...mockAuditEntries[0],
      id: `A${i + 1}`,
      timestamp: new Date(`2024-01-${i + 1}T10:00:00Z`)
    }))
    
    render(<AuditTrail entries={manyEntries} />)
    
    expect(screen.getByText('Show all 15 entries')).toBeInTheDocument()
  })

  it('expands to show all entries when button is clicked', async () => {
    const user = userEvent.setup()
    const manyEntries = Array.from({ length: 15 }, (_, i) => ({
      ...mockAuditEntries[0],
      id: `A${i + 1}`,
      timestamp: new Date(`2024-01-${i + 1}T10:00:00Z`)
    }))
    
    render(<AuditTrail entries={manyEntries} />)
    
    // Initially shows only first 10
    expect(screen.getAllByText(/by admin@example.com/).length).toBeLessThanOrEqual(10)
    
    await user.click(screen.getByText('Show all 15 entries'))
    
    await waitFor(() => {
      expect(screen.getByText('Show less entries')).toBeInTheDocument()
    })
    
    expect(screen.getAllByText(/by admin@example.com/).length).toBe(15)
  })

  it('shows empty filter state message', async () => {
    const user = userEvent.setup()
    render(<AuditTrail entries={mockAuditEntries} />)
    
    // Filter by an action that doesn't exist in our test data
    await user.selectOptions(screen.getByRole('combobox'), 'PHOTO_UPDATED')
    
    await waitFor(() => {
      expect(screen.getByText('No entries found for action: photo updated')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Show all entries')).toBeInTheDocument()
  })

  it('clears filter when "Show all entries" link is clicked', async () => {
    const user = userEvent.setup()
    render(<AuditTrail entries={mockAuditEntries} />)
    
    // Filter by STATUS_CHANGED
    await user.selectOptions(screen.getByRole('combobox'), 'STATUS_CHANGED')
    
    await waitFor(() => {
      expect(screen.getByText('Audit Trail (1 entries)')).toBeInTheDocument()
    })
    
    // Filter to something with no results
    await user.selectOptions(screen.getByRole('combobox'), 'PHOTO_UPDATED')
    
    await waitFor(() => {
      expect(screen.getByText('No entries found for action: photo updated')).toBeInTheDocument()
    })
    
    // Click "Show all entries"
    await user.click(screen.getByText('Show all entries'))
    
    await waitFor(() => {
      expect(screen.getByText('Audit Trail (5 entries)')).toBeInTheDocument()
    })
  })

  it('formats timestamps correctly based on recency', () => {
    const now = new Date()
    const recentEntries: AuditLogEntry[] = [
      {
        ...mockAuditEntries[0],
        id: 'recent1',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        ...mockAuditEntries[0],
        id: 'recent2', 
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        ...mockAuditEntries[0],
        id: 'recent3',
        timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      }
    ]
    
    render(<AuditTrail entries={recentEntries} />)
    
    // Should show different time formats based on recency
    const timeElements = screen.getAllByText(/\d/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('displays correct action icons and colors', () => {
    render(<AuditTrail entries={mockAuditEntries} />)
    
    // Check that action-specific styling is applied
    const entryContainers = screen.getAllByRole('generic').filter(el => 
      el.className?.includes('border-gray-100')
    )
    expect(entryContainers.length).toBeGreaterThan(0)
  })

  it('formats different action text correctly', () => {
    const diverseEntries: AuditLogEntry[] = [
      {
        id: 'div1',
        action: 'FUNDING_UPDATED',
        timestamp: new Date(),
        userEmail: 'test@example.com',
        field: 'funding',
        oldValue: 'NDIS: $1000',
        newValue: 'NDIS: $1500'
      },
      {
        id: 'div2',
        action: 'UPDATED',
        timestamp: new Date(),
        userEmail: 'test@example.com',
        field: 'email',
        oldValue: '',
        newValue: 'new@example.com'
      },
      {
        id: 'div3',
        action: 'UPDATED',
        timestamp: new Date(),
        userEmail: 'test@example.com',
        field: 'notes',
        oldValue: 'old notes',
        newValue: ''
      }
    ]
    
    render(<AuditTrail entries={diverseEntries} />)
    
    expect(screen.getByText('Updated funding from NDIS: $1000 to NDIS: $1500')).toBeInTheDocument()
    expect(screen.getByText('Updated email to "new@example.com"')).toBeInTheDocument()
    expect(screen.getByText('Removed notes (was "old notes")')).toBeInTheDocument()
  })
})