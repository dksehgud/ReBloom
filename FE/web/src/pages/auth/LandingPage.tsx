import rebloomLogo from '../../assets/rebloom-logo.png'

type LandingPageProps = {
  onStart: () => void
}

function LandingPage({ onStart }: LandingPageProps) {
  return (
    <section className="landing-screen" aria-label="랜딩 화면">
      <img className="landing-logo" src={rebloomLogo} alt="Re:Bloom" />
      <button
        type="button"
        className="primary-button landing-button"
        onClick={onStart}
      >
        시작
      </button>
    </section>
  )
}

export default LandingPage
