import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { Mail, MapPin, MessageCircle, Send } from 'lucide-react';

const ContactPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate sending
        console.log('Support Request:', { name, email, message });
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        setName('');
        setEmail('');
        setMessage('');
    };

    return (
        <MainLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Contact & Support</h2>
                <p className="text-slate-500 dark:text-slate-400">We are here to help you.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 border-none text-white">
                        <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
                        <p className="text-indigo-100 mb-8">
                            Have questions or feedback? Reach out to us directly or fill out the form.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-200 uppercase font-semibold">Email Us</p>
                                    <a href="mailto:hakssiwantha@gmail.com" className="font-medium hover:text-white transition-colors">hakssiwantha@gmail.com</a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-200 uppercase font-semibold">Location</p>
                                    <p className="font-medium">Colombo, Sri Lanka</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/20">
                            <a
                                href="https://wa.me/"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                            >
                                <MessageCircle size={20} />
                                Chat on WhatsApp
                            </a>
                        </div>
                    </Card>
                </div>

                {/* Contact Form */}
                <Card>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Send us a Message</h3>

                    {sent ? (
                        <div className="bg-green-100 text-green-700 p-4 rounded-lg flex items-center gap-2 mb-4">
                            <Send size={18} /> Message Sent Successfully!
                        </div>
                    ) : null}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Your Name"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                        <Input
                            label="Email Address"
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            required
                        />
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Message
                            </label>
                            <textarea
                                id="message"
                                rows="4"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                                placeholder="How can we help you?"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" variant="primary" className="w-full mt-4">
                            Send Message
                        </Button>
                    </form>
                </Card>
            </div>
        </MainLayout>
    );
};

export default ContactPage;
