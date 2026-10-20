import { DeskScene } from '@/components/DeskScene'

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-10 pb-12">
        <p className="font-ui text-xs uppercase tracking-[0.22em] text-text-muted mb-5">
          Digital gifts for the one you love
        </p>
        <h1
          className="font-display font-semibold text-text text-balance leading-[1.05] tracking-tight
                     text-[clamp(2.6rem,7vw,5.5rem)] max-w-[16ch]"
        >
          Gifts that are opened, not just received.
        </h1>
        <p className="mt-6 max-w-[56ch] text-lg text-text-soft">
          Build a gift in minutes, wrap it with paper, ribbon and wax, then hit
          Publish. Your partner unwraps it in a real ceremony and keeps it
          forever in their Keepsake Drawer.
        </p>
        <div className="mt-8">
          <a href="/build" className="btn">
            Start building
          </a>
        </div>
      </section>
      <DeskScene />
    </>
  )
}
