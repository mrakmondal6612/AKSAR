import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Twitter, Youtube, Mail, Send } from "lucide-react";
import { SuccessToast } from "@/lib/toasts";

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    SuccessToast("Thank you for subscribing to our newsletter!");
    setEmail("");
  };

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-[#0b0f19]/80 backdrop-blur-xl text-gray-600 dark:text-gray-400 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 bg-clip-text text-transparent font-ubuntu">
                AKSAR
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-libre">
              Empowering India's next generation learners with premium, accessible courses from school level to advanced careers.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200">
                  Community
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/verify-certificate" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200">
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200">
                  Latest News
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors duration-200">
                  Help Center & FAQs
                </Link>
              </li>
              <li className="flex items-center gap-2 pt-2 text-gray-500 dark:text-gray-400 text-xs">
                <Mail className="w-4 h-4 text-purple-500" />
                <span>support@aksar.com</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Stay Updated
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-libre">
              Subscribe to our newsletter for exclusive learning content, course releases, and platform updates.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#121927] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center shrink-0 shadow-md"
                aria-label="Subscribe"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} AKSAR. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
