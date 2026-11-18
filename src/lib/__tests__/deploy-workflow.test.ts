import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflowPath = resolve(process.cwd(), '.github/workflows/ci.yml')

function workflow(): string {
  return readFileSync(workflowPath, 'utf8')
}

describe('CI · deploy automático del frontend en Netlify', () => {
  it('el job de deploy espera a que pasen lint-and-build y e2e', () => {
    const content = workflow()
    expect(content).toMatch(/\n {2}deploy:\n/)
    expect(content).toMatch(/needs:\s*\[lint-and-build, e2e\]/)
  })

  it('el deploy solo se dispara en push a main', () => {
    expect(workflow()).toContain("if: github.event_name == 'push' && github.ref == 'refs/heads/main'")
  })

  it('usa el build hook de Netlify como secreto sin interpolalo en el comando', () => {
    const content = workflow()
    expect(content).toContain('NETLIFY_BUILD_HOOK_URL: ${{ secrets.NETLIFY_BUILD_HOOK_URL }}')
    const curlLine = content.split('\n').find((line) => line.includes('curl') && line.includes('NETLIFY_BUILD_HOOK_URL'))
    expect(curlLine).toContain('$NETLIFY_BUILD_HOOK_URL')
    expect(curlLine).not.toContain('${{')
    expect(curlLine).toContain('--fail')
  })

  it('falla con un mensaje claro si falta el secreto del hook', () => {
    expect(workflow()).toContain('Falta el secreto NETLIFY_BUILD_HOOK_URL')
  })
})
