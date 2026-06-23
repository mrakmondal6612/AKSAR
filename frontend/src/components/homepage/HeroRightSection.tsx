import { motion } from "framer-motion";

const HeroRightSection = () => {
  return (
    <section className="w-full h-[50vh] lg:h-[90vh] flex flex-col justify-center items-center px-4 sm:px-5 relative">
      {/* Floating Join Button */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{
          scale: 1,
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-4 sm:top-10 right-4 sm:right-10 p-3 sm:p-5 text-xs sm:text-lg rounded-full bg-purple-500 text-white shadow-lg dark:shadow-white-500/60 cursor-pointer z-10"
      >
        Join our Learning Platform!
      </motion.div>

      {/* Hero Image */}
      <motion.img
        src="images/hero-section-right-image.png"
        alt="Girl Studying Image"
        loading="eager"
        className="w-[80%] sm:w-[90%] max-w-xs sm:max-w-xl rounded-xl shadow-lg object-cover dark:shadow-white-500/60"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 1,
          delay: 0.5,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      />

      {/* Animated Quote */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 1.5,
          delay: 0.2,
          ease: "easeOut",
        }}
        className="absolute bottom-8 sm:bottom-16 right-4 sm:right-10 p-2 sm:p-4 bg-white dark:bg-black text-black/90 dark:text-white rounded-full shadow-lg dark:shadow-white-500/60 max-w-[90%]"
      >
        <p className="font-semibold text-sm sm:text-xl">
          "Master new skills and boost your career with us!"
        </p>
      </motion.div>
    </section>
  );
};

export default HeroRightSection;
