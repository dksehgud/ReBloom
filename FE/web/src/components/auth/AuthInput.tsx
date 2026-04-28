import type { ChangeEventHandler, InputHTMLAttributes, ReactNode } from 'react'

type AuthInputProps = {
  label: string
  value: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  action?: ReactNode
  error?: string
  help?: string
  readOnly?: boolean
  status?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'readOnly'>

function AuthInput({
  label,
  value,
  onChange,
  action,
  error,
  help,
  readOnly = false,
  status,
  ...props
}: AuthInputProps) {
  return (
    <div className="field-group">
      <div className="field-label-row">
        <label className="field-label">{label}</label>
        {status}
      </div>
      <div className="field-input-wrap">
        <input
          className={`field-input${error ? ' is-error' : ''}${
            readOnly ? ' is-readonly' : ''
          }`}
          onChange={onChange}
          readOnly={readOnly}
          value={value}
          {...props}
        />
        {action}
      </div>
      {help ? <p className="field-help">{help}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  )
}

export default AuthInput
