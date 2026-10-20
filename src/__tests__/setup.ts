import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import vm from 'node:vm'

const NativeFormData = vm.runInThisContext('FormData')

;(globalThis as any).FormData = NativeFormData
;(globalThis as any).File = vm.runInThisContext('File')
;(globalThis as any).Blob = vm.runInThisContext('Blob')

afterEach(() => {
  cleanup()
})
