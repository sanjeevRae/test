const artworkUrl =
  'https://images.unsplash.com/photo-1694200602546-5adaf31cb3f8?auto=format&fit=crop&w=1600&q=90'

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
          <div className="mobile-menu entrance entrance--1" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="hero__heading entrance entrance--2">
            <p className="hero__kicker">Upcoming Exhibition</p>
            <h1 id="exhibition-title">
              <span>Exhibition</span> <span>Title</span>
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
            <button className="button button--primary" type="button">
              Explore exhibition
              <ArrowIcon />
            </button>
            
          </div>

          <div className="edition entrance entrance--5" aria-label="Exhibition year 2026">
            <span>International exhibition</span>
            <span className="edition__line" aria-hidden="true" />
            <strong>2026</strong>
          </div>
        </div>

        <div className="hero__visual">
          <div className="visual-index entrance entrance--2" aria-hidden="true">
            <span>01</span>
            <span>/</span>
            <span>26</span>
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

          <p className="photo-credit">Photograph: Bernd Dittrich / Unsplash</p>
        </div>

        <div className="scroll-cue entrance entrance--5" aria-hidden="true">
          <span>Discover</span>
          <span className="scroll-cue__line" />
        </div>
      </section>
    </main>
  )
}
