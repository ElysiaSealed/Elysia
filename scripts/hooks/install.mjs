// Points this clone at the versioned hooks. Runs from the root "prepare" script.
// Outside a git checkout (for example a cloud build) git fails and the error is ignored on purpose.
import { execFileSync } from 'node:child_process'

try {
  execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], { stdio: 'ignore' })
} catch {
  // not a git checkout: nothing to configure
}
