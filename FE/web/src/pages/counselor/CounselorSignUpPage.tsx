import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'

function CounselorSignUpPage() {
  return (
    <CounselorAuthLayout
      title="회원가입"
      description="상담사 계정을 만들기 위한 정보를 입력해주세요."
      footer={
        <p className="counselor-auth-placeholder-caption">
          다음 커밋에서 이메일 인증과 병원 정보 입력 단계를 구현합니다.
        </p>
      }
    >
      <div className="counselor-auth-placeholder">
        <p className="counselor-auth-placeholder-title">회원가입 화면 준비 완료</p>
        <p className="counselor-auth-placeholder-copy">
          상담사 전용 회원가입 과정을 차례대로 구현하는 중입니다.
        </p>
      </div>
    </CounselorAuthLayout>
  )
}

export default CounselorSignUpPage
