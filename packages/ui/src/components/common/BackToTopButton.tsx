"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "../ui/button";

interface BackToTopButtonProps {
  /** Id of a custom scrollable container to track/scroll instead of the window. */
  scrollContainerId?: string;
}

const BackToTopButton = ({ scrollContainerId }: BackToTopButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = scrollContainerId ? document.getElementById(scrollContainerId) : null;
    if (!container) {
      // Fallback to window scroll
      const handleWindowScroll = () => setIsVisible(window.scrollY > 300);
      window.addEventListener("scroll", handleWindowScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleWindowScroll);
    }

    const handleScroll = () => setIsVisible(container.scrollTop > 300);
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scrollContainerId]);

  const scrollToTop = () => {
    const container = scrollContainerId ? document.getElementById(scrollContainerId) : null;
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      variant="secondary"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-10 w-10"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};

export default BackToTopButton;
