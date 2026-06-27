import { Wrench, MapPin, Phone, Mail, Instagram, Facebook, Youtube } from "lucide-react";

/** Contact + footer block. Carries the #contact anchor the CTAs scroll to. */
export function Footer() {
  return (
    <footer id="contact" className="cc-footer">
      <div className="cc-footer-inner">
        <div>
          <a href="#top" className="cc-brand" style={{ marginBottom: 16 }}>
            <span className="cc-brand-mark">
              <Wrench size={20} strokeWidth={2.5} color="#fff" />
            </span>
            SV<b>CUSTOMS</b>
          </a>
          <p className="cc-footer-blurb">
            Premium car customisation since 2004. Wraps, performance, detailing and
            full custom builds — done right, road-legal, on time.
          </p>
          <div className="cc-social" style={{ marginTop: 18 }}>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="YouTube"><Youtube size={18} /></a>
          </div>
        </div>

        <div>
          <h4>Services</h4>
          <a href="#services">Vinyl Wraps</a>
          <a href="#services">Performance Tuning</a>
          <a href="#services">Alloy Wheels</a>
          <a href="#services">Ceramic Detailing</a>
          <a href="#services">PPF Protection</a>
        </div>

        <div>
          <h4>Studio</h4>
          <a href="#builds">Signature Builds</a>
          <a href="#gallery">Gallery</a>
          <a href="#configurator">Wrap Configurator</a>
          <a href="#wraps">Before / After</a>
        </div>

        <div>
          <h4>Visit the garage</h4>
          <a href="#"><MapPin size={15} style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} /> Plot 14, Auto Hub, Mumbai</a>
          <a href="tel:+919000000000"><Phone size={15} style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} /> +91 90000 00000</a>
          <a href="mailto:hello@svcarcustoms.com"><Mail size={15} style={{ display: "inline", marginRight: 8, verticalAlign: "-2px" }} /> hello@svcarcustoms.com</a>
          <a href="#contact" className="cc-btn cc-btn-primary" style={{ marginTop: 14 }}>
            Book a Build
          </a>
        </div>
      </div>

      <div className="cc-footer-bottom">
        <span>© 2026 SV Car Customs. All rights reserved.</span>
        <span>Crafted in the garage · Drive different.</span>
      </div>
    </footer>
  );
}
