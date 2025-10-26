import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and description */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Kryzon CTF</h3>
            <p className="text-gray-400 mb-4">
              Uma plataforma local de Capture The Flag para aprendizado e prática de 
              cybersecurity. Desafie suas habilidades em um ambiente seguro e controlado.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/kryzon-team" 
                className="text-gray-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a 
                href="https://discord.gg/kryzon" 
                className="text-gray-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-md font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/challenges" className="hover:text-white transition-colors">
                  Challenges
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <a 
                  href="/api/health" 
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API Status
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-md font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a 
                  href="https://owasp.org" 
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OWASP
                </a>
              </li>
              <li>
                <a 
                  href="https://portswigger.net/web-security" 
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PortSwigger Academy
                </a>
              </li>
              <li>
                <a 
                  href="https://overthewire.org" 
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OverTheWire
                </a>
              </li>
              <li>
                <a 
                  href="https://hackthebox.eu" 
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  HackTheBox
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            &copy; {currentYear} Kryzon Team. Built for educational purposes.
          </div>
          <div className="text-gray-400 text-sm mt-4 md:mt-0">
            Made with ❤️ for the cybersecurity community
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;