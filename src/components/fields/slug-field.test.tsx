import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SlugField } from '@/components/fields/SlugField'

describe('SlugField', () => {
  it('renders with prefix', () => {
    render(<SlugField value="" onChange={() => {}} />)
    expect(screen.getByText('keepsake.love/g/')).toBeDefined()
  })

  it('calls onChange with cleaned value', () => {
    let current = ''
    render(
      <SlugField value={current} onChange={(v) => { current = v }} />
    )
    const input = screen.getByRole('textbox')
    fireEvent.input(input, { target: { value: 'My Gift!' } })
    expect(current).toBe('my-gift')
  })

  it('renders label', () => {
    render(<SlugField value="" onChange={() => {}} label="Custom slug" />)
    expect(screen.getByLabelText('Custom slug')).toBeDefined()
  })
})
