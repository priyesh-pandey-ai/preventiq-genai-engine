const SocialProof = () => {
  const logos = [
    "People Matters",
    "SHRM India",
    "Headstart",
    "YourStory",
    "Inc42",
  ];

  return (
    <section className="py-12 border-y border-border bg-card/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Where early users hang out:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="text-muted-foreground/50 font-semibold text-sm sm:text-base tracking-wide opacity-60 hover:opacity-100 transition-opacity"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
