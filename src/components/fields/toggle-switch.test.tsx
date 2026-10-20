import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ToggleSwitch } from '@/components/fields/ToggleSwitch'

describe('ToggleSwitch', () => {
  it('renders with label', () => {
    render(<ToggleSwitch checked={false} onChange={() => {}} label="Publish now" />)
    expect(screen.getByLabelText('Publish now')).toBeDefined()
  })

  it('toggles on click', () => {
    let checked = false
    render(
      <ToggleSwitch checked={checked} onChange={(v) => { checked = v }} label="Test" />
    )
    const btn = screen.getByRole('switch')
    fireEvent.click(btn)
    expect(checked).toBe(true)
  })
})
