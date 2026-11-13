import { useState } from 'react'
import type { FormEvent } from 'react'

const MAPS_URL =
  'https://www.google.com/maps/dir//Bodhisattva+International,+House+no+91,+Diamond+Marg,+Lalitpur,+Bagmati+Province+44600/@27.6837075,85.3154079,734m/data=!3m1!1e3!4m17!1m7!3m6!1s0x39eb195ea299d94b:0x5f8269dbfc793ff8!2sBodhisattva+International!8m2!3d27.6837028!4d85.3179828!16s%2Fg%2F11kpf5kjwb!4m8!1m0!1m5!1m1!1s0x39eb195ea299d94b:0x5f8269dbfc793ff8!2m2!1d85.3179958!2d27.6837017!3e0?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D'

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

function PhoneIcon() {
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
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  )
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
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

function LotusMark() {
  return (
    <svg viewBox="0 0 48 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M24 29.5c-4.6-5.4-6.2-12-4.8-18.6 2.2 2.3 3.8 4.9 4.8 7.6.9-2.7 2.6-5.3 4.8-7.6 1.4 6.6-.2 13.2-4.8 18.6Z" />
      <path d="M16.8 29.8C11.4 27.2 7.9 22.2 7.2 15.9c3.4 1.8 6.6 4.3 9.3 7.4.6 2.2.7 4.4.3 6.5Zm14.4 0c5.4-2.6 8.9-7.6 9.6-13.9-3.4 1.8-6.6 4.3-9.3 7.4-.6 2.2-.7 4.4-.3 6.5Z" />
      <path d="M5.5 32.2c6 2 12.2 3 18.5 3s12.5-1 18.5-3" />
    </svg>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [sent, setSent] = useState<boolean>(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSent(true)
  }

  return (
    <div className="exhibition-page">
      <header className="site-header">
        <a className="brand" href="#">
          <img className="brand-mark" src="/assets/bodhisattva-logo.png" alt="" aria-hidden="true" />
          <span className="brand-text">
            <span>Bodhisattva</span> <span>International</span>{' '}
            <span>Presents</span>
          </span>
        </a>

        <a className="tickets-btn nav-contact" href="#contact">
          Contact Us
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
        <div className="mobile-nav open">
          <p className="mobile-nav-venue">
            Purna Museum of Newa Art &amp; Bodhisattva Gallery
          </p>
          <p className="mobile-nav-line">
            House 91, Diamond Marg, Kupondole Heights, Lalitpur
          </p>
          <p className="mobile-nav-line">Open 12.00 PM – 7.00 PM · Open 7 days a week</p>
          <a
            className="mobile-nav-cta"
            href="#contact"
            onClick={() => setMenuOpen(false)}
          >
            Contact Us
            <ArrowIcon />
          </a>
          <a
            className="mobile-nav-map"
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
          >
            View on Map
          </a>
        </div>
      )}

      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker">
            Upcoming Exhibition
            <span className="kicker-line" aria-hidden="true" />
          </p>

          <h1 className="hero-title">
            <span>10 Years of</span>{' '}
            <span>Celebrating</span>{' '}
            <span>Embodied</span>{' '}
            <span>
              Enlightenment<span className="gold-dot">.</span>
            </span>
          </h1>

          <p className="hero-sub">
            A retrospective exhibition of Samundra Man Singh Shrestha{' '}
            <br className="sub-break" />
            by Bodhisattva International.
          </p>

          <div className="hero-meta">
            <div className="meta-item">
              <span className="meta-icon">
                <CalendarIcon />
              </span>
              <div>
                <p className="meta-label"><span className="label-full">Date &amp; Time</span><span className="label-mobile">Days &amp; Time</span></p>
                <p className="meta-value">12.00 PM – 7.00 PM</p>
                <p className="meta-note">(Open 7 days a week)</p>
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
                <p className="meta-note">Patan, opposite Embark College</p>
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

            <a className="explore-btn" href="#contact">
              <span className="play-icon">
                <PlayIcon />
              </span>
              Explore Exhibition
            </a>
          </div>
        </div>

        <div className="hero-art">
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
          <img
            className="art-img-poster"
            src="/assets/exhibition-poster.png"
            alt="Exhibition poster: painting of a blue wrathful deity with the exhibition details"
          />
          <div className="opening-badge">
            <span className="badge-label">Opening</span>
            <span className="badge-day">16</span>
            <span className="badge-month">November, 2026</span>
          </div>
        </div>

        <a className="opening-block" href="#contact">
          <span className="opening-lotus" aria-hidden="true">
            <LotusMark />
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

      <section className="contact-section" id="contact">
        <div className="contact-inner">
          <div className="contact-info">
            <p className="contact-kicker">Contact Us</p>
            <h2>Plan Your Visit</h2>

            <ul className="contact-details">
              <li>
                <span className="contact-icon">
                  <PinIcon />
                </span>
                <div>
                  <p className="contact-detail-label">Visit Us</p>
                  <p>
                    Purna Museum of Newa Art &amp; Bodhisattva Gallery,
                    <br />
                    House 91, Diamond Marg, Kupondole Heights, Lalitpur
                  </p>
                  <a href={MAPS_URL} target="_blank" rel="noreferrer">
                    View on Map →
                  </a>
                </div>
              </li>
              <li>
                <span className="contact-icon">
                  <PhoneIcon />
                </span>
                <div>
                  <p className="contact-detail-label">Call or WhatsApp</p>
                  <p>
                    <a href="tel:+9779851091255">+977 98510 91255</a>
                    <br />
                    <a href="tel:+9779818882876">+977 981 888 2876</a>
                  </p>
                </div>
              </li>
              <li>
                <span className="contact-icon">
                  <ClockIcon />
                </span>
                <div>
                  <p className="contact-detail-label">Opening Hours</p>
                  <p>
                    12.00 PM – 7.00 PM
                    <br />
                    Open 7 days a week
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="contact-form-wrap">
            {sent ? (
              <div className="form-success" role="status">
                <span className="success-lotus" aria-hidden="true">
                  <LotusMark />
                </span>
                <h3>Thank you</h3>
                <p>
                  Your message has been noted. The gallery team will get back
                  to you shortly — or visit us in Kupondole, Lalitpur.
                </p>
                <button
                  type="button"
                  className="success-again"
                  onClick={() => setSent(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-head">
                  <h3>Send a Message</h3>
                  <p>Tell us about your visit or enquiry.</p>
                </div>
                <div className="form-row">
                  <label>
                    <span>Full Name</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      required
                    />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+977"
                    />
                  </label>
                </div>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label>
                  <span>Subject</span>
                  <select name="subject" defaultValue="Visit enquiry">
                    <option>Visit enquiry</option>
                    <option>Artwork enquiry</option>
                    <option>Private viewing</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  <span>Message</span>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="How can we help you?"
                    required
                  />
                </label>
                <button type="submit" className="submit-btn">
                  Send Message
                  <ArrowIcon />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="construction">
        <img
          className="construction-gif"
          src="/assets/under-construction.gif"
          alt="Animated illustration of a building under construction with a crane"
        />
        <p className="construction-kicker">Bodhisattva International</p>
        <h2>Site Under Construction</h2>
        <p className="construction-text">
          We are building something beautiful. The full website is on its way.
        </p>
      </section>

      <footer className="site-footer">
        <img
          className="footer-logos"
          src="/assets/footer-logos.png"
          alt="Bodhisattva International · Purna Museum of Newa Art · Bodhisattva Gallery · Bodhisattva Foundation · Bodhisattva Gift Shop"
        />
        <img
          className="footer-logos-single"
          src="/assets/footer-logos-tight.png"
          alt="Bodhisattva International · Purna Museum of Newa Art · Bodhisattva Gallery · Bodhisattva Foundation · Bodhisattva Gift Shop"
        />
      </footer>
    </div>
  )
}
