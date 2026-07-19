"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Mail, MessageSquare, DollarSign, User } from "lucide-react";

const projectTypes = [
  "New Website",
  "Website Redesign",
  "E-Commerce Store",
  "SaaS / Dashboard",
  "Automation Setup",
  "Other",
];

const budgetRanges = [
  "Under $500",
  "$500 – $1,000",
  "$1,000 – $3,000",
  "$3,000 – $5,000",
  "$5,000+",
  "Not sure yet",
];

interface FormData {
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
}

const steps = [
  { id: 0, label: "You", icon: User },
  { id: 1, label: "Project", icon: MessageSquare },
  { id: 2, label: "Budget", icon: DollarSign },
  { id: 3, label: "Details", icon: Mail },
];

export function Contact() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<FormData>({
    name: "", email: "", projectType: "", budget: "", message: ""
  });

  const handleSubmit = async () => {
    setSubmitted(true);
    // Actual form submission would go here (Resend, Formspree, etc.)
  };

  const canProceed = () => {
    if (step === 0) return data.name.trim() && data.email.includes("@");
    if (step === 1) return data.projectType;
    if (step === 2) return data.budget;
    if (step === 3) return data.message.trim().length > 10;
    return true;
  };

  return (
    <section id="contact" className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-20 items-start">
          {/* Left — copy */}
          <div className="md:sticky md:top-32">
            <motion.div
              className="text-sm font-medium text-amber-400 mb-4 flex items-center gap-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <span className="w-8 h-px bg-amber-400" />
              Get in touch
            </motion.div>
            <motion.h2
              className="text-5xl md:text-6xl font-display font-black mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              Let's build
              <span className="text-gradient block">something great.</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground text-lg mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Tell us about your project and we'll get back to you within a few hours with a tailored proposal and next steps.
            </motion.p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <CheckCircle size={14} className="text-amber-400" />
                </div>
                Free strategy consultation
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <CheckCircle size={14} className="text-amber-400" />
                </div>
                Response within 24 hours
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <CheckCircle size={14} className="text-amber-400" />
                </div>
                No commitment required
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-white/10">
              <p className="text-sm text-muted-foreground mb-2">Prefer email?</p>
              <a
                href="mailto:colinthomasegan5@gmail.com"
                className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
              >
                colinthomasegan5@gmail.com
              </a>
            </div>
          </div>

          {/* Right — multi-step form */}
          <div>
            <div className="bg-card border border-white/8 rounded-2xl p-8">
              {!submitted ? (
                <>
                  {/* Step indicators */}
                  <div className="flex items-center gap-2 mb-8">
                    {steps.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.id} className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                              i < step
                                ? "bg-amber-600 text-white"
                                : i === step
                                ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                                : "bg-white/5 text-muted-foreground"
                            }`}
                          >
                            {i < step ? <CheckCircle size={14} /> : <Icon size={14} />}
                          </div>
                          {i < steps.length - 1 && (
                            <div
                              className={`h-px flex-1 w-6 transition-colors duration-300 ${i < step ? "bg-amber-500" : "bg-white/10"}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {/* Step 0: Name & Email */}
                    {step === 0 && (
                      <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div>
                          <h3 className="text-2xl font-display font-bold mb-1">Nice to meet you.</h3>
                          <p className="text-muted-foreground text-sm">Let's start with the basics.</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1.5 block">Your name</label>
                          <input
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            placeholder="Jane Smith"
                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-muted-foreground/40"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1.5 block">Email address</label>
                          <input
                            value={data.email}
                            onChange={(e) => setData({ ...data, email: e.target.value })}
                            placeholder="jane@company.com"
                            type="email"
                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-muted-foreground/40"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 1: Project Type */}
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="mb-6">
                          <h3 className="text-2xl font-display font-bold mb-1">What are you building?</h3>
                          <p className="text-muted-foreground text-sm">Select the closest match.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {projectTypes.map((type) => (
                            <button
                              key={type}
                              onClick={() => setData({ ...data, projectType: type })}
                              className={`py-3 px-4 rounded-xl text-sm text-left transition-all duration-200 border ${
                                data.projectType === type
                                  ? "border-amber-500 bg-amber-500/15 text-amber-300"
                                  : "border-white/8 bg-white/3 hover:border-amber-500/30 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Budget */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="mb-6">
                          <h3 className="text-2xl font-display font-bold mb-1">What's your budget?</h3>
                          <p className="text-muted-foreground text-sm">Helps us tailor our proposal.</p>
                        </div>
                        <div className="space-y-2">
                          {budgetRanges.map((range) => (
                            <button
                              key={range}
                              onClick={() => setData({ ...data, budget: range })}
                              className={`w-full py-3 px-4 rounded-xl text-sm text-left transition-all duration-200 border ${
                                data.budget === range
                                  ? "border-amber-500 bg-amber-500/15 text-amber-300"
                                  : "border-white/8 bg-white/3 hover:border-amber-500/30 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {range}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Message */}
                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div>
                          <h3 className="text-2xl font-display font-bold mb-1">Last step!</h3>
                          <p className="text-muted-foreground text-sm">Tell us anything else about your project.</p>
                        </div>
                        <textarea
                          value={data.message}
                          onChange={(e) => setData({ ...data, message: e.target.value })}
                          placeholder="Describe your project, timeline, any specific features you need..."
                          rows={6}
                          className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-muted-foreground/40 resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8">
                    <button
                      onClick={() => setStep(Math.max(0, step - 1))}
                      className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${step === 0 ? "invisible" : ""}`}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => {
                        if (step < 3) setStep(step + 1);
                        else handleSubmit();
                      }}
                      disabled={!canProceed()}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200"
                    >
                      {step === 3 ? "Send Message" : "Continue"}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-16 h-16 rounded-full bg-amber-600 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle size={28} className="text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-display font-bold mb-3">Message sent!</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Thanks, {data.name.split(" ")[0]}! We'll be in touch within 24 hours with a proposal tailored to your project.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
