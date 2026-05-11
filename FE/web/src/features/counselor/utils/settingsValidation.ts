function isValidNewPassword(password: string) {
  return (
    password.length >= 8 &&
    password.length <= 20 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password) &&
    /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(password)
  )
}

function normalizeFormValue(value: string) {
  return value.trim()
}

export { isValidNewPassword, normalizeFormValue }
