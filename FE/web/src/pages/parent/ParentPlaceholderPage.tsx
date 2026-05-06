import MobilePageLayout from '../../components/templates/MobilePageLayout/MobilePageLayout'
import ParentBottomNavigation from '../../features/guardian/components/ParentBottomNavigation'

type ParentPlaceholderPageProps = {
  title: string
  description: string
}

function ParentPlaceholderHeader({ title }: { title: string }) {
  return (
    <div className="parent-home-page__header">
      <div className="parent-home-page__header-copy">
        <h1 className="parent-home-page__title">{title}</h1>
        <p className="parent-home-page__subtitle">준비 중인 보호자 화면</p>
      </div>
    </div>
  )
}

function ParentPlaceholderPage({ title, description }: ParentPlaceholderPageProps) {
  return (
    <MobilePageLayout
      header={<ParentPlaceholderHeader title={title} />}
      className="parent-home-page"
      contentClassName="parent-home-page__content"
      bottomNavigation={<ParentBottomNavigation />}
    >
      <section className="parent-home-page__placeholder-card" aria-label={`${title} 안내`}>
        <h2 className="parent-home-page__placeholder-title">{title}</h2>
        <p className="parent-home-page__placeholder-description">{description}</p>
      </section>
    </MobilePageLayout>
  )
}

export default ParentPlaceholderPage
