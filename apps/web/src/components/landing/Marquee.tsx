// Ticker marquee displaying platform capabilities.
export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="mq" id="mq">
        <span>
          Gate Report
        </span>
        <span>
          On-chain proof
        </span>
        <span>
          Graduation Watch
        </span>
        <span>
          Red flags
        </span>
        <span>
          HYPE Daily Call
        </span>
        <span>
          Contract risk checks
        </span>
      </div>
    </div>
  )
}
