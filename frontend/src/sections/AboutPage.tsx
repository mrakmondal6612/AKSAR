import React from 'react';
import { motion } from 'framer-motion';
import {Image} from "@nextui-org/react"
import { Link } from 'react-router-dom';
import { Github, Linkedin } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen h-auto bg-gray-100 dark:bg-gray-900 transition-colors duration-300 lg:py-12 px-6 py-12 lg:pt-56 pt-60 md:pt-56  relative overflow-x-hidden ">
      {/* Background Section */}
      <div className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-teal-400/30 via-transparent to-teal-600/20 blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Page Container */}
      <div className="max-w-6xl mx-auto px-6 space-y-12 relative">
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          About AKSAR
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-gray-700 dark:text-gray-300 text-center leading-relaxed max-w-3xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          AKSAR is your gateway to mastering new skills and achieving your
          goals. Whether you’re an aspiring professional or a curious learner, we provide the resources you need to
          unlock your potential and embrace lifelong learning.
        </motion.p>

        {/* Stats Banner Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-white dark:bg-gray-850 shadow-lg border border-gray-200/50 dark:border-gray-800/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {[
            { value: "40+", label: "Happy Learners", color: "text-purple-650 dark:text-purple-400" },
            { value: "15+", label: "Premium Courses", color: "text-teal-650 dark:text-teal-400" },
            { value: "35+", label: "Study Resources", color: "text-blue-650 dark:text-blue-400" },
            { value: "24/7", label: "Peer Community Support", color: "text-pink-650 dark:text-pink-400" }
          ].map((stat, sIdx) => (
            <div key={sIdx} className="text-center">
              <p className={`text-3xl md:text-4xl font-extrabold font-ubuntu ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Our mission is to empower learners across the globe by offering
              high-quality courses designed by experts. We believe education should
              be accessible to all, and we are committed to building a platform
              that inspires personal and professional growth.
            </p>
          </motion.div>

          {/* Image Placeholder */}
          <motion.div
            className="rounded-xl shadow-lg object-cover h-64 w-full"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Image
                isBlurred
                src="/images/about_us_pic_1.jpg"
                alt="Our Mission"
                className="rounded-xl shadow-lg object-cover h-64 w-full"
            />
          </motion.div>
        </div>

        {/* Core Values Section */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Excellence', description: 'Delivering top-quality learning experiences.' },
              { title: 'Accessibility', description: 'Ensuring knowledge is accessible to everyone.' },
              { title: 'Innovation', description: 'Creating future-ready courses for modern learners.' },
            ].map((value, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.2 }}
              >
                <h3 className="text-2xl font-semibold text-teal-600 dark:text-teal-400 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Interactive Milestone Timeline */}
        <div className="space-y-8 pt-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Our Journey & Vision
          </h2>
          <div className="relative border-l border-gray-300 dark:border-gray-700 ml-4 md:ml-32 space-y-8">
            {[
              { year: "2024", title: "The Inception", desc: "AKSAR was founded to index free educational tutorials into ordered courses, helping students avoid search rabbit-holes." },
              { year: "2025", title: "AI Learning Integration", desc: "Deployed smart learning recommendations, personalized study planning, and customized practice worksheets." },
              { year: "2026", title: "Peer-to-Peer Community", desc: "Launched peer study circles, active student groups, and certificates of completion verification." },
              { year: "Future", title: "Global Expansion", desc: "Aiming to partner with international educators and universities to bring accredited pathways onto the platform." }
            ].map((milestone, idx) => (
              <motion.div
                key={idx}
                className="relative pl-6 md:pl-8"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
              >
                {/* Timeline Node Icon/Dot */}
                <span className="absolute -left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white text-[10px] font-bold shadow-md">
                  ✓
                </span>
                {/* Year tag for desktop */}
                <span className="hidden md:block absolute -left-32 top-1 text-right w-24 text-sm font-extrabold text-teal-650 dark:text-teal-400 font-ubuntu">
                  {milestone.year}
                </span>
                <div className="p-5 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-250/40 dark:border-gray-750/40">
                  <span className="md:hidden inline-block px-2.5 py-0.5 mb-2 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold font-sans">
                    {milestone.year}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {milestone.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
                    {milestone.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Meet Our Team Section */}
        <div className="space-y-6 pt-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                name: "Ajay",
                role: "Software Architect",
                image: "/images/Ajay-Photo-1.png",
                github: "https://github.com/mrakmondal6612",
                linkedin: "https://www.linkedin.com/in/mr-ak/"
              },
              {
                name: "Arnab Mandal",
                role: "Full Stack Developer",
                image: "/images/Arnab.jpg",
                github: "https://github.com/Arnab-Mandal1",
                linkedin: "https://www.linkedin.com/in/arnab-mandal-004680265/"
              },
              {
                name: "Samadrita Himaktar",
                role: "Business Administrator",
                image: "/images/Samadrita.jpg",
                github: "https://github.com/Samadrita-04",
                linkedin: "https://www.linkedin.com/in/samadrita-himaktar-2796b3256/"
              },
              {
                name: "Kumar Kuntal Kundu",
                role: "Front End Developer",
                image: "/images/Kuntal.png",
                github: "https://github.com/imkumarkuntalkundu",
                linkedin: "https://www.linkedin.com/in/imkumarkuntalkundu/"
              },
              {
                name: "Rohan Pratihar",
                role: "Head of Marketing",
                image: "/images/Rohan.jpg",
                github: "https://github.com/imkumarkuntalkundu",
                linkedin: "https://www.linkedin.com/in/rohan-pratihar-5528a8276?trk=blended-typeahead"
              }
            ].map((member, index) => (
              <motion.div
                key={index}
                className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800 shadow-md border border-gray-200/50 dark:border-gray-700/50 text-center flex flex-col items-center group hover:scale-[1.03] transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-4 border-2 border-teal-500/50 group-hover:border-teal-500 transition-colors duration-300 shadow-md shrink-0 flex items-center justify-center bg-gradient-to-br from-teal-500 to-purple-600 text-white font-ubuntu font-bold text-lg">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span>{member.name.split(' ').map(n => n[0]).join('')}</span>
                  )}
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-xs md:text-sm text-teal-600 dark:text-teal-400 font-medium mb-3">
                  {member.role}
                </p>
                <div className="flex gap-3 mt-auto">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-black dark:hover:text-white transition-all duration-200"
                    aria-label="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          className="mt-12 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <Link to="/courses">
            <button className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-700">
                Explore Courses
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
