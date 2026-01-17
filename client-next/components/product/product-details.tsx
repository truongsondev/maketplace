export function ProductDetails() {
  return (
    <div className="bg-card dark:bg-card/50 rounded-xl shadow-sm p-4 lg:p-6 border border-border">
      <div className="space-y-8">
        {/* Specifications */}
        <section>
          <h3 className="text-lg font-bold bg-muted dark:bg-muted/20 p-3 rounded-lg mb-4 uppercase tracking-wider">
            Product Specifications
          </h3>
          <div className="space-y-4 px-3">
            <div className="grid grid-cols-4 text-sm">
              <span className="text-muted-foreground">Category</span>
              <span className="col-span-3">
                Marketplace &gt; Electronics &gt; Audio
              </span>
            </div>
            <div className="grid grid-cols-4 text-sm">
              <span className="text-muted-foreground">Brand</span>
              <span className="col-span-3">PremiumAudio X</span>
            </div>
            <div className="grid grid-cols-4 text-sm">
              <span className="text-muted-foreground">Battery Capacity</span>
              <span className="col-span-3">800mAh</span>
            </div>
            <div className="grid grid-cols-4 text-sm">
              <span className="text-muted-foreground">Warranty Type</span>
              <span className="col-span-3">Manufacturer Warranty</span>
            </div>
            <div className="grid grid-cols-4 text-sm">
              <span className="text-muted-foreground">Warranty Period</span>
              <span className="col-span-3">12 Months</span>
            </div>
            <div className="grid grid-cols-4 text-sm">
              <span className="text-muted-foreground">Stock</span>
              <span className="col-span-3">254</span>
            </div>
          </div>
        </section>

        {/* Description */}
        <section>
          <h3 className="font-bold bg-muted dark:bg-muted/20 p-3 rounded-lg mb-4 uppercase text-sm tracking-wider">
            Product Description
          </h3>
          <div className="px-3 text-sm leading-relaxed space-y-4">
            <p>
              Experience studio-quality sound with our latest Noise Cancelling
              Wireless Headphones. Designed for comfort and engineered for
              performance, these headphones deliver deep bass and crystal clear
              highs.
            </p>
            <div>
              <p className="font-bold mb-2">Key Features:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Active Noise Cancellation (ANC) for immersive listening.
                </li>
                <li>40 Hours of battery life on a single charge.</li>
                <li>Fast charging: 10 mins = 5 hours of playback.</li>
                <li>Transparency mode to hear your surroundings.</li>
                <li>
                  Ultra-soft protein leather ear cushions for all-day wear.
                </li>
              </ul>
            </div>

            {/* Product Images */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div
                className="aspect-video rounded-lg bg-center bg-cover"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA0HgaHuw34XwQByKGyPTQ5_DqEkkIj6k1Hu9l-twB1siidm366M5P5BzdUhxLZmJ5DO2COWAO0K9i4ECHgR7GPe3nJ6Dq_V6NI7VM0d0jz9g0l9oTGE6DoUAhxNSMyUYpDnbtveZ4X_Z0rNnj8vhlEZ1miX2elUguxfS9IbOumAYpNjyn8UtWdBLAspc7EuRWLrBSA_2YkY9wRHwykT0QNhRr-WDhHo6QeMVRKirO-giyfNeZPwrHUuOwEIoO-u86dUmxTSGop14c2')",
                }}
              />
              <div
                className="aspect-video rounded-lg bg-center bg-cover"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9gVkNDPh-dD7ARnONMp-5cxBM_y1shMDzCP5q5353KB8dgTuejUh0YyctFDI1bW7aY__47BDBivUmTEoFUHhYEUFJ_BX3-xsah3Ssrim-xqNrzy6mVUgRzME1NeIrrKVWhh9h_Tn0ZpLrqp4dqq1qnrdLy5d3D6AIWmIvVAoG70eGdesrIdkPMPE7JeXU3gJg29gUTrL2E0HIesU2J7WeeK_lxZYcTpNJaJyi4EB-Ajxw4ScuYQ8tvHH_Qai4w6cAXONvJP0L2m07')",
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
