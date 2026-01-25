import type { Variants, Transition } from "framer-motion";

// 🌊 SILKY FLOW
// The core curve that defines the "feel" of SoftDo v1.5.0
// Linear-ish start for quick response, smooth deceleration for premium finish.
export const EASE_SILKY: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

// ⚡ SNAP
// For quick toggles and micro-interactions
export const EASE_SNAP: [number, number, number, number] = [0.22, 1, 0.36, 1];

// 🎞️ Transitions
export const TRANSITION_LAYOUT: Transition = {
  duration: 0.3,
  ease: EASE_SILKY,
};

export const TRANSITION_ENTER: Transition = {
  duration: 0.35,
  ease: EASE_SILKY,
};

export const TRANSITION_EXIT: Transition = {
  duration: 0.2, // Faster exit feels snappier
  ease: "easeIn",
};

// 📦 Variants

// List Container (Stagger Children)
export const VARIANTS_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

// Items (Slide In/Out)
export const VARIANTS_ITEM: Variants = {
  hidden: { 
    opacity: 0, 
    y: 15, 
    scale: 0.98 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: TRANSITION_ENTER
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: TRANSITION_EXIT 
  },
};

// Height Expand/Collapse (Accordion)
export const VARIANTS_ACCORDION: Variants = {
  hidden: { 
    opacity: 0, 
    height: 0, 
    overflow: 'hidden' 
  },
  visible: { 
    opacity: 1, 
    height: 'auto',
    transition: {
      height: TRANSITION_LAYOUT,
      opacity: { duration: 0.25, delay: 0.05 } // Delay fade-in slightly
    }
  },
  exit: { 
    opacity: 0, 
    height: 0,
    transition: {
      height: TRANSITION_LAYOUT,
      opacity: { duration: 0.2 }
    }
  },
};
