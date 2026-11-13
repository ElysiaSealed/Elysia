// Ticker marquee displaying platform capabilities.
export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="mq" id="mq">
        <span>
          Rug radar
        </span>
        <span>
          On-chain proof
        </span>
        <span>
          Pons V2 launches
        </span>
        <span>
          Red flags
        </span>
        <span>
          Prediction of the Day
        </span>
        <span>
          Contract risk checks
        </span>
      </div>
    </div>
  )
}
