import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { type TabItem, Tabs } from './Tabs'

const mockTabItems: TabItem[] = [
  {
    id: 'tab1',
    label: 'Tab 1',
    icon: '🔥',
    content: <div>Content 1</div>
  },
  {
    id: 'tab2',
    label: 'Tab 2',
    icon: '⭐',
    content: <div>Content 2</div>
  },
  {
    id: 'tab3',
    label: 'Tab 3',
    content: <div>Content 3</div>
  }
]

describe('Tabs', () => {
  it('renders all tab buttons with labels and icons', () => {
    render(<Tabs items={mockTabItems} />)

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
    expect(screen.getByText('🔥')).toBeInTheDocument()
    expect(screen.getByText('⭐')).toBeInTheDocument()
  })

  it('shows the first tab content by default', () => {
    render(<Tabs items={mockTabItems} />)
    
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
  })

  it('shows specified default tab when provided', () => {
    render(<Tabs items={mockTabItems} defaultTab="tab2" />)
    
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
  })

  it('switches content when tab is clicked', () => {
    render(<Tabs items={mockTabItems} />)
    
    // Initially showing first tab
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    
    // Click second tab
    fireEvent.click(screen.getByText('Tab 2'))
    
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument()
  })

  it('applies active styles to selected tab', () => {
    render(<Tabs items={mockTabItems} />)
    
    const tab1Button = screen.getByText('Tab 1').closest('button')
    const tab2Button = screen.getByText('Tab 2').closest('button')
    
    expect(tab1Button).toHaveClass('border-blue-500', 'text-blue-600')
    expect(tab2Button).toHaveClass('border-transparent', 'text-gray-500')
    
    // Click second tab
    fireEvent.click(screen.getByText('Tab 2'))
    
    expect(tab1Button).toHaveClass('border-transparent', 'text-gray-500')
    expect(tab2Button).toHaveClass('border-blue-500', 'text-blue-600')
  })

  it('handles tabs without icons', () => {
    const itemsWithoutIcons: TabItem[] = [
      { id: 'tab1', label: 'No Icon Tab', content: <div>Content</div> }
    ]
    
    render(<Tabs items={itemsWithoutIcons} />)
    
    expect(screen.getByText('No Icon Tab')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <Tabs items={mockTabItems} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})