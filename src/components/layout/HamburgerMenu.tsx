import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Brain, 
  Library, 
  FileImage, 
  CreditCard, 
  Settings,
  X 
} from "lucide-react";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const navigate = useNavigate();

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  // Add/remove body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-all duration-400 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />
      
      {/* Menu Panel - Enhanced slide animation */}
      <div className={`fixed top-0 left-0 w-80 h-full bg-background border-r border-border z-[9999] transform transition-transform duration-400 ease-out shadow-xl will-change-transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-primary-foreground tracking-tight">MD Creator</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground flex items-center justify-center transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4">
          <nav>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigation("/")}
                  className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-all duration-200 group hover:translate-x-1"
                >
                  <Home size={20} className="text-green-500 group-hover:text-green-400 transition-colors" />
                  <span className="text-foreground font-medium">Home</span>
                </button>
              </li>
              
              <li>
                <button
                  onClick={() => handleNavigation("/workspace")}
                  className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-all duration-200 group hover:translate-x-1"
                >
                  <Library size={20} className="text-primary group-hover:text-primary/80 transition-colors" />
                  <span className="text-foreground font-medium">Workspace</span>
                </button>
              </li>
              
              <li>
                <button
                  onClick={() => handleNavigation("/dashboard")}
                  className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-all duration-200 group hover:translate-x-1 opacity-50"
                >
                  <Home size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-foreground font-medium">Old Dashboard</span>
                </button>
              </li>
              
              <div className="border-t border-border my-4"></div>
              
              <li>
                <button
                  onClick={() => handleNavigation("/pricing")}
                  className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-all duration-200 group hover:translate-x-1"
                >
                  <CreditCard size={20} className="text-primary group-hover:text-primary/80 transition-colors" />
                  <span className="text-foreground font-medium">Pricing</span>
                </button>
              </li>
              
              <li>
                <button
                  onClick={() => handleNavigation("/dashboard/settings")}
                  className="flex items-center gap-4 w-full p-4 rounded-xl hover:bg-muted transition-all duration-200 group hover:translate-x-1"
                >
                  <Settings size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-foreground font-medium">Settings</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}