import { useState, useCallback } from "react";
import { getGuestCredits } from "@/lib/guestCredits";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { HamburgerMenu } from "./HamburgerMenu";


export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { remaining, total } = getGuestCredits();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between p-4 glass-card mx-4 my-4 border border-purple-500/20 relative z-[1000]">
        {/* Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="bg-transparent border-none cursor-pointer p-2 mr-4 group hover:bg-white/5 rounded-lg transition-all duration-200"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col">
            <span className="block w-6 h-[3px] bg-foreground mb-1 transition-all duration-300 group-hover:bg-primary" />
            <span className="block w-6 h-[3px] bg-foreground mb-1 transition-all duration-300 group-hover:bg-primary" />
            <span className="block w-6 h-[3px] bg-foreground transition-all duration-300 group-hover:bg-primary" />
          </div>
        </button>

        {/* Brand (removed per UX cleanup) */}
        <div className="flex-1" />

        {/* Right side status */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/40 text-xs text-muted-foreground cursor-default">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500/80" />
                  <span>Guest</span>
                </span>
                <span className="mx-1 text-border">•</span>
                <span className="inline-flex items-center gap-1">
                  <span>⚡</span>
                  <span>{remaining}/{total}</span>
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                You are not logged in. You have {remaining} of {total} free AI runs today.
                <br />Sign up to save work and get more runs.
              </div>
            </TooltipContent>
          </Tooltip>
          <Link to="/pricing" className="hidden md:inline text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
            Log in
          </Link>
        </div>
      </header>

      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  );
}