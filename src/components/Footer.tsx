import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
            © 2025 Brevo Quiz Challenge @ React India 2025. All rights reserved.
          </div>
          
          {/* Links */}
          <div className="flex items-center gap-4 md:gap-6">
            <a
              href="https://engineering.brevo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs md:text-sm text-primary hover:text-primary/80 transition-colors group font-medium"
            >
              Engineering Blog
              <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a
              href="https://www.brevo.com/careers/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs md:text-sm text-secondary hover:text-secondary/80 transition-colors group font-medium"
            >
              Careers
              <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
        
        {/* Brevo Love */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Made with <span className="text-red-500">❤️</span> by the Brevo Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;