import { ELYSIA_CA, ELYSIA_CA_URL } from '@/lib/site'

/** Contract address for $ELYSIA (address only); renders nothing until the token address is set. */
export function ContractPill() {
  if (!ELYSIA_CA || !ELYSIA_CA_URL) return null
  return (
    <a className="ca" href={ELYSIA_CA_URL} target="_blank" rel="noopener" aria-label={`$ELYSIA contract address ${ELYSIA_CA}, open in explorer`}>
      {ELYSIA_CA}
    </a>
  )
}
