import N8nLogo from "./N8nLogo";

import HowItWorks from "./HowItWorks";

export default function Hero() {
  return (
    <section id="claim" className="hero-glow border-b border-border">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:pb-24 sm:pt-20 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:items-center lg:gap-6 lg:text-left">
        <div>
          <N8nLogo />
          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-5xl xl:text-6xl">
            Outbid. Rank up.
            <br />Get your workflow seen.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance lg:mx-0 text-base text-muted sm:text-lg">
            Every position is up for grabs. Bid for a higher rank and put your n8n workflow in front of thousands of automation builders.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <a href="#workflows" className="btn-run w-full px-7 py-3 text-sm sm:w-auto">
              Claim a position
            </a>
            <a href="#workflows" className="btn-run w-full px-7 py-3 text-sm sm:w-auto">
              Browse workflows
            </a>
          </div>
        </div>
        <div id="how-it-works" className="mt-14 scroll-mt-24 lg:mt-0">
          <HowItWorks />
        </div>
      </div>
    </section>
  );
}
