import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 Brevo Quiz Challenge @ React India 2025. All rights reserved.
          </div>
          <a
            href="https://engineering.brevo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary-glow transition-colors group"
          >
            Visit Brevo Engineering Blog
            <ExternalLink className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;