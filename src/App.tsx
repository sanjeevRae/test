import { useState } from 'react'

const MAPS_URL =
  'https://www.google.com/maps/dir//Bodhisattva+International,+House+no+91,+Diamond+Marg,+Lalitpur,+Bagmati+Province+44600/@27.6837075,85.3154079,734m/data=!3m1!1e3!4m17!1m7!3m6!1s0x39eb195ea299d94b:0x5f8269dbfc793ff8!2sBodhisattva+International!8m2!3d27.6837028!4d85.3179828!16s%2Fg%2F11kpf5kjwb!4m8!1m0!1m5!1m1!1s0x39eb195ea299d94b:0x5f8269dbfc793ff8!2m2!1d85.3179958!2d27.6837017!3e0?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D'

type SlideIndex = 1 | 2 | 3

const NAV_LINKS: { label: string; href: string; active?: boolean }[] = [
  { label: 'Exhibitions', href: '#exhibitions', active: true },
  { label: 'About', href: '#about' },
  { label: 'Visit', href: '#visit' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
]

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15M14 6l6 6-6 6" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 12H5M10 6l-6 6 6 6" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
    </svg>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [slide, setSlide] = useState<SlideIndex>(1)

  const prevSlide = () =>
    setSlide((current) => (current === 1 ? 3 : ((current - 1) as SlideIndex)))
  const nextSlide = () =>
    setSlide((current) => (current === 3 ? 1 : ((current + 1) as SlideIndex)))

  return (
    <div className="exhibition-page">
      <header className="site-header">
        <a className="brand" href="#">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            <span>Bodhisattva</span> <span>International</span>{' '}
            <span>Presents</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={link.active ? 'active' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a className="tickets-btn" href="#visit">
          Get Tickets
          <ArrowIcon />
        </a>

        <button
          className="menu-btn"
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {menuOpen && (
        <nav className="mobile-nav open" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={link.active ? 'active' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a href="#visit" onClick={() => setMenuOpen(false)}>
            Get Tickets
          </a>
        </nav>
      )}

      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker">
            Upcoming Exhibition
            <span className="kicker-line" aria-hidden="true" />
          </p>

          <h1 className="hero-title">
            <span>10 Years of</span>
            <span>Celebrating</span>
            <span>Embodied</span>
            <span>
              Enlightenment<span className="gold-dot">.</span>
            </span>
          </h1>

          <p className="hero-sub">
            A retrospective exhibition of Samundra Man Singh Shrestha by
            Bodhisattva International.
          </p>

          <div className="hero-meta">
            <div className="meta-item">
              <span className="meta-icon">
                <CalendarIcon />
              </span>
              <div>
                <p className="meta-label">Date &amp; Time</p>
                <p className="meta-value">11.00 AM – 6.00 PM</p>
                <p className="meta-note">(Closed on Sundays)</p>
              </div>
            </div>

            <div className="meta-item">
              <span className="meta-icon">
                <PinIcon />
              </span>
              <div>
                <p className="meta-label">Venue</p>
                <p className="meta-value">
                  Purna Museum of Newa Art &amp; Bodhisattva Gallery
                </p>
                <p className="meta-note">Located in Kathmandu, Nepal</p>
              </div>
            </div>
          </div>

          <div className="hero-actions">
            <a
              className="map-btn"
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
            >
              <span className="map-pin" aria-hidden="true">
                <PinIcon />
              </span>
              View on Map
              <ArrowIcon />
            </a>

            <a className="explore-btn" href="#exhibition">
              <span className="play-icon">
                <PlayIcon />
              </span>
              Explore Exhibition
            </a>
          </div>
        </div>

        <div className={slide === 1 ? 'hero-art' : `hero-art slide-${slide}`}>
          <img
            className="art-img-desktop"
            src="/assets/hero-artwork-desktop.png"
            alt="Painting of a blue wrathful deity with a golden crown by Samundra Man Singh Shrestha"
          />
          <img
            className="art-img-mobile"
            src="/assets/hero-artwork-mobile.png"
            alt=""
            aria-hidden="true"
          />

          <div className="slider-ui">
            <span className="slider-count">
              <strong>{String(slide).padStart(2, '0')}</strong> / 03
            </span>
            <div className="slider-btns">
              <button type="button" aria-label="Previous" onClick={prevSlide}>
                <ArrowLeftIcon />
              </button>
              <button type="button" aria-label="Next" onClick={nextSlide}>
                <ArrowIcon />
              </button>
            </div>
          </div>
        </div>

        <a className="opening-block" href="#exhibition">
          <span className="opening-lotus" aria-hidden="true">
            <svg viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
              <path d="M24 27c-4.5-4.2-6.5-9.4-6.5-14.5 2.3 1.2 4.6 3.3 6.5 6.2 1.9-2.9 4.2-5 6.5-6.2C30.5 17.6 28.5 22.8 24 27Z" />
              <path d="M9.5 25.5C6.8 20.8 6.8 15.9 8.6 12c2.3 2 5 4.4 7 7.4-1.9 2.6-3.9 4.6-6.1 6.1Zm29 0c2.7-4.7 2.7-9.6.9-13.5-2.3 2-5 4.4-7 7.4 1.9 2.6 3.9 4.6 6.1 6.1Z" />
              <path d="M5 28.2c6.3 1.9 12.7 2.8 19 2.8s12.7-.9 19-2.8" />
            </svg>
          </span>
          <div>
            <p className="opening-label">Opening</p>
            <p className="opening-date">November 16th</p>
          </div>
          <span className="opening-arrow">
            <ArrowIcon />
          </span>
        </a>

        <div className="scroll-cue" aria-hidden="true">
          <span className="scroll-text">Scroll Down</span>
          <span className="scroll-line" />
          <span className="scroll-mouse" />
        </div>

        <div className="mobile-scenery" aria-hidden="true">
          <img src="/assets/mobile-scenery.png" alt="" />
        </div>

        <div className="hero-clouds" aria-hidden="true">
          <svg viewBox="0 0 360 190" fill="rgba(230, 214, 175, 0.42)" stroke="rgba(185, 141, 53, 0.35)" strokeWidth="1.3" strokeLinecap="round">
            <path d="M-10 150 C40 128 62 148 96 138 C84 122 96 104 116 108 C108 88 128 72 148 82 C162 66 190 74 192 94 C214 84 236 100 230 120 C254 118 268 138 256 154 C282 156 292 176 278 190" opacity="0.55" />
            <path d="M30 168 C58 156 74 168 98 162 C90 150 100 138 114 142" opacity="0.45" />
            <path d="M196 150 C222 138 240 150 262 144 C254 132 264 120 278 124" opacity="0.4" />
            <circle cx="120" cy="126" r="7" opacity="0.5" />
            <circle cx="238" cy="140" r="6" opacity="0.45" />
          </svg>
        </div>

        <div className="hero-foot">
          <span className="foot-line" aria-hidden="true" />
          <p>
            Art{' '}
            <i className="foot-sep" aria-hidden="true">
              ✦
            </i>{' '}
            Culture{' '}
            <i className="foot-sep" aria-hidden="true">
              ✦
            </i>{' '}
            Heritage
          </p>
        </div>
      </section>

      <section className="exhibition" id="exhibition">
        <div className="exhibition-inner">
          <p className="exhibition-kicker">The Exhibition</p>
          <h2>10 Years of Celebrating Embodied Enlightenment</h2>
          <p className="exhibition-text">
            This retrospective brings together a decade of work by Samundra Man
            Singh Shrestha, presented by Bodhisattva International at the Purna
            Museum of Newa Art &amp; Bodhisattva Gallery. The exhibition opens
            on November 16th and welcomes visitors daily from 11.00 AM to 6.00
            PM, remaining closed on Sundays.
          </p>

          <figure>
            <img
              src="/assets/poster-no-strip.png"
              alt="Official exhibition poster"
            />
          </figure>

          <div className="logos-strip">
            <img
              src="/assets/logos-strip.png"
              alt="Bodhisattva International, Purna Museum of Newa Art, Bodhisattva Gallery, Bodhisattva Foundation and Bodhisattva Gift Shop logos"
            />
          </div>
        </div>

        <footer className="site-footer" id="visit">
          <p>
            Purna Museum of Newa Art &amp; Bodhisattva Gallery, House 91,
            Diamond Marg, Kupondole Heights, Lalitpur —{' '}
            <a href={MAPS_URL} target="_blank" rel="noreferrer">
              View on Map
            </a>
          </p>
          <small>© Bodhisattva International</small>
        </footer>
      </section>
    </div>
  )
}
