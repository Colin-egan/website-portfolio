"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

interface FieldState {
  value: string;
  touched: boolean;
  valid: boolean | null;
  error: string;
}

function validate(name: string, value: string) {
  if (name === "email") {
    if (!value) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email";
    return "";
  }
  if (name === "name") {
    if (!value) return "Name is required";
    if (value.length < 2) return "Name must be at least 2 characters";
    return "";
  }
  return "";
}

export function ValidationDemo() {
  const [fields, setFields] = useState<Record<string, FieldState>>({
    name: { value: "", touched: false, valid: null, error: "" },
    email: { value: "", touched: false, valid: null, error: "" },
  });

  const handleChange = (name: string, value: string) => {
    const error = validate(name, value);
    setFields((f) => ({
      ...f,
      [name]: { value, touched: true, valid: !error, error },
    }));
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="text-xs font-medium text-purple-400 uppercase tracking-widest">Live Form Validation</div>
      {["name", "email"].map((field) => {
        const state = fields[field];
        return (
          <div key={field} className="relative">
            <div className="relative">
              <input
                value={state.value}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder={field === "name" ? "Your name" : "Email address"}
                className={`w-full bg-secondary/40 rounded-lg px-3 py-2.5 text-sm pr-9 outline-none transition-all duration-200 placeholder:text-muted-foreground/40 ${
                  state.touched
                    ? state.valid
                      ? "border border-green-500/50 focus:ring-1 focus:ring-green-500/30"
                      : "border border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    : "border border-white/10 focus:ring-1 focus:ring-purple-500/30"
                }`}
              />
              <AnimatePresence>
                {state.touched && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    {state.valid ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {state.touched && state.error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-red-400 mt-1 overflow-hidden"
                >
                  {state.error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <motion.button
        className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
        whileTap={{ scale: 0.97 }}
      >
        Submit
      </motion.button>
    </div>
  );
}
