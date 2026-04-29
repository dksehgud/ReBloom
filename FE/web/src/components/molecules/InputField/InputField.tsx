import type {
  ChangeEventHandler,
  InputHTMLAttributes,
  ReactNode,
} from 'react'

import StatusMessage from '../StatusMessage/StatusMessage'

export type InputFieldProps = {
  label: string
  value: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  action?: ReactNode
  error?: string
  help?: string
  success?: string
  readOnly?: boolean
  status?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'readOnly'>

function InputField({
  label,
  value,
  onChange,
  action,
  error,
  help,
  success,
  readOnly = false,
  status,
  ...props
}: InputFieldProps) {
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
      {help ? <StatusMessage message={help} variant="help" /> : null}
      {error ? <StatusMessage message={error} variant="error" /> : null}
      {success ? <StatusMessage message={success} variant="success" /> : null}
    </div>
  )
}

export default InputField
