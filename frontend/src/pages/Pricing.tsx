import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  X, 
  Shield, 
  CreditCard, 
  Users, 
  Star,
  ChevronDown,
  ChevronUp,
  Menu,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Pricing = () => {
  const [showFaq, setShowFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      billing: "Forever",
      description: "Perfect for trying out AI mindmaps",
      badge: "Get Started",
      badgeVariant: "outline" as const,
      cardStyle: "border-border bg-card",
      headerStyle: "bg-muted/30",
      textStyle: "text-foreground",
      buttonVariant: "outline" as const,
      buttonText: "Start Free",
      features: [
        { text: "5 AI mindmaps per month", included: true },
        { text: "Unlimited manual documents", included: true },
        { text: "Basic templates", included: true },
        { text: "Local storage", included: true },
        { text: "Standard export (PNG, PDF)", included: true },
        { text: "Cloud sync", included: false },
        { text: "Premium templates", included: false },
      ]
    },
    {
      name: "Pro",
      price: "$12",
      billing: "per month",
      description: "Unlimited AI power for professionals",
      badge: "Most Popular",
      badgeVariant: "default" as const,
      cardStyle: "border-primary bg-card shadow-lg ring-2 ring-primary/20",
      headerStyle: "bg-primary text-primary-foreground",
      textStyle: "text-primary-foreground",
      buttonVariant: "default" as const,
      buttonText: "Start Pro Trial",
      trial: "14-day free trial, no credit card required",
      isPopular: true,
      features: [
        { text: "Unlimited AI generations", included: true },
        { text: "All Free features included", included: true },
        { text: "Premium mindmap styles & themes", included: true },
        { text: "Cloud sync & backup", included: true },
        { text: "Advanced exports (SVG, interactive HTML)", included: true },
        { text: "Priority AI processing", included: true },
        { text: "Premium templates library", included: true },
        { text: "Advanced mindmap layouts", included: true },
      ]
    },
    {
      name: "Team",
      price: "$30",
      billing: "per user/month",
      description: "Collaboration and team management",
      badge: "For Teams",
      badgeVariant: "secondary" as const,
      cardStyle: "border-blue-500 bg-card",
      headerStyle: "bg-blue-500 text-white",
      textStyle: "text-white",
      buttonVariant: "secondary" as const,
      buttonText: "Contact Sales",
      contact: "Custom onboarding included",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Real-time collaboration", included: true },
        { text: "Team workspaces", included: true },
        { text: "Admin controls & user management", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Priority support", included: true },
        { text: "Team templates sharing", included: true },
        { text: "White-label options", included: true },
      ]
    }
  ];

  const comparisonFeatures = [
    { category: "Documents", features: [
      { name: "Manual documents", free: true, pro: true, team: true },
      { name: "AI mindmaps per month", free: "5", pro: "Unlimited", team: "Unlimited" },
      { name: "Cloud storage", free: false, pro: true, team: true },
      { name: "Export formats", free: "PNG, PDF", pro: "All formats", team: "All formats" },
    ]},
    { category: "AI Features", features: [
      { name: "AI generation", free: "Limited", pro: "Unlimited", team: "Unlimited" },
      { name: "Premium styles", free: false, pro: true, team: true },
      { name: "Priority processing", free: false, pro: true, team: true },
    ]},
    { category: "Collaboration", features: [
      { name: "Real-time collaboration", free: false, pro: false, team: true },
      { name: "Team workspaces", free: false, pro: false, team: true },
      { name: "Admin controls", free: false, pro: false, team: true },
    ]}
  ];

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan instantly. Changes take effect immediately and billing is prorated."
    },
    {
      question: "What happens when I hit the free limit?",
      answer: "You'll receive gentle upgrade prompts, but your existing work is never lost. You can continue using all manual features."
    },
    {
      question: "Do you offer student discounts?",
      answer: "Yes! Students get 50% off Pro plans with a valid student email address. Contact us for verification."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade security with SSL encryption, SOC 2 compliance, and GDPR compliance."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, there are no long-term contracts. You can cancel your subscription anytime from your account settings."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Hamburger and Back */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={20} className="text-foreground" />
              </button>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            </div>

            {/* Center - Title */}
            <h1 className="text-xl font-semibold text-foreground">Pricing</h1>

            {/* Right side - Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16 pt-8">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Unlock the full power of AI-enhanced writing and mindmap generation
          </p>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you need more AI power
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={`${tier.cardStyle} relative transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl cursor-pointer`}>
              {tier.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant={tier.badgeVariant} className="px-3 py-1">
                    {tier.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className={`${tier.headerStyle} rounded-t-lg`}>
                {!tier.isPopular && (
                  <Badge variant={tier.badgeVariant} className="w-fit mb-2">
                    {tier.badge}
                  </Badge>
                )}
                <CardTitle className={`text-2xl ${tier.textStyle}`}>
                  {tier.name}
                </CardTitle>
                <div className={`${tier.textStyle}`}>
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-sm opacity-80 ml-1">{tier.billing}</span>
                </div>
                <CardDescription className={`${tier.textStyle} opacity-80`}>
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground mr-3 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={tier.buttonVariant} 
                  className="w-full mb-3"
                  size="lg"
                >
                  {tier.buttonText}
                </Button>

                {tier.trial && (
                  <p className="text-sm text-muted-foreground text-center">
                    {tier.trial}
                  </p>
                )}

                {tier.contact && (
                  <p className="text-sm text-muted-foreground text-center">
                    {tier.contact}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold">Features</th>
                      <th className="text-center p-4 font-semibold">Free</th>
                      <th className="text-center p-4 font-semibold bg-primary/10">Pro</th>
                      <th className="text-center p-4 font-semibold">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((category) => (
                      <>
                        <tr key={category.category} className="border-b bg-muted/20">
                          <td className="p-4 font-semibold" colSpan={4}>
                            {category.category}
                          </td>
                        </tr>
                        {category.features.map((feature, index) => (
                          <tr key={index} className="border-b hover:bg-muted/10">
                            <td className="p-4">{feature.name}</td>
                            <td className="p-4 text-center">
                              {typeof feature.free === 'boolean' 
                                ? feature.free 
                                   ? <Check className="h-4 w-4 text-purple-500 mx-auto" />
                                  : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                                : feature.free
                              }
                            </td>
                            <td className="p-4 text-center bg-primary/5">
                              {typeof feature.pro === 'boolean' 
                                ? feature.pro 
                                   ? <Check className="h-4 w-4 text-purple-500 mx-auto" />
                                  : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                                : feature.pro
                              }
                            </td>
                            <td className="p-4 text-center">
                              {typeof feature.team === 'boolean' 
                                ? feature.team 
                                  ? <Check className="h-4 w-4 text-purple-500 mx-auto" />
                                  : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                                : feature.team
                              }
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setShowFaq(showFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                    {showFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {showFaq === index && (
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6">Trusted by professionals worldwide</h3>
          
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span className="text-sm">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span className="text-sm">GDPR Compliant</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 mb-8 text-muted-foreground">
            <CreditCard className="h-8 w-8" />
            <span className="text-sm">Visa</span>
            <span className="text-sm">Mastercard</span>
            <span className="text-sm">PayPal</span>
            <span className="text-sm">Stripe</span>
          </div>

          <div className="bg-muted/30 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-muted-foreground italic mb-2">
              "MD Creator has transformed how I organize my thoughts. The AI mindmaps save me hours every week!"
            </p>
            <p className="text-sm text-muted-foreground">
              — Sarah Chen, Product Manager
            </p>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-2" />
              Join 10,000+ professionals who use MD Creator daily
            </p>
          </div>
        </div>
      </div>

      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </div>
  );
};

export default Pricing;