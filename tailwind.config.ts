import { withUt } from "uploadthing/tw";

export default withUt({
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // semantic palette
        bg: "#F8E5B9", // creamy butter (main background)
        "bg-surface": "#F9C8A9", // peach pastel (cards, panels)
        "bg-surface-alt": "#F7D1A3", // soft apricot

        text: "#5A4638", // dark warm brown (primary text)
        "text-muted": "#6B4F3F", // softer warm brown

        accent: "#F5AFA0", // pastel coral (primary accent/button)
        "accent-soft": "#F7B7C3", // warm blush pink (secondary accent)
        "accent-alt": "#E8C7D8", // warm lavender rose

        border: "#C7B4A6", // light warm border
        "border-strong": "#A69082",

        peachPastel: "#F9C8A9",
        warmBlushPink: "#F7B7C3",
        softApricot: "#F7D1A3",
        pastelCoral: "#F5AFA0",
        creamyButter: "#F8E5B9",
        warmLavenderRose: "#E8C7D8",
        dustyPeach: "#E7B9A0",
        pastelSand: "#EED7C5",
      },
    },
  },
  plugins: [require("prettier-plugin-tailwindcss")],
});
