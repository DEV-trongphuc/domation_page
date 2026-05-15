import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    themeColor?: string; // e.g. "amber-500", "purple-500"
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, themeColor = 'amber-500' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#080c14]/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-sm bg-[#0d1117] rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(var(--${themeColor}-rgb),0.15)] z-10`}
                    >
                        <div className="p-6 md:p-8 text-center">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-white mb-1 text-left">Liên hệ hỗ trợ</h3>
                                    <p className="text-slate-400 text-sm text-left">Chọn kênh liên hệ để được hỗ trợ nhanh nhất.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 mt-6">
                                <a href="https://zalo.me/0378859736" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#0068ff] text-white py-4 rounded-xl font-black shadow-[0_0_20px_rgba(0,104,255,0.3)] hover:-translate-y-1 transition-all">
                                    <img src="https://automation.ideas.edu.vn/imgs/zalolog.png" className="w-5 h-5 object-contain invert brightness-0" alt="Zalo" />
                                    Zalo (0378859736)
                                </a>
                                <a href="https://fb.com/turni0" target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#1877f2] text-white py-4 rounded-xl font-black shadow-[0_0_20px_rgba(24,119,242,0.3)] hover:-translate-y-1 transition-all">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" className="w-5 h-5 object-contain invert brightness-0" alt="Facebook" />
                                    Facebook Messenger
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
