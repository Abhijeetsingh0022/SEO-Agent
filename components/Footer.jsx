"use client";
import { Github, Linkedin, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="ag-footer">
      <div className="ag-footer-wrap">


        {/* ── Row 3: Giant Hero (Centered) ──────────────── */}
        <div className="ag-footer-hero-row">
          <div className="ag-footer-hero-content">
            <span className="ag-footer-word">Abhijeet Singh</span>
            <p className="ag-footer-hero-role">AI/ML Engineer · Full-Stack Developer</p>
          </div>
        </div>

        {/* ── Row 4: Redesigned Bottom (Centered) ───────── */}
        <div className="ag-footer-bottom-row">
          <div className="ag-footer-social-links">
            <a href="https://abhijeetsingh-dev-protfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="ag-social-pill">
              <Globe size={14} /> <span>Portfolio</span>
            </a>
            <a href="https://github.com/Abhijeetsingh0022" target="_blank" rel="noopener noreferrer" className="ag-social-pill">
              <Github size={14} /> <span>GitHub</span>
            </a>
            <a href="https://www.linkedin.com/in/abhijeetsingh0022/" target="_blank" rel="noopener noreferrer" className="ag-social-pill">
              <Linkedin size={14} /> <span>LinkedIn</span>
            </a>
            <a href="mailto:masterabhijeetsingh@gmail.com" className="ag-social-pill">
              <Mail size={14} /> <span>Contact</span>
            </a>
          </div>

          <div className="ag-footer-copyright">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}
