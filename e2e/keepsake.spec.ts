import { test, expect, type Page } from '@playwright/test'

/** Entities that must never reach the reader as literal text. */
const RAW_ENTITIES = ['&hellip;', '&nbsp;', '&mdash;', '&rarr;', '&#39;', '&quot;']

const slug = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Walks the builder to the delivery step. Each navigation is awaited through
 * the URL so a click can never land on a step that has not rendered yet.
 */
async function gotoDeliveryStep(page: Page) {
  await page.goto('/build?step=0')

  await page.getByRole('button', { name: /Love Letter/ }).first().click()
  await expect(page).toHaveURL(/step=1/)

  await page.locator('#gift-title').fill('Playwright gift')

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/step=2/)

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/step=3/)

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/step=4/)

  await expect(page.getByRole('heading', { name: /Delivery/ })).toBeVisible()
}

test.describe('slug field layout', () => {
  test('the fixed prefix and the typed text do not overlap', async ({ page }) => {
    await gotoDeliveryStep(page)

    const prefix = page.getByTestId('slug-prefix')
    const input = page.getByTestId('slug-input')

    await expect(prefix).toBeVisible()
    await expect(input).toBeVisible()

    await input.fill('our-first-year')

    const prefixBox = await prefix.boundingBox()
    const inputBox = await input.boundingBox()

    expect(prefixBox, 'slug prefix must be laid out').not.toBeNull()
    expect(inputBox, 'slug input must be laid out').not.toBeNull()

    const overlaps =
      prefixBox!.x < inputBox!.x + inputBox!.width &&
      inputBox!.x < prefixBox!.x + prefixBox!.width &&
      prefixBox!.y < inputBox!.y + inputBox!.height &&
      inputBox!.y < prefixBox!.y + prefixBox!.height

    expect(overlaps, 'the prefix and the typed text must not be drawn on top of each other').toBe(false)

    // The typed text never starts under the prefix. Wide viewports place them
    // side by side; narrow viewports stack the prefix above the field.
    const stacked = prefixBox!.y + prefixBox!.height <= inputBox!.y
    if (stacked) {
      expect(inputBox!.y).toBeGreaterThanOrEqual(prefixBox!.y + prefixBox!.height)
    } else {
      expect(inputBox!.x).toBeGreaterThanOrEqual(prefixBox!.x + prefixBox!.width)
    }
  })

  test('the prefix stays readable and the typed text is fully visible', async ({ page }) => {
    await gotoDeliveryStep(page)

    const prefix = page.getByTestId('slug-prefix')
    const input = page.getByTestId('slug-input')
    await input.fill('a-longer-slug-value')

    await expect(prefix).toContainText('keepsake.love')
    await expect(input).toHaveValue('a-longer-slug-value')

    const inputBox = await input.boundingBox()
    expect(inputBox!.width).toBeGreaterThan(40)
  })
})

test.describe('publish flow', () => {
  test('publishing lands on a working /g/<slug> page', async ({ page }) => {
    const failures: string[] = []
    page.on('response', (res) => {
      if (res.status() >= 500) failures.push(`${res.status()} ${res.url()}`)
    })

    await gotoDeliveryStep(page)

    const customSlug = slug('pw')
    await page.getByTestId('slug-input').fill(customSlug)

    await page.getByRole('button', { name: 'Publish gift' }).click()

    const link = page.locator('#published-link')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', `/g/${customSlug}`)

    await link.click()
    await page.waitForURL(`**/g/${customSlug}`)

    const body = await page.textContent('body')
    expect(body).not.toContain('Internal Server Error')
    for (const entity of RAW_ENTITIES) {
      expect(body, `raw entity ${entity} must not be shown`).not.toContain(entity)
    }

    expect(failures, `no 5xx responses were expected: ${failures.join(', ')}`).toHaveLength(0)
  })

  test('the builder renders no raw HTML entities', async ({ page }) => {
    await gotoDeliveryStep(page)

    const body = await page.textContent('body')
    for (const entity of RAW_ENTITIES) {
      expect(body, `raw entity ${entity} must not be shown`).not.toContain(entity)
    }
    expect(body).not.toContain('&amp;')
    // The delivery heading must read as words, not as an escaped entity.
    await expect(page.getByRole('heading', { name: /Delivery & publish/ })).toBeVisible()
  })

  test('the note step shows a real ellipsis character', async ({ page }) => {
    await page.goto('/build?step=3')

    const helper = page.getByText('Your message to them…')
    await expect(helper).toBeVisible()

    const body = await page.textContent('body')
    expect(body).not.toContain('&hellip;')
  })
})

test.describe('screenshots', () => {
  test('step 4 in light and dark', async ({ page }, testInfo) => {
    await gotoDeliveryStep(page)

    await page.getByTestId('slug-input').fill('screenshot-slug')

    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForTimeout(300)
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    await page.screenshot({
      path: testInfo.outputPath('build-step4-light.png'),
      fullPage: true,
    })

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(300)
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    await page.screenshot({
      path: testInfo.outputPath('build-step4-dark.png'),
      fullPage: true,
    })

    // The two screenshots have to show different themes.
    expect(lightBg).not.toBe(darkBg)
    expect(lightBg).toBe('rgb(245, 249, 255)')
    expect(darkBg).toBe('rgb(11, 18, 32)')

    // The delivery step is actually on screen and actionable.
    await expect(page.getByRole('button', { name: 'Publish gift' })).toBeEnabled()
    await expect(page.getByTestId('slug-prefix')).toBeVisible()
  })
})
