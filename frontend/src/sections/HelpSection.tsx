import React from 'react';
import { motion } from 'framer-motion';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z, ZodType } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Accordion, AccordionItem, Card, CardBody, Chip } from '@nextui-org/react';
import {faqData} from "@/constants/index";
import { Mail, Phone, Clock, MessageSquare, BookOpen, Users, Award, HeadphonesIcon } from 'lucide-react';

interface SupportForm {
  email: string;
  message: string;
}

const schema: ZodType<SupportForm> = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Invalid email format'
    ),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(3500, 'Message is too long'),
});

const HelpSection: React.FC = () => {

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupportForm>({
    mode: 'onBlur',
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<SupportForm> = (data) => {
    console.log('Submitted:', data);
  };
  
  const displayText = "Help & Support".split('');

  

  return (
    <div className="min-h-screen h-auto bg-gray-100 dark:bg-gray-900 transition-colors duration-300 lg:py-12 lg:pt-24 relative overflow-x-hidden px-2 py-4 pt-40 md:pt-56">
      <div className="max-w-3xl mx-auto sm:space-y-8 space-y-3">
        <div className="max-w-7xl w-full text-center">
        <h1 className="text-center flex justify-center overflow-hidden">
            {displayText.map((char, index) => (
            <motion.span
            key={index}
            initial={{ y: char === ' ' ? 0 : -100 }} // Start below the container
            animate={{ y: 0 }} // Animate to its final position
            transition={{
                duration: 0.5,
                delay: index * 0.02, // Stagger effect
                ease : "easeOut",
                type: 'spring', // Adds a slight bounce for a better effect
                stiffness: 80,
                damping: 20,
            }}
            style={{
                display: 'inline-block',
                whiteSpace: char === ' ' ? 'pre' : 'normal', // Maintain spacing
            }}
            className={"sm:text-6xl text-3xl text-center font-ubuntu bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-teal-400 to-blue-500 font-semibold mb-6"}
            >
            {char === ' ' ? '\u00A0' : char}
            </motion.span>
        ))}
            
        </h1>
        <motion.i 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.7, 0, 0.84, 0] , delay: 0.2 }}
        className="text-neutral-500 dark:text-neutral-400 text-lg font-libre overflow-hidden">
          Find answers to common questions or reach out to us for help.
        </motion.i>
      </div>

        {/* FAQ Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="sm:space-y-4 space-y-3"
        >
          <h2 className="sm:text-3xl text-2xl font-semibold dark:text-blue-300 text-blue-700 font-ubuntu">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqData.map((faq, index) => (
              <Accordion key={index} isCompact className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <AccordionItem 
                  aria-label={`FAQ ${index + 1}`} 
                  title={faq.question} 
                  className='text-base font-ubuntu dark:text-white text-gray-800'
                >
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </motion.div>

        {/* Contact Information Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12"
        >
          <h2 className="sm:text-3xl text-2xl font-semibold dark:text-blue-300 text-blue-700 font-ubuntu mb-6">Contact Information</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-6 h-6 text-teal-500" />
                  <h3 className="font-semibold dark:text-white text-gray-800">Email</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">support@aksar.com</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">sales@aksar.com</p>
              </CardBody>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-6 h-6 text-teal-500" />
                  <h3 className="font-semibold dark:text-white text-gray-800">Phone</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">+1 (555) 123-4567</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Mon-Fri, 9AM-6PM</p>
              </CardBody>
            </Card>
            
            <Card className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-teal-500" />
                  <h3 className="font-semibold dark:text-white text-gray-800">Support Hours</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">24/7 Email Support</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Live Chat: 9AM-9PM IST</p>
              </CardBody>
            </Card>
          </div>
        </motion.div>

        {/* Quick Links Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <h2 className="sm:text-3xl text-2xl font-semibold dark:text-blue-300 text-blue-700 font-ubuntu mb-6">Quick Links</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardBody className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto mb-3" />
                <h3 className="font-semibold dark:text-white text-gray-800 mb-1">Course Guide</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">Learn how to navigate courses</p>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardBody className="p-6 text-center">
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <h3 className="font-semibold dark:text-white text-gray-800 mb-1">Community</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">Join our learner community</p>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardBody className="p-6 text-center">
                <Award className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <h3 className="font-semibold dark:text-white text-gray-800 mb-1">Certificates</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">View and download certificates</p>
              </CardBody>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
              <CardBody className="p-6 text-center">
                <HeadphonesIcon className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-3" />
                <h3 className="font-semibold dark:text-white text-gray-800 mb-1">Live Support</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">Chat with our team</p>
              </CardBody>
            </Card>
          </div>
        </motion.div>

        {/* Contact Form Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-8 h-8 text-teal-500" />
              <h2 className="sm:text-2xl text-xl font-semibold dark:text-white text-gray-800">Need Further Assistance?</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <label className="block">
                <input
                  type="email"
                  {...register('email')}
                  placeholder="Your email address"
                  className="w-full p-4 rounded-lg border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-teal-500 bg-neutral-100 dark:bg-neutral-800 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 transition-all"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </label>

              <label className="block">
                <textarea
                  {...register('message')}
                  placeholder="Describe your issue or question in detail..."
                  rows={5}
                  className="w-full p-4 rounded-lg border border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-teal-500 bg-neutral-100 dark:bg-neutral-800 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 transition-all resize-none"
                ></textarea>
                {errors.message && (
                  <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>
                )}
              </label>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
              >
                Send Message
              </button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <span className="font-medium">Response Time:</span> Usually within 24-48 hours
              </p>
              <div className="flex justify-center gap-2 mt-3">
                <Chip size="sm" variant="flat" className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">Email</Chip>
                <Chip size="sm" variant="flat" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Live Chat</Chip>
                <Chip size="sm" variant="flat" className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">Phone</Chip>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpSection;
