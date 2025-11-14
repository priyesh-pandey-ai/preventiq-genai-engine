const DemoSection = () => {
  return (
    <section id="demo" className="py-16 sm:py-24 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Watch How It Works
          </h2>
        </div>

        <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border shadow-lg shadow-primary/10">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/hWYKHwzSox4"
            title="PreventIQ Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          From raw data → personalized messages → measurable results
        </p>
      </div>
    </section>
  );
};

export default DemoSection;
