import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { Input } from '../../components/ui/Input';
import type { InputProps } from '../../components/ui/Input';

export const PasswordField = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} {...props} className={`pr-11 ${props.className || ''}`} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3.5 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {visible ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
      </button>
    </div>
  );
});

PasswordField.displayName = 'PasswordField';
