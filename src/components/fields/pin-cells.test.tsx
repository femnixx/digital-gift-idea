import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PinCells } from '@/components/fields/PinCells'

describe('PinCells', () => {
  it('renders the correct number of cells', () => {
    render(<PinCells length={4} value="" onChange={() => {}} />)
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
  })

  it('updates value on input', () => {
    let current = ''
    render(
      <PinCells length={4} value={current} onChange={(v) => { current = v }} />
    )
    const cells = screen.getAllByRole('textbox')
    fireEvent.input(cells[0], { target: { value: '1' } })
    expect(current).toBe('1')
  })

  it('strips non-numeric input', () => {
    let current = ''
    render(
      <PinCells length={4} value={current} onChange={(v) => { current = v }} />
    )
    const cells = screen.getAllByRole('textbox')
    fireEvent.input(cells[0], { target: { value: 'a' } })
    expect(current).toBe('')
  })

  it('announces the label', () => {
    render(<PinCells length={4} value="" onChange={() => {}} label="Enter PIN" />)
    expect(screen.getByLabelText('Enter PIN')).toBeDefined()
  })
})
