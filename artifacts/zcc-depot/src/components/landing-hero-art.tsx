import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import "./landing-hero-art.css";

export function LandingHeroArt() {
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const label = paused ? "Play hero image animation" : "Pause hero image animation";

  return (
    <figure className={`landing-hero-art${paused ? " is-paused" : ""}`} data-testid="landing-hero-art">
      <div className="landing-hero-art-halo" aria-hidden />
      <div className="landing-hero-art-float">
        <div className="landing-hero-art-clip">
          <img
            src={`${import.meta.env.BASE_URL}brand/contact-center-hero.png`}
            alt="A contact center agent on a call, surrounded by caller details and live conversation insights."
            width={1484}
            height={1114}
            fetchPriority="high"
            decoding="async"
          />
          <p className="landing-hero-art-tagline">
            <span>Architect the solution.</span>
            <span>Demonstrate the value.</span>
            <span>Accelerate the win.</span>
          </p>
        </div>
        <div className="landing-hero-art-rings" aria-hidden><span /><span /><span /><i /></div>
        <div className="landing-hero-art-wave" aria-hidden><b /><b /><b /><b /><b /></div>
      </div>
      {!reduce && (
        <button
          type="button"
          className="landing-hero-art-toggle"
          aria-label={label}
          aria-pressed={paused}
          title={label}
          onClick={() => setPaused(value => !value)}
          data-testid="button-hero-animation-toggle"
        >
          {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
        </button>
      )}
    </figure>
  );
}
