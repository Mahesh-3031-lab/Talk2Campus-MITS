import { Heart, Mail, Phone, User } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-8 md:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Built by student */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Built by</span>
            <User className="h-4 w-4 text-primary" />
            <span>a student at</span>
            <span className="font-semibold text-foreground">MITS</span>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground md:flex-row md:gap-6">
            <a
              href="mailto:kmaheshbabu733@gmail.com"
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              <span>kmaheshbabu733@gmail.com</span>
            </a>
            <a
              href="tel:+918571222888"
              className="flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4" />
              <span>+91 8571 222 888</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-border/30 pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Madanapalle Institute of Technology and Science. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
