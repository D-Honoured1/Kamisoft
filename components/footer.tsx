import Link from "next/link"
import { Shield, Mail, Phone, MapPin, Linkedin, Twitter, Github } from "lucide-react"
import { COMPANY_INFO } from "@/lib/constants/services"

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container py-12">
        {/* Mobile: 2x2 grid, Desktop: 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company Info - Takes full width on mobile */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Kamisoft Enterprises</span>
            </div>
            <p className="text-sm text-muted-foreground">{COMPANY_INFO.description}</p>
            <p className="text-sm text-muted-foreground">
              Founded {COMPANY_INFO.founded} • {COMPANY_INFO.location}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-muted-foreground hover:text-primary transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Services</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Full-Stack Development</li>
              <li className="text-muted-foreground">Blockchain Solutions</li>
              <li className="text-muted-foreground">Fintech Platforms</li>
              <li className="text-muted-foreground">Mobile Development</li>
            </ul>
          </div>

          {/* Contact Info - Centered on mobile */}
          <div className="col-span-2 md:col-span-1 space-y-4 text-center md:text-left">
            <h3 className="text-sm font-semibold">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-center md:justify-start space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="break-all">{COMPANY_INFO.contact.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{COMPANY_INFO.contact.phone}</span>
              </div>
              <div className="flex items-start justify-center md:justify-start space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{COMPANY_INFO.contact.address}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex justify-center md:justify-start space-x-4 pt-2">
              <Link
                href={COMPANY_INFO.social.linkedin}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link
                href={COMPANY_INFO.social.twitter}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href={COMPANY_INFO.social.github}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p>
              &copy; {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.
            </p>
            <p>A subsidiary of {COMPANY_INFO.parentCompany}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}