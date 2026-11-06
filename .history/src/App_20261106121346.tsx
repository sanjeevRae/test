const artworkUrl = '/poster.jpg'

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h15M14 6l6 6-6 6" />
    </svg>
  )
}

export default function App() {
  return (
    <main className="exhibition-page">
      <section className="hero" aria-labelledby="exhibition-title">
        <div className="hero__content">
          <div className="eyebrow entrance entrance--1">
            <span className="eyebrow__mark" aria-hidden="true" />
            Bodhisattva International presents
          </div>
          

          <div className="hero__heading entrance entrance--2">
            <p className="hero__kicker">Upcoming Exhibition</p>
            <h1 id="exhibition-title">
              <span>10 Years of Celebrating Enlightenment. </span> 
            </h1>
          </div>

          <p className="hero__description entrance entrance--3">
            An encounter with enduring artistic traditions, presented through a
            contemporary international perspective.
          </p>

          <dl className="exhibition-meta entrance entrance--4">
            <div>
              <dt>Date &amp; time</dt>
              <dd>
                <time dateTime="2026-11-15">2026 / 11 / 15</time>
                <span>Time to be announced</span>
              </dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>
                Bodhisattva Gallery
                <span>Location details forthcoming</span>
              </dd>
            </div>
          </dl>

          <div className="hero__actions entrance entrance--5">
  <a
    className="button button--primary"
    href="https://www.google.com/maps/dir//Bodhisattva+International,+House+no+91,+Diamond+Marg,+Lalitpur,+Bagmati+Province+44600/@27.6837075,85.3154079,734m/data=!3m1!1e3!4m17!1m7!3m6!1s0x39eb195ea299d94b:0x5f8269dbfc793ff8!2sBodhisattva+International!8m2!3d27.6837028!4d85.3179828!16s%2Fg%2F11kpf5kjwb!4m8!1m0!1m5!1m1!1s0x39eb195ea299d94b:0x5f8269dbfc793ff8!2m2!1d85.3179958!2d27.6837017!3e0?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D"
    target="_blank"
    rel="noopener noreferrer"
  >
    View On Map
    <ArrowIcon />
  </a>
</div>

          <div className="edition entrance entrance--5" aria-label="Exhibition year 2026">
            <span>International exhibition</span>
            <span className="edition__line" aria-hidden="true" />
            <strong>2026</strong>
          </div>
        </div>

        <div className="hero__visual">
          <div className="visual-index entrance entrance--2" aria-hidden="true">
            <span>NOV</span>
            <span>/</span>
            <span>15</span>
          </div>

          <figure className="artwork artwork-reveal">
            <img
              src={artworkUrl}
              alt="A seated Buddha sculpture displayed against a dark museum backdrop"
            />
            <div className="artwork__veil" aria-hidden="true" />
            <figcaption>
              <span>Featured work</span>
              <span>Exhibition preview</span>
            </figcaption>
          </figure>

          <div className="date-card entrance entrance--5" aria-hidden="true">
            <span>Opening</span>
            <strong>15</strong>
            <span>November 2026</span>
          </div>

          <p className="photo-credit">www.bodhisattvainternational.com</p>
        </div>

        <div className="scroll-cue entrance entrance--5" aria-hidden="true">
          <span>Contact: +977-985-1081098</span>
          <span className="scroll-cue__line" />
        </div>
      </section>
    </main>
  )
}
