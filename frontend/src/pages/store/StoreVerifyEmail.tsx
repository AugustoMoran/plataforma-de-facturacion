import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/ecommerce/SEO';
import { useVerifyEmailMutation } from '../../services/authApi';

export const StoreVerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [verifyEmail] = useVerifyEmailMutation();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación.');
      return;
    }
    verifyEmail(token)
      .unwrap()
      .then(() => {
        setStatus('ok');
        setMessage('Email verificado correctamente. Ya podés pagar con tarjeta.');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.data?.message || 'No se pudo verificar el email');
      });
  }, [token, verifyEmail]);

  return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-4">
      <SEO title="Verificar email" />
      <h1 className="text-2xl font-bold text-white">Verificación de email</h1>
      <p className={status === 'ok' ? 'text-emerald-300' : status === 'error' ? 'text-red-300' : 'text-blue-100/80'}>
        {status === 'loading' ? 'Verificando...' : message}
      </p>
      <Link to="/account" className="btn-primary inline-flex">Ir a mi cuenta</Link>
    </div>
  );
};
